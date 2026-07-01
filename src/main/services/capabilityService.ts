import { app } from 'electron';
import os from 'node:os';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { autoTier, resolveTier } from './capabilityTier';
import {
  TIER_OVERRIDE_KEY,
  parseTierOverride,
  type CapabilityInfo,
  type HardwareSignals,
  type TierOverride,
} from '@/shared/schemas/capability';
import log from '../infra/logger';

// Capability service (B6a) — the ONLY place that touches electron GPU info + os
// hardware signals (CLAUDE.md §1.3/§5.2). It gathers static signals once at startup,
// derives an auto tier via the pure heuristic, and applies the operator's persisted
// override. The renderer reaches all of this only through window.api.capability.

// Conservative fallback if signals are read before init / on a gather failure:
// assume a mid machine with HW compositing so the audience keeps its cross-fade
// rather than being needlessly downgraded.
const FALLBACK_SIGNALS: HardwareSignals = {
  totalMemGb: 8,
  cpuCores: 4,
  gpuCompositing: true,
  hardwareVideoDecode: false,
};

let cachedSignals: HardwareSignals | null = null;

// A GPU feature is hardware-enabled when its status starts with "enabled" and is
// not a software fallback. electron returns strings like "enabled", "enabled_on",
// "software_only", "disabled_software", "unavailable_software".
function isHardwareEnabled(value: string | undefined): boolean {
  if (!value) return false;
  return value.startsWith('enabled') && !value.includes('software');
}

// Read the GPU feature status; falls back to the conservative path on any error so
// gathering never throws (§5.7).
function gpuSignals(): Pick<HardwareSignals, 'gpuCompositing' | 'hardwareVideoDecode'> {
  try {
    const status = app.getGPUFeatureStatus() as unknown as Record<string, string>;
    return {
      gpuCompositing: isHardwareEnabled(status.gpu_compositing),
      hardwareVideoDecode: isHardwareEnabled(status.video_decode),
    };
  } catch (e) {
    log.warn('GPU feature status unavailable; assuming HW compositing:', e);
    return {
      gpuCompositing: FALLBACK_SIGNALS.gpuCompositing,
      hardwareVideoDecode: FALLBACK_SIGNALS.hardwareVideoDecode,
    };
  }
}

// Gather static hardware signals. Synchronous (os + app.getGPUFeatureStatus) so it
// can run before the windows open.
function gatherSignals(): HardwareSignals {
  const totalMemGb = Math.round((os.totalmem() / 1024 ** 3) * 10) / 10;
  const cpuCores = os.cpus()?.length ?? FALLBACK_SIGNALS.cpuCores;
  return { totalMemGb, cpuCores, ...gpuSignals() };
}

function readOverride(): TierOverride {
  try {
    return parseTierOverride(settingsRepository.get(TIER_OVERRIDE_KEY));
  } catch (e) {
    log.warn('Could not read capability override; defaulting to auto:', e);
    return 'auto';
  }
}

export const capabilityService = {
  // Gather signals once at startup (call after app 'ready', before openWindows).
  init(): void {
    cachedSignals = gatherSignals();
    log.info(
      `Capability: ${JSON.stringify(cachedSignals)} → auto ${autoTier(cachedSignals)}, ` +
        `resolved ${capabilityService.get().tier}.`,
    );
  },

  // Current capability — auto tier from cached signals, resolved against the
  // operator override. Safe before init (uses the conservative fallback signals).
  get(): CapabilityInfo {
    const signals = cachedSignals ?? FALLBACK_SIGNALS;
    const auto = autoTier(signals);
    const override = readOverride();
    return { tier: resolveTier(auto, override), autoTier: auto, override, signals };
  },

  // Persist the operator override and return the new resolved capability.
  setOverride(override: TierOverride): CapabilityInfo {
    settingsRepository.set(TIER_OVERRIDE_KEY, override);
    return capabilityService.get();
  },
};
