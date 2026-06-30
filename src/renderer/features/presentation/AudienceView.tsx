import { memo, useEffect, useRef, useState } from 'react';
import type {
  PresentState,
  PresentSlide,
  SlideBackground,
  TransitionType,
} from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';
import { effectiveBackground } from '@/shared/present/serviceBackground';
import { SlideStage } from '@/renderer/components/common/SlideStage';
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

// One full-screen slide layer: the shared <SlideStage> surface (the same renderer
// the operator previews via SlidePreview, §1.9), painted inside the TV safe area.
// Memoized so a re-render that doesn't change this slide leaves its `<video>`/
// `<img>` mounted (B3); SlideStage keys media/background by url and fails safe to
// the backdrop on a load error (§5.7). `surface="projector"` so foreground media
// plays with sound here (a preview stays muted).
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
  // Capture the entrance/exit animation once, at mount. Toggling the NEXT
  // transition type must not re-fire the animation on a slide already on screen.
  const [anim] = useState(animation);
  const padding = safeAreaPct > 0 ? `${safeAreaPct}%` : undefined;
  // The painted background is the per-slide override, else the service default —
  // resolved here so a media slide is skipped and an override always wins (§5.7).
  const background = effectiveBackground(slide, defaultBackground);

  return (
    <div className="absolute inset-0 will-change-[opacity]" style={{ animation: anim, padding }}>
      <SlideStage
        surface="projector"
        scale="lg"
        lines={slide.lines}
        reference={slide.reference}
        media={slide.media}
        background={background}
      />
    </div>
  );
});
