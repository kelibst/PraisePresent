import { ChevronRight, MonitorX, Pencil, SkipForward, Square } from 'lucide-react';
import { PaneHeader, SlidePreview } from '@/renderer/components/common';
import type { PresentState } from '@/shared/schemas/present';
import { effectiveBackground } from '@/shared/present/serviceBackground';

// Pane 3: mirrors the live present state (CLAUDE.md §1.5 — view of main's truth).
// "On screen now" is the big preview of deck[index]; "Next" is the small preview
// of deck[index+1]. Unlike scripture, songs ARE editable — the live preview shows
// an "Editable" badge and a note pointing at the per-song editor. Live controls
// (Next / Black / Clear) drive present via the parent. Pure view — no window.api.

type Props = {
  live: PresentState;
  onNext: () => void;
  onBlack: () => void;
  onClear: () => void;
};

export default function SongLivePane({ live, onNext, onBlack, onClear }: Props) {
  const isLive = live.mode === 'slide' && live.deck.length > 0;
  const current = isLive ? live.deck[live.index] : null;
  const next = isLive ? live.deck[live.index + 1] : null;

  const statusLabel =
    live.mode === 'black'
      ? 'Black'
      : live.mode === 'blank'
        ? 'Blank'
        : live.mode === 'clear' || !isLive
          ? 'Cleared'
          : `Slide ${live.index + 1} / ${live.deck.length}`;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
      <PaneHeader
        label="Live Output"
        actions={
          <span className="inline-flex items-center gap-1 rounded-full bg-pp-surface-2 px-2 py-0.5 text-[11px] font-medium text-pp-text-muted">
            <Pencil className="size-3" aria-hidden /> Editable
          </span>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {/* On screen now. */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-pp-text-label">
              On screen now
            </span>
            <span
              className={
                isLive
                  ? 'rounded-full bg-pp-success/15 px-2 py-0.5 text-[11px] font-semibold uppercase text-pp-success'
                  : 'rounded-full bg-pp-surface-2 px-2 py-0.5 text-[11px] font-semibold uppercase text-pp-text-muted'
              }
            >
              {statusLabel}
            </span>
          </div>
          <SlidePreview
            variant="lg"
            active={isLive}
            lines={current ? current.lines : undefined}
            reference={current?.reference}
            media={current?.media}
            background={current ? effectiveBackground(current, live.defaultBackground) : undefined}
            badge={{ label: 'Editable', tone: 'accent' }}
          />
          <p className="text-xs text-pp-text-dim">Lyrics are editable here — use Edit on a song.</p>
        </div>

        {/* Next. */}
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-pp-text-label">
            <ChevronRight className="size-3.5" aria-hidden /> Next
          </span>
          {next ? (
            <SlidePreview
              variant="sm"
              lines={next.lines}
              reference={next.reference}
              media={next.media}
              background={effectiveBackground(next, live.defaultBackground)}
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed border-pp-border-soft text-xs text-pp-text-dim">
              End of song
            </div>
          )}
        </div>

        {/* Live controls. */}
        <div className="mt-auto grid grid-cols-3 gap-2 pt-1">
          <ControlButton onClick={onNext} disabled={!next} icon={SkipForward} label="Next" />
          <ControlButton onClick={onBlack} icon={Square} label="Black" tone="danger" />
          <ControlButton onClick={onClear} icon={MonitorX} label="Clear" />
        </div>
      </div>
    </section>
  );
}

function ControlButton({
  onClick,
  disabled,
  icon: Icon,
  label,
  tone = 'default',
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: typeof SkipForward;
  label: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        tone === 'danger'
          ? 'flex items-center justify-center gap-1.5 rounded-md border border-pp-border-strong bg-pp-surface-2 px-2 py-2 text-xs font-medium text-pp-error transition-colors hover:bg-pp-error/10 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring'
          : 'flex items-center justify-center gap-1.5 rounded-md border border-pp-border-strong bg-pp-surface-2 px-2 py-2 text-xs font-medium text-pp-text-body transition-colors hover:bg-pp-surface-alt disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring'
      }
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}
