import { useCallback, useEffect, useState } from 'react';
import { FiMonitor, FiCheck } from 'react-icons/fi';
import {
  SAFE_AREA_KEY,
  BLACK_ON_DISCONNECT_KEY,
  MAX_SAFE_AREA_PCT,
  parseSafeAreaPct,
  parseBlackOnDisconnect,
} from '@/shared/schemas/display';
import type { DisplayInfo } from '@/shared/schemas/display';
import { Switch } from '@/renderer/components/ui/switch';
import { Label } from '@/renderer/components/ui/label';
import { Badge } from '@/renderer/components/ui/badge';

// Display/output settings: pick the audience monitor, plus the two safety
// controls (overscan safe-area + black-on-disconnect). Enumeration + placement
// live in main (§1.3) — this only calls `window.api.display.*` / `settings.*`.
// The choice persists and the audience window re-places live (no restart).

// displayId null = "Auto": first non-primary display, else primary (single screen).
const AUTO = 'auto' as const;

export default function DisplaySettings() {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [safeArea, setSafeArea] = useState<number>(0);
  const [blackOnDisconnect, setBlackOnDisconnect] = useState<boolean>(true);

  const load = useCallback(async () => {
    setError(null);
    const [list, choice, safeRes, blackRes] = await Promise.all([
      window.api.display.list(),
      window.api.display.getAudience(),
      window.api.settings.get(SAFE_AREA_KEY),
      window.api.settings.get(BLACK_ON_DISCONNECT_KEY),
    ]);
    if (list.ok) setDisplays(list.data);
    else setError(list.error);
    if (choice.ok) setSelected(choice.data.displayId);
    if (safeRes.ok) setSafeArea(parseSafeAreaPct(safeRes.data));
    if (blackRes.ok) setBlackOnDisconnect(parseBlackOnDisconnect(blackRes.data));
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

  const changeSafeArea = async (pct: number) => {
    setSafeArea(pct);
    await window.api.settings.set(SAFE_AREA_KEY, String(pct));
  };

  const toggleBlack = async (next: boolean) => {
    setBlackOnDisconnect(next);
    await window.api.settings.set(BLACK_ON_DISCONNECT_KEY, next ? 'true' : 'false');
  };

  const isActive = (value: number | typeof AUTO) =>
    value === AUTO ? selected === null : selected === value;

  // Resolve the "control" + "audience" screens for the diagram. Auto picks the
  // first non-primary display when present, else the primary (single-screen).
  const primary = displays.find((d) => d.isPrimary) ?? displays[0] ?? null;
  const resolvedAudience =
    selected === null
      ? (displays.find((d) => !d.isPrimary) ?? primary)
      : (displays.find((d) => d.id === selected) ?? null);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Audience display</h2>
            <p className="text-sm text-muted-foreground">
              Choose the monitor the audience/projector window uses.
            </p>
          </div>
          {saved && (
            <span
              className="flex items-center gap-1 text-sm text-primary"
              role="status"
              aria-label="Saved"
            >
              <FiCheck aria-hidden /> Saved
            </span>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        {/* Two-monitor diagram: Control (primary) vs Audience (resolved choice). */}
        <div className="mb-5 grid grid-cols-2 gap-3" aria-hidden>
          <MonitorTile role="Control" name={primary?.label ?? 'This screen'} />
          <MonitorTile
            role="Audience"
            name={resolvedAudience ? resolvedAudience.label : 'No second screen'}
            highlighted
          />
        </div>

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

      {/* Safe-area margin + black-on-disconnect. */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Output safety</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Margins for overscan TVs and a fail-safe blackout.
        </p>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="safe-area">Safe-area margin</Label>
            <span className="text-sm tabular-nums text-muted-foreground">{safeArea}%</span>
          </div>
          <input
            id="safe-area"
            type="range"
            min={0}
            max={MAX_SAFE_AREA_PCT}
            step={1}
            value={safeArea}
            onChange={(e) => void changeSafeArea(Number(e.target.value))}
            aria-valuetext={`${safeArea} percent`}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Insets the projected slide on every edge. 0% fills the screen.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="black-on-disconnect">Black on disconnect</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Blank the output to black if the audience screen is unplugged.
            </p>
          </div>
          <Switch
            id="black-on-disconnect"
            checked={blackOnDisconnect}
            onCheckedChange={(v) => void toggleBlack(v)}
            aria-label="Black on disconnect"
          />
        </div>
      </section>
    </div>
  );
}

function MonitorTile({
  role,
  name,
  highlighted,
}: {
  role: string;
  name: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 ${
        highlighted ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'
      }`}
    >
      <FiMonitor
        className={`h-10 w-10 ${highlighted ? 'text-primary' : 'text-muted-foreground'}`}
      />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {role}
      </span>
      <span className="truncate text-sm font-medium text-foreground">{name}</span>
    </div>
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
        <Badge variant="secondary" className="ml-auto">
          {badge}
        </Badge>
      )}
      {active && <FiCheck className="ml-auto h-5 w-5 text-primary" aria-hidden />}
    </button>
  );
}
