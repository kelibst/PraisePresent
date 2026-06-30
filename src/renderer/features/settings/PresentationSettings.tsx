import { useCallback, useEffect, useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { Ban } from 'lucide-react';
import { SlidePreview, type SlidePreviewBackground } from '@/renderer/components/common';
import BackgroundPicker from '@/renderer/features/present/BackgroundPicker';
import type { SlideBackground } from '@/shared/schemas/present';

// Settings → Presentation: the persisted, service-wide DEFAULT slide background.
// One background (color or image/video) applied to every slide that lacks its own
// — across the CURRENT live deck and future decks — so scripture/song/AI-detected
// slides share a consistent look without re-setting it per passage. It is live
// present state owned by main (§1.5 truth in SQLite; §5.3 main owns present), so
// saving updates whatever is already on screen immediately. A per-slide override
// in the Present preview still wins; media slides are skipped. Read/written
// through the present domain (`getState`/`setDefaultBackground`) — no new
// settings plumbing in the renderer (§1.3, §1.9). Main re-validates (§5.7).

// A short sample so the preview shows the chosen background behind real text.
const SAMPLE_LINES = ['For God so loved the world,', 'that he gave his only Son.'];

export default function PresentationSettings() {
  const [background, setBackground] = useState<SlideBackground | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void window.api.present.getState().then((res) => {
      if (active && res.ok) setBackground(res.data.defaultBackground);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (next: SlideBackground | null) => {
    setBackground(next);
    setSaved(false);
    const res = await window.api.present.setDefaultBackground(next);
    if (res.ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    }
  }, []);

  // SlideBackground and SlidePreviewBackground are structurally identical (color |
  // media image/video); narrow for the preview prop.
  const previewBg: SlidePreviewBackground | undefined = background ?? undefined;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Service background</h2>
            <p className="text-sm text-muted-foreground">
              Applied to every slide you send live during a service. Override a single slide from
              the Present preview; clear this to use the default gradient.
            </p>
          </div>
          {saved && (
            <span
              className="flex shrink-0 items-center gap-1 text-sm text-primary"
              role="status"
              aria-label="Saved"
            >
              <FiCheck aria-hidden /> Saved
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Live preview of the chosen default behind sample text. */}
          <div className="w-full sm:max-w-xs">
            <SlidePreview lines={SAMPLE_LINES} reference="John 3:16" background={previewBg} />
          </div>

          {/* Picker + clear. */}
          <div className="flex flex-1 flex-col gap-3">
            <BackgroundPicker value={background} onChange={(bg) => void persist(bg)} />
            <button
              type="button"
              onClick={() => void persist(null)}
              disabled={!background}
              className="inline-flex items-center gap-1.5 self-start rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <Ban className="size-3" aria-hidden /> Clear default (use gradient)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
