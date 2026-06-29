import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/renderer/lib/utils';
import type { BibleBook, BibleVerse } from '@/shared/schemas/scripture';
import { isExactBook, matchBooks, nearestBook } from './bookMatch';

// Reference mode — the EasyWorship-style reference field, rendered as ONE
// segmented control the operator types straight into: three chips
// [ Book ] › [ Chapter ] : [ Verse ]. Book autocompletes (nearest J book on "j",
// "John" on "joh") with a dropdown; Space completes the book and advances to the
// chapter, Space/":" advances to the verse, Backspace at a segment start walks
// back. Inline ranges live in the verse zone ("16-18" → John 3:16-18). The field
// is NEVER blank (defaults to Genesis 1:1; clearing a zone restores the last
// valid reference on blur) and resolves live — no Enter required. There is only
// one control, not a read-only display plus a hidden box (§1.9). window.api only
// (§1.3); fully keyboard-operable under pressure (§5.4).

const DEFAULT = { book: 'Genesis', chapter: '1', verse: '1' };

// Stable ids wiring the Book input to its autocomplete listbox for assistive tech
// (role="combobox" + aria-activedescendant). One reference field is on screen at a
// time, so module-level constants are safe.
const LISTBOX_ID = 'reference-book-listbox';
const optionId = (i: number) => `reference-book-option-${i}`;

type Segment = 'book' | 'chapter' | 'verse';

type Props = {
  /** The book list (loaded by the parent once and shared across modes). */
  books: BibleBook[];
  /** The active translation abbreviation, shown as the trailing chip. */
  abbr: string;
  /** Report the resolved passage so the parent can stage it. */
  onResolve: (verses: BibleVerse[]) => void;
};

