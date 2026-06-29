import { useState } from 'react';
import { cn } from '@/renderer/lib/utils';
import type { BibleSearchResult, BibleVerse } from '@/shared/schemas/scripture';
import { highlightSegments } from './scriptureDeck';

// Keyword mode: full-text search over the bundled WEB (scripture.searchKeyword,
// FTS5 in main) with the matched word marked in each hit. Clicking a hit reports
// that single verse up to the parent, which stages it. window.api only (§1.3);
// Enter runs the search (§5.4).

type Props = {
  /** Report a clicked hit (as a single-verse passage) so the parent stages it. */
  onPick: (verse: BibleVerse) => void;
  /** The verse-id of the staged verse, if it came from a keyword hit. */
  activeId: string | null;
};

export default function KeywordMode({ onPick, activeId }: Props) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [results, setResults] = useState<BibleSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setError(null);
    const q = query.trim();
    if (!q) return;
    const res = await window.api.scripture.searchKeyword(q);
    if (res.ok) {
      setResults(res.data);
      setSubmitted(q);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex gap-2">
        <input
          aria-label="Keyword search"
          className="h-10 flex-1 rounded-md border border-pp-border-soft bg-pp-surface-1 px-3 text-sm text-pp-text-body placeholder:text-pp-text-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          placeholder="e.g. love your enemies"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search()}
        />
        <button
          type="button"
          onClick={() => void search()}
          className="h-10 rounded-md bg-pp-accent px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-pp-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          Search
        </button>
      </div>

      {error && <p className="text-sm text-pp-error">{error}</p>}

      {submitted && (
        <p className="text-xs text-pp-text-muted">
          {results.length} verse{results.length === 1 ? '' : 's'} containing “{submitted}”
        </p>
      )}

      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {results.map((r) => {
          const id = `${r.bookNumber}-${r.chapter}-${r.verse}`;
          const active = id === activeId;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onPick(r)}
                aria-current={active}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                  active
                    ? 'border-pp-accent/50 bg-pp-accent/10'
                    : 'border-transparent hover:border-pp-border-soft hover:bg-pp-surface-2',
                )}
              >
                <span className="text-xs font-semibold text-pp-accent">{r.reference}</span>
                <p className="text-sm text-pp-text-body">
                  {highlightSegments(r.text, submitted).map((seg, i) =>
                    seg.match ? (
                      <mark key={i} className="rounded bg-pp-accent/25 px-0.5 text-pp-text-body">
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    ),
                  )}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
