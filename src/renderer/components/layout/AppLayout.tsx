import { Outlet } from 'react-router-dom';

import TopBar from './TopBar';
import NavRail from './NavRail';
import StatusStrip from './StatusStrip';

// The persistent application shell (CLAUDE.md §5.4). Three fixed regions frame
// every screen: a 52px TopBar, a collapsible left NavRail, and a slim bottom
// StatusStrip. The routed screen renders in the scrollable main region via
// <Outlet/>. Dark body comes from the `--background` token (#070b15 in dark).
//
// NOTE for the B3–B11 screen re-skins: screens render INSIDE this frame, so the
// main region is the scroll container. Screens should size to their content (or
// `h-full`), not `min-h-screen`, and own their internal padding.

export default function AppLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <NavRail />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <StatusStrip />
    </div>
  );
}
