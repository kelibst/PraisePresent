import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import type { PlanSummary } from '@/shared/schemas/plan';

// Service plans, persisted in SQLite (CLAUDE.md §1.5) — read through window.api,
// not seed data. The static servicesData fixture was retired in P3-D5.
export default function ServicesPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const refresh = useCallback(async () => {
    const res = await window.api.plans.list();
    if (res.ok) setPlans(res.data);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, location.pathname]);

  const createPlan = async () => {
    if (!name.trim()) return;
    const res = await window.api.plans.create({ name, scheduledFor: null, notes: '', items: [] });
    if (res.ok) {
      setName('');
      await refresh();
      navigate(`/services/${res.data}`);
    }
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex flex-1 flex-col bg-background p-12">
        <h2 className="mb-8 text-2xl font-bold text-foreground">Services</h2>
        <Outlet />
        {location.pathname === '/services' && (
          <div className="flex flex-col gap-6">
            <div className="flex gap-2">
              <input
                aria-label="New service name"
                className="flex-1 rounded border bg-background px-3 py-2 text-sm"
                placeholder="New service name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createPlan()}
              />
              <button
                onClick={createPlan}
                className="rounded bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
              >
                New service
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {plans.map((p) => (
                <button
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border p-6 text-left transition hover:bg-accent"
                  onClick={() => navigate(`/services/${p.id}`)}
                >
                  <div className="text-lg font-semibold text-foreground">{p.name}</div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FiUser />
                    <span className="text-sm text-muted-foreground">
                      {p.scheduledFor ?? 'Unscheduled'}
                    </span>
                  </div>
                </button>
              ))}
              {plans.length === 0 && (
                <p className="text-sm text-muted-foreground">No services yet — create one above.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
