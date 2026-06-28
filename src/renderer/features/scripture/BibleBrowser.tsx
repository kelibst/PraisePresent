import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import type { BibleBook, BibleVerse } from '@/shared/schemas/scripture';

// Bible browser: book → chapter → verses, fully offline against the bundled WEB.
// Opening Scripture lands here (not a blank page). Each verse is selectable to
// present to the audience (reuses the D2 deck via window.api.present). All data
// comes from window.api.scripture.* — no electron/node in the renderer (§5.2).

function verseDeck(verses: BibleVerse[]) {
  return verses.map((v) => ({
    id: `${v.bookNumber}-${v.chapter}-${v.verse}`,
    lines: [v.text],
    reference: `${v.bookName} ${v.chapter}:${v.verse}`,
  }));
}

export default function BibleBrowser() {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [book, setBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load the book list once; default the view to John (a common worship landing).
  useEffect(() => {
    void (async () => {
      const res = await window.api.scripture.listBooks();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setBooks(res.data);
    })();
  }, []);

  const loadChapter = useCallback(async (b: BibleBook, ch: number) => {
    setError(null);
    setBook(b);
    setChapter(ch);
    const res = await window.api.scripture.getChapter(b.number, ch);
    if (res.ok) setVerses(res.data);
    else setError(res.error);
  }, []);

  // Default to John 1 once books arrive (only if nothing is selected yet).
  useEffect(() => {
    if (books.length === 0 || book) return;
    const john = books.find((b) => b.name === 'John') ?? books[0];
    void loadChapter(john, 1);
  }, [books, book, loadChapter]);

  const { ot, nt } = useMemo(
    () => ({
      ot: books.filter((b) => b.testament === 'OT'),
      nt: books.filter((b) => b.testament === 'NT'),
    }),
    [books],
  );

  const presentFrom = (startIndex: number) =>
    void window.api.present.setDeck(verseDeck(verses), startIndex);

  const chapters = book ? Array.from({ length: book.chapterCount }, (_, i) => i + 1) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      {/* Book picker — OT/NT grouped, scrollable. */}
      <nav aria-label="Books" className="rounded-lg border bg-card p-3">
        <BookGroup
          title="Old Testament"
          books={ot}
          current={book}
          onPick={(b) => loadChapter(b, 1)}
        />
        <BookGroup
          title="New Testament"
          books={nt}
          current={book}
          onPick={(b) => loadChapter(b, 1)}
        />
      </nav>

      <div className="flex min-h-[60vh] flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Chapter picker for the selected book. */}
        {book && (
          <div className="rounded-lg border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {book.name} — chapter
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {chapters.map((ch) => (
                <button
                  key={ch}
                  onClick={() => loadChapter(book, ch)}
                  aria-current={ch === chapter}
                  className={`h-9 w-9 rounded text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                    ch === chapter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Verses for the current chapter. */}
        {book && chapter && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {book.name} {chapter}
              </h2>
              {verses.length > 0 && (
                <button
                  onClick={() => presentFrom(0)}
                  className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Present chapter
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-1.5">
              {verses.map((v, i) => (
                <li key={v.verse}>
                  <button
                    onClick={() => presentFrom(i)}
                    className="group flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition hover:border-border hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                    title="Present this verse"
                  >
                    <span className="mt-0.5 w-6 shrink-0 text-right text-sm font-semibold text-primary">
                      {v.verse}
                    </span>
                    <span className="text-foreground">{v.text}</span>
                    <FiChevronRight
                      className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function BookGroup({
  title,
  books,
  current,
  onPick,
}: {
  title: string;
  books: BibleBook[];
  current: BibleBook | null;
  onPick: (b: BibleBook) => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-col">
        {books.map((b) => (
          <li key={b.number}>
            <button
              onClick={() => onPick(b)}
              aria-current={current?.number === b.number}
              className={`w-full rounded px-2 py-1.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                current?.number === b.number
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              {b.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
