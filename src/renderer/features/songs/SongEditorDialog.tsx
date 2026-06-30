import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import { Textarea } from '@/renderer/components/ui/textarea';
import type { Song, SongImportText } from '@/shared/schemas/song';

// New-song / edit-lyrics modal for the Songs screen. Two modes share one dialog
// (CLAUDE.md §1.9 — one songs editor):
//   • create — title + author + plain lyric text → importText (main parses the
//     [Label]-delimited blocks into sections).
//   • edit — title/author/ccli + one textarea per existing section (editing the
//     section content in place) → update(Song). The section structure (kind /
//     label / sortOrder) is preserved; only metadata + content change, so no
//     parser is duplicated in the renderer (the parser stays in main, §5.2).
// Pure form; all persistence is delegated to the parent via onCreate/onSave.

type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: SongImportText) => Promise<boolean>;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song;
  onSave: (song: Song) => Promise<boolean>;
};

export type SongEditorDialogProps = CreateProps | EditProps;

export default function SongEditorDialog(props: SongEditorDialogProps) {
  return props.mode === 'create' ? <CreateDialog {...props} /> : <EditDialog {...props} />;
}

const PLACEHOLDER =
  '[Verse 1]\nAmazing grace how sweet the sound\n\n[Chorus]\nWas blind but now I see';

function CreateDialog({ open, onOpenChange, onCreate }: CreateProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setTitle('');
      setAuthor('');
      setText('');
      setBusy(false);
    }
  }, [open]);

  const canSave = title.trim().length > 0 && !busy;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    const ok = await onCreate({ title: title.trim(), author: author.trim(), text });
    setBusy(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New song</DialogTitle>
          <DialogDescription>
            Paste lyrics with <code>[Verse 1]</code> / <code>[Chorus]</code> headers; blank lines
            separate sections.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="song-title">Title</Label>
            <Input
              id="song-title"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Amazing Grace"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="song-author">Author</Label>
            <Input
              id="song-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="John Newton"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="song-text">Lyrics</Label>
            <Textarea
              id="song-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              className="h-48 font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {busy ? 'Saving…' : 'Create song'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ open, onOpenChange, song, onSave }: EditProps) {
  const [title, setTitle] = useState(song.title);
  const [author, setAuthor] = useState(song.author);
  const [ccli, setCcli] = useState(song.ccli);
  const [contents, setContents] = useState<string[]>(song.sections.map((s) => s.content));
  const [busy, setBusy] = useState(false);

  // Re-seed the form whenever a different song is opened for editing.
  useEffect(() => {
    if (open) {
      setTitle(song.title);
      setAuthor(song.author);
      setCcli(song.ccli);
      setContents(song.sections.map((s) => s.content));
      setBusy(false);
    }
  }, [open, song]);

  const canSave = title.trim().length > 0 && !busy;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    const next: Song = {
      ...song,
      title: title.trim(),
      author: author.trim(),
      ccli: ccli.trim(),
      sections: song.sections.map((sec, i) => ({ ...sec, content: contents[i] ?? sec.content })),
    };
    const ok = await onSave(next);
    setBusy(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit song</DialogTitle>
          <DialogDescription>
            Edit the title, author, CCLI#, and lyrics. Section structure is preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-author">Author</Label>
              <Input id="edit-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-ccli">CCLI#</Label>
            <Input id="edit-ccli" value={ccli} onChange={(e) => setCcli(e.target.value)} />
          </div>
          <div className="grid gap-2">
            {song.sections.map((sec, i) => (
              <div key={i} className="grid gap-1.5">
                <Label htmlFor={`edit-section-${i}`} className="uppercase tracking-wide">
                  {sec.label}
                </Label>
                <Textarea
                  id={`edit-section-${i}`}
                  value={contents[i] ?? ''}
                  onChange={(e) =>
                    setContents((prev) => prev.map((c, j) => (j === i ? e.target.value : c)))
                  }
                  className="min-h-[88px] font-mono"
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
