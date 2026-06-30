import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/renderer/lib/utils';
import type { BibleBook, BibleVerse } from '@/shared/schemas/scripture';

// Card-picker mode (folds the old BibleBrowser, CLAUDE.md §1.9): three columns —
// Book (2-col grid) → Chapter (4-col grid) → Verse (4-col grid). Picking a verse
// loads the whole chapter and reports the chapter + lead index up to the parent,
// which stages it (one scripture UI, no second present path). All data comes from
// window.api.scripture (§1.3); no electron/node in the renderer.

type Props = {
  /** Report a picked passage (the whole chapter) + the lead verse index. */
  onPick: (verses: BibleVerse[], index: number) => void;
  /** The verse number currently staged from this chapter, if any. */
  activeVerse: number | null;
};

export default function CardPickerMode({ onPick, activeVerse }: Props) {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [book, setBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await window.api.scripture.listBooks();
      if (res.ok) setBooks(res.data);
      else setError(res.error);
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

  // Land on John 1 (a common worship starting point) so the pane is never blank.
  useEffect(() => {
    if (books.length === 0 || book) return;
    const john = books.find((b) => b.name === 'John') ?? books[0];
    void loadChapter(john, 1);
  }, [books, book, loadChapter]);

  const chapters = useMemo(
    () => (book ? Array.from({ length: book.chapterCount }, (_, i) => i + 1) : []),
    [book],
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1.4fr_1fr_1fr] gap-3 overflow-hidden">
      {/* Books — 2-col grid, scrollable. */}
      <PickerColumn label="Book">
        <div className="grid grid-cols-2 gap-1">
          {books.map((b) => (
            <PickButton
              key={b.number}
              active={book?.number === b.number}
              onClick={() => void loadChapter(b, 1)}
            >
              {b.name}
            </PickButton>
          ))}
        </div>
      </PickerColumn>

      {/* Chapters — 4-col grid. */}
      <PickerColumn label={book ? `${book.name} · chapter` : 'Chapter'}>
        <div className="grid grid-cols-4 gap-1">
          {chapters.map((ch) => (
            <PickButton
              key={ch}
              active={ch === chapter}
              onClick={() => book && void loadChapter(book, ch)}
            >
              {ch}
            </PickButton>
          ))}
        </div>
      </PickerColumn>

      {/* Verses — 4-col grid; picking stages the chapter at that verse. */}
      <PickerColumn label="Verse">
        {error ? (
          <p className="px-1 text-sm text-pp-error">{error}</p>
        ) : (
          <div className="grid grid-cols-4 gap-1">
            {verses.map((v, i) => (
              <PickButton
                key={v.verse}
                active={v.verse === activeVerse}
                onClick={() => onPick(verses, i)}
                title={v.text}
              >
                {v.verse}
              </PickButton>
            ))}
          </div>
        )}
      </PickerColumn>
    </div>
  );
}

function PickerColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col rounded-md border border-pp-border-soft bg-pp-surface-1">
      <div className="shrink-0 border-b border-pp-border-soft px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-pp-text-label">
        {label}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">{children}</div>
    </div>
  );
}

function PickButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-current={active}
      className={cn(
        'truncate rounded px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        active
          ? 'bg-pp-accent/15 font-medium text-pp-accent ring-1 ring-pp-accent/40'
          : 'text-pp-text-body hover:bg-pp-surface-2',
      )}
    >
      {children}
    </button>
  );
}
