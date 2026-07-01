import type { HardwareSignals, CapabilityTier, TierOverride } from '@/shared/schemas/capability';

// Pure capability-tier heuristic (B6a). No electron/node imports so Vitest can
// unit-test every signal combination in isolation (CLAUDE.md §5.8) — the electron
// signal-gathering lives in capabilityService.ts.
//
// Philosophy (plan/rerendering_engine/media-pipeline.mermaid): adapt, don't punish.
// LOW is the 10–15-year-old church PC — any strong low signal forces it so the
// projector path stays smooth (lighter effects/renditions). HIGH comfortably runs
// full-fidelity renditions and every effect. STANDARD is everything in between.

// Tunable thresholds (kept named so they're easy to revisit against B0 numbers).
const LOW_MEM_GB = 6;
const LOW_MAX_CORES = 2;
const HIGH_MEM_GB = 16;
const HIGH_MIN_CORES = 8;

export function autoTier(s: HardwareSignals): CapabilityTier {
  // Software compositing, low RAM, or very few cores → the projector must stay
  // smooth, so cap to LOW (instant cut, light renditions).
  if (!s.gpuCompositing || s.totalMemGb < LOW_MEM_GB || s.cpuCores <= LOW_MAX_CORES) {
    return 'low';
  }
  // Roomy RAM + hardware video decode + many cores → full fidelity.
  if (s.totalMemGb >= HIGH_MEM_GB && s.hardwareVideoDecode && s.cpuCores >= HIGH_MIN_CORES) {
    return 'high';
  }
  return 'standard';
}

// Apply the operator override: `auto` trusts detection, anything else forces a tier.
export function resolveTier(auto: CapabilityTier, override: TierOverride): CapabilityTier {
  return override === 'auto' ? auto : override;
}
