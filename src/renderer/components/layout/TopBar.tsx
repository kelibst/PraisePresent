import { useEffect, useState } from 'react';
import { CalendarDays, Search, Sun, Moon, Monitor } from 'lucide-react';

import { Button } from '@/renderer/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { cn } from '@/renderer/lib/utils';
import { useTheme } from '@/renderer/lib/theme';
import { useActiveService } from '@/renderer/features/planning/useActiveService';
import type { PlanSummary } from '@/shared/schemas/plan';
import type { PresentState } from '@/shared/schemas/present';
import CommandPalette from './CommandPalette';

// The persistent top bar (52px) — logo, service selector, ⌘K search, theme
// toggle, the LIVE/BLACK pill and the Black fail-safe button (CLAUDE.md §5.4/§5.7).
// Renderer-only: every side effect goes through `window.api` (§1.3).

const SENTINEL_NONE = '__none__'; // radix Select forbids an empty-string value

// Derive the pill label from live state: a slide on screen = LIVE; otherwise the
// audience is dark/empty (the fail-safe family).
function pillFor(state: PresentState | null): { label: string; live: boolean } {
  if (state && state.mode === 'slide' && state.deck.length > 0) {
    return { label: 'LIVE', live: true };
  }
  if (state?.mode === 'clear' || state?.mode === 'blank') {
    return { label: 'CLEAR', live: false };
  }
  return { label: 'BLACK', live: false };
}

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { id, setActiveService } = useActiveService();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [present, setPresent] = useState<PresentState | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Load the plan list for the service selector.
  useEffect(() => {
    let active = true;
    void window.api.plans.list().then((res) => {
      if (active && res.ok) setPlans(res.data);
    });
    return () => {
      active = false;
    };
  }, []);

  // Track live presentation state: snapshot now, then live pushes (§5.3).
  useEffect(() => {
    let active = true;
    void window.api.present.getState().then((res) => {
      if (active && res.ok) setPresent(res.data);
    });
    const off = window.api.present.onState((state) => setPresent(state));
    return () => {
      active = false;
      off();
    };
  }, []);

  // Global keyboard: Cmd/Ctrl+K opens the palette; `B` blacks the output (§5.7).
  // `B` is ignored while typing or when the palette is open so it never fires
  // mid-search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (paletteOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable);
      if (!typing && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        void window.api.present.black();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen]);

  const pill = pillFor(present);
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const cycleTheme = () =>
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-pp-border-soft bg-pp-surface-2 px-3">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-md bg-pp-accent text-xs font-bold text-primary-foreground">
          PP
        </div>
        <span className="hidden text-sm font-semibold text-pp-text-primary sm:inline">
          PraisePresent
        </span>
      </div>

      {/* Service selector */}
      <div className="w-56">
        <Select
          value={id === null ? SENTINEL_NONE : String(id)}
          onValueChange={(v) => void setActiveService(v === SENTINEL_NONE ? null : Number(v))}
        >
          <SelectTrigger aria-label="Active service" className="h-9 gap-2 bg-pp-surface-1">
            <CalendarDays className="size-4 shrink-0 text-pp-accent-light" aria-hidden="true" />
            <SelectValue placeholder="No service selected" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SENTINEL_NONE}>No service</SelectItem>
            {plans.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Global ⌘K search trigger */}
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search (Command or Control + K)"
        aria-keyshortcuts="Meta+K Control+K"
        className="flex h-9 max-w-[440px] flex-1 items-center gap-2 rounded-md border border-pp-border-soft bg-pp-surface-1 px-3 text-sm text-pp-text-muted outline-none transition-colors hover:border-pp-border-strong hover:text-pp-text-body focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pp-surface-2"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Search scripture, songs, media…</span>
        <kbd className="ml-auto hidden rounded border border-pp-border-soft px-1.5 py-0.5 text-[10px] font-medium text-pp-text-dim md:inline">
          ⌘K
        </kbd>
      </button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        aria-label={`Theme: ${theme} (click to change)`}
        className="size-9 text-pp-text-muted hover:text-pp-text-body"
      >
        <ThemeIcon className="size-5" aria-hidden="true" />
      </Button>

      {/* LIVE / BLACK pill */}
      <div
        role="status"
        aria-label={`Audience output: ${pill.label}`}
        className={cn(
          'flex select-none items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide',
          pill.live ? 'bg-pp-success/15 text-pp-success' : 'bg-pp-surface-1 text-pp-text-dim',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'size-2 rounded-full',
            pill.live ? 'animate-pp-pulse bg-pp-success' : 'bg-pp-text-dim',
          )}
        />
        {pill.label}
      </div>

      {/* Black fail-safe (kbd B) */}
      <button
        type="button"
        onClick={() => void window.api.present.black()}
        aria-keyshortcuts="B"
        title="Black the audience output (B)"
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-pp-border-strong bg-pp-surface-1 px-3 text-sm font-semibold text-pp-text-body transition-colors hover:bg-pp-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Black
        <kbd className="rounded bg-pp-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-pp-text-muted">
          B
        </kbd>
      </button>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
