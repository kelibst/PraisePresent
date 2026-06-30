import { describe, it, expect } from 'vitest';
import {
  BUILTIN_AGENTS,
  DEFAULT_AGENT_ID,
  DEFAULT_AUTO_PROJECT,
  DEFAULT_SOURCE_ID,
  findAgent,
  initialState,
  isAgentAvailable,
  modelStatusFor,
  reduce,
  shouldAutoProject,
  toStatus,
  type OrchestratorState,
} from './aiOrchestratorState';

describe('aiOrchestratorState — registry', () => {
  it('exposes the five built-in agents with the documented gates', () => {
    const ids = BUILTIN_AGENTS.map((a) => a.id);
    expect(ids).toEqual([
      'praisepresent-local',
      'whisper-local',
      'claude',
      'deepgram',
      'assemblyai',
    ]);

    const local = findAgent('praisepresent-local')!;
    expect(local.kind).toBe('offline-local');
    expect(local.installed).toBe(true);
    expect(local.requiresKey).toBe(false);

    const whisper = findAgent('whisper-local')!;
    expect(whisper.kind).toBe('offline-local');
    expect(whisper.installed).toBe(false); // model-gated stub

    for (const id of ['claude', 'deepgram', 'assemblyai']) {
      const cloud = findAgent(id)!;
      expect(cloud.kind).toBe('online-cloud');
      expect(cloud.online).toBe(true);
      expect(cloud.requiresKey).toBe(true);
      expect(cloud.hasKey).toBe(false); // key-gated stub
    }
  });

  it('isAgentAvailable gates offline on installed, online on hasKey', () => {
    expect(isAgentAvailable(findAgent('praisepresent-local')!)).toBe(true);
    expect(isAgentAvailable(findAgent('whisper-local')!)).toBe(false);
    expect(isAgentAvailable(findAgent('claude')!)).toBe(false);
  });
});

describe('aiOrchestratorState — initial state', () => {
  it('defaults to passive, enabled, not listening, local agent, offline', () => {
    const s = initialState();
    expect(s.mode).toBe('passive');
    expect(s.enabled).toBe(true);
    expect(s.listening).toBe(false);
    expect(s.activeAgentId).toBe(DEFAULT_AGENT_ID);
    expect(s.online).toBe(false);
    expect(s.lastError).toBeUndefined();
  });

  it('default auto-project is DISABLED and never auto-projects (R8)', () => {
    const s = initialState();
    expect(s.autoProject).toEqual(DEFAULT_AUTO_PROJECT);
    expect(s.autoProject.enabled).toBe(false);
    expect(s.transcriptOnly).toBe(false);
    // Even a perfect-confidence candidate is never auto-projected by default.
    expect(shouldAutoProject(s, 1)).toBe(false);
    expect(shouldAutoProject(s, 0)).toBe(false);
  });
});

describe('aiOrchestratorState — mode', () => {
  it('switches between passive and drive', () => {
    const s = reduce(initialState(), { type: 'setMode', mode: 'drive' });
    expect(s.mode).toBe('drive');
    expect(reduce(s, { type: 'setMode', mode: 'passive' }).mode).toBe('passive');
  });
});

describe('aiOrchestratorState — kill-switch', () => {
  it('setEnabled(false) is a hard stop: forces listening off', () => {
    // Make a state that is listening on the available local agent.
    let s = initialState();
    s = reduce(s, { type: 'startListening' });
    expect(s.listening).toBe(true);

    const off = reduce(s, { type: 'setEnabled', enabled: false });
    expect(off.enabled).toBe(false);
    expect(off.listening).toBe(false);
  });

  it('cannot start listening while disabled', () => {
    let s = reduce(initialState(), { type: 'setEnabled', enabled: false });
    s = reduce(s, { type: 'startListening' });
    expect(s.listening).toBe(false);
    expect(s.lastError).toMatch(/turned off/i);
  });

  it('re-enabling does not auto-resume listening', () => {
    let s = reduce(initialState(), { type: 'setEnabled', enabled: false });
    s = reduce(s, { type: 'setEnabled', enabled: true });
    expect(s.enabled).toBe(true);
    expect(s.listening).toBe(false);
  });
});

