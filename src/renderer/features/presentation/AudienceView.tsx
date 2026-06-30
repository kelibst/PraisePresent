import { memo, useEffect, useRef, useState } from 'react';
import type {
  PresentState,
  PresentSlide,
  SlideMedia,
  SlideBackground,
  TransitionType,
} from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';
import { effectiveBackground } from '@/shared/present/serviceBackground';
import { SAFE_AREA_KEY, parseSafeAreaPct } from '@/shared/schemas/display';

// Full-screen projector view. Subscribes to main's live state and renders the
// current slide, failing safe to black on anything unexpected — never a stack
// trace on the projector (CLAUDE.md §5.7).
//
// Transitions are a true double-buffer cross-fade (B2): two opacity layers over a
// permanent black backdrop. `dissolve` blends the layers together; `fade` runs the
// outgoing layer out then the incoming layer in (through black); `cut` is instant.
// Opacity-only animation so the compositor runs it on the GPU at ≥60fps on weak
// integrated GPUs. Each slide layer is `React.memo`'d and its media is keyed by url,
// so a cursor-only move never remounts/restarts a `<video>` (B3).

// The currently-projectable slide, or null when we must show black/blank/empty.
function activeSlide(state: PresentState): PresentSlide | null {
  if (state.mode !== 'slide') return null;
  const slide = state.deck[state.index];
  return slide ?? null; // out-of-range / empty deck -> black (fail-safe)
}

// Build the opacity-animation shorthand for one layer. `cut` → no animation
// (instant). `fade` → each layer uses half the duration so the outgoing fades out
// (first half) before the incoming fades in (second half) — a moment of black
// between them. `dissolve` → both run the full duration together (cross-dissolve).
function layerAnimation(
  role: 'in' | 'out',
  type: TransitionType,
  durationMs: number,
): string | undefined {
  if (type === 'cut' || durationMs <= 0) return undefined;
  if (type === 'fade') {
    const half = Math.max(1, Math.round(durationMs / 2));
    return role === 'in'
      ? `ppLayerIn ${half}ms ease-in-out ${half}ms both`
      : `ppLayerOut ${half}ms ease-in-out forwards`;
  }
  // dissolve (and any unexpected value): a simultaneous cross-fade.
  return role === 'in'
    ? `ppLayerIn ${durationMs}ms ease-in-out both`
    : `ppLayerOut ${durationMs}ms ease-in-out forwards`;
}

