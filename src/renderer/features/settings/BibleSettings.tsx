import { useCallback, useEffect, useState } from 'react';
import { FiBook, FiCheck, FiPlus, FiWifiOff } from 'react-icons/fi';
import { DEFAULT_TRANSLATION_KEY } from '@/shared/schemas/scripture';
import type { BibleTranslation } from '@/shared/schemas/scripture';
import { Badge } from '@/renderer/components/ui/badge';
import { Button } from '@/renderer/components/ui/button';
import { Label } from '@/renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';

// Settings → Bible: the canonical home for translation management. Lists the
// installed translations (`scripture.listTranslations`), sets + persists the
// default (`settings` key `scripture.defaultTranslation`), and surfaces an
// import affordance. All access is through `window.api` (§1.3); the default key
// lives in the shared schema so there is one source (§1.9).
//
// Importing a new translation is DEFERRED: this build bundles only the offline
// WEB text and no public-domain download source is wired. Rather than fake a
// success (§1), the "Add translation" control is clearly disabled with an
// explanatory tooltip — an honest, renderer-only affordance (no stub IPC channel
// is introduced, keeping the main/preload surface unchanged).

export default function BibleSettings() {
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [defaultTranslation, setDefaultTranslation] = useState<string>('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [transRes, defRes] = await Promise.all([
      window.api.scripture.listTranslations(),
      window.api.settings.get(DEFAULT_TRANSLATION_KEY),
    ]);
    if (transRes.ok) setTranslations(transRes.data);
    // Fall back to the first installed translation when none was chosen yet.
    const stored = defRes.ok ? defRes.data : null;
    if (stored) setDefaultTranslation(stored);
    else if (transRes.ok && transRes.data[0]) {
      setDefaultTranslation(transRes.data[0].abbreviation);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chooseTranslation = async (abbreviation: string) => {
    setDefaultTranslation(abbreviation);
    setSaved(false);
    const res = await window.api.settings.set(DEFAULT_TRANSLATION_KEY, abbreviation);
    if (res.ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Default translation — persisted, used by the Scripture browser. */}
      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Default translation</h2>
            <p className="text-sm text-muted-foreground">
              Used when you open the Scripture browser.
            </p>
          </div>
          {saved && (
            <span
              className="flex items-center gap-1 text-sm text-primary"
              role="status"
              aria-label="Saved"
            >
              <FiCheck aria-hidden /> Saved
            </span>
          )}
        </div>
        <div className="max-w-xs">
          <Label htmlFor="default-translation" className="sr-only">
            Default translation
          </Label>
          <Select
            value={defaultTranslation || undefined}
            onValueChange={(v) => void chooseTranslation(v)}
          >
            <SelectTrigger id="default-translation" aria-label="Default translation">
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

      {/* Installed translations + the deferred import affordance. */}
      <section className="rounded-lg border bg-card p-6">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Installed translations</h2>
          <Badge variant="success">
            <FiWifiOff className="mr-1 h-3 w-3" aria-hidden />
            Offline
          </Badge>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Bundled with PraisePresent and available without an internet connection.
        </p>

        <ul className="mb-5 flex flex-col gap-2">
          {translations.length === 0 ? (
            <li className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
              No translations found.
            </li>
          ) : (
            translations.map((t) => {
              const isDefault = t.abbreviation === defaultTranslation;
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-4"
                >
                  <FiBook className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-foreground">
                      {t.abbreviation} · {t.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{t.license}</span>
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-2">
                    {isDefault && <Badge variant="default">Default</Badge>}
                    <Badge variant="secondary">Bundled</Badge>
                  </span>
                </li>
              );
            })
          )}
        </ul>

        {/* Deferred: no download source is wired in this build, so the control is
            disabled and says so — never a fake-ready button (§1). */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Wrapper span receives pointer/focus events a disabled button cannot. */}
              <span
                className="inline-block"
                tabIndex={0}
                aria-label="Add translation (unavailable)"
              >
                <Button type="button" variant="outline" disabled aria-disabled>
                  <FiPlus className="mr-2 h-4 w-4" aria-hidden />
                  Add translation
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Importing more translations is not available in this build. PraisePresent ships with
              the offline WEB text only.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>
    </div>
  );
}
