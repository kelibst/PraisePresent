import { useEffect, useState } from 'react';
import { Image as ImageIcon, Film, Check } from 'lucide-react';
import { cn } from '@/renderer/lib/utils';
import { mediaUrl } from '@/shared/constants/media';
import type { SlideBackground } from '@/shared/schemas/present';
import type { MediaItem } from '@/shared/schemas/media';

// Shared, presentational background picker (CLAUDE.md §1.9 — one way to pick a
// background). Renders the brand-token color swatches + native color input and a
// collapsible media-library grid (image/video). It only EMITS a chosen
// background via `onChange`; clearing and any apply-scope (a single live slide,
// the whole deck, or the persisted service default) are the caller's concern,
// because those semantics differ between the Present preview (live) and Settings
// (persisted). All media comes through `window.api.media.list` (§1.3); the chosen
// color/url is re-validated in main before it ever reaches the audience (§5.7).
// Tokens only, no hard-coded hex (§5.6).

// Preset swatches use HSL referencing the same brand tokens as the rest of the UI
// (no hard-coded hex — §5.6).
const SWATCHES: { label: string; color: string }[] = [
  { label: 'Black', color: 'hsl(0, 0%, 0%)' },
  { label: 'Deep purple', color: 'hsl(262, 47%, 43%)' },
  { label: 'Sage', color: 'hsl(99, 25%, 47%)' },
  { label: 'Midnight', color: 'hsl(223, 47%, 8%)' },
  { label: 'White', color: 'hsl(0, 0%, 100%)' },
];

type Props = {
  /** The currently-selected background, so swatches/media reflect it. */
  value: SlideBackground | null;
  /** Disable all controls (e.g. nothing is live to paint). */
  disabled?: boolean;
  /** Emit a chosen color or media background. */
  onChange: (background: SlideBackground) => void;
};

export default function BackgroundPicker({ value, disabled = false, onChange }: Props) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Lazily load the library only when the operator opens the media picker, so the
  // picker adds no IPC cost when unused.
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

  const activeColor = value?.type === 'color' ? value.color : null;
  // Native color picker emits #rrggbb (passes the main-side safe-color check).
  const pickerValue = activeColor && activeColor.startsWith('#') ? activeColor : '#000000';
  const visualMedia = mediaItems.filter((m) => m.kind === 'image' || m.kind === 'video');

  return (
    <div className="flex flex-col gap-2">
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
              disabled={disabled}
              onClick={() => onChange({ type: 'color', color: s.color })}
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
            disabled && 'pointer-events-none opacity-40',
          )}
          title="Custom color"
        >
          <input
            type="color"
            value={pickerValue}
            disabled={disabled}
            onChange={(e) => onChange({ type: 'color', color: e.target.value })}
            className="size-8 cursor-pointer border-0 bg-transparent p-0"
            aria-label="Custom background color"
          />
        </label>
      </div>

      {/* Media-from-library picker. */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          disabled={disabled}
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
                  const selected = value?.type === 'media' && value.url === url;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        title={item.name}
                        aria-pressed={selected}
                        onClick={() =>
                          onChange({
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
    </div>
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
