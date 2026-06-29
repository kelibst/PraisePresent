import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import type { PresentSlide, PresentState, TransitionType } from '@/shared/schemas/present';
import { DeckStripThumb, SlidePreview } from '@/renderer/components/common';
import { cn } from '@/renderer/lib/utils';
import SlideTextEditor from './SlideTextEditor';
import TransportButton from './TransportButton';

// The right pane of the unified Present screen: the live-output cockpit, laid out
// as a SINGLE vertical column to match the design (PraisePresent.dc.html lines
// 482–548): header → ON SCREEN NOW preview → horizontal Live Deck strip → NEXT →
// transport footer. It is a VIEW of main's live state (§5.4) — it does NOT
// subscribe to present.onState itself (the parent's single usePresentDeck owns the
// one subscription). Operated LIVE UNDER PRESSURE, so keyboard paths are
// first-class (§5.4). Tokens/atoms only (§5.6).

const TRANSITIONS: { type: TransitionType; label: string }[] = [
  { type: 'cut', label: 'Cut' },
  { type: 'fade', label: 'Fade' },
  { type: 'dissolve', label: 'Dissolve' },
];

// Output target line. Static today (single audience window at 1080p); the
// transition portion is live from state so the operator sees the active mode.
const DISPLAY_STATUS = 'Display 2 · 1080p';

// A compact passage label for the deck sub-header, e.g. "John 3:16–18" when only
// the trailing verse differs, else "first – last", else "". Pure + defensive.
// Exported for unit testing the verse-range collapse.
export function deckPassageLabel(deck: PresentSlide[]): string {
  const refs = deck.map((s) => s.reference).filter((r): r is string => !!r);
  if (refs.length === 0) return '';
  const first = refs[0];
  const last = refs[refs.length - 1];
  if (first === last) return first;
  const tail = last.match(/(\d+)\s*$/);
  if (tail) {
    const lastHead = last.slice(0, tail.index).trim();
    const firstHead = first.replace(/(\d+)\s*$/, '').trim();
    if (lastHead === firstHead) return `${first}–${tail[1]}`;
  }
  return `${first} – ${last}`;
}

type Props = {
  state: PresentState;
  onNext: () => void;
  onPrev: () => void;
  onGoto: (index: number) => void;
  onBlack: () => void;
  onBlank: () => void;
  onClear: () => void;
  onSetTransition: (type: TransitionType) => void;
  /** Apply edited text to the current live slide (main rejects locked slides). */
  onUpdateText: (lines: string[]) => void;
};

