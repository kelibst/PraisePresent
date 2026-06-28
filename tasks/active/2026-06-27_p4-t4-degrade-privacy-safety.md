# P4-T4 — Auto-degrade + privacy + safety controls
- **ID:** 2026-06-27_p4-t4-degrade-privacy-safety
- **Phase:** 4
- **Assigned agent type:** security
- **Status:** blocked (depends on T2 + T3)

## Goal
Seamless online→offline fallback on connectivity loss (no operator action). Online is explicit opt-in + on-screen "online AI is on" indicator + hard kill-switch (audio leaves device). Transcript-only option. Operator-confirmed projection by default; auto-project ONLY above a high confidence threshold (configurable, off by default). R8/R11/R12.

## Rules
§1.7, §5.7, spec §7. Security sign-off: zero-egress offline guarantee, kill-switch, default never auto-projects.
