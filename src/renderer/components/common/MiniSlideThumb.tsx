import { cn } from '@/renderer/lib/utils';

// The small deck thumbnail used in Present's deck rail: a 1-based index, the
// slide's first line, and an optional reference — in a compact card that shows
// selected/live state. Presentational atom; plain data, no fetching (§1.3).
// Renders as a real <button> when `onClick` is set for keyboard nav (§5.4).

export type MiniSlideThumbProps = {
  /** 1-based position shown in the corner badge. */
  index: number;
  /** The slide's first/representative line. Empty → "(blank)". */
  firstLine?: string;
  /** Optional reference label, e.g. "John 3:16". */
  reference?: string;
  /** Highlights the thumb as the user's current selection. */
  selected?: boolean;
  /** Marks the thumb as the slide currently live on the projector. */
  live?: boolean;
  /** Activate handler. When set, the thumb is a focusable button (§5.4). */
  onClick?: () => void;
  className?: string;
};

export function MiniSlideThumb({
  index,
  firstLine,
  reference,
  selected = false,
  live = false,
  onClick,
  className,
}: MiniSlideThumbProps) {
  const interactive = typeof onClick === 'function';

  const inner = (
    <>
      <span
        className={cn(
          'absolute left-1.5 top-1.5 flex size-4 items-center justify-center rounded-[4px] text-[10px] font-semibold tabular-nums',
          live
            ? 'bg-pp-success/20 text-pp-success'
            : selected
              ? 'bg-pp-accent/20 text-pp-accent-light'
              : 'bg-black/40 text-white/70',
        )}
      >
        {index}
      </span>

      <div className="flex h-full flex-col items-center justify-center gap-0.5 px-2 text-center">
        <span className="line-clamp-2 text-[11px] font-medium leading-tight text-white/90 [text-wrap:balance]">
          {firstLine?.trim() ? firstLine : '(blank)'}
        </span>
        {reference && <span className="truncate text-[10px] text-white/50">{reference}</span>}
      </div>
    </>
  );

  const base = cn(
    'relative aspect-video w-full overflow-hidden rounded-md text-white ring-1 ring-inset transition-shadow',
    'bg-pp-surface-live bg-[radial-gradient(circle_at_50%_40%,hsl(var(--pp-accent-deep)/0.45),transparent_65%)]',
    live
      ? 'ring-2 ring-pp-success'
      : selected
        ? 'ring-2 ring-pp-accent'
        : 'ring-pp-border-strong/60',
    className,
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        aria-current={live ? true : undefined}
        className={cn(
          base,
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={base} aria-current={live ? true : undefined}>
      {inner}
    </div>
  );
}

export default MiniSlideThumb;
