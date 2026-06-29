import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/renderer/lib/utils';
import type { BibleBook, BibleVerse } from '@/shared/schemas/scripture';

// Reference mode: a single free-text reference field ("John 3:16", "Gen 1:1-3")
// that resolves through scripture.lookupReference, plus a live book-autocomplete
// dropdown so the operator can type "joh" and pick John. Resolving a reference
// reports the verses up to the parent, which stages them. window.api only (§1.3);
// keyboard-operable under pressure (§5.4): Enter resolves, ↑/↓/Enter pick a book.

type Props = {
  /** The book list (loaded by the parent once and shared across modes). */
  books: BibleBook[];
  /** Report the resolved passage so the parent can stage it. */
  onResolve: (verses: BibleVerse[]) => void;
};

export default function ReferenceMode({ books, onResolve }: Props) {
  const [query, setQuery] = useState('John 3:16');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  // True once the operator has arrowed into the suggestion list; only then does
  // Enter pick a book. Otherwise Enter resolves the typed reference (so a
  // complete "John 3:16" looks up directly without the dropdown stealing Enter).
  const [navigating, setNavigating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The leading word of the query drives the book autocomplete suggestions.
  const bookFragment = useMemo(() => query.trim().split(/[\s\d:]/)[0] ?? '', [query]);
  const suggestions = useMemo(() => {
    const frag = bookFragment.toLowerCase();
    if (frag.length < 2) return [];
    return books
      .filter(
        (b) =>
          b.name.toLowerCase().startsWith(frag) || b.abbreviation.toLowerCase().startsWith(frag),
      )
      .slice(0, 6);
  }, [books, bookFragment]);

  useEffect(() => {
    setHighlight(0);
    setNavigating(false);
  }, [bookFragment]);

  const resolve = async (raw: string) => {
    setError(null);
    setOpen(false);
    const q = raw.trim();
    if (!q) return;
    const res = await window.api.scripture.lookupReference(q);
    if (res.ok) {
      if (res.data.length === 0) {
        setError(`No match for "${q}"`);
        onResolve([]);
      } else {
        onResolve(res.data);
      }
    } else {
      setError(res.error);
    }
  };

  // Picking a book replaces the leading book fragment, keeping any chapter:verse.
  const pickBook = (b: BibleBook) => {
    const rest = query.replace(/^\s*[^\d:]+/, '').trimStart();
    setQuery(rest ? `${b.name} ${rest}` : `${b.name} `);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && suggestions.length > 0) {
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
      // Enter picks a book only while actively navigating the list; otherwise it
      // falls through to resolve the typed reference.
      if (e.key === 'Enter' && navigating) {
        e.preventDefault();
        pickBook(suggestions[highlight]);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
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
          onKeyDown={onKeyDown}
        />

        {open && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-pp-border-soft bg-pp-surface-1 shadow-lg">
            <p className="border-b border-pp-border-soft px-3 py-1.5 text-[11px] text-pp-text-muted">
              Books matching “{bookFragment}”
            </p>
            <ul role="listbox" aria-label="Book suggestions">
              {suggestions.map((b, i) => (
                <li key={b.number} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pickBook(b)}
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
        Type a reference and press{' '}
        <kbd className="rounded border border-pp-border-soft bg-pp-surface-2 px-1 font-mono text-[10px]">
          Enter
        </kbd>{' '}
        to look it up. Use{' '}
        <kbd className="rounded border border-pp-border-soft bg-pp-surface-2 px-1 font-mono text-[10px]">
          ↑
        </kbd>{' '}
        <kbd className="rounded border border-pp-border-soft bg-pp-surface-2 px-1 font-mono text-[10px]">
          ↓
        </kbd>{' '}
        to pick a book.
      </p>

      {error && <p className="text-sm text-pp-error">{error}</p>}
    </div>
  );
}
