import { useTheme } from '@/renderer/lib/theme';

// General settings: appearance/theme. Wired to the ThemeProvider, which persists
// the choice and toggles the `dark` class (§1.5). No fake "coming soon" controls.
const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

export default function GeneralSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="max-w-xl rounded-lg border bg-card p-6">
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
  );
}
