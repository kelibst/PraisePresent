import { useEffect, useRef, useState } from 'react';
import type { PresentState, PresentSlide, SlideMedia } from '@/shared/schemas/present';
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
  // A media file that failed to load (moved/corrupt) — fail safe to black (§5.7).
  const [mediaErrorId, setMediaErrorId] = useState<string | null>(null);
  const lastSlideId = useRef<string | null>(null);

  useEffect(() => window.api.present.onState(setState), []);

  const slide = activeSlide(state);
  const slideId = slide?.id ?? null;

  // Re-trigger the fade (and clear any prior media error) on a slide change.
  useEffect(() => {
    if (slideId === lastSlideId.current) return;
    lastSlideId.current = slideId;
    setMediaErrorId(null);
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
    const showMedia = slide.media && mediaErrorId !== slide.id;
    return (
      <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black text-white">
        <div
          className="absolute inset-0 will-change-[opacity]"
          style={{ opacity: visible ? 1 : 0, transition: `opacity ${durationMs}ms ease-in-out` }}
        >
          {showMedia && (
            <MediaLayer media={slide.media!} onError={() => setMediaErrorId(slide.id)} />
          )}
          {slide.lines.length > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-16 text-center">
              <div className="flex flex-col gap-2">
                {slide.lines.map((line, i) => (
                  <p key={i} className="text-5xl font-semibold leading-tight drop-shadow-lg">
                    {line}
                  </p>
                ))}
              </div>
              {slide.reference && (
                <p className="text-3xl font-normal text-white/70 drop-shadow-lg">
                  {slide.reference}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // black, clear, empty deck, out-of-range index, any unexpected state -> black.
  return <div className="h-screen w-screen bg-black" aria-hidden />;
}

// Renders one media element full-screen. onError bubbles up so a moved/corrupt
// file fails safe to black instead of showing a broken-image icon (§5.7).
function MediaLayer({ media, onError }: { media: SlideMedia; onError: () => void }) {
  if (media.kind === 'image') {
    return (
      <img
        src={media.url}
        alt=""
        onError={onError}
        className="h-full w-full object-contain"
        aria-hidden
      />
    );
  }
  if (media.kind === 'video') {
    return (
      <video
        src={media.url}
        onError={onError}
        autoPlay
        loop
        playsInline
        className="h-full w-full object-contain"
        aria-hidden
      />
    );
  }
  // audio: no visual element; the file plays over a black background.
  return <audio src={media.url} onError={onError} autoPlay loop aria-hidden />;
}
