import { useEffect, useState } from 'react';
import type { PresentState, PresentSlide, TransitionType } from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';

// Presenter live-control surface. It is a VIEW of main's live state (§5.4):
// subscribes to onState, renders the current + next slide, a thumbnail list, a
// transition picker, and live controls — all calling window.api.present.* only.
// Operated LIVE UNDER PRESSURE, so keyboard paths are first-class (§5.4).

const TRANSITIONS: TransitionType[] = ['cut', 'fade', 'dissolve'];

function SlidePreview({
  slide,
  label,
  dim,
}: {
  slide: PresentSlide | null;
  label: string;
  dim?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className="text-sm font-semibold uppercase text-muted-foreground">{label}</span>
      <div
        className={`flex aspect-video items-center justify-center rounded-lg border bg-black p-4 text-center ${
          dim ? 'opacity-50' : ''
        }`}
      >
        {slide ? (
          <div className="flex flex-col items-center gap-2">
            {slide.lines.map((line, i) => (
              <p key={i} className="text-lg font-semibold leading-tight text-white">
                {line}
              </p>
            ))}
            {slide.reference && <p className="text-sm text-white/60">{slide.reference}</p>}
          </div>
        ) : (
          <span className="text-sm text-white/40">—</span>
        )}
      </div>
    </div>
  );
}

export default function PresentationPage() {
  const [state, setState] = useState<PresentState>(FAILSAFE);

  useEffect(() => {
    const unsubscribe = window.api.present.onState(setState);
    // Pull current state on mount so the preview is correct even if the deck was
    // set before this page mounted (no broadcast has fired yet) — §5.4.
    void window.api.present.getState().then((res) => {
      if (res.ok) setState(res.data);
    });
    return unsubscribe;
  }, []);

  // Keyboard live controls (§5.4). Bound while the page is mounted; ignored when
  // the operator is typing into a field so we never hijack text entry.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
        return;
      }
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          void window.api.present.next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          void window.api.present.prev();
          break;
        case 'b':
        case 'B':
          void window.api.present.black();
          break;
        case '.':
        case 'Escape':
          void window.api.present.clear();
          break;
        case 'Home':
          e.preventDefault();
          void window.api.present.goto(0);
          break;
        case 'End':
          e.preventDefault();
          // Let main clamp to the real last index (main is the source of truth).
          void window.api.present.goto(Number.MAX_SAFE_INTEGER);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const current = state.mode === 'slide' ? (state.deck[state.index] ?? null) : null;
  const next = state.deck[state.index + 1] ?? null;

  const setTransition = (type: TransitionType) => {
    // Re-broadcast the same deck with the new transition (main is the source).
    void window.api.present.setDeck(state.deck, state.index, {
      type,
      durationMs: state.transition.durationMs,
    });
  };

  const btn =
    'rounded px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Presentation</h1>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {state.mode === 'slide'
            ? `Slide ${state.deck.length === 0 ? 0 : state.index + 1} / ${state.deck.length}`
            : `Mode: ${state.mode}`}
        </span>
      </header>

      {/* Current + next preview (§5.4 — presenter sees what is and what's next). */}
      <div className="flex gap-6">
        <SlidePreview slide={current} label="Live" dim={state.mode !== 'slide'} />
        <SlidePreview slide={next} label="Next" />
      </div>

      {/* Live controls. */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Live controls">
        <button
          onClick={() => window.api.present.prev()}
          className={`${btn} bg-secondary text-foreground hover:bg-accent`}
        >
          ◀ Prev
        </button>
        <button
          onClick={() => window.api.present.next()}
          className={`${btn} bg-primary text-primary-foreground hover:opacity-90`}
        >
          Next ▶
        </button>
        <button
          onClick={() => window.api.present.black()}
          className={`${btn} bg-black text-white hover:opacity-80`}
        >
          Black
        </button>
        <button
          onClick={() => window.api.present.blank()}
          className={`${btn} bg-secondary text-foreground hover:bg-accent`}
        >
          Blank
        </button>
        <button
          onClick={() => window.api.present.clear()}
          className={`${btn} bg-secondary text-foreground hover:bg-accent`}
        >
          Clear
        </button>

        {/* Transition picker. */}
        <div className="ml-auto flex items-center gap-2" role="group" aria-label="Transition">
          <span className="text-sm text-muted-foreground">Transition:</span>
          {TRANSITIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTransition(t)}
              aria-pressed={state.transition.type === t}
              className={`${btn} ${
                state.transition.type === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-accent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Keys: →/Space next · ← prev · B black · . / Esc clear · Home/End first/last
      </p>

      {/* Slide thumbnails — click to jump (goto). */}
      <section aria-label="Slides" className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
          Deck ({state.deck.length})
        </h2>
        {state.deck.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No deck loaded. Present a song or scripture passage to build one.
          </p>
        ) : (
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {state.deck.map((slide, i) => (
              <li key={slide.id}>
                <button
                  onClick={() => window.api.present.goto(i)}
                  aria-current={state.mode === 'slide' && i === state.index ? 'true' : undefined}
                  className={`flex h-24 w-full flex-col gap-1 overflow-hidden rounded border p-2 text-left text-xs hover:bg-accent ${
                    state.mode === 'slide' && i === state.index
                      ? 'border-primary ring-2 ring-primary'
                      : ''
                  }`}
                >
                  <span className="font-semibold text-muted-foreground">{i + 1}</span>
                  <span className="line-clamp-2 text-foreground">{slide.lines[0] ?? ''}</span>
                  {slide.reference && (
                    <span className="mt-auto text-primary">{slide.reference}</span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
