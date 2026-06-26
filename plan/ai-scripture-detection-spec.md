# Deliverable 4 — Technical Specification: AI Auto-Scripture Detection

**Date:** 2026-06-26
**Feature:** Automatically detect when a speaker references Scripture (spoken or typed) and surface the correct verse(s) for the operator — in both **online** and **offline** modes.
**Depends on:** Phase 3 scripture domain (SQLite Bible + resolver) from [04-implementation-timeline.md](04-implementation-timeline.md).

---

## 1. Problem & scope

During a service a preacher says things like *"turn with me to the book of John, chapter 3 verse 16,"* or *"as Paul writes to the Romans…,"* or quotes a verse without naming it. The feature should **detect the reference, resolve it to canonical verse(s), and queue them for one-click projection** — fast enough to keep up with live speech, and **operator-confirmed** (never auto-projects without a human gate, to avoid wrong-verse embarrassment on screen).

**Three detection inputs, in priority order:**
1. **Explicit reference in speech** — "John 3:16", "first Corinthians thirteen". (Primary, highest accuracy.)
2. **Book/chapter mention** — "the book of Romans, chapter 8". (Partial — offer chapter, let operator pick verse.)
3. **Verbatim quotation without citation** — speaker quotes text; match against Bible by semantic/exact search. (Best-effort, online-leaning.)

**Non-goals (v1):** sermon transcription as a product, theological interpretation, non-Bible citations.

---

## 2. Two-mode architecture

Both modes share one pipeline; only the **ASR** and **reference-resolution** engines differ. The pipeline lives in the **main process** as `AIScriptureDetector`, exposed to the renderer via `window.api.ai` (typed IPC).

```
 Audio (mic)  ──► [1] ASR / Speech-to-Text ──► transcript stream
        │                                            │
 Typed text ──────────────────────────────────────► ├──► [2] Reference Extractor
                                                     │        (NER + grammar + fuzzy book match)
                                                     │              │
                                          [3] Resolver ◄────────────┘ candidate refs
                                                     │  (SQLite Bible lookup + disambiguation)
                                                     ▼
                                    [4] Confidence filter + dedupe
                                                     ▼
                          [5] Operator review queue (renderer) ──► one-click project
```

| Stage | **Online mode** | **Offline mode** |
|---|---|---|
| [1] ASR | Cloud streaming STT (e.g. provider streaming API) tuned for low latency | **whisper.cpp** (Whisper `base`/`small`, int8/Q5 quantized) running locally on CPU/GPU |
| [2] Extract | Cloud LLM (Claude) for robust reference + paraphrase detection | Deterministic grammar + fuzzy book matcher (local), optional small local LLM |
| [3] Resolve | Local SQLite Bible (same in both modes) | Local SQLite Bible |
| [4] Filter | Confidence from model logprobs/score | Heuristic confidence from match strength |
| [5] Review | Same renderer UI in both modes | Same |

**Design rule:** the **resolver and Bible data are always local** (the Bible is small and already in SQLite from Phase 3). Only ASR and the *fuzzy/paraphrase* extraction step benefit from the cloud. This keeps offline mode fully functional and makes online→offline degradation seamless.

---

## 3. Online mode

### 3.1 ASR
- Streaming cloud STT with partial results (interim transcripts) for low perceived latency.
- Domain biasing: pass a **phrase/vocabulary hint list** of all 66 book names + common variants ("first John", "song of solomon", "psalm/psalms") to cut book-name word-error-rate.
- Push-to-talk or continuous VAD-gated capture; only send audio when speech is detected (privacy + cost).

### 3.2 Reference extraction (LLM)
- Send rolling transcript windows (e.g. last ~30 s) to **Claude** via the Anthropic API with **tool use** so the model returns *structured* references, not prose. Use the latest model; for live latency consider Haiku-class for speed and escalate to a larger model only on ambiguous segments.
- Tool schema (the model is forced to call this):

```jsonc
// tool: report_scripture_references
{
  "references": [{
    "book": "John",            // canonical book name
    "chapter": 3,
    "verse_start": 16,
    "verse_end": 16,           // null if whole chapter / unknown
    "translation_hint": null,  // e.g. "KJV" if speaker named it
    "trigger_text": "turn to John three sixteen",
    "type": "explicit",        // explicit | book_chapter | quotation
    "confidence": 0.97         // 0..1
  }]
}
```

