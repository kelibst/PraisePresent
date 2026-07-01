import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/renderer/lib/utils';
import type { BibleBook, BibleVerse } from '@/shared/schemas/scripture';
import { findExactBook, isExactBook, matchBooks, nearestBook } from './bookMatch';
import { parseVerseRange, type VerseRange } from './scriptureDeck';

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
  /**
   * The currently staged passage as a reference draft, so the field reflects it
   * on (re)mount — switching mode tabs and coming back keeps the reference the
   * operator was on rather than resetting to the default. `null` → nothing staged
   * yet, so seed (and resolve) the Genesis 1:1 default.
   */
  initial: { book: string; chapter: string; verse: string } | null;
  /** Report the resolved passage so the parent can stage it. */
  onResolve: (verses: BibleVerse[]) => void;
};

export default function ReferenceMode({ books, abbr, initial, onResolve }: Props) {
  // Seed the zones from the staged passage (if any) so the field is consistent
  // across the mode tabs; only read at mount (a later staged change while this is
  // mounted comes from the field itself, so it must not reset the inputs).
  const seed = initial ?? DEFAULT;
  const [book, setBook] = useState(seed.book);
  const [chapter, setChapter] = useState(seed.chapter);
  const [verse, setVerse] = useState(seed.verse);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  // The whole chapter for the current book+chapter (the EasyWorship results list),
  // and which verse(s) the reference currently selects within it (highlighted).
  const [chapterVerses, setChapterVerses] = useState<BibleVerse[]>([]);
  const [selected, setSelected] = useState<VerseRange | null>(() => parseVerseRange(seed.verse));

  const bookRef = useRef<HTMLInputElement>(null);
  const chapterRef = useRef<HTMLInputElement>(null);
  const verseRef = useRef<HTMLInputElement>(null);
  const leadRowRef = useRef<HTMLButtonElement>(null);
  const reqId = useRef(0);
  const lastValid = useRef({ ...seed });
  // True while focus is being moved programmatically (focusSeg), so the
  // select-on-focus handlers know NOT to re-select and clobber the caret/selection
  // focusSeg just set (e.g. Backspace-to-previous wants the caret at the end).
  const programmatic = useRef(false);

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
    // onFocus fires synchronously inside el.focus(); flag it so the zone's
    // select-on-focus is suppressed and our explicit selection below wins. The
    // finally guarantees the flag never leaks `true` (which would permanently
    // disable select-on-focus) if a DOM call ever throws.
    programmatic.current = true;
    try {
      el.focus();
      if (select) el.select();
      else {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    } finally {
      programmatic.current = false;
    }
  }, []);

  // Select a zone's text when the operator focuses it themselves (click/Tab) so
  // typing replaces the segment — the field is never empty, so without this you'd
  // append to the existing book ("Genesis"+"p" → "pGenesis") and match nothing.
  // Suppressed during programmatic focus moves (focusSeg owns the caret there).
  const selectOnFocus = (el: HTMLInputElement | null) => {
    if (el && !programmatic.current) el.select();
  };

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
        setSelected({
          from: res.data[0].verse,
          to: res.data[res.data.length - 1].verse,
        });
        onResolve(res.data);
        return;
      }
      if (!opts.quiet) setHint(`No verses for “${q}” — check the chapter and verse.`);
    },
    [onResolve],
  );

  // On first mount with nothing staged, resolve the default so the pane is never
  // blank. If a passage is already staged, the seeded zones reflect it and it is
  // already on screen — re-resolving would just re-stage it and reset the lead
  // index, so skip it.
  useEffect(() => {
    if (!initial) void resolve(DEFAULT.book, DEFAULT.chapter, DEFAULT.verse, { quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live resolution: only once the book zone holds a real book (so
  // mid-typing "jo" never resolves Joel before the operator picks). A verse zone
  // ending in "-" is an incomplete range ("16-") — wait for the end verse rather
  // than resolve it and flash a spurious "No verses" hint. When the zones still
  // equal the staged seed (just (re)mounted, untouched), the passage is already
  // on screen — skip, so returning to this tab doesn't re-stage / reset the lead.
  useEffect(() => {
    if (!isExactBook(books, book) || !chapter.trim()) return;
    if (/-$/.test(verse.trim())) return;
    if (
      initial &&
      book === initial.book &&
      chapter === initial.chapter &&
      verse === initial.verse
    ) {
      return;
    }
    const t = setTimeout(() => void resolve(book, chapter, verse), 160);
    return () => clearTimeout(t);
  }, [book, chapter, verse, books, resolve, initial]);

  // Load the WHOLE chapter for the current book+chapter — the EasyWorship results
  // list the operator browses. Re-runs on book/chapter change and on translation
  // switch (abbr), since getChapter resolves the active translation in main.
  useEffect(() => {
    const b = findExactBook(books, book);
    const ch = Number(chapter);
    if (!b || !Number.isInteger(ch) || ch < 1 || ch > b.chapterCount) return;
    let cancelled = false;
    void window.api.scripture.getChapter(b.number, ch).then((res) => {
      if (!cancelled && res.ok) setChapterVerses(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [books, book, chapter, abbr]);

  // Keep the selected (lead) verse scrolled into view as the reference changes.
  useEffect(() => {
    leadRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selected?.from, chapterVerses]);

  // Stage a single verse picked from the chapter list (and reflect it in the
  // field), so clicking a verse behaves like typing its reference. Updating
  // lastValid keeps the never-empty blur-restore pointing at the picked verse;
  // the debounced live-resolve then no-ops (zones already equal what's staged).
  const pickVerse = (v: BibleVerse) => {
    setVerse(String(v.verse));
    setSelected({ from: v.verse, to: v.verse });
    lastValid.current = { book: v.bookName, chapter: String(v.chapter), verse: String(v.verse) };
    onResolve([v]);
  };

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
          programmatic.current = true;
          try {
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
          } finally {
            programmatic.current = false;
          }
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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
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
            onFocus={(e) => {
              setOpen(true);
              selectOnFocus(e.currentTarget);
            }}
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
            onFocus={(e) => selectOnFocus(e.currentTarget)}
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
            onFocus={(e) => selectOnFocus(e.currentTarget)}
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

      <p className="shrink-0 text-xs text-pp-text-muted">
        Type a book, then{' '}
        <kbd className="rounded border border-pp-border-soft bg-pp-surface-2 px-1 font-mono text-[10px]">
          Space
        </kbd>{' '}
        for the chapter and verse — e.g. John 3 16. The field always keeps a valid reference.
      </p>

      {hint && <p className="shrink-0 text-sm text-pp-text-muted">{hint}</p>}

      {/* The whole chapter — the EasyWorship results list. The reference's verse(s)
          are highlighted; clicking a row stages that verse. Fills the pane. */}
      {chapterVerses.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-pp-border-soft bg-pp-surface-1">
          <div className="flex shrink-0 items-center justify-between border-b border-pp-border-soft px-2.5 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-pp-text-label">
              {chapterVerses[0].bookName} {chapterVerses[0].chapter}
            </span>
            <span className="text-[11px] text-pp-text-dim">
              {chapterVerses.length} verses · click to stage
            </span>
          </div>
          <ul aria-label="Chapter verses" className="min-h-0 flex-1 overflow-y-auto p-1">
            {chapterVerses.map((v) => {
              const isSel = selected ? v.verse >= selected.from && v.verse <= selected.to : false;
              const isLead = selected ? v.verse === selected.from : false;
              return (
                <li key={v.verse}>
                  <button
                    type="button"
                    ref={isLead ? leadRowRef : undefined}
                    onClick={() => pickVerse(v)}
                    aria-current={isSel || undefined}
                    className={cn(
                      'flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
                      isSel
                        ? 'bg-pp-accent/10'
                        : 'hover:bg-pp-surface-2 focus-visible:bg-pp-surface-2',
                      isLead && 'ring-1 ring-inset ring-pp-accent/40',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 w-6 shrink-0 text-right text-xs font-semibold',
                        isSel ? 'text-pp-accent' : 'text-pp-text-dim',
                      )}
                    >
                      {v.verse}
                    </span>
                    <span className="min-w-0 flex-1 text-pp-text-body">{v.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
