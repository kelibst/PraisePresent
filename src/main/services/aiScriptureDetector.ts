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
import { whisperLocalAsr as localAsr, createWhisperSession } from './whisperAsr';
import {
  DEFAULT_WHISPER_MODEL,
  deleteModel as deleteWhisperModel,
  downloadModel as downloadWhisperModel,
  downloadProgress as whisperDownloadProgress,
  getPreferredModel,
  isDownloading as isWhisperDownloading,
  isModelInstalled,
  installedModel,
  listModels as listWhisperModels,
  setPreferredModel as setPreferredWhisperModel,
  whisperModelStatus,
} from './modelManager';
import { secrets } from '../infra/secrets';
import log from '../infra/logger';
import { CHANNELS } from '@/shared/constants/channels';
import { TARGET_SAMPLE_RATE } from '@/shared/schemas/ai';
import { sendToPresenter } from '../windows/windowManager';
import type { AsrSession, AsrSessionCallbacks, AsrTranscript } from './asrSession';
import type { WebSocketCtor } from './cloud/streamingClient';
import { createDeepgramSession } from './cloud/deepgramAsr';
import { createAssemblyAiSession } from './cloud/assemblyAiAsr';
import type {
  AiCandidate,
  AiKeyStatus,
  AiModelStatus,
  AiStatus,
  AudioSource,
  AutoProjectConfig,
  DetectionMode,
  DetectedReference,
  TranscriptionAgent,
  TranscriptSegment,
  WhisperModelId,
  WhisperModelsStatus,
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

// REAL install state for an offline agent, injected into the reducer's
// availability gate. EVERY offline-local engine is whisper-backed, so its
// availability is the whisper install state (binary + a downloaded model) — not
// the static registry flag. This is why a local agent becomes listen-eligible the
// moment a model finishes downloading, and why the default `praisepresent-local`
// correctly reports "not available — install it first" before a model exists
// instead of letting the operator press Start on an engine that can't run.
function agentInstalled(agentId: string): boolean {
  const agent = BUILTIN_AGENTS.find((a) => a.id === agentId);
  if (!agent) return false;
  if (agent.kind === 'offline-local') return localAsr.isInstalled();
  return agent.installed;
}

// Whether an agent is one of the whisper-backed offline-local engines.
function isOfflineLocal(agentId: string): boolean {
  return BUILTIN_AGENTS.find((a) => a.id === agentId)?.kind === 'offline-local';
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

// The open ASR session for the current listening lifetime (null when idle). Owned
// by main; the renderer only streams PCM frames into it via `pushAudio`.
let activeSession: AsrSession | null = null;
let segmentSeq = 0;

// Close + drop the active session. Idempotent; never throws (§5.7).
function closeSession(): void {
  if (activeSession) {
    try {
      activeSession.close();
    } catch (e) {
      log.warn('Closing ASR session failed (ignored):', e);
    }
    activeSession = null;
  }
}

function apply(action: OrchestratorAction): AiStatus {
  // Inject real key storage so the availability gate reflects safeStorage.
  const wasListening = state.listening;
  state = reduce(state, action, agentHasKey, agentInstalled);
  // Any transition that turned listening OFF (kill-switch, agent switch, cloud
  // opt-out, explicit stop) must also tear down the live engine — the reducer
  // owns the flag, the session lives here. No orphaned sockets/child processes.
  if (wasListening && !state.listening) closeSession();
  return toStatus(state);
}

// Push a main-initiated status change to the operator UI (a session error or an
// auto-degrade flips listening off without a renderer call — the UI must learn of
// it without polling). Presenter only — the audience never sees AI control state.
function pushStatus(): void {
  sendToPresenter(CHANNELS.ai.statusChanged, toStatus(state));
}

// Read a cloud agent's stored key without ever throwing (a safeStorage/DB hiccup
// must not crash the control surface). Returns null when no usable key exists.
function readKey(agentId: string): string | null {
  try {
    return secrets.get(keyName(agentId));
  } catch (e) {
    log.warn(`Reading key for ${agentId} failed:`, e);
    return null;
  }
}

// The single source of "audio in → results out" for a chosen agent. Throws a
// clear, operator-facing message when the engine can't be built; the caller
// reverts to not-listening with that reason (never a half-open session).
function buildSession(agentId: string, callbacks: AsrSessionCallbacks): AsrSession {
  if (agentId === 'deepgram' || agentId === 'assemblyai') {
    const apiKey = readKey(agentId);
    if (!apiKey) throw new Error('No API key — add one in Settings → AI & Privacy');
    const WebSocketImpl = (globalThis as { WebSocket?: WebSocketCtor }).WebSocket;
    if (!WebSocketImpl) throw new Error('Streaming is unavailable in this runtime');
    const opts = { apiKey, sampleRate: TARGET_SAMPLE_RATE, callbacks, WebSocketImpl };
    return agentId === 'deepgram' ? createDeepgramSession(opts) : createAssemblyAiSession(opts);
  }
  if (agentId === 'claude') {
    throw new Error(
      'Claude transcribes nothing — it is an extraction engine. Pick a cloud STT ' +
        '(Deepgram/AssemblyAI) or a local model.',
    );
  }
  // Local engines (praisepresent-local, whisper-local) → whisper.cpp sidecar. Needs
  // both the binary and a downloaded model; otherwise a clear, actionable reason.
  if (!localAsr.isInstalled()) {
    throw new Error(
      'Local transcription isn’t ready — download a model in Settings → AI & Privacy ' +
        '(and ensure the whisper engine is available).',
    );
  }
  return createWhisperSession({ callbacks });
}

// The session factory is injectable so unit tests can drive the listening lifecycle
// (start/stop/degrade) with a fake engine — never opening a real socket / child
// process. The default is the real `buildSession`; mirrors `setConnectivityCheck`.
export type SessionFactory = (agentId: string, callbacks: AsrSessionCallbacks) => AsrSession;
let sessionFactory: SessionFactory = buildSession;
export function setSessionFactory(factory: SessionFactory): void {
  sessionFactory = factory;
}

// The callbacks every session reports through. Transcript → detect + emit;
// error/close → stop fail-safe and tell the UI.
function sessionCallbacks(): AsrSessionCallbacks {
  return {
    onTranscript: handleTranscript,
    onError: handleSessionError,
    onClose: handleSessionClose,
  };
}

// A final transcript segment arrived. Emit it for the live transcript view and —
// unless transcript-only — run the EXISTING deterministic detector + resolver and
// emit any candidates to the operator review queue (human-in-the-loop, R8). We act
// on finals only; interim partials churn and would produce flickering candidates.
function handleTranscript(t: AsrTranscript): void {
  if (!state.listening || !t.isFinal) return;
  const candidates = state.transcriptOnly ? [] : detectAndResolve(t.text);
  const refs: DetectedReference[] = candidates.map((c) => ({
    reference: c.reference,
    type: c.type,
    confidence: c.confidence,
  }));
  const segment: TranscriptSegment = {
    id: `seg-${++segmentSeq}`,
    text: t.text,
    at: Date.now(),
    ...(refs.length > 0 ? { refs } : {}),
  };
  sendToPresenter(CHANNELS.ai.transcript, segment);
  if (candidates.length > 0) sendToPresenter(CHANNELS.ai.candidates, candidates);
}

// Stop listening fail-safe and carry a reason on the status. The reducer clears
// lastError on stop, so we re-apply it here — one place for the "stop with reason"
// shape (used by errors, a failed engine start, and a failed degrade).
function stopWith(reason: string): void {
  closeSession();
  state = {
    ...reduce(state, { type: 'stopListening' }, agentHasKey, agentInstalled),
    lastError: reason,
  };
}

function isOnlineAgent(agentId: string): boolean {
  return BUILTIN_AGENTS.find((a) => a.id === agentId)?.online ?? false;
}

// Silently fall back from a cloud engine to the offline default with NO operator
// action (spec §7). The cloud socket is torn down FIRST (no more egress), then we
// switch engines; if we were listening we re-open on the offline engine, else stop
// fail-safe with the reason (e.g. no local model). Assumes a cloud agent is active.
function degradeToOffline(reason: string): void {
  closeSession();
  state = reduce(state, { type: 'autoDegrade' }, agentHasKey, agentInstalled);
  if (state.listening) {
    try {
      activeSession = sessionFactory(state.activeAgentId, sessionCallbacks());
    } catch (e) {
      activeSession = null;
      const why = e instanceof Error ? e.message : 'offline engine unavailable';
      stopWith(`${reason} — ${why}`);
    }
  }
}

// A recoverable engine error (bad key, transport fault). Stop listening fail-safe
// with the reason; never let it bubble into an unhandled rejection (§5.7).
function handleSessionError(message: string): void {
  stopWith(message);
  pushStatus();
}

// The engine closed unexpectedly while we believed we were listening (our own
// stop() suppresses this callback, so the far end went away). For a CLOUD engine
// this IS a mid-service connectivity loss → auto-degrade to the offline default
// with no operator action (spec §7). A local engine closing just stops.
function handleSessionClose(): void {
  if (!state.listening) return;
  if (isOnlineAgent(state.activeAgentId)) degradeToOffline('Transcription connection closed');
  else stopWith('Transcription connection closed');
  pushStatus();
}

// Detect references in free text and resolve each through the Phase 3 scripture
// service (reuse, no duplicated Bible logic). References that don't resolve to real
// verses are dropped — that's the resolution-precision gate. Shared by the typed
// path (submitText) and the live transcript path (handleTranscript). Pure.
function detectAndResolve(text: string): AiCandidate[] {
  const candidates: AiCandidate[] = [];
  for (const d of detectReferences(text)) {
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
}

// Every whisper variant's install state + the operator's preference (or null =
// automatic) + which one is actually active right now. Module-level (not a
// method) so the three model-manager actions below can share it without a
// `this` reference (this object is a plain literal, not a class instance).
function buildModelsStatus(): WhisperModelsStatus {
  return {
    models: listWhisperModels(),
    progress: whisperDownloadProgress() ?? undefined,
    preferredModelId: getPreferredModel(),
    activeModelId: installedModel(),
  };
}

export const aiScriptureDetector = {
  // --- text path (unchanged) ----------------------------------------------
  submitText(text: string): AiCandidate[] {
    return detectAndResolve(text);
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
    state = reduce(state, { type: 'setSources', sources }, agentHasKey, agentInstalled);
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

  // --- local model download manager (P4-T3) --------------------------------
  // Every offline-local engine is whisper-backed, so its model state comes from the
  // real download manager (installed / downloading + progress / absent). Non-local
  // (cloud) agents have no local model.
  modelStatus(agentId: string): AiModelStatus {
    if (isOfflineLocal(agentId)) return whisperModelStatus(agentId);
    return modelStatusFor(agentId);
  },

  // Kick off a whisper model download in the background and return the
  // now-`downloading` status immediately; the renderer polls `modelStatus`/
  // `listModels` for progress. `modelId` lets the operator pick which variant
  // (tiny/base/small); omitted, it downloads the app's default (base).
  // Idempotent: a no-op if THAT variant is already installed or a download is
  // in flight (only one runs at a time). Cloud agents have nothing to download.
  downloadModel(agentId: string, modelId?: WhisperModelId): AiModelStatus {
    if (!isOfflineLocal(agentId)) return modelStatusFor(agentId);
    const id = modelId ?? DEFAULT_WHISPER_MODEL;
    if (isModelInstalled(id) || isWhisperDownloading()) return whisperModelStatus(agentId);
    // Fire-and-forget; failures are logged and surface as `absent` on the next poll.
    void downloadWhisperModel(id).catch((e) => {
      log.error('Whisper model download failed:', e);
    });
    return whisperModelStatus(agentId);
  },

  // Every whisper variant's install state + the operator's preference (or
  // null = automatic) + which one is actually active right now.
  listModels(): WhisperModelsStatus {
    return buildModelsStatus();
  },

  // Pin (or, with null, clear) the operator's explicit model choice.
  setPreferredModel(modelId: WhisperModelId | null): WhisperModelsStatus {
    setPreferredWhisperModel(modelId);
    return buildModelsStatus();
  },

  // Remove a downloaded variant to free disk space. Throws (surfaced as a
  // generic IPC error, §5.7) if that variant is currently downloading — the UI
  // should disable the control while any download is in flight.
  deleteModel(modelId: WhisperModelId): WhisperModelsStatus {
    deleteWhisperModel(modelId);
    return buildModelsStatus();
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
    // Wrap the one mutating secrets call so a safeStorage/DB hiccup surfaces as a
    // clear failure rather than crashing the control surface (§5.7) — symmetry with
    // readKey/agentHasKey, which already swallow storage errors.
    try {
      secrets.set(keyName(agentId), apiKey);
    } catch (e) {
      log.error(`Storing key for ${agentId} failed:`, e);
      throw new Error('Could not store the API key in secure storage', { cause: e });
    }
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
  // Probe connectivity via the injectable check. If we've lost connection AND a
  // cloud agent is active, silently fall back to the offline default (spec §7). An
  // offline agent doesn't need the network, so a false reading there is a no-op —
  // we never stop a working offline session over a connectivity blip. This is the
  // explicit-probe path; a dropped cloud socket also triggers degrade on its own
  // (handleSessionClose), so connectivity loss is caught either way.
  checkConnectivity(): AiStatus {
    if (isOnlineCheck()) return toStatus(state);
    if (!isOnlineAgent(state.activeAgentId)) return toStatus(state);
    degradeToOffline('Lost connection');
    pushStatus();
    return toStatus(state);
  },

  // Begin a listening session. The reducer gates it (kill-switch, cloud opt-in,
  // agent availability); only if it allows listening do we actually open the
  // engine. If the engine can't be built we revert to not-listening with the
  // reason — the renderer never gets a "listening" status with no backend (§5.7).
  startListening(): AiStatus {
    const gated = apply({ type: 'startListening' });
    if (!gated.listening) return gated; // blocked — reason already on the status
    try {
      closeSession(); // never leak a prior session
      activeSession = sessionFactory(gated.activeAgentId, sessionCallbacks());
      return gated;
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'Could not start transcription';
      stopWith(reason);
      return toStatus(state);
    }
  },

  stopListening(): AiStatus {
    closeSession();
    return apply({ type: 'stopListening' });
  },

  // Stream one captured PCM frame into the active engine. No-ops unless we're
  // genuinely listening with an open session — a stray frame after Stop is dropped.
  pushAudio(pcm: Int16Array): void {
    if (!state.listening || !activeSession) return;
    activeSession.pushAudio(pcm);
  },
};
