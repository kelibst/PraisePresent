import { useEffect, useRef, useState } from 'react';
import { Check, Ear, Gauge, Power, Radar, Send, Sparkles, X } from 'lucide-react';
import { PaneHeader, SlidePreview } from '@/renderer/components/common';
import { Badge } from '@/renderer/components/ui/badge';
import { cn } from '@/renderer/lib/utils';
import { useAiConsole } from '@/renderer/features/ai/useAiConsole';
import { EqVisualizer } from '@/renderer/features/ai/EqVisualizer';
import { shouldAutoProject } from '@/shared/ai/autoProject';
import type { AiCandidate } from '@/shared/schemas/ai';
import type { BibleVerse } from '@/shared/schemas/scripture';

// Live Detect — the in-Present live console (CLAUDE.md §5.4). This is the ONE
// Live-Detect UI (§1.9): the standalone page is gone. It shows LIVE OPERATION
// ONLY — Start/Stop listening, a passive⇄drive toggle, the scrolling transcript,
// the always-available typed-text path, and detected candidates the operator
// reviews and sends live. ALL config (audio source, agent, API key, thresholds,
// kill-switch) lives in Settings → AI & Privacy — none of it appears here.
//
// EFFICIENCY (hard requirement, M2): this tab only mounts when it is the active
// source tab (PresentPage lazy-mounts tab bodies), and `useAiConsole` subscribes
// to the AI streams ONLY while listening — so an idle tab holds no listeners and
// Stop/unmount tears them down. It feeds the SAME shared deck via `onProject`
// (from the single `usePresentDeck`); it NEVER opens its own present subscription.
// Keys are never rendered/logged (§1.7); tokens only, no hex (§5.6).

type Props = {
  /** Route a reviewed candidate through the single shared present deck. */
  onProject: (verses: BibleVerse[], index?: number) => void;
};

