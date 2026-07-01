import { cn } from '@/renderer/lib/utils';
import { SlideStage } from './SlideStage';

// A scaled-down twin of the audience output (AudienceView). It wraps the shared
// <SlideStage> surface (CLAUDE.md §1.9 — one slide renderer for projector AND
// preview) in a fixed 16:9 box with the operator-UI chrome: a focus ring for the
// staged/live slide and an optional corner badge. It renders plain data and NEVER
// fetches (§1.3). Because the actual painting lives in <SlideStage>, a preview can
// never drift from the projector (e.g. a video background plays in both). Tokens
// only, no hard-coded hex (§5.6).

// The media kinds the preview can show. Mirrors `SlideMedia` from the present
// schema but kept local so callers need not import the schema — it's plain data.
export type SlidePreviewMediaKind = 'image' | 'video' | 'audio';

export type SlidePreviewMedia = {
  kind: SlidePreviewMediaKind;
  /** Already-resolved, renderable URL (e.g. `app-media://media/12`). */
  url: string;
};

// Optional background, painted BENEATH the media + text layers. Mirrors
// `SlideBackground` from the present schema but kept local so callers need not
// import the schema — it's plain data (validated in main before it ever arrives).
export type SlidePreviewBackground =
  | { type: 'color'; color: string }
  | { type: 'media'; kind: 'image' | 'video'; url: string };

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
  /** Optional foreground media. Text overlays it, matching the audience view. */
  media?: SlidePreviewMedia;
  /** Optional background (color or media), painted beneath media + text. Pass the
   *  already-resolved background (per-slide override else service default). */
  background?: SlidePreviewBackground;
  /** Optional corner badge chip. */
  badge?: SlidePreviewBadge;
  /** Size variant. Defaults to `lg`. */
  variant?: SlidePreviewVariant;
  /** Sage focus-ring + brightened border for the staged/live slide. */
  active?: boolean;
  className?: string;
};

const BADGE_TONE: Record<NonNullable<SlidePreviewBadge['tone']>, string> = {
  neutral: 'bg-black/55 text-pp-text-label ring-1 ring-white/10',
  accent: 'bg-pp-accent/85 text-primary-foreground',
  live: 'bg-pp-success/90 text-pp-surface-live',
};

export function SlidePreview({
  lines,
  reference,
  media,
  background,
  badge,
  variant = 'lg',
  active = false,
  className,
}: SlidePreviewProps) {
  return (
    <div
      className={cn(
        // The 16:9 box + operator-UI chrome. `[container-type:inline-size]` so the
        // corner badge's `cqi` units track the box (the inner <SlideStage> is its
        // own container for the slide content).
        'relative aspect-video w-full overflow-hidden rounded-md shadow-sm [container-type:inline-size]',
        'ring-1 ring-inset',
        active
          ? 'ring-2 ring-pp-accent ring-offset-2 ring-offset-pp-surface-1'
          : 'ring-pp-border-strong/60',
        className,
      )}
      data-active={active || undefined}
    >
      <SlideStage
        scale={variant}
        surface="preview"
        lines={lines}
        reference={reference}
        media={media}
        background={background}
      />

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

export default SlidePreview;
