import type { ReactNode } from 'react';
import { cn } from '@/renderer/lib/utils';

// The recurring pane header used at the top of every panel in the workspace
// (Scripture / Songs / Plans / Present / Live-Detect). An uppercase, tracked,
// muted label on the left and an optional meta string or action slot on the
// right. Pure presentational atom — no data, no `window.api` (CLAUDE.md §1.3).

export type PaneHeaderProps = {
  /** The pane label, e.g. "Schedule", "Search", "Deck". Rendered uppercase. */
  label: ReactNode;
  /** Short right-aligned meta text, e.g. "12 items". Ignored if `actions` set. */
  meta?: ReactNode;
  /** Right-side action slot (buttons/toggles). Takes precedence over `meta`. */
  actions?: ReactNode;
  /** Optional leading icon, rendered before the label. */
  icon?: ReactNode;
  className?: string;
};

export function PaneHeader({ label, meta, actions, icon, className }: PaneHeaderProps) {
  return (
    <div
      className={cn(
        'flex h-10 shrink-0 items-center justify-between gap-3 border-b border-pp-border-soft px-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icon && <span className="shrink-0 text-pp-text-muted [&_svg]:size-3.5">{icon}</span>}
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-pp-text-label">
          {label}
        </span>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      ) : meta ? (
        <span className="shrink-0 text-xs text-pp-text-muted">{meta}</span>
      ) : null}
    </div>
  );
}

export default PaneHeader;
