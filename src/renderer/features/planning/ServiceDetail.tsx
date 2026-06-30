import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronUp, ChevronDown, X, Plus, Play } from 'lucide-react';
import type { Plan, PlanItem, PlanItemKind } from '@/shared/schemas/plan';
import type { SongSummary } from '@/shared/schemas/song';
import { PaneHeader, ScheduleRow, SlidePreview } from '@/renderer/components/common';
import type { ScheduleItemType } from '@/renderer/components/common';
import { blocksToDeck, singleSlideDeck, textToLines } from '@/shared/lib/buildDeck';
import { useActiveService } from './useActiveService';

// Panes 2 + 3 of the Plans workspace: the service Builder (ordered plan items,
// reorder/add/remove, estimate badge, Present) and the item Preview (SlidePreview
// of the selected item). Spans the two right columns of ServicesPage's grid.
//
// Explicit load states so the view never hangs (§5.7): plans.get can return
// ok:false (a real error) or ok:true with null data (the id does not exist).
// All data flows through window.api (§1.3); plan truth is SQLite (§1.5).
type Status = 'loading' | 'ready' | 'notfound' | 'error';

// Map a plan item's kind to the ScheduleRow / SlidePreview vocabulary.
const ROW_TYPE: Record<PlanItemKind, ScheduleItemType> = {
  scripture: 'scripture',
  song: 'song',
  media: 'media',
  custom: 'announcement',
};

