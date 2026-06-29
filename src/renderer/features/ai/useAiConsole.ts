import { useCallback, useEffect, useState } from 'react';
import type { AiCandidate, AiStatus, DetectionMode, TranscriptSegment } from '@/shared/schemas/ai';

// The Live-Detect tab's view of the A1 orchestrator (CLAUDE.md §1.3/§1.5): it
// reads status through `window.api.ai`, drives start/stop + the passive⇄drive
// mode, and runs the typed-text detection path. CONFIG (audio source, agent,
// API key, thresholds, kill-switch) lives in Settings → AI & Privacy, not here.
//
// EFFICIENCY (hard requirement, §1.9/task M2): the pushed transcript/candidate
// streams are subscribed ONLY while `status.listening` is true — and the tab
// itself only mounts when it is the active source tab. On Stop, on a mode that
// halts listening, or on unmount, the listeners tear down with no orphans. NO
// privileged work here — every call goes over the bridge; truth stays in main.

const MAX_TRANSCRIPT = 50;

export type AiConsole = {
  status: AiStatus | null;
  /** Newest-last rolling transcript window (pushed from main; capped). */
  transcript: TranscriptSegment[];
  /** Most recent candidate batch (from a push or a typed `submitText`). */
  candidates: AiCandidate[];
  /** Index of the candidate currently shown in the detection view. */
  selectedIndex: number;
  /** True while the initial status fetch is in flight. */
  loading: boolean;
  error: string | null;
  /** Begin listening (stub when the active agent is unavailable). */
  startListening: () => Promise<void>;
  /** Stop listening (tears down the AI streams). */
  stopListening: () => Promise<void>;
  setMode: (mode: DetectionMode) => Promise<void>;
  /** Run the typed/pasted-text detection path; surfaces candidates locally. */
  submitText: (text: string) => Promise<void>;
  select: (index: number) => void;
  /** Drop a candidate from the local review queue (no main-side effect). */
  dismiss: (index: number) => void;
};

export function useAiConsole(): AiConsole {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [candidates, setCandidates] = useState<AiCandidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((next: AiStatus) => {
    setStatus(next);
    setError(next.lastError ?? null);
  }, []);

  // Initial status load (the agent registry + config live in Settings).
  useEffect(() => {
    let alive = true;
    void (async () => {
      const st = await window.api.ai.status();
      if (!alive) return;
      if (st.ok) apply(st.data);
      else setError(st.error);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [apply]);

  // EFFICIENCY: subscribe to the pushed streams ONLY while listening. The effect
  // re-runs whenever `listening` flips, attaching on start and detaching on stop
  // (and on unmount) — so a tab that is mounted but idle holds no AI listeners.
  const listening = status?.listening ?? false;
  useEffect(() => {
    if (!listening) return;
    const offTranscript = window.api.ai.onTranscript((segment) => {
      setTranscript((prev) => [...prev, segment].slice(-MAX_TRANSCRIPT));
    });
    const offCandidates = window.api.ai.onCandidates((batch) => {
      if (batch.length === 0) return;
      setCandidates(batch);
      setSelectedIndex(0);
    });
    return () => {
      offTranscript();
      offCandidates();
    };
  }, [listening]);

  const startListening = useCallback(async () => {
    const res = await window.api.ai.startListening();
    if (res.ok) apply(res.data);
    else setError(res.error);
  }, [apply]);

  const stopListening = useCallback(async () => {
    const res = await window.api.ai.stopListening();
    if (res.ok) apply(res.data);
    else setError(res.error);
    // Clear the transient transcript so a re-listen starts clean (the streams
    // are torn down by the listening-gated effect above).
    setTranscript([]);
  }, [apply]);

  const setMode = useCallback(
    async (mode: DetectionMode) => {
      const res = await window.api.ai.setMode(mode);
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
    transcript,
    candidates,
    selectedIndex,
    loading,
    error,
    startListening,
    stopListening,
    setMode,
    submitText,
    select,
    dismiss,
  };
}
