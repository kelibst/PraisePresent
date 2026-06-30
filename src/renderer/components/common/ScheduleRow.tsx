import type { ReactNode } from 'react';
import {
  BookOpen,
  Music,
  Image as ImageIcon,
  Megaphone,
  CalendarDays,
  GripVertical,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/renderer/lib/utils';

// A single schedule/plan item row, reused by Scripture's Schedule pane, the Plans
// builder, and Home's recent list (CLAUDE.md §1.9 — one canonical version). It is
// a presentational atom: it shows a type icon, a title + meta line, an optional
// duration, and selected/live state, and forwards a click. It owns no data and
// does no fetching (§1.3). When `onClick` is set it renders as a real <button>
// for keyboard operability (§5.4); otherwise a static row.

// The content type a row represents — drives the leading icon.
export type ScheduleItemType = 'scripture' | 'song' | 'media' | 'announcement' | 'service';

const TYPE_ICON: Record<ScheduleItemType, LucideIcon> = {
  scripture: BookOpen,
  song: Music,
  media: ImageIcon,
  announcement: Megaphone,
  service: CalendarDays,
};

export type ScheduleRowProps = {
  type: ScheduleItemType;
  /** Primary label, e.g. the song title or "John 3:16". */
  title: ReactNode;
  /** Secondary line, e.g. author / translation / slide count. */
  meta?: ReactNode;
  /** Right-aligned duration label, e.g. "3:20". Plain string, pre-formatted. */
  duration?: ReactNode;
  /** Highlights the row as the user's current selection. */
  selected?: boolean;
  /** Marks the row as the one currently live on the projector. */
  live?: boolean;
  /** Shows a drag-handle affordance on the left (for re-orderable lists). */
  draggable?: boolean;
  /** Click/activate handler. When set, the row is a focusable button (§5.4). */
  onClick?: () => void;
  /** Trailing slot (e.g. an overflow menu). Stops click propagation is caller's job. */
  trailing?: ReactNode;
  className?: string;
};

export function ScheduleRow({
  type,
  title,
  meta,
  duration,
  selected = false,
  live = false,
  draggable = false,
  onClick,
  trailing,
  className,
}: ScheduleRowProps) {
  const Icon = TYPE_ICON[type];
  const interactive = typeof onClick === 'function';

  const content = (
    <>
      {draggable && (
        <GripVertical
          className="size-4 shrink-0 cursor-grab text-pp-text-dim opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      )}
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md',
          live
            ? 'bg-pp-success/15 text-pp-success'
            : selected
              ? 'bg-pp-accent/15 text-pp-accent'
              : 'bg-pp-surface-2 text-pp-text-muted',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>

      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate text-sm font-medium text-pp-text-body">{title}</span>
        {meta && <span className="truncate text-xs text-pp-text-muted">{meta}</span>}
      </span>

      {live && (
        <span className="shrink-0 rounded-full bg-pp-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pp-success">
          Live
        </span>
      )}

      {duration && (
        <span className="shrink-0 font-mono text-xs tabular-nums text-pp-text-muted">
          {duration}
        </span>
      )}

      {trailing && <span className="shrink-0">{trailing}</span>}
    </>
  );

  const base = cn(
    'group flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 transition-colors',
    live
      ? 'border-pp-success/40 bg-pp-success/5'
      : selected
        ? 'border-pp-accent/50 bg-pp-accent/10'
        : 'border-transparent hover:border-pp-border-soft hover:bg-pp-surface-2/60',
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
          'text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={base} aria-current={live ? true : undefined}>
      {content}
    </div>
  );
}

export default ScheduleRow;
