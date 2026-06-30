import { useEffect, useState } from 'react';
import type { PresentState, TransitionType } from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';
import { MiniSlideThumb, PaneHeader, SlidePreview } from '@/renderer/components/common';
import { cn } from '@/renderer/lib/utils';

// Presenter live-control cockpit. It is a VIEW of main's live state (§5.4):
// subscribes to onState, renders a left deck rail + a right cockpit (LIVE badge,
// big on-screen-now + next previews, transport + transition picker) — all calling
// window.api.present.* only (§1.3). Operated LIVE UNDER PRESSURE, so keyboard
// paths are first-class (§5.4). Tokens/atoms only, no hard-coded hex (§5.6/§1.9).

const TRANSITIONS: { type: TransitionType; label: string }[] = [
  { type: 'cut', label: 'Cut' },
  { type: 'fade', label: 'Fade' },
  { type: 'dissolve', label: 'Dissolve' },
];

// Display/output status line. Static today (single audience window at 1080p60);
// the transition portion is live from state so the operator sees the active mode.
const DISPLAY_STATUS = 'Display 2 · 1920×1080 · 60fps';

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

  const isLive = state.mode === 'slide' && state.deck.length > 0;
  const current = isLive ? (state.deck[state.index] ?? null) : null;
  const next = state.deck[state.index + 1] ?? null;

  const setTransition = (type: TransitionType) => {
    // Re-broadcast the same deck with the new transition (main is the source).
    void window.api.present.setDeck(state.deck, state.index, {
      type,
      durationMs: state.transition.durationMs,
    });
  };

  const slideStatus =
    state.mode === 'slide'
      ? `Slide ${state.deck.length === 0 ? 0 : state.index + 1} / ${state.deck.length}`
      : `Mode: ${state.mode}`;

  const activeTransitionLabel =
    TRANSITIONS.find((t) => t.type === state.transition.type)?.label ?? 'Fade';

  return (
    <div className="flex h-full min-h-0 bg-pp-surface-1 text-pp-text-body">
      {/* ── LEFT: deck rail (~262px) ─────────────────────────────────────── */}
      <aside className="flex w-[262px] shrink-0 flex-col border-r border-pp-border-soft bg-pp-surface-2">
        <PaneHeader label="Deck" meta={`${state.deck.length} slides`} />
        <section aria-label="Slides" className="min-h-0 flex-1 overflow-y-auto p-3">
          {state.deck.length === 0 ? (
            <p className="px-1 py-2 text-xs text-pp-text-muted">
              No deck loaded. Present a song or scripture passage to build one.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {state.deck.map((slide, i) => {
                const live = isLive && i === state.index;
                return (
                  <li key={slide.id}>
                    <MiniSlideThumb
                      index={i + 1}
                      firstLine={slide.lines[0] ?? ''}
                      reference={slide.reference}
                      selected={live}
                      live={live}
                      onClick={() => window.api.present.goto(i)}
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </aside>

      {/* ── RIGHT: cockpit ───────────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Heading kept for accessibility + e2e (role=heading "Presentation"). */}
        <h1 className="sr-only">Presentation</h1>

        {/* State-badge bar. */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-pp-border-soft px-4">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider',
              isLive ? 'bg-pp-success/15 text-pp-success' : 'bg-pp-surface-1 text-pp-text-dim',
            )}
          >
            <span
              className={cn(
                'inline-block size-2 rounded-full',
                isLive ? 'animate-pp-pulse bg-pp-success' : 'bg-pp-text-dim',
              )}
              aria-hidden
            />
            {isLive ? 'LIVE' : state.mode === 'slide' ? 'STANDBY' : state.mode.toUpperCase()}
          </span>
          <span className="text-xs text-pp-text-muted" aria-live="polite">
            {DISPLAY_STATUS} · {activeTransitionLabel} {state.transition.durationMs}ms
          </span>
          <span className="ml-auto text-xs tabular-nums text-pp-text-dim" aria-live="polite">
            {slideStatus}
          </span>
        </header>

        {/* Previews — on-screen-now (lg) + next (sm). */}
        <div className="flex min-h-0 flex-1 items-center justify-center gap-6 overflow-y-auto p-6">
          <div className="flex w-full max-w-[640px] flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-pp-text-label">
              On screen now
            </span>
            <SlidePreview
              variant="lg"
              active={isLive}
              lines={current?.lines}
              reference={current?.reference}
              media={current?.media}
              badge={isLive ? { label: 'LIVE', tone: 'live' } : undefined}
            />
          </div>
          <div className="flex w-full max-w-[300px] flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-pp-text-label">
              Next →
            </span>
            <SlidePreview
              variant="sm"
              lines={next?.lines}
              reference={next?.reference}
              media={next?.media}
            />
          </div>
        </div>

        {/* Transport bar. */}
        <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-pp-border-soft px-4 py-3">
          <div className="flex items-center gap-2" role="group" aria-label="Live controls">
            <TransportButton
              label="◀ Prev"
              onClick={() => window.api.present.prev()}
              tone="secondary"
            />
            <TransportButton
              label="Next ▶"
              kbd="Space"
              onClick={() => window.api.present.next()}
              tone="primary"
            />
            <TransportButton
              label="Black"
              kbd="B"
              onClick={() => window.api.present.black()}
              tone="secondary"
            />
            <TransportButton
              label="Blank"
              onClick={() => window.api.present.blank()}
              tone="secondary"
            />
            <TransportButton
              label="Clear"
              kbd="Esc"
              onClick={() => window.api.present.clear()}
              tone="secondary"
            />
          </div>

          {/* Transition selector — wired to the present transition param. */}
          <div className="ml-auto flex items-center gap-2" role="group" aria-label="Transition">
            <span className="text-xs text-pp-text-muted">Transition</span>
            <div className="inline-flex overflow-hidden rounded-md ring-1 ring-inset ring-pp-border-strong/60">
              {TRANSITIONS.map((t) => {
                const selected = state.transition.type === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setTransition(t.type)}
                    aria-pressed={selected}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                      selected
                        ? 'bg-pp-success/20 text-pp-success'
                        : 'bg-pp-surface-2 text-pp-text-body hover:bg-pp-surface-alt',
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

// One transport button. `primary` is the big sage Next; `secondary` is the muted
// surface variant. `kbd` renders a small key hint chip (§5.4 — keyboard-first).
function TransportButton({
  label,
  kbd,
  tone,
  onClick,
}: {
  label: string;
  kbd?: string;
  tone: 'primary' | 'secondary';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        tone === 'primary'
          ? 'bg-pp-success text-pp-surface-live hover:bg-pp-success/90'
          : 'bg-pp-surface-2 text-pp-text-body ring-1 ring-inset ring-pp-border-strong/60 hover:bg-pp-surface-alt',
      )}
    >
      {label}
      {kbd && (
        <kbd
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-medium leading-none',
            tone === 'primary'
              ? 'bg-pp-surface-live/25 text-pp-surface-live'
              : 'bg-pp-surface-1 text-pp-text-muted',
          )}
        >
          {kbd}
        </kbd>
      )}
    </button>
  );
}
