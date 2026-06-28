import { useCallback, useEffect, useState } from 'react';
import { FiImage, FiFilm, FiMusic, FiPlus, FiTrash2 } from 'react-icons/fi';
import { mediaUrl } from '@/shared/constants/media';
import type { MediaItem, MediaKind } from '@/shared/schemas/media';

// Media library: import files (referenced by path, not copied), browse them, and
// project one to the audience. All file access lives in main — this only calls
// window.api.media.* and references items by the app-media:// url (§5.2).

const KIND_ICON: Record<MediaKind, typeof FiImage> = {
  image: FiImage,
  video: FiFilm,
  audio: FiMusic,
};

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
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

  const importFiles = async () => {
    setBusy(true);
    setError(null);
    const res = await window.api.media.import();
    if (res.ok) setItems(res.data);
    else setError(res.error);
    setBusy(false);
  };

  const present = (item: MediaItem) => {
    void window.api.present.setDeck(
      [{ id: `media-${item.id}`, lines: [], media: { kind: item.kind, url: mediaUrl(item.id) } }],
      0,
    );
  };

  const remove = async (id: number) => {
    const res = await window.api.media.remove(id);
    if (res.ok) setItems(res.data);
    else setError(res.error);
  };

  const black = () => window.api.present.black();

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Media</h1>
        <div className="flex gap-2">
          <button
            onClick={importFiles}
            disabled={busy}
            className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <FiPlus aria-hidden /> {busy ? 'Adding…' : 'Add media'}
          </button>
          <button
            onClick={black}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Black
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FiImage className="h-8 w-8" aria-hidden />
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            No media yet. Use <span className="font-medium text-foreground">Add media</span> to
            import images, video, or audio for the audience screen.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onPresent={() => present(item)}
              onRemove={() => remove(item.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MediaCard({
  item,
  onPresent,
  onRemove,
}: {
  item: MediaItem;
  onPresent: () => void;
  onRemove: () => void;
}) {
  const Icon = KIND_ICON[item.kind];
  return (
    <li className="group relative overflow-hidden rounded-lg border bg-card">
      <button
        onClick={onPresent}
        className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        title={`Present ${item.name}`}
      >
        <div className="flex aspect-video items-center justify-center bg-muted">
          {item.kind === 'image' ? (
            <img src={mediaUrl(item.id)} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon className="h-10 w-10 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="flex items-center gap-2 p-2">
          <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate text-sm text-foreground">{item.name}</span>
        </div>
      </button>
      <button
        onClick={onRemove}
        aria-label={`Remove ${item.name}`}
        className="absolute right-2 top-2 rounded bg-black/60 p-1.5 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
      >
        <FiTrash2 className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}