- **Quotation detection (type=`quotation`):** when the speaker quotes without citing, the model returns the quoted span; the resolver does a **full-text / embedding search** against the local Bible to find the source verse.
- **System prompt** pins: output only via the tool; resolve spoken numerals ("thirty-three" → 33, "first" → 1 Corinthians); never invent references; mark uncertainty in `confidence`.

### 3.3 Endpoints & transport
- `POST` streaming to the STT provider (WebSocket or chunked HTTP) — audio frames up; interim+final transcripts down.
- Anthropic Messages API (HTTPS, streaming) for extraction; tool-use response parsed in main.
- **API keys** stored via OS secure storage (Phase 2 config), never in the renderer. All calls originate in the **main process**; renderer only sends transcript text / receives results over IPC. CSP `connect-src` allow-lists exactly these hosts (Audit S2).
- **Data-transmission protocol:** audio + transcript leave the device in online mode — see § 7 privacy. TLS only; no payload persisted server-side beyond the request; user-visible "online AI is on" indicator and a hard kill-switch.

---

## 4. Offline mode

> Requirement: run locally, no continuous internet, while maintaining usable detection accuracy.

### 4.1 ASR — whisper.cpp
- **whisper.cpp** (GGML/GGUF), models **`base` (~142 MB)** default, **`small` (~466 MB)** for higher accuracy, **`tiny` (~75 MB)** for low-end PCs — user-selectable in settings.
- int8 / Q5_1 quantization; CPU by default, optional GPU (Metal/CUDA/Vulkan) when present.
- Run as a **sidecar binary** (simplest, language-agnostic, sandbox-friendly) or **napi-rs/N-API binding**; invoked by `AIScriptureDetector` ([04](04-implementation-timeline.md) §4).
- Streaming via short rolling windows (e.g. 5–10 s chunks with overlap) for near-live latency on the explicit-reference path.

### 4.2 Reference extraction — deterministic, no cloud
A local, fully offline extractor that handles the high-value **explicit** and **book_chapter** cases without any model:
1. **Spoken-number normalization** — words→digits ("three sixteen" → 3:16; "chapter eight verse one" → 8:1; ordinals "first/second/third" → 1/2/3 books).
2. **Book matcher** — fuzzy match transcript tokens against a **book-alias table** (all 66 books + abbreviations + common ASR mis-hearings) using normalized edit distance / phonetic (Double-Metaphone) keys. Pre-built at build time; tiny.
3. **Reference grammar** — regex/state-machine over the normalized stream: `<book> [chapter] [(verse[-verse])]`.
4. **Optional local LLM (advanced offline):** a small quantized instruct model (e.g. a 1–3B GGUF via llama.cpp, or an ONNX Runtime model) for paraphrase/quotation detection when the user opts into the larger download. Off by default to keep the offline footprint small.

### 4.3 Resolver (shared, offline-capable)
- Resolve `(book, chapter, verse)` against the **local SQLite Bible** (already present from Phase 3). O(1)/indexed lookup.
- **Quotation/verbatim path (offline):** SQLite **FTS5** + optional local **sentence-embedding** index (e.g. a small ONNX embedding model, cosine top-k) over verses for "find the verse that matches this quote." Embeddings precomputed and shipped with the Bible pack.
- Disambiguation: if translation unspecified, use the user's default; if multiple plausible books (ASR noise), surface top-N to the operator.

### 4.4 Footprint (offline bundle options)

| Profile | ASR | Extractor | Quote search | Approx. extra download |
|---|---|---|---|---|
| Lite | whisper `tiny` | deterministic | FTS5 only | ~80 MB |
| Standard (default) | whisper `base` | deterministic | FTS5 + embeddings | ~200 MB |
| Max | whisper `small` | + local 1–3B LLM | embeddings | ~1.5–4 GB |

---

## 5. Integration with the core codebase

- **Module:** `src/main/services/AIScriptureDetector.ts` orchestrates ASR → extractor → resolver; selects online/offline strategy by settings + connectivity.
- **IPC surface (`window.api.ai`):**
  - `ai.startListening(opts)` / `ai.stopListening()`
  - `ai.submitText(text)` (typed-input path)
  - event stream `ai.onCandidates(refs[])` → renderer review queue
  - `ai.setMode('auto'|'online'|'offline')`, `ai.status()`
