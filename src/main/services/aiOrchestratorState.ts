import type {
  AiModelStatus,
  AiStatus,
  AudioSource,
  AutoProjectConfig,
  DetectionMode,
  ModelState,
  TranscriptionAgent,
} from '@/shared/schemas/ai';

// PURE orchestrator reducer + built-in registry (CLAUDE.md §5.8 — no electron /
// native deps, fully unit-testable; pattern: planEstimate.ts). It models the AI
// control surface as in-memory state: which agent is active, the detection mode,
// the kill-switch, the cloud opt-in, and whether we are "listening". Real audio
// capture, network, and keys land in A2/A4 — here every agent is a stub whose
// availability is decided by `installed` (offline-local) / `hasKey` (online).
//
// Invariants enforced here (so the IPC layer can't drift):
//   - default mode is `passive` (operator-confirmed, never auto-project — R8).
//   - `enabled=false` is a HARD kill-switch: it also forces `listening=false`.
//   - listening is only possible when enabled AND the active agent is available.

// --- built-in agent registry ----------------------------------------------
// Stable, code-defined list (no DB). `installed`/`hasKey` are the gates A2/A4
// will flip when a local model is present / a cloud key is stored. In A1 only
// the always-available local engine is usable.
export const BUILTIN_AGENTS: readonly TranscriptionAgent[] = [
  {
    id: 'praisepresent-local',
    name: 'PraisePresent Local',
    kind: 'offline-local',
    online: false,
    requiresKey: false,
    installed: true, // the always-on, bundled offline engine
    hasKey: false,
  },
  {
    id: 'whisper-local',
    name: 'Whisper (local)',
    kind: 'offline-local',
    online: false,
    requiresKey: false,
    installed: false, // model-gated stub — A2 downloads/installs the model
    hasKey: false,
  },
  {
    id: 'claude',
    name: 'Claude (cloud)',
    kind: 'online-cloud',
    online: true,
    requiresKey: true,
    installed: true,
    hasKey: false, // key-gated stub — A4 stores the key in safeStorage
  },
  {
    id: 'deepgram',
    name: 'Deepgram (cloud)',
    kind: 'online-cloud',
    online: true,
    requiresKey: true,
    installed: true,
    hasKey: false,
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI (cloud)',
    kind: 'online-cloud',
    online: true,
    requiresKey: true,
    installed: true,
    hasKey: false,
  },
] as const;

export const DEFAULT_AGENT_ID = 'praisepresent-local';

// The off-by-default auto-project guard (R8). The DEFAULT config NEVER
// auto-projects — `enabled` is false, so no candidate is ever pushed to the
// screen without an operator click, even in `drive` mode.
export const DEFAULT_AUTO_PROJECT: AutoProjectConfig = { enabled: false, minConfidence: 0.95 };

// The always-present fallback audio source. Real device labels are enumerated in
// the RENDERER (via `navigator.mediaDevices` — the only Web-API exception, §5.2)
// and pushed to main via `setSources`; this default is shown when the renderer
// has nothing (no permission / headless) so the Settings UI always has an option.
export const DEFAULT_SOURCE: AudioSource = {
  id: 'default',
  label: 'System default microphone',
} as const;
export const DEFAULT_SOURCE_ID = DEFAULT_SOURCE.id;

// Derive the model-download-manager state for a model-gated local engine from
// the registry. PURE — the real download lands later (R6); until then a
// non-installed model is always `absent` and an installed one is `ready`.
export function modelStatusFor(agentId: string): AiModelStatus {
  const agent = findAgent(agentId);
  if (!agent || agent.kind !== 'offline-local') {
    return {
      agentId,
      installed: false,
      state: 'absent',
      detail: 'No local model for this engine',
    };
  }
  const state: ModelState = agent.installed ? 'ready' : 'absent';
  return {
    agentId,
    installed: agent.installed,
    state,
    detail: agent.installed ? undefined : 'Model not available in this build',
  };
}

