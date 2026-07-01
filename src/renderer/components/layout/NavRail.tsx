import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Music,
  Image,
  ListChecks,
  MonitorPlay,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/renderer/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';

// Left navigation rail (CLAUDE.md §5.4 — operated live, keyboard/aria mandatory).
// Destinations in the approved design order; Settings is pinned to the bottom.
// Live Detect is not a destination — it is a tab inside Present (M2, §1.9).
// The rail collapses to icon-only and the collapsed state is persisted
// through `window.api.settings` (truth in SQLite, §1.5) so it survives reloads.

// Persisted under this settings key ('true'/'false').
export const NAV_RAIL_COLLAPSED_KEY = 'ui.navRailCollapsed';

type NavItem = { label: string; icon: LucideIcon; path: string; end?: boolean };

// Primary items (top group). Routes match router.tsx; `/services` keeps its
// existing route while the label reads "Plans" per the design.
const PRIMARY: NavItem[] = [
  { label: 'Home', icon: Home, path: '/', end: true },
  { label: 'Songs', icon: Music, path: '/songs' },
  { label: 'Media', icon: Image, path: '/media' },
  { label: 'Plans', icon: ListChecks, path: '/services' },
  { label: 'Present', icon: MonitorPlay, path: '/present' },
];

// Pinned to the bottom of the rail.
const PINNED: NavItem = { label: 'Settings', icon: Settings, path: '/settings' };

function NavRailLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const link = (
    <NavLink
      to={item.path}
      end={item.end}
      aria-label={item.label}
      title={collapsed ? undefined : item.label}
      className={({ isActive }) =>
        cn(
          // 3px sage active-bar via a left border; sage tint background when active.
          'group relative flex items-center gap-3 rounded-md border-l-[3px] border-transparent px-3 py-2 text-sm font-medium outline-none transition-colors',
          'text-pp-text-muted hover:bg-pp-surface-1 hover:text-pp-text-body',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pp-surface-2',
          collapsed && 'justify-center px-0',
          isActive &&
            'border-pp-accent bg-pp-accent/15 text-pp-accent-light hover:bg-pp-accent/15 hover:text-pp-accent-light',
        )
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export default function NavRail() {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  // Hydrate the persisted collapse preference once on mount.
  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await window.api.settings.get(NAV_RAIL_COLLAPSED_KEY);
      if (!active) return;
      if (res.ok && res.data === 'true') setCollapsed(true);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    // Persist; ignore failures (the UI still toggles — fail safe, §5.7).
    void window.api.settings.set(NAV_RAIL_COLLAPSED_KEY, next ? 'true' : 'false');
  };

  // Avoid a collapse flash before the persisted state hydrates.
  if (!ready) {
    return (
      <nav
        aria-label="Primary"
        className="w-16 shrink-0 border-r border-pp-border-soft bg-pp-surface-2"
      />
    );
  }

  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        aria-label="Primary"
        data-collapsed={collapsed}
        className={cn(
          'flex shrink-0 flex-col border-r border-pp-border-soft bg-pp-surface-2 transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-56',
        )}
      >
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {PRIMARY.map((item) => (
            <NavRailLink key={item.path} item={item} collapsed={collapsed} />
          ))}
        </div>

        <div className="flex flex-col gap-1 border-t border-pp-border-soft p-2">
          <NavRailLink item={PINNED} collapsed={collapsed} />
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-pressed={collapsed}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-pp-text-muted outline-none transition-colors',
              'hover:bg-pp-surface-1 hover:text-pp-text-body',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pp-surface-2',
              collapsed && 'justify-center px-0',
            )}
          >
            <CollapseIcon className="size-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </nav>
    </TooltipProvider>
  );
}
