import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AiCandidate,
  AiStatus,
  DetectionMode,
  TranscriptionAgent,
  TranscriptSegment,
} from '@/shared/schemas/ai';

// The Live-Detect console's view of the A1 orchestrator (CLAUDE.md §1.3/§1.5):
// it reads status + the agent registry through `window.api.ai`, subscribes to the
// pushed transcript/candidate streams, and exposes typed actions that round-trip
// the returned `AiStatus` back into local view state. NO privileged work here —
// every call goes over the bridge; Redux/DB truth stays in main. Human-in-the-loop
// is preserved upstream (R8): this hook never projects anything on its own.

const MAX_TRANSCRIPT = 50;

export type AiConsole = {
  status: AiStatus | null;
  agents: TranscriptionAgent[];
  /** Newest-last rolling transcript window (pushed from main; capped). */
  transcript: TranscriptSegment[];
  /** Most recent candidate batch (from a push or a typed `submitText`). */
  candidates: AiCandidate[];
  /** Index of the candidate currently shown in the detection pane. */
  selectedIndex: number;
  /** True while the initial status/agent fetch is in flight. */
  loading: boolean;
  error: string | null;
  setMode: (mode: DetectionMode) => Promise<void>;
  setAgent: (agentId: string) => Promise<void>;
  setSource: (sourceId: string) => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Run the typed/pasted-text detection path; surfaces candidates locally. */
  submitText: (text: string) => Promise<void>;
  select: (index: number) => void;
  /** Drop a candidate from the local review queue (no main-side effect). */
  dismiss: (index: number) => void;
};

export function useAiConsole(): AiConsole {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [agents, setAgents] = useState<TranscriptionAgent[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [candidates, setCandidates] = useState<AiCandidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest status reachable from the agent-refresh effect without
  // re-subscribing on every status change.
  const statusRef = useRef<AiStatus | null>(null);
  statusRef.current = status;

  const apply = useCallback((next: AiStatus) => {
    setStatus(next);
    setError(next.lastError ?? null);
  }, []);

  // Initial load + live subscriptions.
  useEffect(() => {
    let alive = true;

    void (async () => {
      const [st, ag] = await Promise.all([window.api.ai.status(), window.api.ai.listAgents()]);
      if (!alive) return;
      if (st.ok) apply(st.data);
      if (ag.ok) setAgents(ag.data);
      setLoading(false);
    })();

    const offTranscript = window.api.ai.onTranscript((segment) => {
      setTranscript((prev) => [...prev, segment].slice(-MAX_TRANSCRIPT));
    });
    const offCandidates = window.api.ai.onCandidates((batch) => {
      if (batch.length === 0) return;
      setCandidates(batch);
      setSelectedIndex(0);
    });

    return () => {
      alive = false;
      offTranscript();
      offCandidates();
    };
  }, [apply]);

  // Agent availability (hasKey/installed) can change after a Settings round-trip;
  // re-pull the registry whenever the active agent changes so gated states stay
  // honest in the grid.
  const refreshAgents = useCallback(async () => {
    const ag = await window.api.ai.listAgents();
    if (ag.ok) setAgents(ag.data);
  }, []);

  const setMode = useCallback(
    async (mode: DetectionMode) => {
      const res = await window.api.ai.setMode(mode);
      if (res.ok) apply(res.data);
      else setError(res.error);
    },
    [apply],
  );

  const setAgent = useCallback(
    async (agentId: string) => {
      const res = await window.api.ai.setAgent(agentId);
      if (res.ok) apply(res.data);
      else setError(res.error);
      await refreshAgents();
    },
    [apply, refreshAgents],
  );

  const setSource = useCallback(
    async (sourceId: string) => {
      const res = await window.api.ai.setSource(sourceId);
      if (res.ok) apply(res.data);
      else setError(res.error);
    },
    [apply],
  );

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      const res = await window.api.ai.setEnabled(enabled);
      if (res.ok) apply(res.data);
      else setError(res.error);
    },
    [apply],
  );

  const submitText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const res = await window.api.ai.submitText(text);
    if (res.ok) {
      setCandidates(res.data);
      setSelectedIndex(0);
      setError(null);
    } else {
      setError(res.error);
    }
  }, []);

  const select = useCallback((index: number) => setSelectedIndex(index), []);

  const dismiss = useCallback((index: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex((prev) => (index <= prev && prev > 0 ? prev - 1 : prev));
  }, []);

  return {
    status,
    agents,
    transcript,
    candidates,
    selectedIndex,
    loading,
    error,
    setMode,
    setAgent,
    setSource,
    setEnabled,
    submitText,
    select,
    dismiss,
  };
}
