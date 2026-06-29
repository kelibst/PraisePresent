import { memo, useCallback } from 'react';
import { cn } from '@/renderer/lib/utils';

// A card in Present's horizontal Live Deck strip (design `PraisePresent.dc.html`
// lines 512–523): a 16:9 thumbnail showing the slide's first line, a reference
// label beneath, and a LIVE badge on the slide currently on the projector.
// Presentational atom — plain data, no fetching (§1.3). Renders as a focusable
// <button> when `onSelect` is set for keyboard nav (§5.4). Tokens only (§5.6).
//
// `React.memo`'d with an `index` + a stable `onSelect(index)` (B4): the rail can
// pass ONE handler shared by every card instead of a per-row closure, so a cursor
// move only re-renders the cards whose `live`/`selected` actually changed.

export type DeckStripThumbProps = {
  /** Position in the deck — passed back to `onSelect` so the rail needs one handler. */
  index: number;
  /** The slide's first/representative line, shown inside the thumbnail. */
  firstLine?: string;
  /** Reference label beneath the thumbnail, e.g. "John 3:16". */
  reference?: string;
  /** The slide currently live on the projector — shows the LIVE badge + sage. */
  live?: boolean;
  /** Highlights the card as the current selection (deck loaded, not yet live). */
  selected?: boolean;
  /** Jump-to-slide handler. When set, the card is a focusable button (§5.4). */
  onSelect?: (index: number) => void;
  className?: string;
};

export const DeckStripThumb = memo(function DeckStripThumb({
  index,
  firstLine,
  reference,
  live = false,
  selected = false,
  onSelect,
  className,
}: DeckStripThumbProps) {
  const active = live || selected;
  const handleClick = useCallback(() => onSelect?.(index), [onSelect, index]);
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-current={live ? true : undefined}
      className={cn(
        'flex w-[110px] shrink-0 flex-col gap-1.5 rounded-[9px] border p-1.5 text-center transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        active
          ? 'border-pp-accent/60 bg-pp-accent/[0.14] shadow-[0_0_0_2px_hsl(var(--pp-accent)/0.18)]'
          : 'border-pp-border-strong bg-pp-surface-1 hover:bg-pp-surface-alt',
        className,
      )}
    >
      <span className="relative aspect-video w-full overflow-hidden rounded-md bg-pp-surface-live bg-[radial-gradient(circle_at_50%_38%,hsl(var(--pp-accent-deep)/0.45),transparent_62%)] [container-type:inline-size]">
        <span className="absolute inset-0 flex items-center justify-center px-[7cqi]">
          <span
            className="line-clamp-3 font-semibold leading-tight text-pp-text-label [text-wrap:balance]"
            style={{ fontSize: '7cqi' }}
          >
            {firstLine?.trim() ? firstLine : '(blank)'}
          </span>
        </span>
        {live && (
          <span className="absolute left-1 top-1 rounded-[4px] bg-pp-accent px-1.5 py-px text-[8px] font-extrabold uppercase tracking-wide text-pp-surface-2">
            Live
          </span>
        )}
      </span>
      {reference && (
        <span
          className={cn(
            'truncate text-[10.5px] font-semibold',
            active ? 'text-pp-accent-light' : 'text-pp-text-dim',
          )}
        >
          {reference}
        </span>
      )}
    </button>
  );
});

export default DeckStripThumb;
