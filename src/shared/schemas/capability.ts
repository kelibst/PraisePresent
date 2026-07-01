import { z } from 'zod';

// Rendering capability tiering (B6a). The app sizes up the machine it runs on and
// adapts the projector path: "adapt, don't punish; clamp to the projector, never to
// the weakest machine." The tier drives effect richness today (audience cross-fade
// vs cut) and media-rendition selection later (B6b). Owned by main (§5.3); the
// renderer reads it only through window.api.capability.

// Auto-detected capability bucket.
export const capabilityTier = z.enum(['low', 'standard', 'high']);
export type CapabilityTier = z.infer<typeof capabilityTier>;

// Operator override. `auto` = trust the auto-detected tier; otherwise force a tier
// (e.g. an operator who knows their hardware better than the heuristic does).
export const tierOverride = z.enum(['auto', 'low', 'standard', 'high']);
export type TierOverride = z.infer<typeof tierOverride>;

// Raw hardware signals — surfaced for transparency/diagnostics (Settings) and so a
// consumer can key off a precise signal rather than the coarse tier (e.g. the
// audience forces a cut when the GPU is NOT compositing).
export const hardwareSignals = z.object({
  /** Total system RAM in GB (rounded to 0.1). */
  totalMemGb: z.number(),
  /** Logical CPU cores. */
  cpuCores: z.number().int(),
  /** Is the GPU compositing the page (true) or is it the software/CPU path (false)? */
  gpuCompositing: z.boolean(),
  /** Is hardware video decode available (vs software decode)? */
  hardwareVideoDecode: z.boolean(),
});
export type HardwareSignals = z.infer<typeof hardwareSignals>;

export const capabilityInfo = z.object({
  /** The RESOLVED tier the app uses (after applying the override). */
  tier: capabilityTier,
  /** What auto-detection alone produced (shown next to the override in Settings). */
  autoTier: capabilityTier,
  /** The operator's current override setting. */
  override: tierOverride,
  /** The raw signals the auto tier was derived from. */
  signals: hardwareSignals,
});
export type CapabilityInfo = z.infer<typeof capabilityInfo>;

// IPC input: set the operator override.
export const setTierOverrideInput = z.object({ override: tierOverride });
export type SetTierOverrideInput = z.infer<typeof setTierOverrideInput>;

// Persisted settings key for the operator override.
export const TIER_OVERRIDE_KEY = 'capability.tierOverride';

// Parse a persisted override value, defaulting to 'auto' for missing/garbage.
export function parseTierOverride(value: string | null): TierOverride {
  const parsed = tierOverride.safeParse(value);
  return parsed.success ? parsed.data : 'auto';
}
