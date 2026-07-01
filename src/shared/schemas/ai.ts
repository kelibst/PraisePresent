import { z } from 'zod';
import { bibleVerse } from './scripture';

// AI scripture-detection schemas (CLAUDE.md §5.1/§5.3). Phase 4 text path: the
// renderer submits free text (typed/pasted/transcribed) and gets back resolved
// candidate references for the operator to review and project (human-in-the-loop
// — never auto-projected here). ASR (audio) and online LLM modes land later.

export const aiSubmitText = z.object({
  text: z.string().min(1).max(20000),
});

export const detectionType = z.enum(['explicit', 'book_chapter']);

// A detected reference that resolved to real verses, ready for the review queue.
export const aiCandidate = z.object({
  reference: z.string(), // canonical label, e.g. "John 3:16"
  type: detectionType,
  confidence: z.number().min(0).max(1),
  triggerText: z.string(), // the span in the source text that triggered it
  verses: z.array(bibleVerse),
});

// --- A1 orchestrator control surface --------------------------------------
// Interfaces + in-memory state only (no real audio/network/keys here — A2/A4).
// Default mode is passive (operator-confirmed, never auto-projected — R8).

// passive = surface candidates, operator projects; drive = (later) auto-advance.
export const detectionMode = z.enum(['passive', 'drive']);

// A lightweight detected reference (no resolved verses) for transcript display.
export const detectedReference = z.object({
  reference: z.string(), // canonical label, e.g. "John 3:16"
  type: detectionType,
  confidence: z.number().min(0).max(1),
});

// A transcription engine the operator can select. `kind` separates offline-local
// (model-gated) from online-cloud (key-gated); `installed`/`hasKey` say whether
// it is actually usable right now. All stubs in A1 — capture lands in A2/A4.
export const transcriptionAgentKind = z.enum(['offline-local', 'online-cloud']);
export const transcriptionAgent = z.object({
  id: z.string(),
  name: z.string(),
  kind: transcriptionAgentKind,
  online: z.boolean(),
  requiresKey: z.boolean(),
  installed: z.boolean(),
  hasKey: z.boolean(),
});

// An available audio input the operator could listen on. Labels are enumerated
// in the renderer via `navigator.mediaDevices` (a Web API — the only privileged
// thing allowed there, §5.2); main holds only the *selected* id.
export const audioSource = z.object({
  id: z.string(),
  label: z.string(),
});

// The lifecycle of a model-gated local engine (e.g. whisper.cpp). `absent` =
// not downloaded; `downloading` = a fetch is in flight; `ready` = installed and
// usable. The real download lands later (R6) — for now the manager only ever
// reports `absent` and the download action is a no-op stub.
export const modelState = z.enum(['absent', 'downloading', 'ready']);

// Model-download-manager status for a local engine, surfaced to Settings. The
// interface is stable now; the binary/weights are deferred behind it (R6).
export const aiModelStatus = z.object({
  agentId: z.string(),
  installed: z.boolean(),
  state: modelState,
  // Operator-facing reason when the model can't be made ready in this build.
  detail: z.string().optional(),
  // Download progress 0..1 while `state` is `downloading` (omitted otherwise).
  progress: z.number().min(0).max(1).optional(),
});

// The one capture rate the whole pipeline standardizes on. whisper.cpp requires
// 16 kHz; Deepgram/AssemblyAI accept it; it keeps the PCM stream small. The
// renderer downsamples its mic to exactly this before streaming frames to main.
export const TARGET_SAMPLE_RATE = 16000;

// A frame of captured microphone audio streamed renderer → main while listening.
// The renderer (the only place allowed `navigator.mediaDevices`, §5.2) downsamples
// to 16 kHz mono 16-bit PCM — the lowest common denominator every ASR backend
// accepts (whisper.cpp + Deepgram linear16 + AssemblyAI pcm_s16le). It is a
// FIRE-AND-FORGET stream (`ipcMain.on`, not invoke); validated cheaply at the
// boundary (§5.3) — the payload is binary, so we bound its size rather than its
// contents. ~6 s @ 16 kHz is a generous per-frame ceiling against a hostile sender.
export const MAX_PCM_SAMPLES = 16000 * 6;
export const aiAudioFrame = z.object({
  sampleRate: z.number().int().positive().max(192000),
  pcm: z.instanceof(Int16Array).refine((a) => a.length > 0 && a.length <= MAX_PCM_SAMPLES, {
    message: 'PCM frame is empty or exceeds the maximum size',
  }),
});

// One chunk of (eventually) transcribed speech, with any references found in it.
export const transcriptSegment = z.object({
  id: z.string(),
  text: z.string(),
  at: z.number(), // epoch ms
  refs: z.array(detectedReference).optional(),
});