export default function ServiceDetail() {
  const { id } = useParams();
  const planId = Number(id);
  const [status, setStatus] = useState<Status>('loading');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [estimate, setEstimate] = useState(0);
  const [selected, setSelected] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const { setActiveService } = useActiveService();

  const refreshEstimate = useCallback(async () => {
    const e = await window.api.plans.estimate(planId);
    if (e.ok) setEstimate(e.data);
  }, [planId]);

  const load = useCallback(async () => {
    setStatus('loading');
    if (!Number.isInteger(planId) || planId <= 0) {
      setStatus('notfound');
      return;
    }
    const [p, s] = await Promise.all([window.api.plans.get(planId), window.api.songs.list()]);
    if (!p.ok) {
      setStatus('error');
      return;
    }
    if (!p.data) {
      setStatus('notfound');
      return;
    }
    setPlan(p.data);
    setSelected(0);
    setStatus('ready');
    if (s.ok) setSongs(s.data);
    await refreshEstimate();
    // Deep-linking straight to a service (e.g. on reload) makes it active too.
    await setActiveService(planId);
  }, [planId, refreshEstimate, setActiveService]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (items: PlanItem[]) => {
    if (!plan) return;
    const reindexed = items.map((it, i) => ({ ...it, sortOrder: i }));
    const next = { ...plan, items: reindexed };
    await window.api.plans.update(next);
    setPlan(next);
    await refreshEstimate();
  };

  const addSong = (song: SongSummary) => {
    if (!plan) return;
    const item: PlanItem = {
      kind: 'song',
      refId: song.id,
      title: song.title,
      content: '',
      sortOrder: plan.items.length,
    };
    setAddOpen(false);
    setSelected(plan.items.length);
    void persist([...plan.items, item]);
  };

  const addCustom = () => {
    if (!plan) return;
    const item: PlanItem = {
      kind: 'custom',
      refId: null,
      title: 'Announcement',
      content: 'Welcome',
      sortOrder: plan.items.length,
    };
    setAddOpen(false);
    setSelected(plan.items.length);
    void persist([...plan.items, item]);
  };

  const move = (index: number, dir: -1 | 1) => {
    if (!plan) return;
    const target = index + dir;
    if (target < 0 || target >= plan.items.length) return;
    const items = [...plan.items];
    [items[index], items[target]] = [items[target], items[index]];
    if (selected === index) setSelected(target);
    else if (selected === target) setSelected(index);
    void persist(items);
  };

  const remove = (index: number) => {
    if (!plan) return;
    if (selected >= plan.items.length - 1) setSelected(Math.max(0, plan.items.length - 2));
    void persist(plan.items.filter((_, i) => i !== index));
  };

  const present = async (item: PlanItem) => {
    if (item.kind === 'song' && item.refId) {
      const res = await window.api.songs.get(item.refId);
      // Present the full song as a multi-slide deck (one slide per section).
      if (res.ok && res.data && res.data.sections.length > 0) {
        const deck = blocksToDeck(
          res.data.sections.map((sec) => ({ text: sec.content, label: sec.label })),
          `song-${res.data.id}`,
        );
        await window.api.present.setDeck(deck);
        return;
      }
      await window.api.present.setDeck(
        singleSlideDeck(item.title, undefined, `item-${item.sortOrder}`),
      );
    } else {
      await window.api.present.setDeck(
        singleSlideDeck(item.content, undefined, `item-${item.sortOrder}`),
      );
    }
  };

  if (status === 'loading') {
    return (
      <DetailShell>
        <p className="px-4 py-3 text-sm text-pp-text-muted">Loading…</p>
      </DetailShell>
    );
  }

  if (status === 'notfound') {
    return (
      <DetailShell>
        <div className="flex flex-col items-start gap-2 px-4 py-4">
          <p className="text-sm text-pp-text-body">Service not found.</p>
          <Link
            to="/services"
            className="text-sm font-medium text-pp-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            ← Back to services
          </Link>
        </div>
      </DetailShell>
    );
  }

  if (status === 'error' || !plan) {
    return (
      <DetailShell>
        <div className="flex flex-col items-start gap-2 px-4 py-4">
          <p className="text-sm text-pp-text-body">Couldn’t load this service. Please try again.</p>
          <Link
            to="/services"
            className="text-sm font-medium text-pp-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            ← Back to services
          </Link>
        </div>
      </DetailShell>
    );
  }

  const selectedItem = plan.items[selected] ?? null;

  return (
    <>
      {/* Pane 2 — Builder. */}
      <section className="flex min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
        <PaneHeader
          label={
            <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-pp-text-label">
              {plan.name}
            </h2>
          }
          actions={
            <>
              <span className="rounded-full bg-pp-surface-2 px-2 py-0.5 text-[11px] font-medium tabular-nums text-pp-text-muted">
                Total ~{estimate} min
              </span>
              <button
                type="button"
                onClick={() => selectedItem && void present(selectedItem)}
                disabled={!selectedItem}
                className="inline-flex items-center gap-1 rounded-md bg-pp-accent px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-pp-accent-hover disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                <Play className="size-3.5" aria-hidden /> Present
              </button>
            </>
          }
        />
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3">
          {plan.items.map((item, i) => (
            <ScheduleRow
              key={`${i}-${item.title}`}
              type={ROW_TYPE[item.kind]}
              title={item.title || 'Untitled'}
              meta={item.kind === 'custom' ? item.content || undefined : item.kind}
              draggable
              selected={selected === i}
              onClick={() => setSelected(i)}
              trailing={
                <span className="flex items-center gap-0.5">
                  <RowBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ChevronUp className="size-3.5" aria-hidden />
                  </RowBtn>
                  <RowBtn
                    label="Move down"
                    onClick={() => move(i, 1)}
                    disabled={i === plan.items.length - 1}
                  >
                    <ChevronDown className="size-3.5" aria-hidden />
                  </RowBtn>
                  <RowBtn label="Remove" onClick={() => remove(i)} tone="danger">
                    <X className="size-3.5" aria-hidden />
                  </RowBtn>
                </span>
              }
            />
          ))}
          {plan.items.length === 0 && (
            <p className="px-1 py-2 text-sm text-pp-text-muted">
              Empty plan — add songs or a custom item below.
            </p>
          )}

          <AddItem
            songs={songs}
            open={addOpen}
            setOpen={setAddOpen}
            onSong={addSong}
            onCustom={addCustom}
          />
        </div>
      </section>

      {/* Pane 3 — Preview of the selected item. */}
      <section className="flex min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
        <PaneHeader label="Preview" meta={selectedItem ? selectedItem.kind : undefined} />
        <div className="flex flex-col gap-3 p-3">
          <SlidePreview variant="lg" active={!!selectedItem} lines={previewLines(selectedItem)} />
          {selectedItem ? (
            <div className="flex flex-col gap-1 rounded-md border border-pp-border-soft bg-pp-surface-2 p-3">
              <p className="text-sm font-medium text-pp-text-body">
                {selectedItem.title || 'Untitled'}
              </p>
              <p className="text-xs uppercase tracking-wide text-pp-text-muted">
                {selectedItem.kind}
              </p>
              {selectedItem.content && (
                <p className="mt-1 line-clamp-3 text-xs text-pp-text-muted">
                  {selectedItem.content}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-pp-text-muted">Select an item to preview it.</p>
          )}
        </div>
      </section>
    </>
  );
}

// Lines shown in the preview for the selected item: custom items show their
// content; song items (no inline lyrics here) show their title.
function previewLines(item: PlanItem | null): string[] | undefined {
  if (!item) return undefined;
  if (item.kind === 'song') return [item.title];
  const lines = textToLines(item.content);
  return lines.length > 0 ? lines : [item.title];
}

// Wraps the builder column when there is nothing to build (loading / error /
// not-found), keeping the right preview column present so the grid stays stable.
function DetailShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <section className="flex min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
        <PaneHeader label="Service" />
        {children}
      </section>
      <section className="flex min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
        <PaneHeader label="Preview" />
      </section>
    </>
  );
}

// A compact icon button used inside a ScheduleRow trailing slot. Stops click
// propagation so pressing it never re-selects the row underneath.
function RowBtn({
  label,
  onClick,
  disabled,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'danger';
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded p-1 transition-colors hover:bg-pp-surface-alt disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring ${
        tone === 'danger' ? 'text-pp-error' : 'text-pp-text-muted'
      }`}
    >
      {children}
    </button>
  );
}

// The dashed "Add item" affordance: opens a small popover with Custom + the song
// library. Keyboard operable (§5.4); closes on outside click / Escape.
function AddItem({
  songs,
  open,
  setOpen,
  onSong,
  onCustom,
}: {
  songs: SongSummary[];
  open: boolean;
  setOpen: (v: boolean) => void;
  onSong: (s: SongSummary) => void;
  onCustom: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  return (
    <div ref={ref} className="relative mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-pp-border-strong px-3 py-2 text-xs font-medium text-pp-text-muted transition-colors hover:border-pp-accent hover:text-pp-text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      >
        <Plus className="size-3.5" aria-hidden /> Add item
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 flex max-h-60 flex-col gap-0.5 overflow-y-auto rounded-md border border-pp-border-strong bg-pp-surface-1 p-1 shadow-lg">
          <button
            type="button"
            onClick={onCustom}
            className="rounded px-3 py-2 text-left text-sm text-pp-text-body transition-colors hover:bg-pp-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            + Custom item
          </button>
          {songs.length > 0 && (
            <div className="px-3 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-pp-text-dim">
              Songs
            </div>
          )}
          {songs.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSong(s)}
              className="rounded px-3 py-2 text-left text-sm text-pp-text-body transition-colors hover:bg-pp-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              + {s.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