describe('aiOrchestratorState — agent selection', () => {
  it('switches to a known agent and stops listening', () => {
    let s = reduce(initialState(), { type: 'startListening' });
    expect(s.listening).toBe(true);
    s = reduce(s, { type: 'setAgent', agentId: 'whisper-local' });
    expect(s.activeAgentId).toBe('whisper-local');
    expect(s.listening).toBe(false);
  });

  it('rejects an unknown agent without throwing or mutating the active id', () => {
    const s = reduce(initialState(), { type: 'setAgent', agentId: 'nope' });
    expect(s.activeAgentId).toBe(DEFAULT_AGENT_ID);
    expect(s.lastError).toMatch(/unknown agent/i);
  });
});

describe('aiOrchestratorState — listening availability', () => {
  it('starts listening on the available bundled local agent', () => {
    const s = reduce(initialState(), { type: 'startListening' });
    expect(s.listening).toBe(true);
    expect(s.lastError).toBeUndefined();
  });

  it('no-ops with a clear status for an uninstalled offline agent', () => {
    let s = reduce(initialState(), { type: 'setAgent', agentId: 'whisper-local' });
    s = reduce(s, { type: 'startListening' });
    expect(s.listening).toBe(false);
    expect(s.lastError).toMatch(/install/i);
  });

  it('no-ops for a keyless cloud agent even with online enabled', () => {
    let s = reduce(initialState(), { type: 'setOnline', online: true });
    s = reduce(s, { type: 'setAgent', agentId: 'claude' });
    s = reduce(s, { type: 'startListening' });
    expect(s.listening).toBe(false);
    expect(s.lastError).toMatch(/api key/i);
  });

  it('requires the online opt-in before a cloud agent can listen', () => {
    let s = reduce(initialState(), { type: 'setAgent', agentId: 'claude' });
    // online is still false here.
    s = reduce(s, { type: 'startListening' });
    expect(s.listening).toBe(false);
    expect(s.lastError).toMatch(/online mode/i);
  });

  it('turning the online opt-in off stops a listening cloud agent', () => {
    // Force a listening cloud state through the reducer's own gate by faking key.
    const base: OrchestratorState = {
      ...initialState(),
      online: true,
      activeAgentId: 'claude',
      listening: true,
    };
    const s = reduce(base, { type: 'setOnline', online: false });
    expect(s.online).toBe(false);
    expect(s.listening).toBe(false);
  });

  it('stopListening always clears listening', () => {
    let s = reduce(initialState(), { type: 'startListening' });
    s = reduce(s, { type: 'stopListening' });
    expect(s.listening).toBe(false);
  });
});

describe('aiOrchestratorState — toStatus', () => {
  it('projects the full status shape', () => {
    const status = toStatus(initialState());
    expect(status).toEqual({
      enabled: true,
      mode: 'passive',
      listening: false,
      activeAgentId: DEFAULT_AGENT_ID,
      online: false,
      autoProject: DEFAULT_AUTO_PROJECT,
      transcriptOnly: false,
      selectedSourceId: DEFAULT_SOURCE_ID,
      lastError: undefined,
    });
  });
});

describe('aiOrchestratorState — auto-project guard (R8)', () => {
  it('never auto-projects below the configured threshold when enabled', () => {
    const s = reduce(initialState(), {
      type: 'setAutoProject',
      config: { enabled: true, minConfidence: 0.9 },
    });
    expect(s.autoProject).toEqual({ enabled: true, minConfidence: 0.9 });
    expect(shouldAutoProject(s, 0.89)).toBe(false);
    expect(shouldAutoProject(s, 0.9)).toBe(true);
    expect(shouldAutoProject(s, 1)).toBe(true);
  });

  it('the kill-switch overrides auto-project entirely', () => {
    let s = reduce(initialState(), {
      type: 'setAutoProject',
      config: { enabled: true, minConfidence: 0.5 },
    });
    s = reduce(s, { type: 'setEnabled', enabled: false });
    expect(shouldAutoProject(s, 1)).toBe(false);
  });

  it('clamps an out-of-range minConfidence', () => {
    const hi = reduce(initialState(), {
      type: 'setAutoProject',
      config: { enabled: true, minConfidence: 5 },
    });
    expect(hi.autoProject.minConfidence).toBe(1);
    const lo = reduce(initialState(), {
      type: 'setAutoProject',
      config: { enabled: true, minConfidence: -2 },
    });
    expect(lo.autoProject.minConfidence).toBe(0);
  });
});

