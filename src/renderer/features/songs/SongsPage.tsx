import { useCallback, useEffect, useState } from 'react';
import type { Song, SongSummary } from '@/shared/schemas/song';

// Songs feature: list, import (plain text), and project a song's sections to the
// audience window via the Phase 2 present:* broadcast. Business logic lives in
// main behind window.api (CLAUDE.md §5.4) — this only renders + calls the API.
export default function SongsPage() {
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [selected, setSelected] = useState<Song | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await window.api.songs.list();
    if (res.ok) setSongs(res.data);
    else setError(res.error);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openSong = async (id: number) => {
    const res = await window.api.songs.get(id);
    if (res.ok) setSelected(res.data);
    else setError(res.error);
  };

  const importSong = async () => {
    if (!title.trim()) return;
    const res = await window.api.songs.importText({ title, author: '', text });
    if (res.ok) {
      setTitle('');
      setText('');
      await refresh();
      await openSong(res.data);
    } else {
      setError(res.error);
    }
  };

  const present = (content: string) =>
    window.api.present.setState({ mode: 'slide', slide: { text: content } });
  const black = () => window.api.present.setState({ mode: 'black', slide: null });

  return (
    <div className="flex min-h-screen gap-6 bg-background p-8">
      {/* Left: import + library */}
      <div className="flex w-80 flex-col gap-4">
        <h1 className="text-2xl font-bold text-foreground">Songs</h1>
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <input
            aria-label="Song title"
            className="rounded border bg-background px-3 py-2 text-sm"
            placeholder="Song title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            aria-label="Song lyrics"
            className="h-32 rounded border bg-background px-3 py-2 font-mono text-sm"
            placeholder={'[Verse 1]\nAmazing grace...\n\n[Chorus]\n...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={importSong}
            className="rounded bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
          >
            Import song
          </button>
        </div>
        <ul className="flex flex-col gap-1">
          {songs.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => openSong(s.id)}
                className={`w-full rounded px-3 py-2 text-left hover:bg-accent ${
                  selected?.id === s.id ? 'bg-accent text-primary' : 'text-foreground'
                }`}
              >
                <span className="font-medium">{s.title}</span>
                {s.author && <span className="ml-2 text-sm text-muted-foreground">{s.author}</span>}
              </button>
            </li>
          ))}
          {songs.length === 0 && <li className="text-sm text-muted-foreground">No songs yet.</li>}
        </ul>
      </div>

      {/* Right: selected song sections + live controls */}
      <div className="flex-1">
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        {!selected && <p className="text-muted-foreground">Select or import a song to present.</p>}
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">{selected.title}</h2>
              <button
                onClick={black}
                className="rounded bg-black px-4 py-2 font-medium text-white hover:opacity-80"
              >
                Black
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {selected.sections.map((sec, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase text-muted-foreground">
                      {sec.label}
                    </span>
                    <button
                      onClick={() => present(sec.content)}
                      className="rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      Present
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-foreground">{sec.content}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
