import { useCallback, useEffect, useState } from 'react';
import type { AudioSource } from '@/shared/schemas/ai';

// Audio-input enumeration hook (CLAUDE.md §5.2). This is the ONE place in the app
// that touches `navigator.mediaDevices` — a Web API (not electron/node/fs), and
// the only way to read device LABELS, which the main process cannot see. The
// enumerated sources are pushed to main via `ai.listSources`, which stores them +
// the selected id in orchestrator state; main returns the merged list (always
// including the built-in default) for the UI to render.
//
// No capture happens here — labels only. `getUserMedia` is requested solely to
// unlock real labels (browsers hide them until mic permission is granted), then
// the stream is stopped immediately. A denied/absent mic is non-fatal: main's
// default source still lists, so the operator always has something to pick.

function toSources(devices: MediaDeviceInfo[]): AudioSource[] {
  return devices
    .filter((d) => d.kind === 'audioinput' && d.deviceId)
    .map((d, i) => ({
      id: d.deviceId,
      label: d.label || `Microphone ${i + 1}`,
    }));
}

export type AudioSourcesHook = {
  /** The merged source list returned by main (default + enumerated devices). */
  sources: AudioSource[];
  /** Re-enumerate devices and push them to main; returns the merged list. */
  refresh: () => Promise<AudioSource[]>;
};

export function useAudioSources(): AudioSourcesHook {
  const [sources, setSources] = useState<AudioSource[]>([]);

  const refresh = useCallback(async (): Promise<AudioSource[]> => {
    let enumerated: AudioSource[] = [];
    try {
      // Best-effort permission unlock so labels are populated; ignore failure.
      const md = navigator.mediaDevices;
      if (md?.getUserMedia) {
        try {
          const stream = await md.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          // Permission denied / no mic — proceed with whatever enumerates.
        }
      }
      if (md?.enumerateDevices) {
        enumerated = toSources(await md.enumerateDevices());
      }
    } catch {
      // navigator.mediaDevices unavailable (headless) — push an empty list; main
      // keeps the built-in default so the UI is never empty.
      enumerated = [];
    }
    const res = await window.api.ai.listSources(enumerated);
    const merged = res.ok ? res.data : enumerated;
    setSources(merged);
    return merged;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { sources, refresh };
}