- **Reuses** the Phase 3 `ScriptureService.resolve()` and `.search()` — the AI feature adds detection *in front of* the existing scripture pipeline; it does not duplicate Bible logic.
- **UI:** a "Live Detect" panel in the presentation feature showing rolling candidates with confidence; operator clicks to stage → existing audience-window projection path. Auto-project is opt-in and confidence-gated.
- **Settings:** mode (auto/online/offline), model profile + download manager, mic device + VAD sensitivity, privacy/kill-switch, default translation, auto-project threshold.

---

## 6. Data, training, and testing

### 6.1 Data requirements
- **Bible data** (already needed for the product): full text per translation in SQLite; **book-alias table** (names, abbreviations, ASR-confusion variants, multi-language) ; precomputed **verse embeddings** for the quote path.
- **Evaluation corpus:** a labeled set of **sermon/preaching audio clips** with ground-truth `(timestamp → reference)` annotations, spanning accents, mic quality, denominational phrasing, and both explicit + paraphrased citations. ~5–10 h to start; this is the single most important data asset and gates the accuracy claims.

### 6.2 Model training / fine-tuning needs
- **ASR:** start with off-the-shelf Whisper — **no training needed for v1**. If book-name WER is too high, fine-tune Whisper on religious-vocabulary audio (LoRA / small fine-tune) or rely on vocabulary biasing (online) + the fuzzy book matcher (offline) first — cheaper and usually sufficient.
- **Extractor:** online LLM needs **prompt engineering, not training**. Offline deterministic extractor needs a curated **alias/confusion table** (data work, not training). Optional local LLM uses an off-the-shelf quantized model.
- **Embeddings:** off-the-shelf small embedding model; no training. Precompute once per translation at build time.

### 6.3 Testing & validation protocol

**Metrics (per mode, per detection type):**
- **Reference detection** — precision, recall, F1 of detected `(book,chapter,verse)` vs. ground truth.
- **Resolution accuracy** — % of detected references resolved to the *correct* verse.
- **Latency** — speech end → candidate shown (target: explicit refs **< 2 s online / < 4 s offline** on mid-spec hardware).
- **ASR quality** — WER overall and **book-name WER** specifically.
- **False-positive rate** — spurious references per minute (critical: a wrong verse on the projector is worse than a miss).

**Acceptance bars (v1):**

| | Online | Offline (Standard) |
|---|---|---|
| Explicit-reference recall | ≥ 0.92 | ≥ 0.85 |
| Resolution precision | ≥ 0.97 | ≥ 0.95 |
| False positives | < 0.2 / min | < 0.3 / min |
| Latency (explicit) | < 2 s | < 4 s |

**Test process:**
1. Unit tests for number-normalization, book matcher, grammar, resolver (deterministic, fast — fits the Vitest harness from Phase 2).
2. Component tests on the labeled audio corpus → metrics dashboard per build; **regression-gate** in CI (no metric may drop > X% between builds).
3. Adversarial set: noisy audio, overlapping speech, unusual accents, rapid multi-reference passages, near-miss book names (Philippians vs. Philemon, Jude vs. John).
4. Field pilot with 2–3 churches; capture operator overrides as new labeled data (closes the loop, with consent).
5. Privacy test: verify offline mode makes **zero network calls** (assert via CSP + network mock); verify the kill-switch.

---

## 7. Privacy, safety, and degradation

- **Online mode transmits audio/transcript off-device** → must be explicit opt-in, clearly indicated, with a one-tap kill-switch; document retention with the chosen providers; allow "transcript-only" (send text from local ASR, never raw audio) as a middle ground.
- **Offline mode = zero egress** by construction; the default for privacy-sensitive deployments.
- **Auto-degradation:** on connectivity loss mid-service, `AIScriptureDetector` silently falls back online→offline (local ASR + deterministic extractor) without operator action.
- **Human-in-the-loop:** default is operator-confirmed projection; fully automatic projection is opt-in and only above a high confidence threshold — this is the primary safeguard against a wrong verse reaching the congregation.
- **Reuse note:** any LLM integration here should follow the project's Claude API guidance (model IDs, tool use, streaming, token costs) — see the `claude-api` reference before implementing § 3.2.