export default function ReferenceMode({ books, abbr, onResolve }: Props) {
  const [book, setBook] = useState(DEFAULT.book);
  const [chapter, setChapter] = useState(DEFAULT.chapter);
  const [verse, setVerse] = useState(DEFAULT.verse);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  const bookRef = useRef<HTMLInputElement>(null);
  const chapterRef = useRef<HTMLInputElement>(null);
  const verseRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);
  const lastValid = useRef({ ...DEFAULT });

  const suggestions = useMemo(() => matchBooks(books, book).slice(0, 7), [books, book]);
  // Hide the dropdown once the book zone holds an exact book (nothing to pick).
  const showList = open && suggestions.length > 0 && !isExactBook(books, book);

  // Re-arm the highlight on the nearest match whenever the fragment changes.
  useEffect(() => {
    setHighlight(0);
  }, [book]);

  // Move focus to a segment. Advancing forward (Space/commit) selects the zone so
  // the next keystroke overtypes the old value — the EasyWorship feel where you
  // just keep typing book→chapter→verse. Going back (Backspace) puts the caret at
  // the end so the operator can edit in place.
  const focusSeg = useCallback((seg: Segment, select = false) => {
    const el =
      seg === 'book' ? bookRef.current : seg === 'chapter' ? chapterRef.current : verseRef.current;
    if (!el) return;
    el.focus();
    if (select) el.select();
    else {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, []);

  // Resolve {book, chapter, verse} → stage it. Stale (superseded) responses are
  // ignored so fast typing always reflects the latest. `quiet` suppresses the
  // not-found hint (used for the initial default resolve).
  const resolve = useCallback(
    async (b: string, c: string, v: string, opts: { quiet?: boolean } = {}) => {
      const bookName = b.trim();
      const ch = c.trim();
      if (!bookName || !ch) return;
      const tail = v.trim();
      const q = tail ? `${bookName} ${ch}:${tail}` : `${bookName} ${ch}`;
      const id = ++reqId.current;
      const res = await window.api.scripture.lookupReference(q);
      if (id !== reqId.current) return; // a newer keystroke superseded this one
      if (!res.ok) {
        setHint(res.error);
        return;
      }
      if (res.data.length > 0) {
        lastValid.current = { book: bookName, chapter: ch, verse: tail };
        setHint(null);
        onResolve(res.data);
        return;
      }
      if (!opts.quiet) setHint(`No verses for “${q}” — check the chapter and verse.`);
    },
    [onResolve],
  );

  // Resolve the default on mount so the pane is never blank (never-empty rule).
  useEffect(() => {
    void resolve(DEFAULT.book, DEFAULT.chapter, DEFAULT.verse, { quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live resolution: only once the book zone holds a real book (so
  // mid-typing "jo" never resolves Joel before the operator picks). A verse zone
  // ending in "-" is an incomplete range ("16-") — wait for the end verse rather
  // than resolve it and flash a spurious "No verses" hint.
  useEffect(() => {
    if (!isExactBook(books, book) || !chapter.trim()) return;
    if (/-$/.test(verse.trim())) return;
    const t = setTimeout(() => void resolve(book, chapter, verse), 160);
    return () => clearTimeout(t);
  }, [book, chapter, verse, books, resolve]);

  // Commit a chosen/nearest book to its canonical name, then (default) advance.
  const commitBook = useCallback(
    (b: BibleBook, advance = true) => {
      setBook(b.name);
      setOpen(false);
      if (advance) focusSeg('chapter', true);
    },
    [focusSeg],
  );

  const onBookKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => (h + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        commitBook(suggestions[highlight] ?? suggestions[0]);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
    }
    // Space completes the nearest book and advances — unless the fragment is just
    // a leading numeral ("1", "2"), which belongs to a numbered book ("1 John"):
    // then let the space through so the operator can keep typing the name.
    if (e.key === ' ') {
      if (/^\s*\d\s*$/.test(book)) return;
      const near = suggestions[highlight] ?? suggestions[0] ?? nearestBook(books, book);
      e.preventDefault();
      if (near) commitBook(near);
      return;
    }
    // A digit typed after an alphabetic fragment means the operator is moving on
    // to the chapter: commit the nearest book and seed the chapter with the digit.
    if (/^\d$/.test(e.key) && /[a-z]/i.test(book)) {
      const near = suggestions[highlight] ?? suggestions[0] ?? nearestBook(books, book);
      if (near) {
        e.preventDefault();
        setBook(near.name);
        setChapter(e.key);
        setOpen(false);
        // Focus the chapter after the seeded digit commits, caret at the end so
        // the next digit appends (not selected — else multi-digit chapters like
        // "23" typed straight from the book would overtype to "3").
        requestAnimationFrame(() => {
          const el = chapterRef.current;
          if (!el) return;
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        });
      }
    }
  };

  const onChapterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === ':') {
      e.preventDefault();
      focusSeg('verse', true);
      return;
    }
    if (e.key === 'Backspace' && chapter === '') {
      e.preventDefault();
      focusSeg('book');
    }
  };

  const onVerseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && verse === '') {
      e.preventDefault();
      focusSeg('chapter');
    }
  };

  // Never-empty guarantees on blur: a cleared zone snaps back to the last valid
  // reference; an incomplete book commits to its nearest match.
  const onBookBlur = () => {
    setOpen(false);
    if (!book.trim()) {
      setBook(lastValid.current.book);
      return;
    }
    if (!isExactBook(books, book)) {
      const near = nearestBook(books, book);
      if (near) setBook(near.name);
      else setBook(lastValid.current.book);
    }
  };
  const onChapterBlur = () => {
    if (!chapter.trim()) setChapter(lastValid.current.chapter);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {/* The segmented field: Book › Chapter : Verse, plus the translation chip. */}
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-[11px] border px-2 py-1.5 transition-shadow',
            'border-pp-accent/40 bg-pp-surface-alt focus-within:shadow-[0_0_0_3px_hsl(var(--pp-accent)/0.18)]',
          )}
        >
          <input
            ref={bookRef}
            aria-label="Book"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showList}
            aria-controls={LISTBOX_ID}
            aria-activedescendant={showList ? optionId(highlight) : undefined}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-lg bg-pp-accent/15 px-2.5 py-1 text-base font-semibold leading-none text-pp-accent-light outline-none placeholder:font-normal placeholder:text-pp-text-dim"
            placeholder="Book"
            value={book}
            onChange={(e) => {
              setBook(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={onBookBlur}
            onKeyDown={onBookKeyDown}
          />
          <span className="shrink-0 text-base text-pp-text-dim" aria-hidden>
            ›
          </span>
          <input
            ref={chapterRef}
            aria-label="Chapter"
            inputMode="numeric"
            autoComplete="off"
            className="w-14 shrink-0 rounded-lg bg-pp-surface-2 px-2 py-1 text-center text-base font-semibold leading-none text-pp-text-body outline-none focus:bg-pp-surface-1"
            placeholder="Ch"
            value={chapter}
            onChange={(e) => setChapter(e.target.value.replace(/\D/g, ''))}
            onKeyDown={onChapterKeyDown}
            onBlur={onChapterBlur}
          />
          <span className="shrink-0 text-base text-pp-text-dim" aria-hidden>
            :
          </span>
          <input
            ref={verseRef}
            aria-label="Verse"
            inputMode="numeric"
            autoComplete="off"
            className="w-20 shrink-0 rounded-lg bg-pp-surface-2 px-2 py-1 text-center text-base font-semibold leading-none text-pp-text-body outline-none focus:bg-pp-surface-1"
            placeholder="Vs"
            value={verse}
            onChange={(e) => setVerse(e.target.value.replace(/[^\d-]/g, ''))}
            onKeyDown={onVerseKeyDown}
          />
          <span className="shrink-0 rounded-lg border border-pp-border-strong bg-pp-surface-1 px-2.5 py-1 text-xs font-semibold text-pp-text-muted">
            {abbr}
          </span>
        </div>

        {showList && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-pp-border-soft bg-pp-surface-1 shadow-lg">
            <p className="border-b border-pp-border-soft px-3 py-1.5 text-[11px] text-pp-text-muted">
              Books matching “{book.trim()}”
            </p>
            <ul id={LISTBOX_ID} role="listbox" aria-label="Book suggestions">
              {suggestions.map((b, i) => (
                <li key={b.number} id={optionId(i)} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => commitBook(b)}
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
