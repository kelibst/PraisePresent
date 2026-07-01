import { ipcMain } from 'electron';
import { z } from 'zod';
import { CHANNELS } from '@/shared/constants/channels';
import {
  aiSubmitText,
  aiSetMode,
  aiSetEnabled,
  aiSetAgent,
  aiSetOnline,
  aiSetAutoProject,
  aiSetTranscriptOnly,
  aiSetApiKey,
  aiHasKey,
  aiClearApiKey,
  aiListSources,
  aiSetSource,
  aiModelStatusRequest,
  aiDownloadModel,
  aiAudioFrame,
} from '@/shared/schemas/ai';
import { aiScriptureDetector } from '../services/aiScriptureDetector';
import { handle } from './registry';
import type {
  AiCandidate,
  AiKeyStatus,
  AiModelStatus,
  AiStatus,
  AudioSource,
  TranscriptionAgent,
} from '@/shared/schemas/ai';

// AI detection IPC — zod-validated at the main boundary (§5.3). The text path
// runs fully offline (no network/secrets). The A1 control surface (agents, mode,
// kill-switch, status, sources, listen) holds in-memory orchestrator state; real
// audio capture / online keys land in A2/A4. The renderer is never trusted.
export function registerAiHandlers(): void {
  handle(CHANNELS.ai.submitText, aiSubmitText, ({ text }): AiCandidate[] =>
    aiScriptureDetector.submitText(text),
  );

  // Read-only enumerations.
  handle(CHANNELS.ai.listAgents, z.undefined(), (): readonly TranscriptionAgent[] =>
    aiScriptureDetector.listAgents(),
  );
  // Audio sources: the renderer enumerates device LABELS (it owns
  // `navigator.mediaDevices`) and pushes them here; main stores them + the
  // selected id. Returns the merged list (always includes the built-in default).
  handle(CHANNELS.ai.listSources, aiListSources, ({ sources }): readonly AudioSource[] =>
    aiScriptureDetector.setSources(sources),
  );
  handle(
    CHANNELS.ai.setSource,
    aiSetSource,
    ({ sourceId }): AiStatus => aiScriptureDetector.setSource(sourceId),
  );

  // Local model download manager (R6 — stable interface, binary deferred).
  handle(
    CHANNELS.ai.modelStatus,
    aiModelStatusRequest,
    ({ agentId }): AiModelStatus => aiScriptureDetector.modelStatus(agentId),
  );
  handle(
    CHANNELS.ai.downloadModel,
    aiDownloadModel,
    ({ agentId }): AiModelStatus => aiScriptureDetector.downloadModel(agentId),
  );

  handle(CHANNELS.ai.status, z.undefined(), (): AiStatus => aiScriptureDetector.status());

  // State transitions — each returns the new status so the UI updates in one hop.
  handle(CHANNELS.ai.setMode, aiSetMode, ({ mode }): AiStatus => aiScriptureDetector.setMode(mode));
  handle(
    CHANNELS.ai.setEnabled,
    aiSetEnabled,
    ({ enabled }): AiStatus => aiScriptureDetector.setEnabled(enabled),
  );
  handle(
    CHANNELS.ai.setAgent,
    aiSetAgent,
    ({ agentId }): AiStatus => aiScriptureDetector.setAgent(agentId),
  );
  // Cloud opt-in + safety controls (A3). setOnline wires A1's reducer action.
  handle(
    CHANNELS.ai.setOnline,
    aiSetOnline,
    ({ online }): AiStatus => aiScriptureDetector.setOnline(online),
  );
  handle(
    CHANNELS.ai.setAutoProject,
    aiSetAutoProject,
    (config): AiStatus => aiScriptureDetector.setAutoProject(config),
  );
  handle(
    CHANNELS.ai.setTranscriptOnly,
    aiSetTranscriptOnly,
    ({ transcriptOnly }): AiStatus => aiScriptureDetector.setTranscriptOnly(transcriptOnly),
  );

  // Capture controls. startListening opens the active agent's ASR session (or
  // returns a clear status when it can't); stopListening tears it down.
  handle(
    CHANNELS.ai.startListening,
    z.undefined(),
    (): AiStatus => aiScriptureDetector.startListening(),
  );
  handle(
    CHANNELS.ai.stopListening,
    z.undefined(),
    (): AiStatus => aiScriptureDetector.stopListening(),
  );

  // The hot PCM stream (renderer → main). Fire-and-forget `on`, not `invoke` — no
  // per-frame Result round-trip. Validated at the boundary like any untrusted
  // payload (§5.3); a frame that fails validation is dropped silently rather than
  // logged per-frame (per-frame logging on a hot path is itself a DoS vector).
  ipcMain.on(CHANNELS.ai.audioFrame, (_event, raw) => {
    const parsed = aiAudioFrame.safeParse(raw);
    if (!parsed.success) return;
    aiScriptureDetector.pushAudio(parsed.data.pcm);
  });

  // Key management (A2). setApiKey/clearApiKey store/remove the cloud key in OS
  // secure storage; hasKey returns ONLY a boolean (+ masked hint) — the key
  // value never crosses the bridge (§1.7).
  handle(
    CHANNELS.ai.setApiKey,
    aiSetApiKey,
    ({ agentId, apiKey }): AiKeyStatus => aiScriptureDetector.setApiKey(agentId, apiKey),
  );
  handle(
    CHANNELS.ai.hasKey,
    aiHasKey,
    ({ agentId }): AiKeyStatus => aiScriptureDetector.hasKey(agentId),
  );
  handle(
    CHANNELS.ai.clearApiKey,
    aiClearApiKey,
    ({ agentId }): AiKeyStatus => aiScriptureDetector.clearApiKey(agentId),
  );
}
