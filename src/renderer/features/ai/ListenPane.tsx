import { useState } from 'react';
import { Check, Ear, Gauge, KeyRound, Mic, PackageOpen, Power, Send, Wifi } from 'lucide-react';
import { PaneHeader } from '@/renderer/components/common';
import { Badge } from '@/renderer/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { cn } from '@/renderer/lib/utils';
import type {
  AiStatus,
  AudioSource,
  DetectionMode,
  TranscriptionAgent,
  TranscriptSegment,
} from '@/shared/schemas/ai';
import { EqVisualizer } from './EqVisualizer';

// Pane 1 of the Live-Detect console: where the operator wires the input. Audio
// source picker (A4 sources, read-only) → mode (passive/drive) → agent registry
// (honest gated states) → the live transcript + the always-available typed-text
// path. All state comes from `useAiConsole`/`useAudioSources`; this pane only
// renders + raises callbacks (§1.3). Keys are NEVER shown — only a gated badge
// telling the operator a key/model is missing (§1.7).

type Props = {
  status: AiStatus;
  agents: TranscriptionAgent[];
  sources: AudioSource[];
  transcript: TranscriptSegment[];
  onSetSource: (id: string) => void;
  onSetMode: (mode: DetectionMode) => void;
  onSetAgent: (id: string) => void;
  onSetEnabled: (enabled: boolean) => void;
  onSubmitText: (text: string) => void;
};

// The operator-facing reason an agent can't run right now (§1.7 — never a key).
function gatedReason(a: TranscriptionAgent): string | null {
  if (a.kind === 'offline-local' && !a.installed) return 'Not installed';
  if (a.requiresKey && !a.hasKey) return 'Add a key';
  return null;
}

export default function ListenPane({
  status,
  agents,
  sources,
  transcript,
  onSetSource,
  onSetMode,
  onSetAgent,
  onSetEnabled,
  onSubmitText,
}: Props) {
  const [text, setText] = useState('');
  const killed = !status.enabled;

  const submit = () => {
    if (!text.trim()) return;
    onSubmitText(text);
    setText('');
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
      <PaneHeader
        label={
          <span className="flex items-center gap-2">
            <span role="heading" aria-level={1}>
              Live Detect
            </span>
            <Badge variant="warn" className="px-1.5 py-0 text-[10px] uppercase tracking-wide">
              AI · Beta
            </Badge>
          </span>
        }
        icon={<Ear />}
        actions={
          <button
            type="button"
            onClick={() => onSetEnabled(killed)}
            aria-pressed={!killed}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
              killed
                ? 'bg-pp-error/15 text-pp-error hover:bg-pp-error/25'
                : 'bg-pp-surface-2 text-pp-text-muted hover:bg-pp-surface-alt',
            )}
            title={killed ? 'AI is stopped — click to enable' : 'Kill switch — stop all detection'}
          >
            <Power className="size-3.5" aria-hidden />
            {killed ? 'Stopped' : 'Stop AI'}
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
        {/* Audio source + EQ. */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel icon={<Mic className="size-3.5" aria-hidden />}>Audio source</FieldLabel>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <select
                value={status.selectedSourceId}
                onChange={(e) => onSetSource(e.target.value)}
                disabled={killed}
                aria-label="Audio input source"
                className="w-full truncate rounded-md border border-pp-border-strong bg-pp-surface-2 px-3 py-2 text-sm text-pp-text-body disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <EqVisualizer
              active={status.listening}
              className="shrink-0 rounded-md border border-pp-border-soft bg-pp-surface-2 px-2"
            />
          </div>
        </div>

        {/* Detection mode. */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel icon={<Gauge className="size-3.5" aria-hidden />}>Detection mode</FieldLabel>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Detection mode">
            <ModeCard
              title="Passive"
              desc="Surface candidates — you confirm and send each one."
              selected={status.mode === 'passive'}
              disabled={killed}
              onClick={() => onSetMode('passive')}
            />
            <ModeCard
              title="Drive"
              desc="Auto-advance detected verses (still operator-confirmed unless auto-project is on)."
              selected={status.mode === 'drive'}
              disabled={killed}
              onClick={() => onSetMode('drive')}
            />
          </div>
        </div>

        {/* Transcription agents. */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Transcription agent</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {agents.map((a) => (
              <AgentCard
                key={a.id}
                agent={a}
                selected={a.id === status.activeAgentId}
                disabled={killed}
                onClick={() => onSetAgent(a.id)}
              />
            ))}
          </div>
        </div>

        {/* Live transcript. */}
        <div className="flex min-h-32 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <FieldLabel>Live transcript</FieldLabel>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] font-semibold',
                status.listening ? 'text-pp-accent' : 'text-pp-text-dim',
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  status.listening ? 'animate-pp-pulse bg-pp-accent' : 'bg-pp-text-dim',
                )}
                aria-hidden
              />
              {status.listening ? 'Listening' : 'Idle'}
            </span>
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto rounded-md border border-pp-border-soft bg-pp-surface-2 p-3 text-sm text-pp-text-body"
            aria-live="polite"
            aria-label="Live transcript"
          >
            {transcript.length === 0 ? (
              <p className="text-xs text-pp-text-dim">
                {killed
                  ? 'AI is stopped.'
                  : status.listening
                    ? 'Listening for speech…'
                    : 'No transcript yet — start listening or type below.'}
              </p>
            ) : (
              <p className="leading-relaxed">
                {transcript.map((seg) => (
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
            Paste or type what's being said
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
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
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

function AgentCard({
  agent,
  selected,
  disabled,
  onClick,
}: {
  agent: TranscriptionAgent;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const gated = gatedReason(agent);
  // Online dot = warn (cloud/data leaves the box); offline-local = accent (safe).
  const isOnline = agent.kind === 'online-cloud';

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      title={agent.name}
      className={cn(
        'flex flex-col gap-1 rounded-md border p-2.5 text-left transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        selected
          ? 'border-pp-accent bg-pp-accent/10'
          : 'border-pp-border-strong bg-pp-surface-2 hover:bg-pp-surface-alt',
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              isOnline ? 'bg-pp-warn' : 'bg-pp-accent',
            )}
            aria-hidden
          />
          <span
            className={cn(
              'truncate text-sm font-semibold',
              selected ? 'text-pp-accent' : 'text-pp-text-body',
            )}
          >
            {agent.name}
          </span>
        </span>
        {selected && <Check className="size-3.5 shrink-0 text-pp-accent" aria-hidden />}
      </span>
      <span className="flex items-center justify-between gap-1">
        <span className="text-[10px] uppercase tracking-wide text-pp-text-dim">
          {isOnline ? 'Online · cloud' : 'Offline · local'}
        </span>
        {gated ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 rounded-full bg-pp-warn/15 px-1.5 py-0.5 text-[10px] font-medium text-pp-warn">
                  {agent.requiresKey && !agent.hasKey ? (
                    <KeyRound className="size-2.5" aria-hidden />
                  ) : (
                    <PackageOpen className="size-2.5" aria-hidden />
                  )}
                  {gated}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {agent.requiresKey && !agent.hasKey
                  ? 'Add this agent’s API key in Settings to use it.'
                  : 'This local model isn’t installed yet.'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : isOnline ? (
          <Wifi className="size-3 text-pp-warn" aria-hidden />
        ) : null}
      </span>
    </button>
  );
}
