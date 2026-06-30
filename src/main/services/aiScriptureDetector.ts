import { detectReferences } from './scriptureDetect';
import { scriptureService } from './scriptureService';
import {
  BUILTIN_AGENTS,
  initialState,
  modelStatusFor,
  reduce,
  toStatus,
  type OrchestratorAction,
  type OrchestratorState,
} from './aiOrchestratorState';
import { localAsr } from './localAsr';
import { secrets } from '../infra/secrets';
import { CHANNELS } from '@/shared/constants/channels';
import { sendToPresenter } from '../windows/windowManager';
import type {
  AiCandidate,
  AiKeyStatus,
  AiModelStatus,
  AiStatus,
  AudioSource,
  AutoProjectConfig,
  DetectionMode,
  TranscriptionAgent,
  TranscriptSegment,
} from '@/shared/schemas/ai';

// The secure-storage key namespace for an agent's API key. The VALUE is only
// ever read in main (online extraction); it never returns over the bridge.
function keyName(agentId: string): string {
  return `ai.apiKey.${agentId}`;
}

// A masked hint for the operator UI — the last 4 chars, never the key (§1.7).
function maskHint(plaintext: string): string | undefined {
  if (plaintext.length < 4) return undefined;
  return `••••${plaintext.slice(-4)}`;
}

// Whether a (cloud) agent currently has a stored key. Wraps secrets.has so a
// safeStorage / DB hiccup never crashes the control surface (§5.7).
function agentHasKey(agentId: string): boolean {
  try {
    return secrets.has(keyName(agentId));
  } catch {
    return false;
  }
}

// An injectable connectivity check so a fake can drive auto-degrade in tests.
// The default is conservative: if we can't tell, assume we're still online
// (don't degrade spuriously). Real probing lands with the audio path (P4-T2).
export type ConnectivityCheck = () => boolean;
let isOnlineCheck: ConnectivityCheck = () => true;
export function setConnectivityCheck(check: ConnectivityCheck): void {
  isOnlineCheck = check;
}

// AI scripture detector + orchestrator control surface (CLAUDE.md §5, spec §5).
//
// TEXT PATH (unchanged): detect candidate references (pure) → resolve each
// through the Phase 3 scriptureService (reuse, no duplicated Bible logic).
// Candidates that don't resolve to real verses are dropped — that's where
// resolution precision comes from. The operator reviews and projects
// (human-in-the-loop, never auto).
//
// CONTROL SURFACE (A1): holds the in-memory orchestrator state (active agent,
// mode, kill-switch, online opt-in, listening) behind a PURE reducer
// (aiOrchestratorState.ts). No real audio capture, network, or keys here —
// `startListening` is a stub that records a clear status when the active agent
// is unavailable; real capture lands in A2/A4. Default mode is `passive`;
// `setEnabled(false)` is a hard kill-switch (R8 — never auto-project).

// Live orchestrator state, owned by main (§5.3). Mutated only via the reducer.
let state: OrchestratorState = initialState();

function apply(action: OrchestratorAction): AiStatus {
  // Inject real key storage so the availability gate reflects safeStorage.
  state = reduce(state, action, agentHasKey);
  return toStatus(state);
}

