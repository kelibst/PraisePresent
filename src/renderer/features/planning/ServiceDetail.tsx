import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Plan, PlanItem } from '@/shared/schemas/plan';
import type { SongSummary } from '@/shared/schemas/song';
import { blocksToDeck, singleSlideDeck } from '@/shared/lib/buildDeck';

// Explicit load states so the view never hangs (§5.7): plans.get can return
// ok:false (a real error) or ok:true with null data (the id does not exist).
type Status = 'loading' | 'ready' | 'notfound' | 'error';

// A single service plan: ordered mixed elements, persisted in SQLite. Add songs
// (from the library) or custom items, reorder, and present each to the audience.
export default function ServiceDetail() {
  const { id } = useParams();
  const planId = Number(id);
  const [status, setStatus] = useState<Status>('loading');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [estimate, setEstimate] = useState(0);

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
    setStatus('ready');
    if (s.ok) setSongs(s.data);
    await refreshEstimate();
  }, [planId, refreshEstimate]);

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
    void persist([...plan.items, item]);
  };

  const move = (index: number, dir: -1 | 1) => {
    if (!plan) return;
    const target = index + dir;
    if (target < 0 || target >= plan.items.length) return;
    const items = [...plan.items];
    [items[index], items[target]] = [items[target], items[index]];
    void persist(items);
  };

  const remove = (index: number) => {
    if (!plan) return;
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

  if (status === 'loading') return <div className="text-muted-foreground">Loading…</div>;

  if (status === 'notfound') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-foreground">Service not found.</p>
        <Link to="/services" className="text-sm font-medium text-primary hover:underline">
          ← Back to services
        </Link>
      </div>
    );
  }

  if (status === 'error' || !plan) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-foreground">Couldn’t load this service. Please try again.</p>
        <Link to="/services" className="text-sm font-medium text-primary hover:underline">
          ← Back to services
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-col gap-6">
      <div className="flex items-baseline gap-3">
        <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
        <span className="text-sm text-muted-foreground">~{estimate} min</span>
      </div>

      <div className="flex flex-col gap-2">
        {plan.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <span className="w-16 text-xs font-semibold uppercase text-muted-foreground">
              {item.kind}
            </span>
            <span className="flex-1 font-medium text-foreground">{item.title}</span>
            <button
              onClick={() => move(i, -1)}
              className="rounded px-2 py-1 hover:bg-accent"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              onClick={() => move(i, 1)}
              className="rounded px-2 py-1 hover:bg-accent"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              onClick={() => present(item)}
              className="rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Present
            </button>
            <button
              onClick={() => remove(i)}
              className="rounded px-2 py-1 text-destructive hover:bg-accent"
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}
        {plan.items.length === 0 && (
          <p className="text-sm text-muted-foreground">Empty plan — add songs or a custom item.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <button onClick={addCustom} className="rounded border px-3 py-2 text-sm hover:bg-accent">
          + Custom item
        </button>
        <span className="text-sm text-muted-foreground">Add song:</span>
        {songs.map((s) => (
          <button
            key={s.id}
            onClick={() => addSong(s)}
            className="rounded border px-3 py-2 text-sm hover:bg-accent"
          >
            + {s.title}
          </button>
        ))}
      </div>
    </div>
  );
}
