import { useState } from 'react';
import { cn } from '@/renderer/lib/utils';

// A pure, presentational, scaled-down twin of the audience output (AudienceView).
// It renders plain data — text lines, an optional reference, optional media, an
// optional corner badge — inside a fixed 16:9 box and NEVER fetches anything
// (CLAUDE.md §1.3). Text scales to the box via container-query units (`cqi`) so
// the same component reads correctly at a large "live" size and a small "next"
// size without hard-coded font sizes. Tokens only, no hard-coded hex (§5.6).

// The media kinds the preview can show. Mirrors `SlideMedia` from the present
// schema but kept local so this atom imports no schema/runtime — it's plain data.
export type SlidePreviewMediaKind = 'image' | 'video' | 'audio';

export type SlidePreviewMedia = {
  kind: SlidePreviewMediaKind;
  /** Already-resolved, renderable URL (e.g. `app-media://media/12`). */
  url: string;
};

// A small label pinned to the top-left corner, e.g. "Scripture · read-only".
export type SlidePreviewBadge = {
  label: string;
  /** Visual tone of the badge chip. Defaults to `neutral`. */
  tone?: 'neutral' | 'accent' | 'live';
};

// `lg` = the large staged/live preview; `sm` = the compact "next" preview. The
// variant only scales typography and chrome — the 16:9 ratio is constant.
export type SlidePreviewVariant = 'lg' | 'sm';

export type SlidePreviewProps = {
  /** Text lines, centered and balanced. Empty/absent → media-only or blank. */
  lines?: string[];
  /** Reference label pinned bottom-right, e.g. "John 3:16". */
  reference?: string;
  /** Optional background media. Text overlays it, matching the audience view. */
  media?: SlidePreviewMedia;
  /** Optional corner badge chip. */
  badge?: SlidePreviewBadge;
  /** Size variant. Defaults to `lg`. */
  variant?: SlidePreviewVariant;
  /** Sage focus-ring + brightened border for the staged/live slide. */
  active?: boolean;
  className?: string;
};

// Font sizes expressed in container-inline-size units so text tracks the box.
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

const BADGE_TONE: Record<NonNullable<SlidePreviewBadge['tone']>, string> = {
  neutral: 'bg-black/55 text-pp-text-label ring-1 ring-white/10',
  accent: 'bg-pp-accent/85 text-primary-foreground',
  live: 'bg-pp-success/90 text-pp-surface-live',
};

export function SlidePreview({
  lines,
  reference,
  media,
  badge,
  variant = 'lg',
  active = false,
  className,
}: SlidePreviewProps) {
  // A media file that failed to load (moved/corrupt) fails safe to the gradient
  // backdrop rather than a broken-image icon — the projector never shows junk.
  const [mediaFailed, setMediaFailed] = useState(false);
  const t = TYPE[variant];
  const hasText = (lines?.length ?? 0) > 0;
  const showMedia = media && media.kind !== 'audio' && !mediaFailed;

  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-md text-white shadow-sm',
        '[container-type:inline-size]',
        // Deep radial-gradient slide backdrop (matches the audience look).
        'bg-pp-surface-live bg-[radial-gradient(circle_at_50%_38%,hsl(var(--pp-accent-deep)/0.55),transparent_62%),radial-gradient(circle_at_50%_120%,hsl(var(--background)/0.9),hsl(var(--pp-surface-live)))]',
        'ring-1 ring-inset',
        active
          ? 'ring-2 ring-pp-accent ring-offset-2 ring-offset-pp-surface-1'
          : 'ring-pp-border-strong/60',
        className,
      )}
      data-active={active || undefined}
    >
      {showMedia && <SlideMediaLayer media={media} onError={() => setMediaFailed(true)} />}

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
                className="font-semibold leading-tight drop-shadow-md [text-wrap:balance]"
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
          className="absolute bottom-[3cqi] right-[4cqi] font-normal text-white/70 drop-shadow-md"
          style={{ fontSize: t.reference }}
        >
          {reference}
        </p>
      )}

      {badge && (
        <span
          className={cn(
            'absolute left-[3cqi] top-[3cqi] inline-flex items-center rounded-full px-[2.6cqi] py-[1cqi] font-medium leading-none',
            BADGE_TONE[badge.tone ?? 'neutral'],
          )}
          style={{ fontSize: '2.8cqi' }}
        >
          {badge.label}
        </span>
      )}
    </div>
  );
}

// Renders one media element to fill the box. onError fails safe to the gradient
// backdrop (§5.7). Image/video only; audio has no visual element.
function SlideMediaLayer({ media, onError }: { media: SlidePreviewMedia; onError: () => void }) {
  if (media.kind === 'image') {
    return (
      <img
        src={media.url}
        alt=""
        aria-hidden
        onError={onError}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  // video — muted + non-interactive; this is a preview, not playback.
  return (
    <video
      src={media.url}
      aria-hidden
      muted
      playsInline
      onError={onError}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export default SlidePreview;