describe('aiOrchestratorState — transcript-only', () => {
  it('toggles the transcript-only flag without touching detection state', () => {
    const on = reduce(initialState(), { type: 'setTranscriptOnly', transcriptOnly: true });
    expect(on.transcriptOnly).toBe(true);
    expect(on.enabled).toBe(true);
    const off = reduce(on, { type: 'setTranscriptOnly', transcriptOnly: false });
    expect(off.transcriptOnly).toBe(false);
  });
});

describe('aiOrchestratorState — auto-degrade (connectivity loss)', () => {
  it('falls back online → offline default with no operator action', () => {
    const base: OrchestratorState = {
      ...initialState(),
      online: true,
      activeAgentId: 'claude',
      listening: true,
    };
    const s = reduce(base, { type: 'autoDegrade' });
    expect(s.activeAgentId).toBe(DEFAULT_AGENT_ID);
    expect(s.online).toBe(false);
    expect(s.lastError).toMatch(/offline/i);
  });

  it('is a no-op when an offline agent is already active', () => {
    const s = reduce(initialState(), { type: 'autoDegrade' });
    expect(s).toEqual(initialState());
  });
});

describe('aiOrchestratorState — online availability with real keys', () => {
  it('listening on a cloud agent requires the injected hasKeyFor to be true', () => {
    let s = reduce(initialState(), { type: 'setOnline', online: true });
    s = reduce(s, { type: 'setAgent', agentId: 'claude' });
    // No key → blocked.
    const blocked = reduce(s, { type: 'startListening' }, () => false);
    expect(blocked.listening).toBe(false);
    expect(blocked.lastError).toMatch(/api key/i);
    // Key present (injected) → listening succeeds even though the registry
    // flag is false.
    const ok = reduce(s, { type: 'startListening' }, (id) => id === 'claude');
    expect(ok.listening).toBe(true);
  });
});

describe('aiOrchestratorState — audio sources', () => {
  it('starts with the built-in default selected and listed', () => {
    const s = initialState();
    expect(s.selectedSourceId).toBe(DEFAULT_SOURCE_ID);
    expect(s.sources.map((x) => x.id)).toEqual([DEFAULT_SOURCE_ID]);
    expect(toStatus(s).selectedSourceId).toBe(DEFAULT_SOURCE_ID);
  });

  it('setSources merges renderer devices and always keeps the default (deduped)', () => {
    const s = reduce(initialState(), {
      type: 'setSources',
      sources: [
        { id: 'default', label: 'dup default' },
        { id: 'mic-1', label: 'USB Mic' },
      ],
    });
    expect(s.sources.map((x) => x.id)).toEqual([DEFAULT_SOURCE_ID, 'mic-1']);
  });

  it('setSource selects a known device; rejects an unknown id without throwing', () => {
    let s = reduce(initialState(), {
      type: 'setSources',
      sources: [{ id: 'mic-1', label: 'USB Mic' }],
    });
    s = reduce(s, { type: 'setSource', sourceId: 'mic-1' });
    expect(s.selectedSourceId).toBe('mic-1');

    const bad = reduce(s, { type: 'setSource', sourceId: 'ghost' });
    expect(bad.selectedSourceId).toBe('mic-1'); // unchanged
    expect(bad.lastError).toMatch(/unknown audio source/i);
  });

  it('falls back to the default when the selected device disappears', () => {
    let s = reduce(initialState(), {
      type: 'setSources',
      sources: [{ id: 'mic-1', label: 'USB Mic' }],
    });
    s = reduce(s, { type: 'setSource', sourceId: 'mic-1' });
    // The device is unplugged → it's gone from the new list.
    s = reduce(s, { type: 'setSources', sources: [] });
    expect(s.selectedSourceId).toBe(DEFAULT_SOURCE_ID);
  });
});

describe('aiOrchestratorState — local model status (R6 stub)', () => {
  it('reports whisper-local as absent / not installed', () => {
    const m = modelStatusFor('whisper-local');
    expect(m.installed).toBe(false);
    expect(m.state).toBe('absent');
    expect(m.detail).toMatch(/not available/i);
  });

  it('reports the bundled local engine as ready', () => {
    const m = modelStatusFor('praisepresent-local');
    expect(m.installed).toBe(true);
    expect(m.state).toBe('ready');
  });

  it('reports absent for a non-local / unknown engine', () => {
    expect(modelStatusFor('claude').state).toBe('absent');
    expect(modelStatusFor('does-not-exist').state).toBe('absent');
  });
});
