import { Check, ChevronRight, Radar, Send, Sparkles, X } from 'lucide-react';
import { PaneHeader, SlidePreview } from '@/renderer/components/common';
import { cn } from '@/renderer/lib/utils';
import type { AiCandidate, AiStatus } from '@/shared/schemas/ai';
import type { BibleVerse } from '@/shared/schemas/scripture';

// Pane 2 of the Live-Detect console: the detection result. Shows the selected
// candidate (from a push or a typed submit) with a confidence read-out, a preview
// of the verse, and the review queue of other candidates. Projection is ALWAYS
// operator-confirmed (R8) — even in `drive` mode nothing auto-sends unless the
// off-by-default auto-project guard is enabled, in which case we surface an honest
// "auto-sent" banner. `present.setDeck` is the only side effect, raised via props.

function deckFor(verses: BibleVerse[]) {
  return verses.map((v) => ({
    id: `${v.bookNumber}-${v.chapter}-${v.verse}`,
    lines: [v.text],
    reference: `${v.bookName} ${v.chapter}:${v.verse}`,
  }));
}

type Props = {
  status: AiStatus;
  candidates: AiCandidate[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onDismiss: (index: number) => void;
};

export default function DetectionPane({
  status,
  candidates,
  selectedIndex,
  onSelect,
  onDismiss,
}: Props) {
  const selected = candidates[selectedIndex] ?? null;
  // Auto-project is the off-by-default guard (§ R8). Only when it is enabled does
  // `drive` mode auto-send; otherwise every candidate is operator-confirmed.
  const autoActive = status.mode === 'drive' && status.autoProject.enabled;
  const autoSent =
    autoActive && !!selected && selected.confidence >= status.autoProject.minConfidence;

  const sendLive = (c: AiCandidate) => void window.api.present.setDeck(deckFor(c.verses), 0);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
      <PaneHeader
        label="Detection"
        icon={<Radar />}
        meta={candidates.length > 0 ? `${candidates.length} in queue` : undefined}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {!selected ? (
          <EmptyState mode={status.mode} />
        ) : (
          <>
            {/* Auto-sent banner — ONLY when the auto-project guard is on (R8). */}
            {autoSent && (
              <div
                className="flex items-center gap-2 rounded-md border border-pp-success/40 bg-pp-success/10 px-3 py-2 text-xs font-medium text-pp-success"
                role="status"
              >
                <Check className="size-3.5 shrink-0" aria-hidden />
                Auto-sent live ({Math.round(status.autoProject.minConfidence * 100)}%+ in Drive
                mode)
              </div>
            )}

            {/* The detected reference + confidence. */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="truncate text-2xl font-bold text-pp-text-primary">
                  {selected.reference}
                </h2>
                <ConfidencePill value={selected.confidence} />
              </div>
              {selected.triggerText && (
                <p className="truncate text-xs text-pp-text-muted">
                  matched: “{selected.triggerText}”
                </p>
              )}
            </div>

            {/* Verse preview. */}
            <SlidePreview
              variant="lg"
              active
              lines={selected.verses[0] ? [selected.verses[0].text] : undefined}
              reference={selected.reference}
              badge={{ label: 'Detected', tone: 'accent' }}
            />

            {selected.verses.length > 1 && (
              <p className="text-xs text-pp-text-muted">
                {selected.verses.length} verses · projects as a {selected.verses.length}-slide deck
              </p>
            )}

            {/* Operator actions — confirm-to-send is the default (R8). */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onDismiss(selectedIndex)}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-pp-border-strong bg-pp-surface-2 px-3 py-2 text-sm font-medium text-pp-text-body transition-colors hover:bg-pp-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                <X className="size-3.5" aria-hidden />
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => sendLive(selected)}
                aria-label={`${autoSent ? 'Re-send' : 'Review & Send'} ${selected.reference} live`}
                title={`Send ${selected.reference} to the audience screen`}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-pp-accent px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-pp-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                <Send className="size-3.5" aria-hidden />
                {autoSent ? 'Re-send Live' : 'Review & Send Live'}
              </button>
            </div>
          </>
        )}

        {/* Review queue — other detected candidates, selectable. */}
        {candidates.length > 1 && (
          <div className="mt-1 flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-pp-text-label">
              Review queue
            </span>
            <ul className="flex flex-col gap-1" aria-label="Detected references">
              {candidates.map((c, i) => (
                <li key={`${c.reference}-${i}`}>
                  <button
                    type="button"
                    aria-current={i === selectedIndex}
                    onClick={() => onSelect(i)}
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                      i === selectedIndex
                        ? 'border-pp-accent bg-pp-accent/10'
                        : 'border-pp-border-soft bg-pp-surface-2 hover:bg-pp-surface-alt',
                    )}
                  >
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate font-medium',
                        i === selectedIndex ? 'text-pp-accent' : 'text-pp-text-body',
                      )}
                    >
                      {c.reference}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-pp-text-muted">
                      {Math.round(c.confidence * 100)}%
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-pp-text-dim opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  // Confidence tone: high = success, medium = warn, low = muted.
  const tone =
    value >= 0.8
      ? 'bg-pp-success/15 text-pp-success'
      : value >= 0.6
        ? 'bg-pp-warn/15 text-pp-warn'
        : 'bg-pp-surface-2 text-pp-text-muted';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
        tone,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {pct}% match
    </span>
  );
}

function EmptyState({ mode }: { mode: AiStatus['mode'] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
      <Sparkles className="size-8 text-pp-text-dim" aria-hidden />
      <p className="text-sm font-medium text-pp-text-muted">No detection yet</p>
      <p className="max-w-[28ch] text-xs text-pp-text-dim">
        {mode === 'drive'
          ? 'Drive mode is on — detected verses will appear here, confirmed by you before they go live.'
          : 'Type or speak a passage and detected references will appear here for you to review and send live.'}
      </p>
    </div>
  );
}
