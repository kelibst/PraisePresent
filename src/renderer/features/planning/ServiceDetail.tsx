import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Plan, PlanItem } from '@/shared/schemas/plan';
import type { SongSummary } from '@/shared/schemas/song';

// A single service plan: ordered mixed elements, persisted in SQLite. Add songs
// (from the library) or custom items, reorder, and present each to the audience.
export default function ServiceDetail() {
  const { id } = useParams();
  const planId = Number(id);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [songs, setSongs] = useState<SongSummary[]>([]);

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([window.api.plans.get(planId), window.api.songs.list()]);
    if (p.ok) setPlan(p.data);
    if (s.ok) setSongs(s.data);
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (items: PlanItem[]) => {
    if (!plan) return;
    const reindexed = items.map((it, i) => ({ ...it, sortOrder: i }));
    const next = { ...plan, items: reindexed };
    await window.api.plans.update(next);
    setPlan(next);
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
      const text =
        res.ok && res.data ? (res.data.sections[0]?.content ?? res.data.title) : item.title;
      await window.api.present.setState({ mode: 'slide', slide: { text } });
    } else {
      await window.api.present.setState({ mode: 'slide', slide: { text: item.content } });
    }
  };

  if (!plan) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="mb-8 flex flex-col gap-6">
      <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>

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
