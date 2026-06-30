import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  Plus,
  ArrowRight,
  BookOpen,
  Music,
  Image as ImageIcon,
  MonitorCheck,
  MonitorOff,
  type LucideIcon,
} from 'lucide-react';

import { ScheduleRow, PaneHeader } from '@/renderer/components/common';
import { useActiveService } from '@/renderer/features/planning/useActiveService';
import { cn } from '@/renderer/lib/utils';
import type { PlanSummary } from '@/shared/schemas/plan';
import type { DisplayInfo } from '@/shared/schemas/display';

// Home / Dashboard (CLAUDE.md §1.5). The operator's landing screen: a greeting,
// two CTA cards (continue the active service / start a new one), the recent
// services list and quick-jump tiles, and a live audience-display banner. All
// data comes through `window.api` (§1.3); the screen sizes to its content and
// owns its padding — the shell owns the scroll (AppLayout note).

// No church-name setting exists yet, so the greeting uses a stable product
// default. When a `church.name` setting lands this is the single place to swap.
const CHURCH_NAME = 'PraisePresent';

const QUICK_JUMP: ReadonlyArray<{ label: string; to: string; icon: LucideIcon }> = [
  { label: 'Scripture', to: '/scripture', icon: BookOpen },
  { label: 'Songs', to: '/songs', icon: Music },
  { label: 'Media', to: '/media', icon: ImageIcon },
];

const RECENT_LIMIT = 6;

// "Sunday · June 28" — the small sage date line above the greeting.
function formatToday(now: Date): string {
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  const month = now.toLocaleDateString(undefined, { month: 'long' });
  return `${weekday} · ${month} ${now.getDate()}`;
}

