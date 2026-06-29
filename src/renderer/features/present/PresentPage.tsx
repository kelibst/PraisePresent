import { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { useActiveService } from '@/renderer/features/planning/useActiveService';
import SearchPane from '@/renderer/features/scripture/SearchPane';
import PreviewSchedulePane from '@/renderer/features/scripture/PreviewSchedulePane';
import { cn } from '@/renderer/lib/utils';
import { usePresentDeck } from './usePresentDeck';
import LiveCockpit from './LiveCockpit';
import LiveDetectTab from './LiveDetectTab';

// The unified Present screen (CLAUDE.md §5.4): a full-height 3-pane row inside the
// app shell's scrollable main. It merges the old standalone Scripture workspace
// and the standalone Present cockpit into ONE UI (§1.9):
//   LEFT   — a tabbed Source panel (Scripture search/stage | Live Detect, M1 idle);
//   MIDDLE — Preview of the staged verse over the active service Schedule;
//   RIGHT  — the live-output cockpit (deck rail + on-screen-now/next + transport +
//            transitions), with all keyboard controls preserved.
// EFFICIENCY (hard requirement): exactly ONE present.onState subscription on the
// whole screen — usePresentDeck owns it and powers preview + deck rail + cockpit.
// Tabs lazy-mount (only the active tab body renders) so M1 never mounts AI streams.
// All data flows through window.api via the hook + useActiveService (§1.3).

type SourceTab = 'scripture' | 'detect';

const SOURCE_TABS: { id: SourceTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'scripture', label: 'Scripture', icon: BookOpen },
  { id: 'detect', label: 'Live Detect', icon: Sparkles },
];

export default function PresentPage() {
  const deck = usePresentDeck();
  const { plan, loading: planLoading } = useActiveService();
  const [tab, setTab] = useState<SourceTab>('scripture');

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.15fr)] bg-background">
      {/* ── LEFT: tabbed Source panel (full-bleed column) ────────────────── */}
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-pp-border-soft bg-pp-surface-1">
        <div
          className="flex shrink-0 items-center gap-1.5 border-b border-pp-border-soft px-3 py-2"
          role="tablist"
          aria-label="Source"
        >
          {SOURCE_TABS.map((t) => {
            const Icon = t.icon;
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                  selected
                    ? 'border-pp-accent/50 bg-pp-accent/20 text-pp-accent-light'
                    : 'border-pp-border-strong text-pp-text-muted hover:text-pp-text-body',
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Only the active tab body mounts (lazy-mount — no idle AI streams). */}
        <div className="flex min-h-0 flex-1 flex-col">
          {tab === 'scripture' ? (
            <SearchPane
              staged={deck.staged}
              onStage={deck.stage}
              onStageIndex={deck.setStagedIndex}
              onSendLive={deck.sendLive}
            />
          ) : (
            <LiveDetectTab onProject={deck.projectVerses} />
          )}
        </div>
      </section>

      {/* ── MIDDLE: Preview + Schedule ───────────────────────────────────── */}
      <PreviewSchedulePane
        staged={deck.staged}
        plan={plan}
        planLoading={planLoading}
        onSendLive={deck.sendLive}
        onSetNext={deck.setAsNext}
        liveBackground={deck.live.deck[deck.live.index]?.background ?? null}
        hasDeck={deck.live.deck.length > 0}
        onSetBackground={deck.setBackground}
      />

      {/* ── RIGHT: live-output cockpit ───────────────────────────────────── */}
      <LiveCockpit
        state={deck.live}
        onNext={deck.next}
        onPrev={deck.prev}
        onGoto={deck.goto}
        onBlack={deck.black}
        onBlank={deck.blank}
        onClear={deck.clear}
        onSetTransition={deck.setTransition}
        onUpdateText={deck.updateText}
      />
    </div>
  );
}
