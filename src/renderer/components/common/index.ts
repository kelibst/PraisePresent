// Shared presentational screen atoms reused across Scripture/Songs/Plans/Present/
// Live-Detect (CLAUDE.md §1.9 — one canonical version each). All are pure, plain-
// data-driven, and do no fetching (§1.3).

export {
  SlidePreview,
  type SlidePreviewProps,
  type SlidePreviewMedia,
  type SlidePreviewMediaKind,
  type SlidePreviewBadge,
  type SlidePreviewVariant,
} from './SlidePreview';

export { PaneHeader, type PaneHeaderProps } from './PaneHeader';

export { ScheduleRow, type ScheduleRowProps, type ScheduleItemType } from './ScheduleRow';

export { MiniSlideThumb, type MiniSlideThumbProps } from './MiniSlideThumb';