export default function AudienceView() {
  const [state, setState] = useState<PresentState>(FAILSAFE);
  // The slide currently fading away (a frozen snapshot of the slide we left), or
  // null when nothing is transitioning out. The incoming/current layer is always
  // derived from live state so in-place edits (background/text) show immediately.
  const [outgoing, setOutgoing] = useState<{ id: string; slide: PresentSlide } | null>(null);
  // Overscan / TV safe-area inset (% per edge). Read once on mount from settings;
  // 0 = no inset. Garbage/missing values fall back to 0 (never breaks the view).
  const [safeAreaPct, setSafeAreaPct] = useState(0);
  // Is the GPU compositing the page? When false (software/CPU compositing on a weak
  // or old machine) the opacity cross-fade animates on the CPU and janks, so we drop
  // to an instant cut (B6a — "adapt, don't punish"). Defaults true (cross-fade) until
  // the capability read resolves; capable machines keep the fade.
  const [compositorSafe, setCompositorSafe] = useState(true);
  const prevSlideRef = useRef<PresentSlide | null>(null);

  useEffect(() => window.api.present.onState(setState), []);

  useEffect(() => {
    let active = true;
    void window.api.capability.get().then((res) => {
      if (active && res.ok) setCompositorSafe(res.data.signals.gpuCompositing);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void window.api.settings.get(SAFE_AREA_KEY).then((res) => {
      if (active && res.ok) setSafeAreaPct(parseSafeAreaPct(res.data));
    });
    return () => {
      active = false;
    };
  }, []);

  const slide = activeSlide(state);
  const slideId = slide?.id ?? null;
  const transitionType = state.transition.type;
  // `cut` and going-to-black are immediate (operator safety); only a slide→slide
  // change with a non-zero duration drives a cross-fade. On a software-compositing
  // machine we force the cut (durationMs 0) so the projector never CPU-animates (B6a).
  const durationMs = transitionType === 'cut' || !compositorSafe ? 0 : state.transition.durationMs;

  // Drive the cross-fade: when the visible slide changes, freeze the slide we left
  // as the outgoing layer and schedule its removal. A same-slide re-render (a
  // background/text edit) is a no-op here — no re-fade.
  useEffect(() => {
    const prev = prevSlideRef.current;
    prevSlideRef.current = slide;

    // First slide, going to black/blank/clear, or same slide on screen: no fade-out.
    if (!prev || !slide || prev.id === slide.id || durationMs <= 0) {
      setOutgoing(null);
      return;
    }

    setOutgoing({ id: prev.id, slide: prev });
    const timer = window.setTimeout(() => setOutgoing(null), durationMs + 60);
    return () => window.clearTimeout(timer);
    // `slideId` is the real trigger; `durationMs` lets a transition-type toggle be a
    // clean no-op (it hits the same-slide branch above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideId, durationMs]);

  // blank dims the screen but keeps it "on" for a smooth resume.
  if (state.mode === 'blank') {
    return <div className="h-screen w-screen bg-neutral-900" aria-hidden />;
  }

  // Never render the outgoing layer for the slide that is currently incoming: when
  // the operator navigates BACK to the slide that is still fading out, the two
  // layers would share a React key (slide id) and React would desync, orphaning a
  // DOM node that never unmounts. Excluding it here also avoids a pointless
  // same-slide cross-fade. Guarantees the two layer keys are always distinct.
  const renderedOutgoing = outgoing && outgoing.id !== slideId ? outgoing : null;

  // Outermost layer is always solid black: the edge-to-edge fail-safe backdrop
  // (§5.7). Up to two slide layers cross-fade on top of it. When there is no slide
  // (black/clear/empty/out-of-range) neither layer renders → pure black.
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {renderedOutgoing && (
        <SlideLayer
          key={renderedOutgoing.id}
          slide={renderedOutgoing.slide}
          defaultBackground={state.defaultBackground}
          animation={layerAnimation('out', transitionType, durationMs)}
          safeAreaPct={safeAreaPct}
        />
      )}
      {slide && (
        <SlideLayer
          key={slide.id}
          slide={slide}
          defaultBackground={state.defaultBackground}
          animation={layerAnimation('in', transitionType, durationMs)}
          safeAreaPct={safeAreaPct}
        />
      )}
    </div>
  );
}

// One full-screen slide layer: the deep radial-gradient surface (the full-screen
// twin of the SlidePreview atom) with its background → media → text → reference,
// painted inside the safe area. Memoized so a re-render that doesn't change this
// slide leaves its `<video>`/`<img>` mounted (B3). Media/background load errors are
// handled locally so a moved/corrupt file fails safe to the gradient/black (§5.7).
const SlideLayer = memo(function SlideLayer({
  slide,
  defaultBackground,
  animation,
  safeAreaPct,
}: {
  slide: PresentSlide;
  defaultBackground: SlideBackground | null;
  animation: string | undefined;
  safeAreaPct: number;
}) {
  const [mediaFailed, setMediaFailed] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);
  // Capture the entrance/exit animation once, at mount. Toggling the NEXT transition
  // type must not re-fire the animation on a slide that's already on screen.
  const [anim] = useState(animation);

  const showMedia = slide.media && !mediaFailed;
  // The painted background is the per-slide override, else the service default —
  // resolved here so a media slide is skipped and an override always wins (§5.7).
  const background = effectiveBackground(slide, defaultBackground);
  const showBg = background && !(background.type === 'media' && bgFailed);
  const padding = safeAreaPct > 0 ? `${safeAreaPct}%` : undefined;

  return (
    <div
      className="absolute inset-0 will-change-[opacity]"
      style={{ animation: anim, padding }}
      aria-hidden={undefined}
    >
      <div className="relative h-full w-full overflow-hidden bg-pp-surface-live bg-[radial-gradient(circle_at_50%_38%,hsl(var(--pp-accent-deep)/0.55),transparent_62%),radial-gradient(circle_at_50%_120%,hsl(var(--background)/0.9),hsl(var(--pp-surface-live)))]">
        {showBg && <BackgroundLayer background={background} onError={() => setBgFailed(true)} />}
        {showMedia && <MediaLayer media={slide.media!} onError={() => setMediaFailed(true)} />}
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
  );
});

// Renders one media element full-screen. Keyed by url by the caller so identical
// media never remounts (B3). onError bubbles up so a moved/corrupt file fails safe
// to the gradient/black instead of showing a broken-image icon (§5.7).
function MediaLayer({ media, onError }: { media: SlideMedia; onError: () => void }) {
  if (media.kind === 'image') {
    return (
      <img
        key={media.url}
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
        key={media.url}
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
  return <audio key={media.url} src={media.url} onError={onError} autoPlay loop aria-hidden />;
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
        key={background.url}
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
      key={background.url}
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
