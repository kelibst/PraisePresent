import { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon, Film, Check, Ban } from 'lucide-react';
import { cn } from '@/renderer/lib/utils';
import { mediaUrl } from '@/shared/constants/media';
import type { SlideBackground } from '@/shared/schemas/present';
import type { MediaItem } from '@/shared/schemas/media';

// Compact Background control for the Present preview pane (CLAUDE.md §5.4). Lets
// the operator set the live slide's background to a color (preset swatch or the
// native picker) or to a media file (image/video) from the library, with an
// "Apply to all slides" toggle and a Clear action. All IPC goes through the
// caller-provided `onApply` (which calls window.api.present.setBackground) — main
// re-validates the color/url and clamps (§1.3, §5.7). Tokens only, no hex (§5.6).

// Preset swatches use HSL referencing the same brand tokens as the rest of the UI
// (no hard-coded hex — §5.6). `null` clears the background back to the gradient.
const SWATCHES: { label: string; color: string }[] = [
  { label: 'Black', color: 'hsl(0, 0%, 0%)' },
  { label: 'Deep purple', color: 'hsl(262, 47%, 43%)' },
  { label: 'Sage', color: 'hsl(99, 25%, 47%)' },
  { label: 'Midnight', color: 'hsl(223, 47%, 8%)' },
  { label: 'White', color: 'hsl(0, 0%, 100%)' },
];

type Props = {
  /** The current live slide's background, so the control reflects live state. */
  current: SlideBackground | null;
  /** Whether anything is live (a deck exists) — controls disabled otherwise. */
  hasDeck: boolean;
  /** Set (null = clear) the background; applyToAll paints every slide. */
  onApply: (background: SlideBackground | null, applyToAll: boolean) => void;
};

export default function BackgroundEditor({ current, hasDeck, onApply }: Props) {
  const [applyToAll, setApplyToAll] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Lazily load the library only when the operator opens the media picker, so the
  // editor adds no IPC cost when unused.
  useEffect(() => {
    if (!pickerOpen) return;
    let active = true;
    void window.api.media.list().then((res) => {
      if (active && res.ok) setMediaItems(res.data);
    });
    return () => {
      active = false;
    };
  }, [pickerOpen]);

  const apply = useCallback(
    (bg: SlideBackground | null) => onApply(bg, applyToAll),
    [onApply, applyToAll],
  );

  const activeColor = current?.type === 'color' ? current.color : null;
  // Native color picker emits #rrggbb (passes the main-side safe-color check).
  const pickerValue = activeColor && activeColor.startsWith('#') ? activeColor : '#000000';

  const visualMedia = mediaItems.filter((m) => m.kind === 'image' || m.kind === 'video');

  return (
    <section className="flex flex-col gap-2 rounded-md border border-pp-border-soft bg-pp-surface-2 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-pp-text-label">Background</span>
        <button
          type="button"
          onClick={() => apply(null)}
          disabled={!hasDeck || !current}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-pp-text-muted transition-colors hover:text-pp-text-body disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          <Ban className="size-3" aria-hidden /> Clear
        </button>
      </div>

      {/* Color swatches + native picker. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {SWATCHES.map((s) => {
          const selected = activeColor === s.color;
          return (
            <button
              key={s.color}
              type="button"
              title={s.label}
              aria-label={`Background ${s.label}`}
              aria-pressed={selected}
              disabled={!hasDeck}
              onClick={() => apply({ type: 'color', color: s.color })}
              className={cn(
                'relative size-6 rounded-full ring-1 ring-inset ring-pp-border-strong/60 transition disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                selected && 'ring-2 ring-pp-accent ring-offset-1 ring-offset-pp-surface-2',
              )}
              style={{ backgroundColor: s.color }}
            >
              {selected && (
                <Check
                  className="absolute inset-0 m-auto size-3.5 text-white mix-blend-difference"
                  aria-hidden
                />
              )}
            </button>
          );
        })}

        <label
          className={cn(
            'inline-flex size-6 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-inset ring-pp-border-strong/60',
            !hasDeck && 'pointer-events-none opacity-40',
          )}
          title="Custom color"
        >
          <input
            type="color"
            value={pickerValue}
            disabled={!hasDeck}
            onChange={(e) => apply({ type: 'color', color: e.target.value })}
            className="size-8 cursor-pointer border-0 bg-transparent p-0"
            aria-label="Custom background color"
          />
        </label>
      </div>

      {/* Media-from-library picker. */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          disabled={!hasDeck}
          onClick={() => setPickerOpen((o) => !o)}
          aria-expanded={pickerOpen}
          className="inline-flex items-center gap-1.5 self-start rounded-md border border-pp-border-strong bg-pp-surface-1 px-2 py-1 text-xs font-medium text-pp-text-body transition-colors hover:bg-pp-surface-alt disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          <ImageIcon className="size-3.5" aria-hidden /> Choose image/video
        </button>

        {pickerOpen && (
          <div className="rounded-md border border-pp-border-soft bg-pp-surface-1 p-1.5">
            {visualMedia.length === 0 ? (
              <p className="px-1 py-2 text-xs text-pp-text-muted">
                No image or video in the library yet.
              </p>
            ) : (
              <ul
                className="grid max-h-32 gap-1.5 overflow-y-auto"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(4.5rem, 1fr))' }}
              >
                {visualMedia.map((item) => {
                  const url = mediaUrl(item.id);
                  const selected = current?.type === 'media' && current.url === url;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        title={item.name}
                        aria-pressed={selected}
                        onClick={() =>
                          apply({
                            type: 'media',
                            kind: item.kind === 'video' ? 'video' : 'image',
                            url,
                          })
                        }
                        className={cn(
                          'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded border bg-pp-surface-alt text-pp-text-muted transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                          selected
                            ? 'border-pp-accent ring-2 ring-pp-accent'
                            : 'border-pp-border-soft hover:border-pp-border-strong',
                        )}
                      >
                        {item.kind === 'image' ? (
                          <BgThumb url={url} />
                        ) : (
                          <Film className="size-5" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Apply-to-all toggle. */}
      <label className="inline-flex cursor-pointer items-center gap-1.5 self-start text-xs text-pp-text-muted">
        <input
          type="checkbox"
          checked={applyToAll}
          onChange={(e) => setApplyToAll(e.target.checked)}
          className="size-3.5 accent-pp-accent"
        />
        Apply to all slides
      </label>
    </section>
  );
}

// Thumbnail for an image background option. Fails safe to the kind glyph rather
// than a broken-image icon if the file is missing/moved (§5.7).
function BgThumb({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <ImageIcon className="size-5" aria-hidden />;
  return (
    <img
      src={url}
      alt=""
      aria-hidden
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
