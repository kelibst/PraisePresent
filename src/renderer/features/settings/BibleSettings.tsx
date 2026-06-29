import { useEffect, useState } from 'react';
import { FiBook } from 'react-icons/fi';
import type { BibleTranslation } from '@/shared/schemas/scripture';
import { Badge } from '@/renderer/components/ui/badge';

// Bible settings: real, read-only info about the installed translations. The app
// ships the bundled WEB (offline) translation; this lists what is actually
// available via `window.api.scripture.listTranslations` (§1.3) — no fake imports.

export default function BibleSettings() {
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await window.api.scripture.listTranslations();
      if (res.ok) setTranslations(res.data);
    })();
  }, []);

  return (
    <section className="max-w-2xl rounded-lg border bg-card p-6">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Installed translations</h2>
        <Badge variant="success">Offline</Badge>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Bundled with PraisePresent and available without an internet connection.
      </p>

      <ul className="flex flex-col gap-2">
        {translations.length === 0 ? (
          <li className="text-sm text-muted-foreground">No translations found.</li>
        ) : (
          translations.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-4">
              <FiBook className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span className="flex flex-col">
                <span className="font-medium text-foreground">
                  {t.abbreviation} · {t.name}
                </span>
                <span className="text-xs text-muted-foreground">{t.license}</span>
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
