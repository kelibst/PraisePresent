# P4-T5 — Accuracy & latency harness (gates the phase)
- **ID:** 2026-06-27_p4-t5-accuracy-harness
- **Phase:** 4
- **Assigned agent type:** tester
- **Status:** blocked (needs labeled sermon-audio eval corpus)

## Goal
Labeled sermon-audio eval corpus (~5–10h, varied accents/phrasing) → metrics: reference precision/recall/F1, resolution precision, latency, book-name WER, false-positives/min; per-build dashboard + CI regression gate; adversarial set (near-miss book names, noise, rapid multi-ref). Capture operator overrides as new labeled data (with consent).

## Note
A TEXT-level extractor eval (no audio) is buildable now against the T1 extractor and can seed this harness; the full audio harness needs the corpus. Bars in the phase-4 brief table. Regressions block merge.

## Rules
§5.8, spec §6.3.
