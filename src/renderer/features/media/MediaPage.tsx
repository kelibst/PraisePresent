import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Film, Music, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/renderer/lib/utils';
import { PaneHeader, SlidePreview } from '@/renderer/components/common';
import { Button } from '@/renderer/components/ui/button';
import { mediaUrl } from '@/shared/constants/media';
import type { MediaItem, MediaKind } from '@/shared/schemas/media';

// Media workspace (CLAUDE.md §5.4): a full-height 2-pane row inside the app
// shell's scrollable main. Pane 1 is a filterable grid of library tiles; Pane 2
// shows the selected item's preview, metadata, and live actions. All file access
// lives in main — this only calls window.api.media.* / window.api.present.* and
// references items by the DB-allowlisted app-media:// url (§1.3, §5.2). A missing
// or broken file fails safe to a placeholder, never a crash (§5.7).

type Filter = 'all' | MediaKind;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
];

const KIND_ICON: Record<MediaKind, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  audio: Music,
};

const KIND_LABEL: Record<MediaKind, string> = {
  image: 'IMAGE',
  video: 'VIDEO',
  audio: 'AUDIO',
};

// The live slide for a media item: media-only (no text), so the audience shows
// it full-screen. Kept in sync with the present-media shape the e2e relies on.
function mediaSlide(item: MediaItem) {
  return {
    id: `media-${item.id}`,
    lines: [] as string[],
    media: { kind: item.kind, url: mediaUrl(item.id) },
  };
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await window.api.media.list();
    if (res.ok) setItems(res.data);
    else setError(res.error);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Keep the selection valid as the library changes (import/remove).
  useEffect(() => {
    if (items.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (selectedId === null || !items.some((i) => i.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.kind === filter)),
    [items, filter],
  );

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  const importFiles = async () => {
    setBusy(true);
    setError(null);
    const res = await window.api.media.import();
    if (res.ok) setItems(res.data);
    else setError(res.error);
    setBusy(false);
  };

  const present = (item: MediaItem) => {
    void window.api.present.setDeck([mediaSlide(item)], 0);
  };

  const remove = async (id: number) => {
    setError(null);
    const res = await window.api.media.remove(id);
    if (res.ok) setItems(res.data);
    else setError(res.error);
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[1.7fr_1fr] gap-3 bg-background p-3">
      <GridPane
        items={visible}
        total={items.length}
        filter={filter}
        onFilter={setFilter}
        busy={busy}
        error={error}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onImport={importFiles}
      />

      <DetailPane item={selected} onPresent={present} onRemove={remove} />
    </div>
  );
}

function GridPane({
  items,
  total,
  filter,
  onFilter,
  busy,
  error,
  selectedId,
  onSelect,
  onImport,
}: {
  items: MediaItem[];
  total: number;
  filter: Filter;
  onFilter: (f: Filter) => void;
  busy: boolean;
  error: string | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onImport: () => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
      <PaneHeader
        label="Media"
        actions={
          <Button
            size="sm"
            onClick={onImport}
            disabled={busy}
            className="bg-pp-accent text-primary-foreground hover:bg-pp-accent-hover"
          >
            <Plus aria-hidden /> {busy ? 'Importing…' : 'Import media'}
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        {/* Type filter chips. */}
        <div
          className="inline-flex shrink-0 gap-1 self-start rounded-md bg-pp-surface-2 p-1"
          role="tablist"
          aria-label="Filter media by type"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => onFilter(f.id)}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                filter === f.id
                  ? 'bg-pp-accent text-primary-foreground shadow-sm'
                  : 'text-pp-text-muted hover:text-pp-text-body',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && <p className="shrink-0 text-sm text-destructive">{error}</p>}

        {total === 0 ? (
          <EmptyState />
        ) : items.length === 0 ? (
          <p className="text-sm text-pp-text-muted">No {filter} media in the library.</p>
        ) : (
          <ul
            className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))' }}
          >
            {items.map((item) => (
              <MediaTile
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={() => onSelect(item.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function MediaTile({
  item,
  selected,
  onSelect,
}: {
  item: MediaItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        title={item.name}
        className={cn(
          'group flex w-full flex-col overflow-hidden rounded-lg border bg-pp-surface-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          selected
            ? 'border-pp-accent ring-2 ring-pp-accent'
            : 'border-pp-border-soft hover:border-pp-border-strong',
        )}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-pp-surface-alt">
          <Thumbnail item={item} />
          <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-white">
            {KIND_LABEL[item.kind]}
          </span>
        </div>
        <span className="truncate px-2 py-1.5 text-xs text-pp-text-body">{item.name}</span>
      </button>
    </li>
  );
}

// Grid thumbnail. Image → object-cover via app-media://; video → play-circle
// overlay; audio → waveform glyph. A failed image fails safe to the kind glyph
// (§5.7) rather than a broken-image icon — the grid never breaks.
function Thumbnail({ item }: { item: MediaItem }) {
  const [failed, setFailed] = useState(false);
  const Icon = KIND_ICON[item.kind];

  if (item.kind === 'image' && !failed) {
    return (
      <img
        src={mediaUrl(item.id)}
        alt=""
        aria-hidden
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }

  if (item.kind === 'video') {
    return (
      <div className="flex h-full w-full items-center justify-center text-pp-text-muted">
        <PlayCircle className="size-9" aria-hidden />
      </div>
    );
  }

  // audio (or a failed image) — kind glyph on the surface.
  return (
    <div className="flex h-full w-full items-center justify-center text-pp-text-muted">
      <Icon className="size-9" aria-hidden />
    </div>
  );
}

function DetailPane({
  item,
  onPresent,
  onRemove,
}: {
  item: MediaItem | null;
  onPresent: (item: MediaItem) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
      <PaneHeader label="Selected" meta={item ? KIND_LABEL[item.kind] : undefined} />

      {!item ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-sm text-pp-text-muted">
            Select an item from the library to preview and present it.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
          <SlidePreview
            variant="lg"
            media={{ kind: item.kind, url: mediaUrl(item.id) }}
            badge={{ label: KIND_LABEL[item.kind] }}
          />

          {/* Metadata: name · type · path. (Dims/size are not in the schema yet.) */}
          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-pp-text-muted">Name</dt>
              <dd className="min-w-0 truncate text-right font-medium text-pp-text-body">
                {item.name}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-pp-text-muted">Type</dt>
              <dd className="text-pp-text-body">{KIND_LABEL[item.kind]}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-pp-text-muted">Path</dt>
              <dd className="min-w-0 truncate text-right text-pp-text-muted" title={item.path}>
                {item.path}
              </dd>
            </div>
          </dl>

          <div className="mt-auto flex flex-col gap-2">
            <Button
              onClick={() => onPresent(item)}
              className="bg-pp-accent text-primary-foreground hover:bg-pp-accent-hover"
            >
              <PlayCircle aria-hidden /> Present
            </Button>
            <Button
              variant="outline"
              disabled
              title="No dedicated background layer yet — use Present to project this full-screen."
            >
              Set as background
            </Button>
            <Button
              variant="ghost"
              onClick={() => onRemove(item.id)}
              className="text-pp-text-muted hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 aria-hidden /> Remove
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-pp-accent/10 text-pp-accent">
        <ImageIcon className="size-8" aria-hidden />
      </div>
      <p className="max-w-md text-sm text-pp-text-muted">
        No media yet. Use <span className="font-medium text-pp-text-body">Import media</span> to
        bring in images, video, or audio for the audience screen.
      </p>
    </div>
  );
}
