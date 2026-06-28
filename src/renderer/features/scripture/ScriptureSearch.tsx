import { useState } from 'react';
import type { BibleVerse, BibleSearchResult } from '@/shared/schemas/scripture';

// Scripture search: look up a reference ("John 3:16") or keyword-search the
// bundled WEB text, then project a verse to the audience as a multi-verse deck.
// All logic lives in main behind window.api (§5.2) — this only renders + calls.

type Mode = 'reference' | 'keyword';

function referenceLabel(v: BibleVerse): string {
  return `${v.bookName} ${v.chapter}:${v.verse}`;
}

export default function ScriptureSearch() {
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

  // Present a passage as a MULTI-VERSE deck: one slide per verse with its own
  // reference label, starting at the clicked verse. next/prev then walk verses.
  const presentVerses = (startIndex: number) => {
    const deck = verses.map((v) => ({
      id: `${v.bookNumber}-${v.chapter}-${v.verse}`,
      lines: [v.text],
      reference: referenceLabel(v),
    }));
    void window.api.present.setDeck(deck, startIndex);
  };

  // Present keyword hits as a deck, starting at the clicked result.
  const presentResults = (startIndex: number) => {
    const deck = results.map((r) => ({
      id: `${r.bookNumber}-${r.chapter}-${r.verse}`,
      lines: [r.text],
      reference: r.reference,
    }));
    void window.api.present.setDeck(deck, startIndex);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void search();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="flex gap-2" role="tablist" aria-label="Search mode">
          {(['reference', 'keyword'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1 text-sm font-medium capitalize transition ${
                mode === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
              }`}
            >
              {m}
            </button>
          ))}
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
            className="rounded bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90"
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
          {verses.map((v, i) => (
            <li key={`${v.bookNumber}-${v.chapter}-${v.verse}`} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-foreground">
                  <span className="mr-2 font-semibold text-primary">{v.verse}</span>
                  {v.text}
                </p>
                <button
                  onClick={() => presentVerses(i)}
                  className="shrink-0 rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground transition hover:opacity-90"
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
          {results.map((r, i) => (
            <li key={`${r.bookNumber}-${r.chapter}-${r.verse}`} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">{r.reference}</p>
                  <p className="text-foreground">{r.text}</p>
                </div>
                <button
                  onClick={() => presentResults(i)}
                  className="shrink-0 rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground transition hover:opacity-90"
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
