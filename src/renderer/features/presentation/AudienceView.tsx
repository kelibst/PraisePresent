import { useEffect, useRef, useState } from 'react';
import type {
  PresentState,
  PresentSlide,
  SlideMedia,
  SlideBackground,
} from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';
import { SAFE_AREA_KEY, parseSafeAreaPct } from '@/shared/schemas/display';

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
  // A background media file that failed to load — fall back to the gradient (§5.7).
  const [bgErrorId, setBgErrorId] = useState<string | null>(null);
  // Overscan / TV safe-area inset (% per edge). Read once on mount from settings;
  // 0 = no inset. Garbage/missing values fall back to 0 (never breaks the view).
  const [safeAreaPct, setSafeAreaPct] = useState(0);
  const lastSlideId = useRef<string | null>(null);

  useEffect(() => window.api.present.onState(setState), []);

  useEffect(() => {
    let active = true;
    void window.api.settings.get(SAFE_AREA_KEY).then((res) => {
      if (active && res.ok) setSafeAreaPct(parseSafeAreaPct(res.data));
    });
    return () => {
      active = false;
    };
  }, []);

  // Padding applied to the content layer so text/media stay inside the safe area
  // while the black backdrop always fills the screen edge-to-edge (§5.7).
  const safeAreaStyle = safeAreaPct > 0 ? { padding: `${safeAreaPct}%` } : undefined;

  const slide = activeSlide(state);
  const slideId = slide?.id ?? null;

  // Re-trigger the fade (and clear any prior media error) on a slide change.
  useEffect(() => {
    if (slideId === lastSlideId.current) return;
    lastSlideId.current = slideId;
    setMediaErrorId(null);
    setBgErrorId(null);
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
    const showBg =
      slide.background && !(slide.background.type === 'media' && bgErrorId === slide.id);
    return (
      // Outermost layer is always solid black: the edge-to-edge fail-safe backdrop
      // (§5.7). The radial-gradient slide surface — the full-screen twin of the
      // SlidePreview atom — paints on top, inside the safe area.
      <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
        <div
          className="absolute inset-0 will-change-[opacity]"
          style={{
            opacity: visible ? 1 : 0,
            transition: `opacity ${durationMs}ms ease-in-out`,
            ...safeAreaStyle,
          }}
        >
          {/* Deep radial-gradient slide surface, matching SlidePreview. */}
          <div className="relative h-full w-full overflow-hidden bg-pp-surface-live bg-[radial-gradient(circle_at_50%_38%,hsl(var(--pp-accent-deep)/0.55),transparent_62%),radial-gradient(circle_at_50%_120%,hsl(var(--background)/0.9),hsl(var(--pp-surface-live)))]">
            {showBg && (
              <BackgroundLayer
                background={slide.background!}
                onError={() => setBgErrorId(slide.id)}
              />
            )}
            {showMedia && (
              <MediaLayer media={slide.media!} onError={() => setMediaErrorId(slide.id)} />
            )}
            {slide.lines.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-[7vw] text-center">
                <div className="flex flex-col gap-[1.2vw]">
                  {slide.lines.map((line, i) => (
                    <p
                      key={i}
                      className="font-semibold leading-tight drop-shadow-lg [text-wrap:balance]"
                      style={{ fontSize: '5.2vw' }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {slide.reference && (
              <p
                className="absolute bottom-[3vw] right-[4vw] font-normal text-white/70 drop-shadow-lg"
                style={{ fontSize: '3.2vw' }}
              >
                {slide.reference}
              </p>
            )}
          </div>
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
        className="absolute inset-0 h-full w-full object-cover"
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
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
    );
  }
  // audio: no visual element; the file plays over a black background.
  return <audio src={media.url} onError={onError} autoPlay loop aria-hidden />;
}

// Renders the slide background full-screen, beneath the media + text layers. A
// color is an inline fill — the value is allow-listed in main before it reaches
// here (§5.7), so it can never inject CSS. A media background that errors bubbles
// up so we fall back to the gradient backdrop, never a broken-image icon.
function BackgroundLayer({
  background,
  onError,
}: {
  background: SlideBackground;
  onError: () => void;
}) {
  if (background.type === 'color') {
    return (
      <div className="absolute inset-0" style={{ backgroundColor: background.color }} aria-hidden />
    );
  }
  if (background.kind === 'image') {
    return (
      <img
        src={background.url}
        alt=""
        aria-hidden
        onError={onError}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <video
      src={background.url}
      aria-hidden
      autoPlay
      loop
      muted
      playsInline
      onError={onError}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