export default function LiveDetectTab({ onProject }: Props) {
  const console = useAiConsole();
  const [text, setText] = useState('');

  const status = console.status;
  const listening = status?.listening ?? false;
  const killed = status ? !status.enabled : false;
  const selected = console.candidates[console.selectedIndex] ?? null;

  const submit = () => {
    if (!text.trim()) return;
    void console.submitText(text);
    setText('');
  };

  const sendLive = (c: AiCandidate) => {
    onProject(c.verses, 0);
  };

  // AUTO-PROJECT (R8): off by default. When the operator has enabled it in Settings,
  // the highest-confidence candidate that clears the threshold is sent live without
  // a click — using the SAME shared gate main applies, so the safety rule can't
  // drift. We project at most once per distinct best-candidate so a re-pushed batch
  // never re-fires. This is the only place a detection reaches the audience without
  // an operator click, and only when explicitly opted in above a high threshold.
  const lastAutoRef = useRef<string | null>(null);
  useEffect(() => {
    if (!status) return;
    const best = console.candidates.reduce<AiCandidate | null>(
      (top, c) => (!top || c.confidence > top.confidence ? c : top),
      null,
    );
    if (!best) return;
    const key = `${best.reference}@${best.confidence}`;
    if (lastAutoRef.current === key) return;
    if (shouldAutoProject(status, best.confidence)) {
      lastAutoRef.current = key;
      onProject(best.verses, 0);
    }
  }, [console.candidates, status, onProject]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
      <PaneHeader
        label={
          <span className="flex items-center gap-2">
            <span>Live Detect</span>
            <Badge variant="warn" className="px-1.5 py-0 text-[10px] uppercase tracking-wide">
              AI · Beta
            </Badge>
          </span>
        }
        icon={<Ear />}
        actions={
          <button
            type="button"
            disabled={killed || !status}
            onClick={() => void (listening ? console.stopListening() : console.startListening())}
            aria-pressed={listening}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
              listening
                ? 'bg-pp-accent/15 text-pp-accent hover:bg-pp-accent/25'
                : 'bg-pp-surface-2 text-pp-text-muted hover:bg-pp-surface-alt',
            )}
            title={
              killed
                ? 'AI is off — enable it in Settings → AI & Privacy'
                : listening
                  ? 'Stop listening'
                  : 'Start listening'
            }
          >
            <Power className="size-3.5" aria-hidden />
            {listening ? 'Stop' : 'Start'}
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
        {/* Kill-switch notice — config lives in Settings, but tell the operator. */}
        {killed && (
          <p
            className="rounded-md border border-pp-border-soft bg-pp-surface-2 px-3 py-2 text-xs text-pp-text-muted"
            role="status"
          >
            AI detection is off. Turn it on in Settings → AI &amp; Privacy.
          </p>
        )}

        {/* Detection mode (live operation — passive ⇄ drive). */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel icon={<Gauge className="size-3.5" aria-hidden />}>Detection mode</FieldLabel>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Detection mode">
            <ModeCard
              title="Passive"
              desc="Surface candidates — you confirm and send each one."
              selected={status?.mode === 'passive'}
              disabled={killed || !status}
              onClick={() => void console.setMode('passive')}
            />
            <ModeCard
              title="Drive"
              desc="Auto-advance detected verses (still operator-confirmed unless auto-project is on)."
              selected={status?.mode === 'drive'}
              disabled={killed || !status}
              onClick={() => void console.setMode('drive')}
            />
          </div>
        </div>

        {/* Live transcript. */}
        <div className="flex min-h-28 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <FieldLabel>Live transcript</FieldLabel>
            <span className="flex items-center gap-2">
              <EqVisualizer active={listening} />
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-[11px] font-semibold',
                  listening ? 'text-pp-accent' : 'text-pp-text-dim',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    listening ? 'animate-pp-pulse bg-pp-accent' : 'bg-pp-text-dim',
                  )}
                  aria-hidden
                />
                {listening ? 'Listening' : 'Idle'}
              </span>
            </span>
          </div>
          <div
            className="max-h-40 min-h-20 flex-1 overflow-y-auto rounded-md border border-pp-border-soft bg-pp-surface-2 p-3 text-sm text-pp-text-body"
            aria-live="polite"
            aria-label="Live transcript"
          >
            {console.transcript.length === 0 ? (
              <p className="text-xs text-pp-text-dim">
                {killed
                  ? 'AI is off.'
                  : listening
                    ? 'Listening for speech…'
                    : 'Not listening — press Start, or type below.'}
              </p>
            ) : (
              <p className="leading-relaxed">
                {console.transcript.map((seg) => (
                  <span key={seg.id}>{seg.text} </span>
                ))}
              </p>
            )}
          </div>
        </div>

        {/* Typed-text detect path (always usable — the Phase 4 text path). */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="detect-input"
            className="text-xs font-semibold uppercase tracking-wider text-pp-text-label"
          >
            Paste or type what&apos;s being said
          </label>
          <textarea
            id="detect-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="e.g. Turn with me to John three sixteen, and then to Romans 8:28…"
            className="w-full resize-y rounded-md border border-pp-border-strong bg-pp-surface-2 px-3 py-2 text-sm text-pp-text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          />
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-pp-accent px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-pp-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            <Send className="size-3.5" aria-hidden />
            Detect references
          </button>
        </div>

        {/* Detected candidates — reviewed, then sent to the shared deck. */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <FieldLabel icon={<Radar className="size-3.5" aria-hidden />}>Detected</FieldLabel>
            {console.candidates.length > 0 && (
              <span className="text-[11px] text-pp-text-muted">
                {console.candidates.length} in queue
              </span>
            )}
          </div>

          {!selected ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-pp-border-soft p-5 text-center">
              <Sparkles className="size-6 text-pp-text-dim" aria-hidden />
              <p className="max-w-[28ch] text-xs text-pp-text-dim">
                Type or speak a passage — detected references appear here for you to review and send
                live.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="truncate text-lg font-bold text-pp-text-primary">
                  {selected.reference}
                </h3>
                <ConfidencePill value={selected.confidence} />
              </div>
              <SlidePreview
                variant="sm"
                active
                lines={selected.verses[0] ? [selected.verses[0].text] : undefined}
                reference={selected.reference}
                badge={{ label: 'Detected', tone: 'accent' }}
              />
              {selected.verses.length > 1 && (
                <p className="text-xs text-pp-text-muted">
                  {selected.verses.length} verses · projects as a {selected.verses.length}-slide
                  deck
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => console.dismiss(console.selectedIndex)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-pp-border-strong bg-pp-surface-2 px-3 py-2 text-sm font-medium text-pp-text-body transition-colors hover:bg-pp-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                >
                  <X className="size-3.5" aria-hidden />
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => sendLive(selected)}
                  aria-label={`Send ${selected.reference} live`}
                  title={`Send ${selected.reference} to the audience screen`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-pp-accent px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-pp-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                >
                  <Send className="size-3.5" aria-hidden />
                  Send to Live
                </button>
              </div>
            </div>
          )}

          {/* Review queue — other detected candidates, selectable. */}
          {console.candidates.length > 1 && (
            <ul className="mt-1 flex flex-col gap-1" aria-label="Detected references">
              {console.candidates.map((c, i) => (
                <li key={`${c.reference}-${i}`}>
                  <button
                    type="button"
                    aria-current={i === console.selectedIndex}
                    onClick={() => console.select(i)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                      i === console.selectedIndex
                        ? 'border-pp-accent bg-pp-accent/10'
                        : 'border-pp-border-soft bg-pp-surface-2 hover:bg-pp-surface-alt',
                    )}
                  >
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate font-medium',
                        i === console.selectedIndex ? 'text-pp-accent' : 'text-pp-text-body',
                      )}
                    >
                      {c.reference}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-pp-text-muted">
                      {Math.round(c.confidence * 100)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function FieldLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-pp-text-label">
      {icon}
      {children}
    </span>
  );
}

function ModeCard({
  title,
  desc,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  desc: string;
  selected: boolean | undefined;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 rounded-md border p-2.5 text-left transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        selected
          ? 'border-pp-accent bg-pp-accent/10'
          : 'border-pp-border-strong bg-pp-surface-2 hover:bg-pp-surface-alt',
      )}
    >
      <span
        className={cn(
          'flex items-center justify-between text-sm font-semibold',
          selected ? 'text-pp-accent' : 'text-pp-text-body',
        )}
      >
        {title}
        {selected && <Check className="size-3.5" aria-hidden />}
      </span>
      <span className="text-[11px] leading-snug text-pp-text-muted">{desc}</span>
    </button>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
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
