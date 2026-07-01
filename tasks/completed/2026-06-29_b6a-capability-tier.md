# Capability probe + tier + operator override (adapt, don't punish)
- **ID:** 2026-06-29_b6a-capability-tier
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** implementer (security review REQUIRED — main/IPC/preload, §7)
- **Status:** done

## Goal
Detect the machine's rendering capability at startup → a Low/Standard/High tier,
with a persisted operator override (auto | low | standard | high). Expose it over a
zod-validated IPC surface. First consumer: the audience skips the opacity cross-fade
when the GPU is NOT compositing (software path) — weak/old machines get an instant cut
instead of a CPU-bound animation. The tier is the foundation B6b uses to pick a media
rendition per machine ("adapt, don't punish; clamp to the projector, never to the
weakest machine"). No native deps.

## Scope (files/areas)
- src/shared/schemas/capability.ts — tier/override/info schemas + types + settings key
- src/main/services/capabilityTier.ts (+ .test.ts) — PURE autoTier()/resolveTier() heuristic
- src/main/services/capabilityService.ts — gather signals (os + app.getGPUFeatureStatus), persist override
- src/shared/constants/channels.ts — capability:get, capability:set-override
- src/main/ipc/capabilityHandlers.ts + ipc/index.ts — register
- src/preload/index.ts + api.d.ts — window.api.capability.get()/setOverride()
- src/main/index.ts — capabilityService.init() before openWindows
- src/renderer/features/presentation/AudienceView.tsx — read capability; force cut when !gpuCompositing

## Rules that apply
- CLAUDE.md §1.3 (no privileged power in renderer — only the service touches GPU/os),
  §5.2/§5.3 (main is source of truth; zod-validated IPC), §5.7 (fail safe), §5.8 (tests).
  Phase brief: plan/prompt.md §4 (capability tiers) + plan/rerendering_engine/media-pipeline.mermaid.

## Acceptance criteria
- [ ] Pure tier heuristic unit-tested across RAM/cores/GPU combinations.
- [ ] Override persists via settingsRepository; auto resolves from signals.
- [ ] IPC zod-validated; renderer reads tier only through window.api.capability.
- [ ] Audience forces instant cut when gpuCompositing is false (weak/software path).
- [ ] tsc + lint clean; all existing 218 unit + 18 e2e stay green.
- [x] reviewer + security sign-off (§7).

## Outcome (filled on completion)
Implemented as scoped. Pure tier heuristic (`capabilityTier.ts`, 9 unit cases incl.
exact boundaries) separated from electron signal-gathering (`capabilityService.ts`:
os RAM/cores + `app.getGPUFeatureStatus`, fail-safe, conservative fallback). Operator
override persists via settingsRepository and is re-validated on read. New zod-validated
IPC domain (`capability:get`/`set-override`) → preload `window.api.capability` → typed
`CapabilityInfo`. First consumer: AudienceView forces an instant cut when
`gpuCompositing` is false (software path) — capable machines keep the cross-fade.
**Reviews:** security SIGNED OFF (no findings) + correctness SIGNED OFF (two low/advisory
notes — exact-boundary tests + a cleaner e2e assertion — both applied). 227 unit + 19 e2e
green; tsc + lint clean. Foundation for B6b's per-machine media-rendition selection.
