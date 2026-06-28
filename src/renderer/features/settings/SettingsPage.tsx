import { useState } from 'react';
import { FiUser, FiMonitor } from 'react-icons/fi';
import GeneralSettings from './GeneralSettings';
import DisplaySettings from './DisplaySettings';

// Settings shell: a left tab rail (General / Display) with real, working panels.
// Display config matters for a dual-screen app — the operator picks the audience
// monitor here (§1.3 keeps the actual placement in main). No fake controls.
const TABS = [
  { id: 'general', label: 'General', icon: FiUser, render: () => <GeneralSettings /> },
  { id: 'display', label: 'Display', icon: FiMonitor, render: () => <DisplaySettings /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function SettingsPage() {
  const [active, setActive] = useState<TabId>('general');
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div className="flex min-h-screen bg-background">
      <nav aria-label="Settings sections" className="w-56 shrink-0 border-r bg-secondary/40 p-3">
        <h1 className="mb-3 px-2 text-xl font-bold text-foreground">Settings</h1>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={active === id}
            onClick={() => setActive(id)}
            className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
              active === id
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-auto p-8">{current.render()}</div>
    </div>
  );
}
