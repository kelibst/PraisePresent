import { useCallback, useEffect, useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { useTheme } from '@/renderer/lib/theme';

// General settings: appearance/theme and what the app does on startup. Theme is
// wired to the ThemeProvider (persisted + toggles the `dark` class, §1.5);
// startup persists via `settings:get/set` (truth in SQLite, §1.5) through
// `window.api` only (§1.3). The default Bible translation lives in Settings →
// Bible (one source, §1.9). No fake controls.

// Persisted settings key (truth in SQLite). Kept beside its UI so the contract
// is one source per concern; main stores the raw string and the renderer parses.
export const STARTUP_KEY = 'app.onStartup';

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

// On-startup choices. `last-service` reopens the last active service plan; `home`
// always lands on the dashboard. Default is `last-service`.
const STARTUP_OPTIONS = [
  { value: 'last-service', label: 'Reopen last service' },
  { value: 'home', label: 'Go to Home' },
] as const;
type StartupChoice = (typeof STARTUP_OPTIONS)[number]['value'];
const DEFAULT_STARTUP: StartupChoice = 'last-service';

function parseStartup(raw: string | null): StartupChoice {
  return raw === 'home' ? 'home' : DEFAULT_STARTUP;
}

export default function GeneralSettings() {
  const { theme, setTheme } = useTheme();

  const [startup, setStartup] = useState<StartupChoice>(DEFAULT_STARTUP);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const flashSaved = useCallback((key: string) => {
    setSavedKey(key);
    window.setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
  }, []);

  useEffect(() => {
    void (async () => {
      const startRes = await window.api.settings.get(STARTUP_KEY);
      if (startRes.ok) setStartup(parseStartup(startRes.data));
    })();
  }, []);

  const chooseStartup = async (value: StartupChoice) => {
    setStartup(value);
    const res = await window.api.settings.set(STARTUP_KEY, value);
    if (res.ok) flashSaved(STARTUP_KEY);
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Appearance / theme. */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Appearance</h2>
        <p className="mb-4 text-sm text-muted-foreground">Choose how PraisePresent looks.</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={theme === t.value}
              onClick={() => setTheme(t.value)}
              className={`rounded px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                theme === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* On startup. */}
      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">On startup</h2>
            <p className="text-sm text-muted-foreground">Where PraisePresent opens each launch.</p>
          </div>
          {savedKey === STARTUP_KEY && <SavedTag />}
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="On startup">
          {STARTUP_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={startup === o.value}
              onClick={() => void chooseStartup(o.value)}
              className={`rounded px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                startup === o.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SavedTag() {
  return (
    <span className="flex items-center gap-1 text-sm text-primary" role="status" aria-label="Saved">
      <FiCheck aria-hidden /> Saved
    </span>
  );
}
