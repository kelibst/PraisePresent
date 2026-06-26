import { useState } from 'react';
import type { BibleVerse, BibleSearchResult } from '@/shared/schemas/scripture';

// Scripture feature: look up a reference ("John 3:16") or keyword-search the
// bundled WEB text, then project a verse to the audience window via the Phase 2
// present:* broadcast. All logic lives in main behind window.api (§5.4) — this
// only renders + calls the API.

type Mode = 'reference' | 'keyword';

function referenceLabel(v: BibleVerse): string {
  return `${v.bookName} ${v.chapter}:${v.verse}`;
}

export default function ScripturePage() {
  const [mode, setMode] = useState<Mode>('reference');
  const [query, setQuery] = useState('');
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [results, setResults] = useState<BibleSearchResult[]>([]);
  const [heading, setHeading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setError(null);
    if (!query.trim()) return;
    if (mode === 'reference') {
      const res = await window.api.scripture.lookupReference(query);
      if (res.ok) {
        setVerses(res.data);
        setResults([]);
        setHeading(res.data.length ? referenceLabel(res.data[0]) : 'No match');
      } else {
        setError(res.error);
      }
    } else {
      const res = await window.api.scripture.searchKeyword(query);
      if (res.ok) {
        setResults(res.data);
        setVerses([]);
        setHeading(`${res.data.length} result${res.data.length === 1 ? '' : 's'}`);
      } else {
        setError(res.error);
      }
    }
  };

  const present = (reference: string, text: string) =>
    window.api.present.setState({ mode: 'slide', slide: { text: `${text}\n\n${reference}` } });
  const black = () => window.api.present.setState({ mode: 'black', slide: null });

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void search();
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Scripture</h1>
        <button
          onClick={black}
          className="rounded bg-black px-4 py-2 font-medium text-white hover:opacity-80"
        >
          Black
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex gap-2" role="tablist" aria-label="Search mode">
          <button
            role="tab"
            aria-selected={mode === 'reference'}
            onClick={() => setMode('reference')}
            className={`rounded px-3 py-1 text-sm font-medium ${
              mode === 'reference'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground'
            }`}
          >
            Reference
          </button>
          <button
            role="tab"
            aria-selected={mode === 'keyword'}
            onClick={() => setMode('keyword')}
            className={`rounded px-3 py-1 text-sm font-medium ${
              mode === 'keyword'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground'
            }`}
          >
            Keyword
          </button>
        </div>
        <div className="flex gap-2">
          <input
            aria-label={mode === 'reference' ? 'Scripture reference' : 'Keyword search'}
            className="flex-1 rounded border bg-background px-3 py-2 text-sm"
            placeholder={
              mode === 'reference' ? 'e.g. John 3:16 or Psalm 23' : 'e.g. love your enemies'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            onClick={search}
            className="rounded bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
          >
            Search
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {heading && <h2 className="text-lg font-semibold text-foreground">{heading}</h2>}

      {/* Reference lookup: verses in order. */}
      {verses.length > 0 && (
        <ul className="flex flex-col gap-2">
          {verses.map((v) => (
            <li key={`${v.bookNumber}-${v.chapter}-${v.verse}`} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-foreground">
                  <span className="mr-2 font-semibold text-primary">{v.verse}</span>
                  {v.text}
                </p>
                <button
                  onClick={() => present(referenceLabel(v), v.text)}
                  className="shrink-0 rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Present
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Keyword search: each hit shows its reference. */}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r) => (
            <li key={`${r.bookNumber}-${r.chapter}-${r.verse}`} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">{r.reference}</p>
                  <p className="text-foreground">{r.text}</p>
                </div>
                <button
                  onClick={() => present(r.reference, r.text)}
                  className="shrink-0 rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Present
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
