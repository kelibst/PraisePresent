import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { PlanSummary } from '@/shared/schemas/plan';
import { PaneHeader, ScheduleRow } from '@/renderer/components/common';
import { useActiveService } from './useActiveService';

// Plans workspace (CLAUDE.md §5.4): a full-height 3-pane row inside the app
// shell's scrollable main. Pane 1 (this file) is the persistent Services list;
// Panes 2+3 (the builder + item preview) render through <Outlet/> as the
// /services/:id child (ServiceDetail). Selecting a service routes to it AND sets
// it active via useActiveService so the TopBar selector and Scripture schedule
// stay in sync. Service plans are SQLite truth read through window.api (§1.3/§1.5)
// — the static fixture was retired in P3-D5.
export default function ServicesPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const selectedId = id ? Number(id) : null;
  const { setActiveService } = useActiveService();

  const refresh = useCallback(async () => {
    const res = await window.api.plans.list();
    if (res.ok) setPlans(res.data);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Create a new (empty) service, set it active, and open its builder.
  const createPlan = async () => {
    const res = await window.api.plans.create({
      name: 'New service',
      scheduledFor: null,
      notes: '',
      items: [],
    });
    if (res.ok) {
      await refresh();
      await setActiveService(res.data);
      navigate(`/services/${res.data}`);
    }
  };

  // Opening a service makes it the active service (TopBar / Scripture follow it).
  const openPlan = async (planId: number) => {
    await setActiveService(planId);
    navigate(`/services/${planId}`);
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[1fr_1.35fr_1fr] gap-3 bg-background p-3">
      {/* Pane 1 — Services list. */}
      <section className="flex min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
        <PaneHeader
          label="Services"
          actions={
            <button
              type="button"
              onClick={createPlan}
              className="inline-flex items-center gap-1 rounded-md bg-pp-accent px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-pp-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <Plus className="size-3.5" aria-hidden /> New
            </button>
          }
        />
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3">
          {plans.map((p) => (
            <ScheduleRow
              key={p.id}
              type="announcement"
              title={p.name}
              meta={planMeta(p)}
              selected={selectedId === p.id}
              onClick={() => void openPlan(p.id)}
            />
          ))}
          {plans.length === 0 && (
            <p className="px-1 py-2 text-sm text-pp-text-muted">
              No services yet — create one with “New”.
            </p>
          )}
        </div>
      </section>

      {/* Panes 2 + 3 — builder + preview (ServiceDetail), or an empty prompt. */}
      <Outlet />
      {selectedId === null && <EmptyBuilder />}
    </div>
  );
}

// Secondary line for a service row: scheduled date · item-count placeholder. The
// summary has no item count (that needs the full plan), so we show the schedule.
function planMeta(p: PlanSummary): string {
  return p.scheduledFor ?? 'Unscheduled';
}

// Index state (/services with no id): the builder + preview columns prompt the
// operator to pick a service. Spans the two right columns of the parent grid.
function EmptyBuilder() {
  return (
    <section className="col-span-2 flex min-h-0 items-center justify-center rounded-lg border border-pp-border-soft bg-pp-surface-1">
      <p className="px-6 text-center text-sm text-pp-text-muted">
        Select a service to build its order, or create a new one.
      </p>
    </section>
  );
}