export default function LiveCockpit({
  state,
  onNext,
  onPrev,
  onGoto,
  onBlack,
  onBlank,
  onClear,
  onSetTransition,
  onUpdateText,
}: Props) {
  // Keyboard live controls (§5.4). Bound while the cockpit is mounted; ignored
  // only while the operator is typing into a TEXT field so we never hijack text
  // entry. Non-text controls (checkbox/color/button — e.g. the Background editor)
  // must NOT block transport: the operator keeps driving the show with the arrow
  // keys right after toggling them (this app is run live under pressure).
  useEffect(() => {
    const TEXT_INPUT_TYPES = new Set([
      'text',
      'search',
      'email',
      'url',
      'tel',
      'password',
      'number',
    ]);
    const isTextEntry = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      if (el.isContentEditable || el.tagName === 'TEXTAREA') return true;
      if (el.tagName !== 'INPUT') return false;
      // A bare <input> defaults to type=text; only text-entry types swallow keys.
      const type = (el as HTMLInputElement).type || 'text';
      return TEXT_INPUT_TYPES.has(type);
    };
    const onKey = (e: KeyboardEvent) => {
      if (isTextEntry(e.target as HTMLElement | null)) {
        return;
      }
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'b':
        case 'B':
          onBlack();
          break;
        case '.':
        case 'Escape':
          onClear();
          break;
        case 'Home':
          e.preventDefault();
          onGoto(0);
          break;
        case 'End':
          e.preventDefault();
          // Let main clamp to the real last index (main is the source of truth).
          onGoto(Number.MAX_SAFE_INTEGER);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onPrev, onBlack, onClear, onGoto]);

  const isLive = state.mode === 'slide' && state.deck.length > 0;
  const current = isLive ? (state.deck[state.index] ?? null) : null;
  const next = state.deck[state.index + 1] ?? null;
  const locked = current?.locked === true;

  const activeTransitionLabel =
    TRANSITIONS.find((t) => t.type === state.transition.type)?.label ?? 'Fade';

  const passage = deckPassageLabel(state.deck);
  const deckMeta =
    state.deck.length === 0
      ? 'No deck'
      : `${passage ? `${passage} · ` : ''}${state.deck.length} slide${state.deck.length === 1 ? '' : 's'}`;

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-pp-surface-live text-pp-text-body">
      {/* Heading kept for accessibility + e2e (role=heading "Presentation"). */}
      <h1 className="sr-only">Presentation</h1>

      {/* ── Header: Live Output + live status line ───────────────────────── */}
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-pp-border-soft px-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-pp-text-muted">
          Live Output
        </span>
        <span className="text-[11px] text-pp-text-dim" aria-live="polite">
          {DISPLAY_STATUS} · {activeTransitionLabel}
        </span>
      </header>

      {/* ── Scroll body: on-screen-now / deck strip / next ───────────────── */}
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        {/* ON SCREEN NOW */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pp-accent-light">
              On screen now
            </span>
            {locked && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-pp-border-strong bg-pp-surface-1 px-2.5 py-1 text-[11px] font-semibold text-pp-text-dim">
                <Lock className="size-3" aria-hidden /> Edit locked
              </span>
            )}
          </div>
          <SlidePreview
            variant="lg"
            active={isLive}
            lines={current?.lines}
            reference={current?.reference}
            media={current?.media}
            background={current?.background}
            badge={locked ? { label: 'Scripture · read-only', tone: 'neutral' } : undefined}
          />
          {/* Editable slides (songs/custom) get the inline text editor; for a
              locked scripture slide SlideTextEditor renders nothing — the "Edit
              locked" pill above is the sole lock indicator (§5.4). */}
          {current && <SlideTextEditor slide={current} onSave={onUpdateText} />}
        </div>

        {/* LIVE DECK — horizontal thumbnail strip */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pp-text-dim">
              Live deck
            </span>
            <span className="text-[11px] tabular-nums text-pp-text-dim">{deckMeta}</span>
          </div>
          {state.deck.length === 0 ? (
            <p className="rounded-md border border-dashed border-pp-border-strong/60 px-3 py-4 text-center text-xs text-pp-text-muted">
              No deck loaded. Present a song or scripture passage to build one.
            </p>
          ) : (
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              role="group"
              aria-label="Live deck slides"
            >
              {state.deck.map((slide, i) => {
                const live = isLive && i === state.index;
                return (
                  <DeckStripThumb
                    key={slide.id}
                    firstLine={slide.lines[0] ?? ''}
                    reference={slide.reference}
                    live={live}
                    selected={!isLive && i === state.index}
                    onClick={() => onGoto(i)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* NEXT → */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-pp-text-dim">
            Next →
          </span>
          <div className="w-[62%]">
            <SlidePreview
              variant="sm"
              lines={next?.lines}
              reference={next?.reference}
              media={next?.media}
              background={next?.background}
            />
          </div>
        </div>
      </div>

      {/* ── Transport footer ─────────────────────────────────────────────── */}
      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-pp-border-soft bg-pp-surface-2 px-4 py-3">
        <TransportButton label="◀ Prev" onClick={onPrev} tone="secondary" />
        <TransportButton label="Next ▶" kbd="Space" onClick={onNext} tone="primary" grow />
        <TransportButton label="Black" kbd="B" onClick={onBlack} tone="secondary" />
        <TransportButton label="Blank" onClick={onBlank} tone="secondary" />
        <TransportButton label="Clear" kbd="Esc" onClick={onClear} tone="secondary" />

        {/* Transition selector — wired to the present transition param. */}
        <div
          className="ml-auto inline-flex rounded-md bg-pp-surface-1 p-[3px] ring-1 ring-inset ring-pp-border-strong/60"
          role="group"
          aria-label="Transition"
        >
          {TRANSITIONS.map((t) => {
            const selected = state.transition.type === t.type;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => onSetTransition(t.type)}
                aria-pressed={selected}
                className={cn(
                  'rounded px-3 py-1.5 text-xs font-semibold transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  selected
                    ? 'bg-pp-accent/20 text-pp-accent-light'
                    : 'text-pp-text-muted hover:text-pp-text-body',
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </footer>
    </section>
  );
}
