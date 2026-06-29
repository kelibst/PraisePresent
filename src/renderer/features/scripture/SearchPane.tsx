import { useCallback, useEffect, useState } from 'react';
import { Grid3x3, Search, Type } from 'lucide-react';
import { cn } from '@/renderer/lib/utils';
import { DEFAULT_TRANSLATION_KEY } from '@/shared/schemas/scripture';
import type { BibleBook, BibleTranslation, BibleVerse } from '@/shared/schemas/scripture';
import { referenceLabel, rangeLabel, verseId } from './scriptureDeck';
import type { StagedPassage } from '@/renderer/features/present/usePresentDeck';
import ReferenceMode from './ReferenceMode';
import CardPickerMode from './CardPickerMode';
import KeywordMode from './KeywordMode';

// Pane 1 of the Scripture workspace: mode toggle (reference / card-picker /
// keyword), a segmented reference display + translation dropdown, the active
// mode body, and the result rows for the current passage. Folds the old
// Search + Browse tabs into one UI (CLAUDE.md §1.9). Lifts the loaded passage up
// via onStage; it does not own present state. window.api only (§1.3).

type Mode = 'reference' | 'picker' | 'keyword';

const MODES: { id: Mode; label: string; icon: typeof Search }[] = [
  { id: 'reference', label: 'Reference', icon: Type },
  { id: 'picker', label: 'Card picker', icon: Grid3x3 },
  { id: 'keyword', label: 'Keyword', icon: Search },
];

type Props = {
  staged: StagedPassage | null;
  onStage: (verses: BibleVerse[], index: number) => void;
  onStageIndex: (index: number) => void;
  onSendLive: () => void;
};

export default function SearchPane({ staged, onStage, onStageIndex, onSendLive }: Props) {
  const [mode, setMode] = useState<Mode>('reference');
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [translation, setTranslation] = useState<BibleTranslation | null>(null);

  useEffect(() => {
    void (async () => {
      const [bookRes, transRes, defRes] = await Promise.all([
        window.api.scripture.listBooks(),
        window.api.scripture.listTranslations(),
        window.api.settings.get(DEFAULT_TRANSLATION_KEY),
      ]);
      if (bookRes.ok) setBooks(bookRes.data);
      if (transRes.ok) {
        setTranslations(transRes.data);
        // Reflect the persisted default (Settings → Bible), else the first.
        const stored = defRes.ok ? defRes.data : null;
        const active =
          (stored && transRes.data.find((t) => t.abbreviation === stored)) ?? transRes.data[0];
        if (active) setTranslation(active);
      }
    })();
  }, []);

  // Switch the active translation: persist the shared default key, then
  // re-resolve the currently staged passage in the new translation so what's on
  // screen (and headed to Live) updates immediately.
  const changeTranslation = useCallback(
    async (abbreviation: string) => {
      const next = translations.find((t) => t.abbreviation === abbreviation);
      if (!next) return;
      setTranslation(next);
      await window.api.settings.set(DEFAULT_TRANSLATION_KEY, abbreviation);
      if (staged && staged.verses.length > 0) {
        const first = staged.verses[0];
        const last = staged.verses[staged.verses.length - 1];
        const query =
          staged.verses.length > 1
            ? `${first.bookName} ${first.chapter}:${first.verse}-${last.verse}`
            : `${first.bookName} ${first.chapter}:${first.verse}`;
        const res = await window.api.scripture.lookupReference(query);
        if (res.ok && res.data.length > 0) {
          onStage(res.data, Math.min(staged.index, res.data.length - 1));
        }
      }
    },
    [translations, staged, onStage],
  );

  // Stable callback so ReferenceMode's debounced live-resolve isn't re-armed by
  // unrelated parent re-renders (reviewer finding).
  const handleReferenceResolve = useCallback(
    (verses: BibleVerse[]) => onStage(verses, 0),
    [onStage],
  );

  const lead = staged ? staged.verses[staged.index] : null;
  const stagedActiveVerse =
    mode === 'picker' && lead && staged && staged.verses.length > 1 ? lead.verse : null;
  const stagedKeywordId = mode === 'keyword' && lead ? verseId(lead) : null;
  const abbr = translation?.abbreviation ?? 'WEB';

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        {/* Mode toggle + Bible meta (the design's second header row). */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div
            className="inline-flex flex-wrap gap-1 rounded-md bg-pp-surface-2 p-1"
            role="tablist"
            aria-label="Scripture mode"
          >
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={mode === m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                    mode === m.id
                      ? 'bg-pp-accent/20 text-pp-accent-light'
                      : 'text-pp-text-muted hover:text-pp-text-body',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {m.label}
                </button>
              );
            })}
          </div>
          {/* Active translation switcher — persists the shared default key and
              re-resolves the staged passage. One source of truth with Settings
              → Bible (CLAUDE.md §1.9). */}
          <label className="flex items-center gap-1.5 text-[11px] text-pp-text-muted">
            <span className="sr-only">Bible translation</span>
            <select
              aria-label="Bible translation"
              title="Active Bible translation"
              value={abbr}
              onChange={(e) => void changeTranslation(e.target.value)}
              className="rounded-md border border-pp-border-strong bg-pp-surface-1 px-2 py-1 text-[11px] font-semibold text-pp-text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              {translations.length === 0 ? (
                <option value={abbr}>{abbr}</option>
              ) : (
                translations.map((t) => (
                  <option key={t.id} value={t.abbreviation}>
                    {t.abbreviation} · {t.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>

        {/* In Reference mode the editable field IS the segmented display, so the
            read-only strip would just duplicate it (§1.9) — show it only for the
            picker/keyword modes, which have no reference input of their own. */}
        {mode !== 'reference' && (
          <SegmentedReference lead={lead} abbr={abbr} count={staged?.verses.length ?? 0} />
        )}

        {/* Active mode body. */}
        <div className="flex min-h-0 flex-1 flex-col">
          {mode === 'reference' && (
            <ReferenceMode books={books} abbr={abbr} onResolve={handleReferenceResolve} />
          )}
          {mode === 'picker' && <CardPickerMode onPick={onStage} activeVerse={stagedActiveVerse} />}
          {mode === 'keyword' && (
            <KeywordMode onPick={(v) => onStage([v], 0)} activeId={stagedKeywordId} />
          )}
        </div>

        {/* Results: the staged passage's verses, with the lead verse marked. */}
        {staged && staged.verses.length > 0 && (
          <ResultsList staged={staged} onSetLead={onStageIndex} onSendLive={onSendLive} />
        )}
      </div>
    </section>
  );
}

function SegmentedReference({
  lead,
  abbr,
  count,
}: {
  lead: BibleVerse | null;
  abbr: string;
  count: number;
}) {
  const chips: string[] = lead
    ? [lead.bookName, String(lead.chapter), String(lead.verse)]
    : ['Book', 'Ch', 'Vs'];
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-[11px] border px-2.5 py-2 transition-shadow',
        lead
          ? 'border-pp-accent/40 bg-pp-surface-alt shadow-[0_0_0_3px_hsl(var(--pp-accent)/0.18)]'
          : 'border-pp-border-strong bg-pp-surface-alt',
      )}
    >
      {chips.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-base text-pp-text-dim">{i === 1 ? '›' : ':'}</span>}
          <span
            className={cn(
              'rounded-lg px-2.5 py-1 text-base font-semibold leading-none',
              i === 0 && lead
                ? 'bg-pp-accent/20 text-pp-accent-light'
                : lead
                  ? 'bg-pp-surface-2 text-pp-text-body'
                  : 'text-pp-text-dim',
            )}
          >
            {c}
          </span>
        </span>
      ))}
      <span className="ml-auto rounded-lg border border-pp-border-strong bg-pp-surface-1 px-2.5 py-1 text-xs font-semibold text-pp-text-muted">
        {abbr}
      </span>
      {count > 1 && <span className="text-xs text-pp-text-dim">· {count} verses</span>}
    </div>
  );
}

