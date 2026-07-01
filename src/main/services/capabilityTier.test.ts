import { describe, it, expect } from 'vitest';
import { autoTier, resolveTier } from './capabilityTier';
import type { HardwareSignals } from '@/shared/schemas/capability';

// A capable baseline; override individual fields per case.
function signals(overrides: Partial<HardwareSignals> = {}): HardwareSignals {
  return {
    totalMemGb: 16,
    cpuCores: 8,
    gpuCompositing: true,
    hardwareVideoDecode: true,
    ...overrides,
  };
}

describe('autoTier heuristic', () => {
  it('software compositing forces LOW regardless of RAM/cores', () => {
    expect(autoTier(signals({ gpuCompositing: false }))).toBe('low');
    expect(autoTier(signals({ gpuCompositing: false, totalMemGb: 64, cpuCores: 32 }))).toBe('low');
  });

  it('low RAM (<6GB) forces LOW', () => {
    expect(autoTier(signals({ totalMemGb: 4 }))).toBe('low');
  });

  it('very few cores (<=2) forces LOW', () => {
    expect(autoTier(signals({ cpuCores: 2 }))).toBe('low');
  });

  it('a strong machine (>=16GB, HW decode, >=8 cores) is HIGH', () => {
    expect(autoTier(signals())).toBe('high');
  });

  it('falls to STANDARD when a HIGH condition is missing', () => {
    expect(autoTier(signals({ hardwareVideoDecode: false }))).toBe('standard'); // no HW decode
    expect(autoTier(signals({ totalMemGb: 8 }))).toBe('standard'); // mid RAM
    expect(autoTier(signals({ cpuCores: 4 }))).toBe('standard'); // mid cores
  });

  it('a typical 8GB/4-core HW-composited machine is STANDARD (not punished)', () => {
    expect(autoTier(signals({ totalMemGb: 8, cpuCores: 4 }))).toBe('standard');
  });

  it('honors the exact threshold boundaries (guards the comparators)', () => {
    // RAM: <6 is LOW, exactly 6 is not LOW; <16 is not HIGH, exactly 16 can be HIGH.
    expect(autoTier(signals({ totalMemGb: 5.9 }))).toBe('low');
    expect(autoTier(signals({ totalMemGb: 6 }))).toBe('standard');
    expect(autoTier(signals({ totalMemGb: 15.9 }))).toBe('standard');
    expect(autoTier(signals({ totalMemGb: 16 }))).toBe('high');
    // Cores: <=2 is LOW, 3 is not LOW; <8 is not HIGH, exactly 8 can be HIGH.
    expect(autoTier(signals({ cpuCores: 2 }))).toBe('low');
    expect(autoTier(signals({ cpuCores: 3 }))).toBe('standard');
    expect(autoTier(signals({ cpuCores: 7 }))).toBe('standard');
    expect(autoTier(signals({ cpuCores: 8 }))).toBe('high');
  });
});

describe('resolveTier override', () => {
  it('auto trusts the detected tier', () => {
    expect(resolveTier('high', 'auto')).toBe('high');
    expect(resolveTier('low', 'auto')).toBe('low');
  });

  it('an explicit override wins over detection', () => {
    expect(resolveTier('high', 'low')).toBe('low');
    expect(resolveTier('low', 'high')).toBe('high');
    expect(resolveTier('standard', 'standard')).toBe('standard');
  });
});
