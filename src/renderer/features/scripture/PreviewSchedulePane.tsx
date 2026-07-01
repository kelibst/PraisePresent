import { useState } from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '@/renderer/lib/utils';
import { PaneHeader, ScheduleRow, SlidePreview } from '@/renderer/components/common';
import type { ScheduleItemType } from '@/renderer/components/common';
import type { Plan } from '@/shared/schemas/plan';
import type { SlideBackground } from '@/shared/schemas/present';
import { referenceLabel } from './scriptureDeck';
import type { StagedPassage } from '@/renderer/features/present/usePresentDeck';
import BackgroundEditor from '@/renderer/features/present/BackgroundEditor';

// Pane 2: the staged-verse Preview (read-only SlidePreview, lock badge) with
// Send-to-Live / Set-as-Next actions, stacked over the active service's Schedule
// (ScheduleRow per plan item). Scripture is edit-locked everywhere (§ design).
// Pure view: it renders props + calls back; no window.api here (the parent owns
// staging + present; planning truth comes from useActiveService) (§1.3).

const PLAN_TYPE: Record<string, ScheduleItemType> = {
  scripture: 'scripture',
  song: 'song',
  media: 'media',
  custom: 'announcement',
};

type Props = {
  staged: StagedPassage | null;
  plan: Plan | null;
  planLoading: boolean;
  onSendLive: () => void;
  onSetNext: () => void;
  /** Append the staged passage to the active service as a scripture item. */
  onAddToPlan: () => void;
  /** The current live slide's background (raw override), for the editor's state. */
  liveBackground: SlideBackground | null;
  /**
   * The service-wide default background. A staged passage is a text slide, so the
   * preview shows the default it will inherit when sent (a per-slide override is
   * set later, live). `null` = the gradient backdrop.
   */
  defaultBackground: SlideBackground | null;
  /** Whether a live deck exists — gates the background editor. */
  hasDeck: boolean;
  /** Set/clear the live slide background (applyToAll paints every slide). */
  onSetBackground: (background: SlideBackground | null, applyToAll: boolean) => void;
};

export default function PreviewSchedulePane({
  staged,
  plan,
  planLoading,
  onSendLive,
  onSetNext,
  onAddToPlan,
  liveBackground,
  defaultBackground,
  hasDeck,
  onSetBackground,
}: Props) {
  const lead = staged ? staged.verses[staged.index] : null;
  // The Background editor is a panel toggled from the controls row (design): it
  // stays out of the way until the operator opens it.
  const [showBg, setShowBg] = useState(false);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-pp-border-soft bg-pp-surface-1">
      {/* Preview of the staged verse. */}
      <section className="flex shrink-0 flex-col border-b border-pp-border-soft">
        <PaneHeader label="Preview" meta="Read-only" />
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pp-text-dim">
              Up next{lead ? ` · ${referenceLabel(lead)}` : ''}
            </span>
          </div>
          <SlidePreview
            variant="lg"
            active
            lines={lead ? [lead.text] : undefined}
            reference={lead ? referenceLabel(lead) : undefined}
            // A staged verse is a text-only slide (no media, no per-slide override
            // yet), so its effective background IS the service default — passing it
            // directly is correct, not a bypass of `effectiveBackground`. The actual
            // override is set later, live, on the deck.
            background={defaultBackground ?? undefined}
            badge={{ label: 'Scripture · read-only', tone: 'neutral' }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSendLive}
              disabled={!lead}
              className="flex-1 rounded-md bg-pp-accent px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-pp-accent-hover disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              Send to Live
            </button>
            <button
              type="button"
              onClick={onSetNext}
              disabled={!lead}
              className="rounded-md border border-pp-border-strong bg-pp-surface-2 px-3 py-2 text-sm font-medium text-pp-text-body transition-colors hover:bg-pp-surface-alt disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              Set as Next
            </button>
            <button
              type="button"
              onClick={() => setShowBg((v) => !v)}
              aria-pressed={showBg}
              aria-label="Background"
              title="Background"
              className={cn(
                'rounded-md border px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                showBg
                  ? 'border-pp-accent/50 bg-pp-accent/15 text-pp-accent-light'
                  : 'border-pp-border-strong bg-pp-surface-2 text-pp-text-muted hover:bg-pp-surface-alt hover:text-pp-text-body',
              )}
            >
              <ImageIcon className="size-4" aria-hidden />
            </button>
          </div>
          {showBg && (
            <BackgroundEditor
              current={liveBackground}
              hasDeck={hasDeck}
              onApply={onSetBackground}
            />
          )}
        </div>
      </section>

      {/* Active service schedule. */}
      <section className="flex min-h-0 flex-1 flex-col">
        <PaneHeader
          label="Schedule"
          meta={plan ? plan.name : planLoading ? 'Loading…' : 'No active service'}
        />
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3">
          {plan && plan.items.length > 0 ? (
            plan.items
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <ScheduleRow
                  key={`${item.sortOrder}-${item.title}`}
                  type={PLAN_TYPE[item.kind] ?? 'announcement'}
                  title={item.title || 'Untitled'}
                  meta={item.content || undefined}
                />
              ))
          ) : (
            <p className="px-1 py-2 text-sm text-pp-text-muted">
              {plan ? 'This service has no items yet.' : 'Pick an active service to see its plan.'}
            </p>
          )}

          <button
            type="button"
            onClick={onAddToPlan}
            disabled={!plan || !lead}
            title={
              !plan
                ? 'Pick an active service to add scripture'
                : !lead
                  ? 'Stage a verse to add it'
                  : `Add ${referenceLabel(lead)} to ${plan.name}`
            }
            className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-pp-border-strong px-3 py-2 text-xs font-medium text-pp-text-muted transition-colors hover:border-pp-accent/50 hover:bg-pp-accent/10 hover:text-pp-accent-light disabled:cursor-not-allowed disabled:text-pp-text-dim disabled:hover:border-pp-border-strong disabled:hover:bg-transparent disabled:hover:text-pp-text-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            <Plus className="size-3.5" aria-hidden /> {lead ? 'Add to service' : 'Add item'}
          </button>
        </div>
      </section>
    </div>
  );
}
