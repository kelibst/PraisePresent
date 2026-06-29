import { useCallback, useEffect, useState } from 'react';
import type { Plan } from '@/shared/schemas/plan';

// Shared "active service" context (CLAUDE.md §5.4). One persisted source of truth
// for which service plan the operator is working on — the settings key
// `activeServiceId` (truth in SQLite, §1.5). The TopBar selector (B2) and the
// Scripture Schedule pane (B4) both read this hook so they never drift apart.
//
// No business logic and no new channel: it reuses `settings:get/set` for the id
// and `plans.get` to resolve the plan, all through `window.api` (§1.3/§5.2).

export const ACTIVE_SERVICE_KEY = 'activeServiceId';

export type ActiveService = {
  /** The persisted active plan id, or null when none is selected. */
  id: number | null;
  /** The resolved plan, or null while loading / when none/missing. */
  plan: Plan | null;
  /** True until the initial id + plan resolve. */
  loading: boolean;
  /** Persist a new active service id (null clears it) and refresh the plan. */
  setActiveService: (id: number | null) => Promise<void>;
};

function parseId(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function useActiveService(): ActiveService {
  const [id, setId] = useState<number | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve a plan id to its plan (null id → null plan). Tolerates a deleted
  // plan: a missing/failed lookup just clears the resolved plan, never throws.
  const resolvePlan = useCallback(async (planId: number | null): Promise<Plan | null> => {
    if (planId === null) return null;
    const res = await window.api.plans.get(planId);
    return res.ok ? res.data : null;
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await window.api.settings.get(ACTIVE_SERVICE_KEY);
      const nextId = res.ok ? parseId(res.data) : null;
      const nextPlan = await resolvePlan(nextId);
      if (!active) return;
      setId(nextId);
      setPlan(nextPlan);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [resolvePlan]);

  const setActiveService = useCallback(
    async (nextId: number | null): Promise<void> => {
      await window.api.settings.set(ACTIVE_SERVICE_KEY, nextId === null ? '' : String(nextId));
      const nextPlan = await resolvePlan(nextId);
      setId(nextId);
      setPlan(nextPlan);
    },
    [resolvePlan],
  );

  return { id, plan, loading, setActiveService };
}
