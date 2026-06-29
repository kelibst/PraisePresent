import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/renderer/lib/utils';
import type { BibleBook, BibleVerse } from '@/shared/schemas/scripture';
import { bookFragmentOf, matchBooks, nearestBook, normalizeFragment } from './bookMatch';

// Reference mode — the EasyWorship-style reference field. One free-text input
// that is NEVER empty (defaults to Genesis 1:1; clearing it restores the last
// valid reference), with single-keystroke nearest-book selection ("j" → the
// nearest J book), Space to complete the book and move to chapter/verse, and
// live resolution as the reference becomes complete (no Enter required). Invalid
// complete references show a quiet inline hint rather than going blank.
// window.api only (§1.3); keyboard-operable under pressure (§5.4).

const DEFAULT_REFERENCE = 'Genesis 1:1';

type Props = {
  /** The book list (loaded by the parent once and shared across modes). */
  books: BibleBook[];
  /** Report the resolved passage so the parent can stage it. */
  onResolve: (verses: BibleVerse[]) => void;
};

export default function ReferenceMode({ books, onResolve }: Props) {
  const [query, setQuery] = useState(DEFAULT_REFERENCE);
  const [hint, setHint] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  // True once the operator has arrowed into the list; only then does Enter pick
  // a book (otherwise Enter resolves the typed reference directly).
  const [navigating, setNavigating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastValid = useRef(DEFAULT_REFERENCE);
  const reqId = useRef(0);

  // The book portion drives the autocomplete; once a chapter digit is typed we
  // leave the book segment and hide the dropdown.
  const fragment = useMemo(() => bookFragmentOf(query), [query]);
  const inBookSegment = useMemo(() => !/\d/.test(query.replace(/^\s*\d\s/, '')), [query]);
  const suggestions = useMemo(
    () => (fragment ? matchBooks(books, fragment).slice(0, 7) : []),
    [books, fragment],
  );
  const showList = open && inBookSegment && suggestions.length > 0;

  // Auto-highlight the nearest match (index 0) whenever the fragment changes.
  useEffect(() => {
    setHighlight(0);
    setNavigating(false);
  }, [fragment]);

  // Resolve a reference → stage it. Stale (superseded) responses are ignored so
  // fast typing always shows the latest. `quiet` suppresses the not-found hint
  // (used for the initial default resolve).
  const resolve = useCallback(
    async (raw: string, opts: { quiet?: boolean } = {}) => {
      const q = raw.trim();
      if (!q) return;
      const id = ++reqId.current;
      const res = await window.api.scripture.lookupReference(q);
      if (id !== reqId.current) return; // a newer keystroke superseded this one
      if (!res.ok) {
        setHint(res.error);
        return;
      }
      if (res.data.length > 0) {
        lastValid.current = q;
        setHint(null);
        onResolve(res.data);
        return;
      }
      // Zero verses: only complain once the input is complete enough (has a
      // chapter number) so we don't nag mid-type (T3 validation UX).
      if (!opts.quiet && /\d/.test(q)) {
        const known = nearestBook(books, bookFragmentOf(q));
        setHint(
          known
            ? `No verses for “${q}” — check the chapter and verse.`
            : `Unknown book “${bookFragmentOf(q)}”.`,
        );
      }
    },
    [books, onResolve],
  );

  // Resolve the default on mount so the pane is never blank (never-empty rule).
  useEffect(() => {
    void resolve(DEFAULT_REFERENCE, { quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live resolution on each edit.
  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(() => void resolve(query), 160);
    return () => clearTimeout(t);
  }, [query, resolve]);

  // Replace the book portion with a chosen book, keeping any chapter:verse tail.
  const applyBook = (b: BibleBook) => {
    const tail = query.replace(/^\s*\d?\s*[^\d]*/, '').trimStart();
    setQuery(tail ? `${b.name} ${tail}` : `${b.name} `);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setNavigating(true);
        setHighlight((h) => (navigating ? (h + 1) % suggestions.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setNavigating(true);
        setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' && navigating) {
        e.preventDefault();
        applyBook(suggestions[highlight]);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      // Space completes the nearest book and advances to the chapter segment —
      // unless what's typed already IS the book name (then let space through).
      if (e.key === ' ') {
        const near = suggestions[highlight] ?? suggestions[0];
        if (near && normalizeFragment(fragment) !== normalizeFragment(near.name)) {
          e.preventDefault();
          applyBook(near);
          return;
        }
      }
    }
    if (e.key === 'Enter') void resolve(query);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          ref={inputRef}
          aria-label="Scripture reference"
          autoComplete="off"
          className="h-10 w-full rounded-md border border-pp-border-soft bg-pp-surface-1 px-3 text-sm text-pp-text-body placeholder:text-pp-text-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          placeholder="e.g. John 3:16 or Psalm 23"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            // Never-empty: a cleared field restores the last valid reference.
            if (!query.trim()) setQuery(lastValid.current);
          }}
          onKeyDown={onKeyDown}
        />

        {showList && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-pp-border-soft bg-pp-surface-1 shadow-lg">
            <p className="border-b border-pp-border-soft px-3 py-1.5 text-[11px] text-pp-text-muted">
              Books matching “{fragment}”
            </p>
            <ul role="listbox" aria-label="Book suggestions">
              {suggestions.map((b, i) => (
                <li key={b.number} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => applyBook(b)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-1.5 text-left text-sm',
                      i === highlight
                        ? 'bg-pp-accent/15 text-pp-accent'
                        : 'text-pp-text-body hover:bg-pp-surface-2',
                    )}
                  >
                    <span>{b.name}</span>
                    <span className="text-xs text-pp-text-dim">{b.abbreviation}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-xs text-pp-text-muted">
        Type a book, then{' '}
        <kbd className="rounded border border-pp-border-soft bg-pp-surface-2 px-1 font-mono text-[10px]">
          Space
        </kbd>{' '}
        for the chapter and verse — e.g. John 3 16. The field always keeps a valid reference.
      </p>

      {hint && <p className="text-sm text-pp-text-muted">{hint}</p>}
    </div>
  );
}
