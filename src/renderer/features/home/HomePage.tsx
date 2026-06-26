import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBook, FiMusic, FiImage, FiMonitor, FiList, FiSettings, FiPlus } from 'react-icons/fi';
import { ChurchIcon } from 'lucide-react';
import type { PlanSummary } from '@/shared/schemas/plan';

// Real landing page (§1.5): quick links to the live domains plus the most
// recent service plans read from SQLite via window.api. No fixtures, no alerts,
// no links to non-existent ids — the template cruft was removed here.
const QUICK_ACTIONS = [
  { label: 'Scripture', to: '/scripture', icon: FiBook },
  { label: 'Songs', to: '/songs', icon: FiMusic },
  { label: 'Services', to: '/services', icon: FiList },
  { label: 'Present', to: '/present', icon: FiMonitor },
  { label: 'Media', to: '/media', icon: FiImage },
  { label: 'Settings', to: '/settings', icon: FiSettings },
] as const;

const RECENT_LIMIT = 5;

export default function HomePage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    const res = await window.api.plans.list();
    if (res.ok) setPlans(res.data);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Mirror ServicesPage.createPlan: persist a new plan, then open it (§1.9 —
  // one way to create a service, shared shape).
  const createService = async () => {
    const res = await window.api.plans.create({
      name: 'New service',
      scheduledFor: null,
      notes: '',
      items: [],
    });
    if (res.ok) navigate(`/services/${res.data}`);
  };

  const recent = plans.slice(0, RECENT_LIMIT);

  return (
    <div className="flex min-h-screen flex-col gap-10 bg-background p-12">
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ChurchIcon className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">PraisePresent</h1>
          <p className="text-sm text-muted-foreground">Worship presentation for your church.</p>
        </div>
      </header>

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold text-foreground">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 rounded-lg border p-5 text-center transition hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Icon className="h-6 w-6 text-primary" aria-hidden />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-semibold text-foreground">
            Recent services
          </h2>
          <button
            type="button"
            onClick={createService}
            className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <FiPlus aria-hidden /> New service
          </button>
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services yet — create one to begin.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/services/${p.id}`}
                  className="flex items-center justify-between rounded-lg border p-5 transition hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="text-base font-semibold text-foreground">{p.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {p.scheduledFor ?? 'Unscheduled'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
