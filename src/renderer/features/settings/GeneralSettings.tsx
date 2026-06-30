import { useCallback, useEffect, useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { useTheme } from '@/renderer/lib/theme';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { Label } from '@/renderer/components/ui/label';
import type { BibleTranslation } from '@/shared/schemas/scripture';

// General settings: appearance/theme, the default Bible translation, and what the
// app does on startup. Theme is wired to the ThemeProvider (persisted + toggles
// the `dark` class, §1.5); translation + startup persist via `settings:get/set`
// (truth in SQLite, §1.5) through `window.api` only (§1.3). No fake controls.

// Persisted settings keys (truth in SQLite). Kept beside their UI so the contract
// is one source per concern; main stores the raw string and the renderer parses.
export const DEFAULT_TRANSLATION_KEY = 'scripture.defaultTranslation';
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

  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [defaultTranslation, setDefaultTranslation] = useState<string>('');
  const [startup, setStartup] = useState<StartupChoice>(DEFAULT_STARTUP);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const flashSaved = useCallback((key: string) => {
    setSavedKey(key);
    window.setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
  }, []);

  useEffect(() => {
    void (async () => {
      const [transRes, defRes, startRes] = await Promise.all([
        window.api.scripture.listTranslations(),
        window.api.settings.get(DEFAULT_TRANSLATION_KEY),
        window.api.settings.get(STARTUP_KEY),
      ]);
      if (transRes.ok) setTranslations(transRes.data);
      if (startRes.ok) setStartup(parseStartup(startRes.data));
      // Fall back to the first available translation when none was chosen yet.
      const stored = defRes.ok ? defRes.data : null;
      if (stored) setDefaultTranslation(stored);
      else if (transRes.ok && transRes.data[0]) {
        setDefaultTranslation(transRes.data[0].abbreviation);
      }
    })();
  }, []);

  const chooseTranslation = async (abbreviation: string) => {
    setDefaultTranslation(abbreviation);
    const res = await window.api.settings.set(DEFAULT_TRANSLATION_KEY, abbreviation);
    if (res.ok) flashSaved(DEFAULT_TRANSLATION_KEY);
  };

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

      {/* Default Bible translation. */}
      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Default Bible translation</h2>
            <p className="text-sm text-muted-foreground">
              Used when you open the Scripture browser.
            </p>
          </div>
          {savedKey === DEFAULT_TRANSLATION_KEY && <SavedTag />}
        </div>
        <div className="max-w-xs">
          <Label htmlFor="default-translation" className="sr-only">
            Default Bible translation
          </Label>
          <Select
            value={defaultTranslation || undefined}
            onValueChange={(v) => void chooseTranslation(v)}
          >
            <SelectTrigger id="default-translation" aria-label="Default Bible translation">
              <SelectValue placeholder="Select a translation" />
            </SelectTrigger>
            <SelectContent>
              {translations.map((t) => (
                <SelectItem key={t.id} value={t.abbreviation}>
                  {t.abbreviation} · {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
