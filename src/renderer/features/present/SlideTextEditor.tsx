import { useEffect, useId, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import type { PresentSlide } from '@/shared/schemas/present';
import { MAX_SLIDE_LINES, MAX_SLIDE_LINE_LENGTH } from '@/shared/schemas/present';

// Inline "Edit text" affordance for the live slide, beneath the on-screen-now
// preview in the cockpit (CLAUDE.md §5.4 — operated live, keyboard-first). For an
// UNLOCKED slide (song/custom) the operator edits the displayed lines in a
// textarea and applies them to the live output. A LOCKED slide (scripture)
// renders no editor — the cockpit's "Edit locked" header pill is the sole lock
// indicator (translation integrity). The lock is also enforced in main — a
// crafted IPC can't edit scripture (§5.3). All IPC goes through the caller-
// provided `onSave`; tokens only, no hex (§5.6).

type Props = {
  /** The current live slide, or null when nothing is live. */
  slide: PresentSlide | null;
  /** Apply the edited lines to the current live slide via window.api (§1.3). */
  onSave: (lines: string[]) => void;
};

// One text line per editor row; blanks are kept (an empty slide line still
// renders safe — §5.7). Bounded to the same limits main enforces.
function linesToText(lines: string[]): string {
  return lines.join('\n');
}
function textToLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .slice(0, MAX_SLIDE_LINES)
    .map((l) => l.slice(0, MAX_SLIDE_LINE_LENGTH));
}

export default function SlideTextEditor({ slide, onSave }: Props) {
  const fieldId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const slideId = slide?.id ?? null;
  const locked = slide?.locked === true;

  // Leave edit mode whenever the live slide changes underfoot (the operator
  // advanced, or a new deck was sent) so a stale draft can't be applied to the
  // wrong slide. Re-seed the draft from the new slide.
  useEffect(() => {
    setEditing(false);
    setDraft(slide ? linesToText(slide.lines) : '');
  }, [slideId, slide]);

  // Focus the textarea when entering edit mode (keyboard-first — §5.4).
  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  // No editor for a locked (scripture) slide — the cockpit's "Edit locked" pill
  // is the lock indicator. Also a defensive guard: this component never offers an
  // edit path for locked text even if mounted with one.
  if (!slide || locked) return null;

  const save = () => {
    onSave(textToLines(draft));
    setEditing(false);
  };
  const cancel = () => {
    setDraft(linesToText(slide.lines));
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        data-testid="slide-text-edit"
        className="inline-flex items-center gap-1.5 self-start rounded-md border border-pp-border-strong bg-pp-surface-2 px-2.5 py-1 text-xs font-medium text-pp-text-body transition-colors hover:bg-pp-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      >
        <Pencil className="size-3" aria-hidden /> Edit text
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-pp-accent/50 bg-pp-surface-2 p-2.5">
      <label htmlFor={fieldId} className="text-xs font-medium text-pp-text-label">
        Edit slide text
      </label>
      <textarea
        id={fieldId}
        ref={textareaRef}
        value={draft}
        rows={Math.min(Math.max(draft.split('\n').length, 2), 8)}
        maxLength={MAX_SLIDE_LINES * (MAX_SLIDE_LINE_LENGTH + 1)}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // Ctrl/Cmd+Enter applies; Escape cancels (live-friendly — §5.4).
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        data-testid="slide-text-textarea"
        className="w-full resize-y rounded-md border border-pp-border-strong bg-pp-surface-1 px-2.5 py-1.5 text-sm text-pp-text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          data-testid="slide-text-save"
          className="rounded-md bg-pp-accent px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-pp-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          Apply to live
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-md border border-pp-border-strong bg-pp-surface-1 px-3 py-1.5 text-sm font-medium text-pp-text-body transition-colors hover:bg-pp-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          Cancel
        </button>
        <span className="ml-auto text-[10px] text-pp-text-dim" aria-hidden>
          ⌘/Ctrl+Enter applies · Esc cancels
        </span>
      </div>
    </div>
  );
}