// Internal orchestrator state. `lastError` is surfaced to the operator (e.g.
// "agent not available") and cleared on the next successful transition.
export type OrchestratorState = {
  enabled: boolean;
  mode: DetectionMode;
  listening: boolean;
  activeAgentId: string;
  online: boolean;
  autoProject: AutoProjectConfig;
  transcriptOnly: boolean;
  // The operator-selected audio input id, and the renderer-enumerated source
  // list (labels come from `navigator.mediaDevices`). Capture itself is deferred.
  selectedSourceId: string;
  sources: readonly AudioSource[];
  lastError?: string;
};

// The initial state: kill-switch on but passive, not listening, local agent,
// auto-project disabled (never auto-projects — R8), transcript-only off.
export function initialState(): OrchestratorState {
  return {
    enabled: true,
    mode: 'passive',
    listening: false,
    activeAgentId: DEFAULT_AGENT_ID,
    online: false,
    autoProject: DEFAULT_AUTO_PROJECT,
    transcriptOnly: false,
    selectedSourceId: DEFAULT_SOURCE_ID,
    sources: [DEFAULT_SOURCE],
    lastError: undefined,
  };
}

// Should a candidate of this confidence be auto-projected? FALSE unless the
// operator explicitly enabled auto-project AND the candidate clears the
// configured threshold. The default config returns false for everything (R8).
export function shouldAutoProject(state: OrchestratorState, confidence: number): boolean {
  if (!state.enabled) return false; // kill-switch wins
  if (!state.autoProject.enabled) return false; // off by default
  return confidence >= state.autoProject.minConfidence;
}

export function findAgent(agentId: string): TranscriptionAgent | undefined {
  return BUILTIN_AGENTS.find((a) => a.id === agentId);
}

// A predicate the service injects so the reducer can consult REAL key storage
// for an online agent (the static registry's `hasKey` is always false). Pure
// callers (tests) omit it and fall back to the registry value.
export type HasKeyFor = (agentId: string) => boolean;

// Is an agent actually usable right now? Offline agents need `installed`; online
// agents need a key (real storage via `hasKeyFor` when provided, else the
// registry flag) and the operator's cloud opt-in (checked in the reducer).
export function isAgentAvailable(agent: TranscriptionAgent, hasKeyFor?: HasKeyFor): boolean {
  if (!agent.online) return agent.installed;
  return hasKeyFor ? hasKeyFor(agent.id) : agent.hasKey;
}

// --- actions ---------------------------------------------------------------
export type OrchestratorAction =
  | { type: 'setMode'; mode: DetectionMode }
  | { type: 'setEnabled'; enabled: boolean }
  | { type: 'setAgent'; agentId: string }
  | { type: 'setOnline'; online: boolean }
  | { type: 'setAutoProject'; config: AutoProjectConfig }
  | { type: 'setTranscriptOnly'; transcriptOnly: boolean }
  | { type: 'setSources'; sources: readonly AudioSource[] } // renderer-enumerated devices
  | { type: 'setSource'; sourceId: string } // operator-chosen input
  | { type: 'autoDegrade' } // connectivity loss → fall back online → offline
  | { type: 'startListening' }
  | { type: 'stopListening' };

// Why listening isn't possible right now, or null if it is. Online agents also
// require the operator's cloud opt-in (`online`). Pure — drives the stub status.
function listenBlockReason(state: OrchestratorState, hasKeyFor?: HasKeyFor): string | null {
  if (!state.enabled) return 'Detection is turned off';
  const agent = findAgent(state.activeAgentId);
  if (!agent) return 'No transcription agent selected';
  if (agent.online && !state.online) return `${agent.name} requires online mode to be enabled`;
  if (!isAgentAvailable(agent, hasKeyFor)) {
    return agent.online
      ? `${agent.name} is not available — add an API key`
      : `${agent.name} is not available — install it first`;
  }
  return null;
}

