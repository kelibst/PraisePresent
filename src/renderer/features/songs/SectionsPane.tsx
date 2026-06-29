import { Pencil, Trash2, Upload } from 'lucide-react';
import { PaneHeader } from '@/renderer/components/common';
import { cn } from '@/renderer/lib/utils';
import type { PresentState } from '@/shared/schemas/present';
import type { Song } from '@/shared/schemas/song';
import { isSectionLive } from './useSongsPresenter';

// Pane 2: the open song's sections. Header carries the song title + "author · key"
// meta and Edit / Import-style actions; each section card shows an uppercase label
// and its lyrics. Clicking a card presents that section (leads the deck at its
// index). The live section is sage-highlighted (mirrors present state). Songs are
// editable, so Edit + Delete affordances live here (CLAUDE.md §1.3 — actions are
// the parent's; this is a view). Keyboard operable (§5.4).

type Props = {
  song: Song | null;
  live: PresentState;
  onPresent: (index: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onNew: () => void;
};

export default function SectionsPane({ song, live, onPresent, onEdit, onDelete, onNew }: Props) {
  if (!song) {
    return (
      <section className="flex h-full min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
        <PaneHeader label="Sections" />
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-pp-text-dim">
          Select a song to view and present its sections.
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
      <PaneHeader
        label="Sections"
        actions={
          <>
            <IconButton onClick={onEdit} icon={Pencil} label="Edit song" />
            <IconButton onClick={onNew} icon={Upload} label="Import song" />
            <IconButton onClick={onDelete} icon={Trash2} label="Delete song" tone="danger" />
          </>
        }
      />

      <div className="border-b border-pp-border-soft px-3 py-2.5">
        <h2 className="truncate text-base font-semibold text-pp-text-primary">{song.title}</h2>
        <p className="truncate text-xs text-pp-text-muted">
          {song.author || 'Unknown author'} · {song.sections.length} section
          {song.sections.length === 1 ? '' : 's'}
          {song.ccli ? ` · CCLI ${song.ccli}` : ''}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {song.sections.map((sec, i) => {
          const liveNow = isSectionLive(live, song.id, i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPresent(i)}
              aria-current={liveNow || undefined}
              className={cn(
                'group rounded-lg border-l-2 p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                liveNow
                  ? 'border-pp-accent bg-pp-accent/10'
                  : 'border-transparent bg-pp-surface-2 hover:bg-pp-surface-alt',
              )}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-pp-text-label">
                  {sec.label}
                </span>
                {liveNow && (
                  <span className="rounded-full bg-pp-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-pp-success">
                    Live
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-snug text-pp-text-body">
                {sec.content}
              </p>
            </button>
          );
        })}
        {song.sections.length === 0 && (
          <p className="px-1 py-4 text-center text-sm text-pp-text-dim">
            This song has no sections yet — edit it to add lyrics.
          </p>
        )}
      </div>
    </section>
  );
}

function IconButton({
  onClick,
  icon: Icon,
  label,
  tone = 'default',
}: {
  onClick: () => void;
  icon: typeof Pencil;
  label: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        tone === 'danger'
          ? 'text-pp-text-muted hover:bg-pp-error/10 hover:text-pp-error'
          : 'text-pp-text-muted hover:bg-pp-surface-2 hover:text-pp-text-body',
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
