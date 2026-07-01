import { useCallback, useState } from 'react';
import { Ban } from 'lucide-react';
import type { SlideBackground } from '@/shared/schemas/present';
import BackgroundPicker from './BackgroundPicker';

// Compact Background control for the Present preview pane (CLAUDE.md §5.4). Lets
// the operator set the LIVE slide's background to a color or a media file from
// the library (via the shared `BackgroundPicker`, §1.9), with an "Apply to all
// slides" toggle and a Clear action. All IPC goes through the caller-provided
// `onApply` (which calls window.api.present.setBackground) — main re-validates
// the color/url and clamps (§1.3, §5.7). For a consistent background across the
// WHOLE service, see Settings → Presentation (the persisted default).

type Props = {
  /** The current live slide's background, so the control reflects live state. */
  current: SlideBackground | null;
  /** Whether anything is live (a deck exists) — controls disabled otherwise. */
  hasDeck: boolean;
  /** Set (null = clear) the background; applyToAll paints every slide. */
  onApply: (background: SlideBackground | null, applyToAll: boolean) => void;
};

export default function BackgroundEditor({ current, hasDeck, onApply }: Props) {
  const [applyToAll, setApplyToAll] = useState(false);

  const apply = useCallback(
    (bg: SlideBackground | null) => onApply(bg, applyToAll),
    [onApply, applyToAll],
  );

  return (
    <section className="flex flex-col gap-2 rounded-md border border-pp-border-soft bg-pp-surface-2 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-pp-text-label">Background</span>
        <button
          type="button"
          onClick={() => apply(null)}
          disabled={!hasDeck || !current}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-pp-text-muted transition-colors hover:text-pp-text-body disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          <Ban className="size-3" aria-hidden /> Clear
        </button>
      </div>

      <BackgroundPicker value={current} disabled={!hasDeck} onChange={apply} />

      {/* Apply-to-all toggle. */}
      <label className="inline-flex cursor-pointer items-center gap-1.5 self-start text-xs text-pp-text-muted">
        <input
          type="checkbox"
          checked={applyToAll}
          onChange={(e) => setApplyToAll(e.target.checked)}
          className="size-3.5 accent-pp-accent"
        />
        Apply to all slides
      </label>
    </section>
  );
}