// The single pure transition. Never throws; clamps every result to the
// invariants above so the IPC layer can't produce an illegal state (§5.7).
// `hasKeyFor` lets the service inject real key storage for the availability
// gate; omit it (tests) to use the registry flags.
export function reduce(
  state: OrchestratorState,
  action: OrchestratorAction,
  hasKeyFor?: HasKeyFor,
): OrchestratorState {
  switch (action.type) {
    case 'setMode':
      return { ...state, mode: action.mode, lastError: undefined };

    case 'setEnabled': {
      // Hard kill-switch: turning off also forces listening off.
      if (!action.enabled) {
        return { ...state, enabled: false, listening: false, lastError: undefined };
      }
      return { ...state, enabled: true, lastError: undefined };
    }

    case 'setAgent': {
      // Unknown agent ids are rejected without throwing — keep current agent.
      if (!findAgent(action.agentId)) {
        return { ...state, lastError: `Unknown agent: ${action.agentId}` };
      }
      // Switching agents stops any in-progress listening (the front-end differs).
      return { ...state, activeAgentId: action.agentId, listening: false, lastError: undefined };
    }

    case 'setOnline': {
      // Turning the cloud opt-in off stops listening if a cloud agent is active.
      const agent = findAgent(state.activeAgentId);
      const listening = !action.online && agent?.online ? false : state.listening;
      return { ...state, online: action.online, listening, lastError: undefined };
    }

    case 'setAutoProject':
      // Clamp confidence into [0,1]; the schema also validates at the boundary.
      return {
        ...state,
        autoProject: {
          enabled: action.config.enabled,
          minConfidence: Math.min(1, Math.max(0, action.config.minConfidence)),
        },
        lastError: undefined,
      };

    case 'setTranscriptOnly':
      return { ...state, transcriptOnly: action.transcriptOnly, lastError: undefined };

    case 'setSources': {
      // Always keep the built-in default available (dedup by id); if the current
      // selection vanished from the new device list, fall back to the default.
      const merged = [DEFAULT_SOURCE, ...action.sources.filter((s) => s.id !== DEFAULT_SOURCE_ID)];
      const stillPresent = merged.some((s) => s.id === state.selectedSourceId);
      return {
        ...state,
        sources: merged,
        selectedSourceId: stillPresent ? state.selectedSourceId : DEFAULT_SOURCE_ID,
        lastError: undefined,
      };
    }

    case 'setSource': {
      // Unknown source ids are rejected without throwing — keep current.
      if (!state.sources.some((s) => s.id === action.sourceId)) {
        return { ...state, lastError: `Unknown audio source: ${action.sourceId}` };
      }
      return { ...state, selectedSourceId: action.sourceId, lastError: undefined };
    }

    case 'autoDegrade': {
      // Connectivity loss while a cloud agent is active: silently fall back to
      // the offline default and drop the cloud opt-in (zero network from here
      // on — spec §7). No-op if we're already on an offline agent.
      const agent = findAgent(state.activeAgentId);
      if (!agent?.online) return state;
      return {
        ...state,
        activeAgentId: DEFAULT_AGENT_ID,
        online: false,
        // Keep listening on the offline engine if we were listening — the
        // service continues without operator action; only the engine changes.
        lastError: 'Lost connection — switched to offline detection',
      };
    }

    case 'startListening': {
      const reason = listenBlockReason(state, hasKeyFor);
      if (reason) {
        // Stub no-op with a clear status — real capture lands in A2/A4 (R8).
        return { ...state, listening: false, lastError: reason };
      }
      return { ...state, listening: true, lastError: undefined };
    }

    case 'stopListening':
      return { ...state, listening: false, lastError: undefined };

    default:
      // Unreachable for the typed union; stay safe rather than throw (§5.7).
      return state;
  }
}

// Project internal state to the IPC-facing status (shared schema shape).
export function toStatus(state: OrchestratorState): AiStatus {
  return {
    enabled: state.enabled,
    mode: state.mode,
    listening: state.listening,
    activeAgentId: state.activeAgentId,
    online: state.online,
    autoProject: state.autoProject,
    transcriptOnly: state.transcriptOnly,
    selectedSourceId: state.selectedSourceId,
    lastError: state.lastError,
  };
}
