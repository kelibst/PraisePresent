import { PaneHeader } from '@/renderer/components/common';
import { useAudioSources } from './useAudioSources';
import { useAiConsole } from './useAiConsole';
import ListenPane from './ListenPane';
import DetectionPane from './DetectionPane';

// Live Detect — the Stage-A AI console (CLAUDE.md §5.4). A two-pane workspace
// inside the app shell's scrollable main: Pane 1 (input — audio source, mode,
// transcription agent, live transcript, and the always-available typed-text path)
// and Pane 2 (detection — the reviewed candidate + send-live). All state flows
// through `window.api.ai`/`present` via the hooks (§1.3). Human-in-the-loop is the
// default: nothing auto-projects unless the off-by-default guard is on (R8). API
// keys are never rendered — only honest "add a key / not installed" gates (§1.7).

export default function LiveDetectPage() {
  const { sources } = useAudioSources();
  const console = useAiConsole();

  if (!console.status) {
    return (
      <div className="grid h-full place-items-center bg-background p-3">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-pp-border-soft bg-pp-surface-1 p-6">
          <PaneHeader label="Live Detect" />
          <p className="text-sm text-pp-text-muted">
            {console.error ?? 'Starting the detection engine…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[1.5fr_1fr] gap-3 bg-background p-3">
      <ListenPane
        status={console.status}
        agents={console.agents}
        sources={sources}
        transcript={console.transcript}
        onSetSource={(id) => void console.setSource(id)}
        onSetMode={(mode) => void console.setMode(mode)}
        onSetAgent={(id) => void console.setAgent(id)}
        onSetEnabled={(enabled) => void console.setEnabled(enabled)}
        onSubmitText={(text) => void console.submitText(text)}
      />

      <DetectionPane
        status={console.status}
        candidates={console.candidates}
        selectedIndex={console.selectedIndex}
        onSelect={console.select}
        onDismiss={console.dismiss}
      />
    </div>
  );
}