export const aiScriptureDetector = {
  // --- text path (unchanged) ----------------------------------------------
  submitText(text: string): AiCandidate[] {
    const detected = detectReferences(text);
    const candidates: AiCandidate[] = [];
    for (const d of detected) {
      const verses = scriptureService.resolve(d.ref);
      if (verses.length === 0) continue; // not a real passage → not a candidate
      candidates.push({
        reference: d.canonical,
        type: d.type,
        confidence: d.confidence,
        triggerText: d.triggerText,
        verses,
      });
    }
    return candidates;
  },

  // --- control surface (A1) -----------------------------------------------
  // Each online agent's `hasKey` reflects REAL secure storage (A2), so the UI
  // shows which cloud engines are ready. The key value never leaves main.
  listAgents(): readonly TranscriptionAgent[] {
    return BUILTIN_AGENTS.map((a) => (a.online ? { ...a, hasKey: agentHasKey(a.id) } : a));
  },

  // Audio sources: device LABELS are enumerated in the renderer (it owns
  // `navigator.mediaDevices`, the only Web-API exception, §5.2). The renderer
  // pushes them here; main holds them + the selected id in orchestrator state.
  // The built-in default is always preserved so listing never comes back empty.
  setSources(sources: AudioSource[]): readonly AudioSource[] {
    state = reduce(state, { type: 'setSources', sources }, agentHasKey);
    return state.sources;
  },

  listSources(): readonly AudioSource[] {
    return state.sources;
  },

  // Choose the active audio input. Returns the new status so the UI updates in
  // one hop; an unknown id is rejected (status carries the reason), never throws.
  setSource(sourceId: string): AiStatus {
    return apply({ type: 'setSource', sourceId });
  },

  // --- local model download manager (A4 / P4-T3 interface) -----------------
  // Read the whisper-local model state via the stable ASR interface. Today it is
  // always `absent` (NullLocalAsr) — the real binary/weights are deferred (R6).
  modelStatus(agentId: string): AiModelStatus {
    if (agentId === localAsr.agentId) return localAsr.modelStatus();
    return modelStatusFor(agentId);
  },

  // No-op download stub (R6): returns a clear "not available in this build"
  // status rather than faking a "ready" model or attempting a network fetch.
  // The interface is what must be stable; the downloader lands with the binary.
  downloadModel(agentId: string): AiModelStatus {
    const status = this.modelStatus(agentId);
    if (status.installed) return status;
    return {
      ...status,
      state: 'absent',
      detail: 'Model download is not available in this build',
    };
  },

  status(): AiStatus {
    return toStatus(state);
  },

  setMode(mode: DetectionMode): AiStatus {
    return apply({ type: 'setMode', mode });
  },

  setEnabled(enabled: boolean): AiStatus {
    return apply({ type: 'setEnabled', enabled });
  },

  setAgent(agentId: string): AiStatus {
    return apply({ type: 'setAgent', agentId });
  },

  // Cloud opt-in (A3). Wires A1's previously un-wired `setOnline` reducer action.
  setOnline(online: boolean): AiStatus {
    return apply({ type: 'setOnline', online });
  },

  // Auto-project guard (A3, R8). Off by default; even in drive mode nothing
  // auto-projects unless enabled AND above the configured threshold.
  setAutoProject(config: AutoProjectConfig): AiStatus {
    return apply({ type: 'setAutoProject', config });
  },

  // Transcript-only: show the transcript but suppress detection/candidates.
  setTranscriptOnly(transcriptOnly: boolean): AiStatus {
    return apply({ type: 'setTranscriptOnly', transcriptOnly });
  },

  // --- key management (A2) -------------------------------------------------
  // Store a cloud agent's API key in OS secure storage (main only, §1.7). The
  // value never returns over the bridge — callers get a boolean status back.
  setApiKey(agentId: string, apiKey: string): AiKeyStatus {
    secrets.set(keyName(agentId), apiKey);
    return { hasKey: true, hint: maskHint(apiKey) };
  },

  // Whether a key is stored. Returns ONLY a boolean (+ optional masked hint) —
  // never the key. This is the renderer-facing read.
  hasKey(agentId: string): AiKeyStatus {
    return { hasKey: agentHasKey(agentId) };
  },

  clearApiKey(agentId: string): AiKeyStatus {
    secrets.delete(keyName(agentId));
    return { hasKey: false };
  },

  // --- auto-degrade (A3) ---------------------------------------------------
  // Probe connectivity via the injectable check; if a cloud agent is active and
  // we've lost connection, silently fall back to the offline default with NO
  // operator action (spec §7). The offline path makes zero network calls.
  checkConnectivity(): AiStatus {
    if (isOnlineCheck()) return toStatus(state);
    return apply({ type: 'autoDegrade' });
  },

  // Stub: real audio capture lands in A2/A4. The reducer no-ops with a clear
  // "agent not available" status when the active agent is uninstalled/keyless or
  // the kill-switch is off, so the UI can explain why nothing is listening.
  startListening(): AiStatus {
    return apply({ type: 'startListening' });
  },

  stopListening(): AiStatus {
    return apply({ type: 'stopListening' });
  },

  // --- event push (for A2/A4 audio path) ----------------------------------
  // Pushed to the PRESENTER window only — the operator reviews; the audience
  // never sees unconfirmed AI output (R8). No-ops cleanly if no candidates.
  emitCandidates(candidates: AiCandidate[]): void {
    sendToPresenter(CHANNELS.ai.candidates, candidates);
  },

  emitTranscript(segment: TranscriptSegment): void {
    sendToPresenter(CHANNELS.ai.transcript, segment);
  },
};