// Auto-project guard (R8). Disabled by default — even in `drive` mode the
// operator must opt in, and candidates below `minConfidence` are never
// auto-projected. The default config NEVER auto-projects at all.
export const autoProjectConfig = z.object({
  enabled: z.boolean(),
  minConfidence: z.number().min(0).max(1),
});

// The full orchestrator status the renderer renders. `enabled=false` is the hard
// kill-switch (forces listening=false). `online` is the operator's cloud opt-in.
// `autoProject` is the (off-by-default) high-confidence guard; `transcriptOnly`
// shows the transcript while detection is suppressed.
export const aiStatus = z.object({
  enabled: z.boolean(),
  mode: detectionMode,
  listening: z.boolean(),
  activeAgentId: z.string(),
  online: z.boolean(),
  autoProject: autoProjectConfig,
  transcriptOnly: z.boolean(),
  // The operator-selected audio input id (the device list is read separately via
  // listSources; capture itself is deferred behind the ASR interface).
  selectedSourceId: z.string(),
  lastError: z.string().optional(),
});

// Per-agent key presence, surfaced to the renderer. The key VALUE never crosses
// the bridge (§1.7) — only whether one is stored and an optional masked hint.
export const aiKeyStatus = z.object({
  hasKey: z.boolean(),
  // e.g. "••••cdef" — a masked last-4 hint, never the key itself.
  hint: z.string().optional(),
});

// IPC inputs (renderer -> main). The renderer is never trusted; main validates.
export const aiSetMode = z.object({ mode: detectionMode });
export const aiSetEnabled = z.object({ enabled: z.boolean() });
export const aiSetAgent = z.object({ agentId: z.string().min(1) });
export const aiSetOnline = z.object({ online: z.boolean() });
export const aiSetAutoProject = autoProjectConfig;
export const aiSetTranscriptOnly = z.object({ transcriptOnly: z.boolean() });
export const aiSetSource = z.object({ sourceId: z.string().min(1) });
// The renderer-supplied audio device labels (it owns `navigator.mediaDevices`).
// Validated at the boundary like any other untrusted payload (§5.3); an empty
// list is allowed (main falls back to the built-in default source).
export const aiListSources = z.object({ sources: z.array(audioSource) });
export const aiModelStatusRequest = z.object({ agentId: z.string().min(1) });
export const aiDownloadModel = z.object({ agentId: z.string().min(1) });

// Key management (A2). The renderer may SET a key for an agent and CLEAR it, but
// it can only ever READ a boolean back — the value never returns over the bridge.
export const aiSetApiKey = z.object({
  agentId: z.string().min(1),
  // Bound the input so a hostile renderer can't push an unbounded blob into
  // secure storage; real keys are well under this.
  apiKey: z.string().min(1).max(500),
});
export const aiHasKey = z.object({ agentId: z.string().min(1) });
export const aiClearApiKey = z.object({ agentId: z.string().min(1) });

export type AiSubmitText = z.infer<typeof aiSubmitText>;
export type AiAudioFrame = z.infer<typeof aiAudioFrame>;
export type DetectionType = z.infer<typeof detectionType>;
export type AiCandidate = z.infer<typeof aiCandidate>;
export type DetectionMode = z.infer<typeof detectionMode>;
export type DetectedReference = z.infer<typeof detectedReference>;
export type TranscriptionAgentKind = z.infer<typeof transcriptionAgentKind>;
export type TranscriptionAgent = z.infer<typeof transcriptionAgent>;
export type AudioSource = z.infer<typeof audioSource>;
export type ModelState = z.infer<typeof modelState>;
export type AiModelStatus = z.infer<typeof aiModelStatus>;
export type TranscriptSegment = z.infer<typeof transcriptSegment>;
export type AutoProjectConfig = z.infer<typeof autoProjectConfig>;
export type AiStatus = z.infer<typeof aiStatus>;
export type AiKeyStatus = z.infer<typeof aiKeyStatus>;
export type AiSetMode = z.infer<typeof aiSetMode>;
export type AiSetEnabled = z.infer<typeof aiSetEnabled>;
export type AiSetAgent = z.infer<typeof aiSetAgent>;
export type AiSetOnline = z.infer<typeof aiSetOnline>;
export type AiSetAutoProject = z.infer<typeof aiSetAutoProject>;
export type AiSetTranscriptOnly = z.infer<typeof aiSetTranscriptOnly>;
export type AiSetSource = z.infer<typeof aiSetSource>;
export type AiListSources = z.infer<typeof aiListSources>;
export type AiModelStatusRequest = z.infer<typeof aiModelStatusRequest>;
export type AiDownloadModel = z.infer<typeof aiDownloadModel>;
export type AiSetApiKey = z.infer<typeof aiSetApiKey>;
export type AiHasKey = z.infer<typeof aiHasKey>;
export type AiClearApiKey = z.infer<typeof aiClearApiKey>;
