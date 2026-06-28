import { useCallback, useEffect, useState } from 'react';
import { FiMonitor, FiCheck } from 'react-icons/fi';
import type { DisplayInfo } from '@/shared/schemas/display';

// Display/output settings: pick which monitor is the audience screen. Enumeration
// + placement live in main (§1.3) — this only calls window.api.display.*. The
// choice persists and the audience window re-places live (no restart needed).

// displayId null = "Auto": first non-primary display, else primary (single screen).
const AUTO = 'auto' as const;

export default function DisplaySettings() {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [list, choice] = await Promise.all([
      window.api.display.list(),
      window.api.display.getAudience(),
    ]);
    if (list.ok) setDisplays(list.data);
    else setError(list.error);
    if (choice.ok) setSelected(choice.data.displayId);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const choose = async (displayId: number | null) => {
    setSaved(false);
    setError(null);
    const res = await window.api.display.setAudience(displayId);
    if (res.ok) {
      setSelected(res.data.displayId);
      setSaved(true);
    } else {
      setError(res.error);
    }
  };

  const isActive = (value: number | typeof AUTO) =>
    value === AUTO ? selected === null : selected === value;

  return (
    <section className="max-w-2xl rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Audience display</h2>
          <p className="text-sm text-muted-foreground">
            Choose the monitor the audience/projector window uses.
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-primary" role="status">
            <FiCheck aria-hidden /> Saved
          </span>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Audience display">
        {/* Auto option — let the app pick the secondary screen automatically. */}
        <DisplayOption
          active={isActive(AUTO)}
          onSelect={() => choose(null)}
          title="Auto (recommended)"
          subtitle="Use the secondary display when one is connected"
        />

        {displays.map((d) => (
          <DisplayOption
            key={d.id}
            active={isActive(d.id)}
            onSelect={() => choose(d.id)}
            title={d.label}
            subtitle={`${d.width} × ${d.height}`}
            badge={d.isPrimary ? 'Primary' : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function DisplayOption({
  active,
  onSelect,
  title,
  subtitle,
  badge,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
    >
      <FiMonitor
        className={`h-6 w-6 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
        aria-hidden
      />
      <span className="flex flex-col">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
      {badge && (
        <span className="ml-auto rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {badge}
        </span>
      )}
      {active && <FiCheck className="ml-auto h-5 w-5 text-primary" aria-hidden />}
    </button>
  );
}
