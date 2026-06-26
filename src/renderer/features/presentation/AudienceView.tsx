import { useEffect, useRef, useState } from 'react';
import type { PresentState, PresentSlide } from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';

// Full-screen projector view. Subscribes to main's live state and renders the
// current slide, failing safe to black on anything unexpected — never a stack
// trace on the projector (CLAUDE.md §5.7).
//
// Transitions are GPU-composited: we cross-fade by toggling `opacity` (no layout
// thrash), so fade/dissolve run on the compositor at ≥60fps. `cut` = 0ms.

// The currently-projectable slide, or null when we must show black/blank/empty.
function activeSlide(state: PresentState): PresentSlide | null {
  if (state.mode !== 'slide') return null;
  const slide = state.deck[state.index];
  return slide ?? null; // out-of-range / empty deck -> black (fail-safe)
}

export default function AudienceView() {
  const [state, setState] = useState<PresentState>(FAILSAFE);
  // Drives the opacity cross-fade: drop to 0 on a slide change, then to 1.
  const [visible, setVisible] = useState(true);
  const lastSlideId = useRef<string | null>(null);

  useEffect(() => window.api.present.onState(setState), []);

  const slide = activeSlide(state);
  const slideId = slide?.id ?? null;

  // Re-trigger the fade whenever the active slide changes.
  useEffect(() => {
    if (slideId === lastSlideId.current) return;
    lastSlideId.current = slideId;
    if (state.transition.type === 'cut' || slideId === null) {
      setVisible(true);
      return;
    }
    setVisible(false);
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [slideId, state.transition.type]);

  // blank dims the screen but keeps it "on" for a smooth resume.
  if (state.mode === 'blank') {
    return <div className="h-screen w-screen bg-neutral-900" aria-hidden />;
  }

  if (slide) {
    const durationMs = state.transition.type === 'cut' ? 0 : state.transition.durationMs;
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <div
          className="flex flex-col items-center gap-6 px-16 text-center will-change-[opacity]"
          style={{ opacity: visible ? 1 : 0, transition: `opacity ${durationMs}ms ease-in-out` }}
        >
          <div className="flex flex-col gap-2">
            {slide.lines.map((line, i) => (
              <p key={i} className="text-5xl font-semibold leading-tight">
                {line}
              </p>
            ))}
          </div>
          {slide.reference && (
            <p className="text-3xl font-normal text-white/60">{slide.reference}</p>
          )}
        </div>
      </div>
    );
  }

  // black, clear, empty deck, out-of-range index, any unexpected state -> black.
  return <div className="h-screen w-screen bg-black" aria-hidden />;
}
