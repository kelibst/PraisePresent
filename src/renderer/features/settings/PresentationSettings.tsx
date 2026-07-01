import { useCallback, useEffect, useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { Ban, Save } from 'lucide-react';
import { SlidePreview, type SlidePreviewBackground } from '@/renderer/components/common';
import BackgroundPicker from '@/renderer/features/present/BackgroundPicker';
import type { SlideBackground } from '@/shared/schemas/present';

// Settings → Presentation: the persisted, service-wide DEFAULT slide background.
// One background (color or image/video) applied to every slide that lacks its own
// — across the CURRENT live deck and future decks — so scripture/song/AI-detected
// slides share a consistent look without re-setting it per passage. It is live
// present state owned by main (§1.5 truth in SQLite; §5.3 main owns present), so
// SAVING it updates whatever is already on screen immediately. A per-slide override
// in the Present preview still wins; media slides are skipped. Read/written through
// the present domain (`getState`/`setDefaultBackground`) — no new settings plumbing
// in the renderer (§1.3, §1.9). Main re-validates (§5.7).
//
// The operator stages a choice (picker updates the preview only) and then commits
// it with an explicit Save — the background is not applied to the live presentation
// until Save, so there is a clear, intentional moment of change during a service.

// A short sample so the preview shows the chosen background behind real text.
const SAMPLE_LINES = ['For God so loved the world,', 'that he gave his only Son.'];

// Structural equality for the dirty check (the values are small + consistently
// shaped, so this avoids a stringify and is explicit about what "changed" means).
function sameBackground(a: SlideBackground | null, b: SlideBackground | null): boolean {
  if (a === b) return true;
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === 'color' && b.type === 'color') return a.color === b.color;
  if (a.type === 'media' && b.type === 'media') return a.kind === b.kind && a.url === b.url;
  return false;
}

export default function PresentationSettings() {
  // `saved` = what is currently persisted/live; `draft` = the staged choice shown in
  // the preview. They diverge while the operator is editing and re-converge on Save.
  const [saved, setSaved] = useState<SlideBackground | null>(null);
  const [draft, setDraft] = useState<SlideBackground | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    let active = true;
    void window.api.present.getState().then((res) => {
      if (!active || !res.ok) return;
      setSaved(res.data.defaultBackground);
      setDraft(res.data.defaultBackground);
    });
    return () => {
      active = false;
    };
  }, []);

  const isDirty = !sameBackground(draft, saved);

  // Stage a choice (preview only) — no IPC until Save. Clears any "Saved" flag so
  // the indicator can't imply the new, unsaved choice is live.
  const stage = useCallback((next: SlideBackground | null) => {
    setDraft(next);
    setStatus('idle');
  }, []);

  // Commit: persist + apply to the live presentation (main re-validates, §5.7).
  const save = useCallback(async () => {
    setStatus('saving');
    const res = await window.api.present.setDefaultBackground(draft);
    if (res.ok) {
      setSaved(draft);
      setStatus('saved');
      window.setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } else {
      setStatus('idle');
    }
  }, [draft]);

  // SlideBackground and SlidePreviewBackground are structurally identical (color |
  // media image/video); narrow for the preview prop.
  const previewBg: SlidePreviewBackground | undefined = draft ?? undefined;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Service background</h2>
          <p className="text-sm text-muted-foreground">
            Applied to every slide you send live during a service. Override a single slide from the
            Present preview; clear this to use the default gradient. Click <strong>Save</strong> to
            apply it to the live presentation.
          </p>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Live preview of the STAGED choice behind sample text. */}
          <div className="w-full sm:max-w-xs">
            <SlidePreview lines={SAMPLE_LINES} reference="John 3:16" background={previewBg} />
          </div>

          {/* Picker + clear (stage only) and the explicit Save. */}
          <div className="flex flex-1 flex-col gap-3">
            <BackgroundPicker value={draft} onChange={stage} />

            <button
              type="button"
              onClick={() => stage(null)}
              disabled={!draft}
              className="inline-flex items-center gap-1.5 self-start rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <Ban className="size-3" aria-hidden /> Clear (use gradient)
            </button>

            <div className="mt-2 flex items-center gap-3 border-t pt-3">
              <button
                type="button"
                onClick={() => void save()}
                disabled={!isDirty || status === 'saving'}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Save className="size-4" aria-hidden />
                {status === 'saving' ? 'Saving…' : 'Save background'}
              </button>

              {status === 'saved' ? (
                <span
                  className="flex items-center gap-1 text-sm text-primary"
                  role="status"
                  aria-label="Saved"
                >
                  <FiCheck aria-hidden /> Saved — now live
                </span>
              ) : isDirty ? (
                <span className="text-sm text-muted-foreground" role="status">
                  Unsaved changes
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
