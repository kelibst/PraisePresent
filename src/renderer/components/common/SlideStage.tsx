import { useEffect, useState } from 'react';
import { cn } from '@/renderer/lib/utils';
import type { SlideMedia, SlideBackground } from '@/shared/schemas/present';

// The ONE slide surface (CLAUDE.md §1.9). Every projectable slide — on the live
// projector (AudienceView) and in every scaled preview twin (SlidePreview) — is
// painted by this single component, so "what the operator previews" is, by
// construction, "what the audience sees." It paints, bottom -> top:
//
//   stage backdrop -> background -> media -> text lines -> reference label
//
// The backdrop is the theme-INDEPENDENT `.pp-stage-backdrop` (globals.css), so the
// surface looks identical in light or dark mode (§5.7). Text scales to the box via
// container-query units (`cqi`) — the element is its own container — so the same
// component reads correctly full-screen and at thumbnail size with no hard-coded
// font sizes (§5.6). Pure + presentational: it renders already-resolved data
// (colors/urls validated in main before they arrive) and NEVER fetches (§1.3). A
// media/background load error fails safe to the backdrop, never a broken-image
// icon (§5.7). The `surface` distinction is the only projector/preview difference:
// the projector plays foreground media with sound; a preview stays muted.

export type SlideStageScale = 'lg' | 'sm';
// `projector` = the live audience output: foreground media plays WITH sound.
// `preview` = a scaled twin in the operator UI: always muted (never blast audio).
export type SlideStageSurface = 'projector' | 'preview';

export type SlideStageProps = {
  /** Text lines, centered and balanced. Empty/absent → media-only or blank. */
  lines?: string[];
  /** Reference label pinned bottom-right, e.g. "John 3:16". */
  reference?: string;
  /** Foreground media (image/video/audio), painted over the background. */
  media?: SlideMedia;
  /** Background (color or image/video), painted beneath media + text. Resolve the
   *  per-slide override vs the service default with `effectiveBackground` BEFORE
   *  passing it here. */
  background?: SlideBackground;
  /** Typography scale. `lg` = large live/staged + the full-screen projector;
   *  `sm` = the compact "next" preview. Defaults to `lg`. */
  scale?: SlideStageScale;
  /** Projector (plays sound) vs a muted preview twin. Defaults to `preview`. */
  surface?: SlideStageSurface;
  className?: string;
};

// Font sizes in container-inline-size units so text tracks the box at any size.
const TYPE = {
  lg: {
    line: '5.2cqi',
    reference: '3.2cqi',
    gap: 'gap-[2.2cqi]',
    lineGap: 'gap-[1.2cqi]',
    pad: 'px-[7cqi]',
  },
  sm: {
    line: '7cqi',
    reference: '4.4cqi',
    gap: 'gap-[2.4cqi]',
    lineGap: 'gap-[1.4cqi]',
    pad: 'px-[6cqi]',
  },
} as const;

export function SlideStage({
  lines,
  reference,
  media,
  background,
  scale = 'lg',
  surface = 'preview',
  className,
}: SlideStageProps) {
  // A media/background file that fails to load (moved/corrupt) fails safe to the
  // backdrop rather than a broken-image icon — the projector never shows junk.
  const [mediaFailed, setMediaFailed] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);
  const t = TYPE[scale];
  const hasText = (lines?.length ?? 0) > 0;
  const showMedia = !!media && !mediaFailed;
  const showBg = !!background && !(background.type === 'media' && bgFailed);

  // Clear the per-source error flag when the source changes, so switching to a
  // working file recovers from a prior failure.
  const bgKey = background
    ? `${background.type}:${'url' in background ? background.url : background.color}`
    : '';
  useEffect(() => setBgFailed(false), [bgKey]);
  const mediaKey = media?.url ?? '';
  useEffect(() => setMediaFailed(false), [mediaKey]);

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden text-white pp-stage-backdrop [container-type:inline-size]',
        className,
      )}
    >
      {showBg && <StageBackground background={background!} onError={() => setBgFailed(true)} />}

      {showMedia && (
        <StageMedia media={media!} surface={surface} onError={() => setMediaFailed(true)} />
      )}

      {hasText && (
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center text-center',
            t.gap,
            t.pad,
          )}
        >
          <div className={cn('flex flex-col', t.lineGap)}>
            {lines!.map((line, i) => (
              <p
                key={i}
                className="font-semibold leading-tight drop-shadow-lg [text-wrap:balance]"
                style={{ fontSize: t.line }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {reference && (
        <p
          className="absolute bottom-[3cqi] right-[4cqi] font-normal text-white/70 drop-shadow-lg"
          style={{ fontSize: t.reference }}
        >
          {reference}
        </p>
      )}
    </div>
  );
}

// The background layer (decorative, BENEATH media + text). A color is an inline
// fill — the value is allow-listed in main before it arrives (§5.7), so it can
// never inject CSS. Image/video cover the surface; a video is always muted (a
// backdrop has no sound). Keyed by url so re-picking a different file remounts the
// element rather than leaving the old one mounted (B3). onError fails safe up.
function StageBackground({
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

// The foreground media layer. Keyed by url (B3). Image covers the surface; video
// autoplays + loops, with sound ONLY on the projector (a preview stays muted).
// Audio has no visual surface — only the projector plays it; a preview renders
// nothing so it can never blast sound. onError fails safe to the backdrop.
function StageMedia({
  media,
  surface,
  onError,
}: {
  media: SlideMedia;
  surface: SlideStageSurface;
  onError: () => void;
}) {
  const live = surface === 'projector';
  if (media.kind === 'image') {
    return (
      <img
        key={media.url}
        src={media.url}
        alt=""
        aria-hidden
        onError={onError}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  if (media.kind === 'video') {
    return (
      <video
        key={media.url}
        src={media.url}
        aria-hidden
        autoPlay
        loop
        playsInline
        muted={!live}
        onError={onError}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  // audio: no visual element. Only the projector plays it; a preview stays silent.
  if (!live) return null;
  return <audio key={media.url} src={media.url} autoPlay loop aria-hidden onError={onError} />;
}

export default SlideStage;
