import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import LibraryPane from './LibraryPane';
import SectionsPane from './SectionsPane';
import SongLivePane from './SongLivePane';
import SongEditorDialog from './SongEditorDialog';
import { useSongsPresenter } from './useSongsPresenter';

// Songs workspace (CLAUDE.md §5.4): a full-height 3-pane row inside the app
// shell's scrollable main. Pane 1 library + search + category filters → opens a
// song; Pane 2 its sections (click presents one); Pane 3 mirrors the live output.
// Unlike scripture, songs ARE editable — New / Import / Edit / Delete are wired
// through window.api via the presenter hook (§1.3). One songs UI (§1.9): the old
// single-column import form is folded into the New-song dialog.

export default function SongsPage() {
  const p = useSongsPresenter();
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="grid h-full min-h-0 grid-cols-[1.15fr_1.1fr_1fr] gap-3 bg-background p-3">
      <LibraryPane
        songs={p.songs}
        selectedId={p.selected?.id ?? null}
        onSelect={(id) => void p.open(id)}
        onNew={() => setEditorMode('create')}
      />

      <SectionsPane
        song={p.selected}
        live={p.live}
        onPresent={p.presentSection}
        onEdit={() => p.selected && setEditorMode('edit')}
        onDelete={() => p.selected && setConfirmDelete(true)}
        onNew={() => setEditorMode('create')}
      />

      <SongLivePane live={p.live} onNext={p.next} onBlack={p.black} onClear={p.clear} />

      {p.error && (
        <p role="alert" className="fixed bottom-4 left-4 z-50 text-sm text-pp-error">
          {p.error}
        </p>
      )}

      {/* New-song dialog. */}
      <SongEditorDialog
        mode="create"
        open={editorMode === 'create'}
        onOpenChange={(o) => setEditorMode(o ? 'create' : null)}
        onCreate={p.importText}
      />

      {/* Edit-lyrics dialog (only when a song is open). */}
      {p.selected && (
        <SongEditorDialog
          mode="edit"
          open={editorMode === 'edit'}
          onOpenChange={(o) => setEditorMode(o ? 'edit' : null)}
          song={p.selected}
          onSave={p.update}
        />
      )}

      {/* Delete confirmation. */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete song?</DialogTitle>
            <DialogDescription>
              {p.selected
                ? `“${p.selected.title}” will be removed from the library. This can't be undone.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const id = p.selected?.id;
                setConfirmDelete(false);
                if (id != null) void p.remove(id);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
