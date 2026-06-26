import type { PlanItem, PlanItemKind } from '@/shared/schemas/plan';

// Rough per-element duration estimate in minutes (pure — unit-tested). Refined
// later with real song/scripture lengths.
const MINUTES_BY_KIND: Record<PlanItemKind, number> = {
  song: 4,
  scripture: 2,
  media: 3,
  custom: 2,
};

export function estimateMinutes(items: Pick<PlanItem, 'kind'>[]): number {
  return items.reduce((total, item) => total + MINUTES_BY_KIND[item.kind], 0);
}
