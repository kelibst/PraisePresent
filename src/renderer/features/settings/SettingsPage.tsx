import { useState } from 'react';
import { FiUser, FiMonitor, FiImage, FiBook, FiCpu, FiInfo } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import GeneralSettings from './GeneralSettings';
import DisplaySettings from './DisplaySettings';
import PresentationSettings from './PresentationSettings';
import AiPrivacySettings from './AiPrivacySettings';
import BibleSettings from './BibleSettings';
import AboutSettings from './AboutSettings';

// Settings shell: a fixed 218px left sub-nav (General · Display · Presentation ·
// Bible · AI & Privacy · About) with a sage active-bar, beside a scrollable
// content panel. Renders INSIDE the app shell's scrollable <main> (AppLayout), so
// it sizes to `h-full` and owns its own internal scroll — not `min-h-screen`.
// Every panel is real, wired through `window.api` (§1.3); no placeholder controls.
const TABS: { id: string; label: string; icon: IconType; render: () => JSX.Element }[] = [
  { id: 'general', label: 'General', icon: FiUser, render: () => <GeneralSettings /> },
  { id: 'display', label: 'Display', icon: FiMonitor, render: () => <DisplaySettings /> },
  {
    id: 'presentation',
    label: 'Presentation',
    icon: FiImage,
    render: () => <PresentationSettings />,
  },
  { id: 'bible', label: 'Bible', icon: FiBook, render: () => <BibleSettings /> },
  { id: 'ai', label: 'AI & Privacy', icon: FiCpu, render: () => <AiPrivacySettings /> },
  { id: 'about', label: 'About', icon: FiInfo, render: () => <AboutSettings /> },
];

export default function SettingsPage() {
  const [active, setActive] = useState<string>('general');
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div className="flex h-full bg-background">
      <nav
        aria-label="Settings sections"
        className="flex w-[218px] shrink-0 flex-col border-r bg-secondary/40 p-3"
      >
        <h1 className="mb-3 px-2 text-xl font-bold text-foreground">Settings</h1>
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setActive(id)}
              className={`relative mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                isActive
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {/* Sage active-bar. */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-primary"
                />
              )}
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} aria-hidden />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto p-8">{current.render()}</div>
    </div>
  );
}
