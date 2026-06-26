import { describe, it, expect } from 'vitest';
import { estimateMinutes } from './planEstimate';

describe('estimateMinutes', () => {
  it('sums per-kind estimates', () => {
    expect(
      estimateMinutes([
        { kind: 'song' },
        { kind: 'song' },
        { kind: 'scripture' },
        { kind: 'custom' },
      ]),
    ).toBe(4 + 4 + 2 + 2);
  });

  it('is zero for an empty plan', () => {
    expect(estimateMinutes([])).toBe(0);
  });
});
