import { z } from 'zod';

// Service plan domain (CLAUDE.md §1.5/§5.3). A plan is an ordered list of mixed
// elements. 'song' items reference a song by refId; 'custom' holds inline text;
// 'scripture'/'media' land when those domains do.
export const planItemKind = z.enum(['song', 'scripture', 'media', 'custom']);

export const planItem = z.object({
  kind: planItemKind,
  refId: z.number().int().positive().nullable(),
  title: z.string(),
  content: z.string(),
  sortOrder: z.number().int().nonnegative(),
});

export const plan = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  scheduledFor: z.string().nullable(), // ISO date or null
  notes: z.string(),
  items: z.array(planItem),
});

export const planSummary = plan.omit({ items: true });
export const planCreate = plan.omit({ id: true });
export const planId = z.object({ id: z.number().int().positive() });

export type PlanItemKind = z.infer<typeof planItemKind>;
export type PlanItem = z.infer<typeof planItem>;
export type Plan = z.infer<typeof plan>;
export type PlanSummary = z.infer<typeof planSummary>;
export type PlanCreate = z.infer<typeof planCreate>;
