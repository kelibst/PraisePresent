import { Plus } from 'lucide-react';
import { PaneHeader, ScheduleRow, SlidePreview } from '@/renderer/components/common';
import type { ScheduleItemType } from '@/renderer/components/common';
import type { Plan } from '@/shared/schemas/plan';
import { referenceLabel } from './scriptureDeck';
import type { StagedPassage } from './useScripturePresenter';

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
};

export default function PreviewSchedulePane({
  staged,
  plan,
  planLoading,
  onSendLive,
  onSetNext,
}: Props) {
  const lead = staged ? staged.verses[staged.index] : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Preview of the staged verse. */}
      <section className="flex shrink-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
        <PaneHeader label="Preview" meta="Read-only" />
        <div className="flex flex-col gap-3 p-3">
          <SlidePreview
            variant="lg"
            active
            lines={lead ? [lead.text] : undefined}
            reference={lead ? referenceLabel(lead) : undefined}
            badge={{ label: 'Scripture · read-only', tone: 'neutral' }}
          />
          <div className="flex gap-2">
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
              className="flex-1 rounded-md border border-pp-border-strong bg-pp-surface-2 px-3 py-2 text-sm font-medium text-pp-text-body transition-colors hover:bg-pp-surface-alt disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              Set as Next
            </button>
          </div>
        </div>
      </section>

      {/* Active service schedule. */}
      <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
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
            disabled
            title="Adding scripture to the plan lands with the Plans builder"
            className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-pp-border-strong px-3 py-2 text-xs font-medium text-pp-text-dim disabled:cursor-not-allowed"
          >
            <Plus className="size-3.5" aria-hidden /> Add item
          </button>
        </div>
      </section>
    </div>
  );
}
