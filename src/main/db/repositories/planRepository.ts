import { getDb } from '../connection';
import type { Plan, PlanCreate, PlanItem, PlanSummary } from '@/shared/schemas/plan';

// All plan DB access behind this repository (§5.5); parameterized queries only.
// Plan + items written atomically.
type PlanRow = { id: number; name: string; scheduled_for: string | null; notes: string };
type ItemRow = {
  kind: string;
  ref_id: number | null;
  title: string;
  content: string;
  sort_order: number;
};

function mapItem(r: ItemRow): PlanItem {
  return {
    kind: r.kind as PlanItem['kind'],
    refId: r.ref_id,
    title: r.title,
    content: r.content,
    sortOrder: r.sort_order,
  };
}

function insertItems(planId: number, items: PlanItem[]) {
  const insItem = getDb().prepare(
    'INSERT INTO plan_items (plan_id, kind, ref_id, title, content, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
  );
  for (const it of items) {
    insItem.run(planId, it.kind, it.refId, it.title, it.content, it.sortOrder);
  }
}

export const planRepository = {
  list(): PlanSummary[] {
    const rows = getDb()
      .prepare('SELECT id, name, scheduled_for, notes FROM plans ORDER BY id DESC')
      .all() as PlanRow[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      scheduledFor: r.scheduled_for,
      notes: r.notes,
    }));
  },

  get(id: number): Plan | null {
    const r = getDb()
      .prepare('SELECT id, name, scheduled_for, notes FROM plans WHERE id = ?')
      .get(id) as PlanRow | undefined;
    if (!r) return null;
    const items = getDb()
      .prepare(
        'SELECT kind, ref_id, title, content, sort_order FROM plan_items WHERE plan_id = ? ORDER BY sort_order',
      )
      .all(id) as ItemRow[];
    return {
      id: r.id,
      name: r.name,
      scheduledFor: r.scheduled_for,
      notes: r.notes,
      items: items.map(mapItem),
    };
  },

  create(input: PlanCreate): number {
    const db = getDb();
    const tx = db.transaction((p: PlanCreate): number => {
      const info = db
        .prepare('INSERT INTO plans (name, scheduled_for, notes) VALUES (?, ?, ?)')
        .run(p.name, p.scheduledFor, p.notes);
      const planId = Number(info.lastInsertRowid);
      insertItems(planId, p.items);
      return planId;
    });
    return tx(input);
  },

  update(input: Plan): void {
    const db = getDb();
    const tx = db.transaction((p: Plan) => {
      db.prepare('UPDATE plans SET name = ?, scheduled_for = ?, notes = ? WHERE id = ?').run(
        p.name,
        p.scheduledFor,
        p.notes,
        p.id,
      );
      db.prepare('DELETE FROM plan_items WHERE plan_id = ?').run(p.id);
      insertItems(p.id, p.items);
    });
    tx(input);
  },

  delete(id: number): void {
    getDb().prepare('DELETE FROM plans WHERE id = ?').run(id);
  },
};
