import { useTheme } from '@/renderer/lib/theme';

// Settings: only real, working controls (§1.5/§1.9) — no fake "coming soon"
// buttons. Theme is wired to the existing ThemeProvider, which persists the
// choice and toggles the `dark` class. More settings land with later domains.
const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background p-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <section className="max-w-xl rounded-lg border p-6">
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
    </div>
  );
}