function ResultsList({
  staged,
  onSetLead,
  onSendLive,
}: {
  staged: StagedPassage;
  onSetLead: (index: number) => void;
  onSendLive: () => void;
}) {
  return (
    <div className="flex min-h-0 shrink-0 flex-col gap-1.5 border-t border-pp-border-soft pt-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-pp-text-label">
          {rangeLabel(staged.verses)} · {staged.verses.length} verse
          {staged.verses.length === 1 ? '' : 's'} · one slide each
        </p>
        <span className="flex items-center gap-1 text-xs text-pp-accent">
          <span className="size-1.5 rounded-full bg-pp-accent" aria-hidden /> staged
        </span>
      </div>

      <ul className="flex max-h-44 flex-col gap-1 overflow-y-auto">
        {staged.verses.map((v, i) => {
          const isLead = i === staged.index;
          return (
            <li
              key={verseId(v)}
              className={cn(
                'flex items-start gap-2 rounded-md py-1.5 pr-1.5 transition-colors',
                isLead
                  ? 'border-l-2 border-pp-accent bg-pp-accent/10 pl-2'
                  : 'border-l-2 border-transparent pl-2 hover:bg-pp-surface-2',
              )}
            >
              <span className="mt-0.5 w-5 shrink-0 text-right text-xs font-semibold text-pp-accent">
                {v.verse}
              </span>
              <p className="min-w-0 flex-1 text-sm text-pp-text-body">{v.text}</p>
              <div className="flex shrink-0 gap-1">
                {!isLead && (
                  <button
                    type="button"
                    onClick={() => onSetLead(i)}
                    title={`Stage ${referenceLabel(v)}`}
                    className="rounded px-2 py-0.5 text-xs font-medium text-pp-text-muted transition-colors hover:bg-pp-surface-2 hover:text-pp-text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  >
                    Stage
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSetLead(i);
                    onSendLive();
                  }}
                  title={`Send ${referenceLabel(v)} live`}
                  className="rounded bg-pp-accent/15 px-2 py-0.5 text-xs font-medium text-pp-accent transition-colors hover:bg-pp-accent/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                >
                  Send Live
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
