import { useEffect, useState } from 'react';
import { MonitorOff, BookText, Radio } from 'lucide-react';

import { cn } from '@/renderer/lib/utils';
import type { DisplayInfo } from '@/shared/schemas/display';
import type { AiStatus } from '@/shared/schemas/ai';

// Slim bottom status strip (CLAUDE.md §5.4). Reports the audience display, the
// bundled bible, the Live-Detect engine state and the app version. Renderer-only:
// all data comes through `window.api` (§1.3); the version is a build-time
// constant injected by Vite (no IPC needed).

type DisplayStatus = {
  connected: boolean;
  label: string | null;
  resolution: string | null;
};

const DISCONNECTED: DisplayStatus = { connected: false, label: null, resolution: null };

export default function StatusStrip() {
  const [display, setDisplay] = useState<DisplayStatus>(DISCONNECTED);
  const [ai, setAi] = useState<AiStatus | null>(null);

  // Resolve the audience display: the persisted choice, or auto (first
  // non-primary, else primary). Fails safe to "no display" on any error (§5.7).
  useEffect(() => {
    let active = true;
    void (async () => {
      const [listRes, audRes] = await Promise.all([
        window.api.display.list(),
        window.api.display.getAudience(),
      ]);
      if (!active) return;
      if (!listRes.ok || listRes.data.length === 0) {
        setDisplay(DISCONNECTED);
        return;
      }
      const displays: DisplayInfo[] = listRes.data;
      const chosenId = audRes.ok ? audRes.data.displayId : null;
      const chosen =
        (chosenId !== null && displays.find((d) => d.id === chosenId)) ||
        displays.find((d) => !d.isPrimary) ||
        displays[0];
      setDisplay({
        connected: true,
        label: chosen.label,
        resolution: chosen.width > 0 ? `${chosen.width}×${chosen.height}` : null,
      });
    })();
    return () => {
      active = false;
    };
  }, []);

  // Live-Detect engine status.
  useEffect(() => {
    let active = true;
    void window.api.ai.status().then((res) => {
      if (active && res.ok) setAi(res.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const aiLabel = !ai
    ? 'Live Detect: off'
    : !ai.enabled
      ? 'Live Detect: off'
      : ai.listening
        ? 'Live Detect: listening'
        : 'Live Detect: ready';
  const aiActive = Boolean(ai?.enabled && ai.listening);

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-pp-border-soft bg-pp-surface-2 px-3 text-[11px] text-pp-text-dim">
      {/* Audience display */}
      <span className="flex items-center gap-1.5" title="Audience display">
        {display.connected ? (
          <span
            className="size-1.5 rounded-full bg-pp-success shadow-[0_0_6px_1px_hsl(var(--pp-success)/0.5)]"
            aria-hidden="true"
          />
        ) : (
          <MonitorOff className="size-3.5 text-pp-warn" aria-hidden="true" />
        )}
        {display.connected ? (
          <span className="text-pp-text-muted">
            <span className="text-pp-text-dim">Audience: </span>
            {display.label} connected
            {display.resolution ? ` · ${display.resolution}` : ''}
          </span>
        ) : (
          <span className="text-pp-warn">No audience display</span>
        )}
      </span>

      {/* Bible */}
      <span className="flex items-center gap-1.5" title="Bundled translation">
        <BookText className="size-3.5 text-pp-text-muted" aria-hidden="true" />
        <span className="text-pp-text-muted">Bible: WEB (bundled, offline)</span>
      </span>

      {/* Live Detect */}
      <span className="flex items-center gap-1.5" title="AI scripture detection">
        <Radio
          className={cn('size-3.5', aiActive ? 'text-pp-success' : 'text-pp-text-muted')}
          aria-hidden="true"
        />
        <span className={cn(aiActive ? 'text-pp-success' : 'text-pp-text-muted')}>{aiLabel}</span>
      </span>

      {/* Version */}
      <span className="ml-auto text-pp-text-dim">v{__APP_VERSION__}</span>
    </footer>
  );
}
