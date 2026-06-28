import { useState } from 'react';
import BibleBrowser from './BibleBrowser';
import ScriptureSearch from './ScriptureSearch';

// Scripture feature shell: a Browse tab (book → chapter → verses, the default so
// the page is never blank) and a Search tab (reference / keyword). A Black
// button is always available to fail the audience screen to black (§5.7).

type Tab = 'browse' | 'search';

export default function ScripturePage() {
  const [tab, setTab] = useState<Tab>('browse');
  const black = () => window.api.present.black();

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Scripture</h1>
          <div
            className="flex gap-1 rounded-lg bg-secondary p-1"
            role="tablist"
            aria-label="Scripture view"
          >
            {(['browse', 'search'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                  tab === t
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={black}
          className="rounded bg-black px-4 py-2 font-medium text-white transition hover:opacity-80"
        >
          Black
        </button>
      </div>

      {tab === 'browse' ? <BibleBrowser /> : <ScriptureSearch />}
    </div>
  );
}