// "Good morning" / "afternoon" / "evening" from the local hour.
function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// A scheduled-for ISO date → "Jun 28, 2026"; null → "Unscheduled".
function formatScheduled(iso: string | null): string {
  if (!iso) return 'Unscheduled';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

type DisplayStatus = {
  connected: boolean;
  label: string | null;
  resolution: string | null;
};

const DISCONNECTED: DisplayStatus = { connected: false, label: null, resolution: null };

export default function HomePage() {
  const navigate = useNavigate();
  const { plan: activePlan, loading: activeLoading } = useActiveService();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [display, setDisplay] = useState<DisplayStatus>(DISCONNECTED);

  const now = useMemo(() => new Date(), []);

  // Recent services (newest first as returned by the repository).
  useEffect(() => {
    let active = true;
    void window.api.plans.list().then((res) => {
      if (active && res.ok) setPlans(res.data);
    });
    return () => {
      active = false;
    };
  }, []);

  // Resolve the audience display exactly like the StatusStrip (§1.9): the
  // persisted choice, else auto (first non-primary, else primary). Fails safe to
  // "no display" on any error (§5.7).
  useEffect(() => {
    let active = true;
    void (async () => {
      const [listRes, audRes] = await Promise.all([
        window.api.display.list(),
        window.api.display.getAudience(),
      ]);
      if (!active) return;
      if (!listRes.ok || listRes.data.length === 0) {
        setDisplay(DISCONNECTED);
        return;
      }
      const displays: DisplayInfo[] = listRes.data;
      const chosenId = audRes.ok ? audRes.data.displayId : null;
      const chosen =
        (chosenId !== null && displays.find((d) => d.id === chosenId)) ||
        displays.find((d) => !d.isPrimary) ||
        displays[0];
      setDisplay({
        connected: true,
        label: chosen.label,
        resolution: chosen.width > 0 ? `${chosen.width}×${chosen.height}` : null,
      });
    })();
    return () => {
      active = false;
    };
  }, []);

  // "Continue last service": the active plan if set, else the most recent plan.
  const continuePlan = activePlan ?? plans[0] ?? null;
  const continueItemCount = activePlan ? activePlan.items.length : null;

  const recent = plans.slice(0, RECENT_LIMIT);

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-10 px-8 py-[46px]">
      {/* Greeting */}
      <header className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-pp-accent">
          {formatToday(now)}
        </span>
        <h1 className="text-[30px] font-bold leading-tight text-pp-text-primary">
          {greetingFor(now)}, {CHURCH_NAME}.
        </h1>
        <p className="text-sm text-pp-text-muted">
          Pick up where you left off, or open a domain to build your next service.
        </p>
      </header>

      {/* CTA cards */}
      <section aria-label="Quick start" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Continue last service — wider, sage gradient */}
        <button
          type="button"
          onClick={() => navigate('/present')}
          className="group relative col-span-1 flex flex-col justify-between gap-6 overflow-hidden rounded-xl bg-gradient-to-br from-pp-accent to-pp-accent-deep p-5 text-left text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:col-span-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <PlayCircle className="size-9 shrink-0" aria-hidden />
              <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wider text-primary-foreground/75">
                  Continue last service
                </span>
                <span className="text-lg font-semibold">
                  {activeLoading ? 'Loading…' : (continuePlan?.name ?? 'No service yet')}
                </span>
              </div>
            </div>
            <ArrowRight
              className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </div>
          <span className="text-sm text-primary-foreground/80">
            {continuePlan
              ? [
                  continueItemCount !== null
                    ? `${continueItemCount} item${continueItemCount === 1 ? '' : 's'}`
                    : null,
                  formatScheduled(continuePlan.scheduledFor),
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Create your first service to start presenting.'}
          </span>
        </button>

        {/* New service */}
        <button
          type="button"
          onClick={() => navigate('/services')}
          className="group flex flex-col justify-between gap-6 rounded-xl border border-pp-border-soft bg-pp-surface-1 p-5 text-left transition-colors hover:border-pp-border-strong hover:bg-pp-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-pp-accent/15 text-pp-accent">
            <Plus className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-pp-text-primary">New service</span>
            <span className="text-sm text-pp-text-muted">Plan a fresh order of service.</span>
          </div>
        </button>
      </section>

      {/* Recent services */}
      <section aria-label="Recent services" className="flex flex-col">
        <PaneHeader
          label="Recent services"
          meta={recent.length > 0 ? `${plans.length} total` : undefined}
          className="px-0"
        />
        {recent.length === 0 ? (
          <p className="pt-4 text-sm text-pp-text-muted">No services yet — create one to begin.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 pt-3">
            {recent.map((p) => (
              <li key={p.id}>
                <ScheduleRow
                  type="service"
                  title={p.name}
                  meta={formatScheduled(p.scheduledFor)}
                  onClick={() => navigate(`/services/${p.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick jump */}
      <section aria-label="Quick jump" className="flex flex-col">
        <PaneHeader label="Quick jump" className="px-0" />
        <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
          {QUICK_JUMP.map(({ label, to, icon: Icon }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className="flex items-center gap-3 rounded-xl border border-pp-border-soft bg-pp-surface-1 p-4 text-left transition-colors hover:border-pp-border-strong hover:bg-pp-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-pp-accent/15 text-pp-accent">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-medium text-pp-text-body">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Audience-status banner */}
      <section
        aria-label="Audience display status"
        className={cn(
          'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3.5',
          display.connected
            ? 'border-pp-accent/30 bg-pp-accent/10'
            : 'border-pp-border-soft bg-pp-surface-1',
        )}
      >
        {display.connected ? (
          <span className="relative flex size-2.5 shrink-0 items-center justify-center" aria-hidden>
            <span className="absolute inline-flex size-2.5 animate-pp-pulse rounded-full bg-pp-success/60" />
            <span className="relative inline-flex size-2 rounded-full bg-pp-success shadow-[0_0_8px_hsl(var(--pp-success))]" />
          </span>
        ) : (
          <MonitorOff className="size-4 shrink-0 text-pp-text-muted" aria-hidden />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 text-sm font-medium text-pp-text-body">
            {display.connected ? (
              <>
                <MonitorCheck className="size-4 text-pp-accent" aria-hidden />
                Audience display ready
              </>
            ) : (
              'No audience display'
            )}
          </span>
          <span className="truncate text-xs text-pp-text-muted">
            {display.connected
              ? [display.label, display.resolution].filter(Boolean).join(' · ')
              : 'Connect a second screen, then choose it in Settings.'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="shrink-0 rounded-md border border-pp-border-soft bg-pp-surface-1 px-3 py-1.5 text-xs font-medium text-pp-text-body transition-colors hover:border-pp-border-strong hover:bg-pp-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Display setup
        </button>
      </section>
    </div>
  );
}
