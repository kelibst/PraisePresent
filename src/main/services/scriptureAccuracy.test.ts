import { describe, it, expect } from 'vitest';
import { detectReferences } from './scriptureDetect';
import {
  computeAccuracy,
  falsePositiveCount,
  scoreCase,
  type ScoredCase,
} from './scriptureAccuracy';
import { SCRIPTURE_CORPUS } from './scriptureDetect.fixtures';

// Run each labeled fixture through the REAL deterministic extractor and pair the
// emitted canonical references with the labels. No mocking — the extractor is
// pure (no DB/electron), so this is a true end-to-end text-accuracy gate.
function scoreCorpus(cases: typeof SCRIPTURE_CORPUS): ScoredCase[] {
  return cases.map((c) => ({
    id: c.id,
    expected: c.expected,
    predicted: detectReferences(c.text).map((r) => r.canonical),
  }));
}

describe('scriptureAccuracy (pure metrics)', () => {
  it('counts TP / FP / FN per case via set intersection', () => {
    const s = scoreCase({
      id: 't',
      expected: ['John 3:16', 'Romans 8:28'],
      predicted: ['John 3:16', 'Acts 2:1'],
    });
    expect(s.truePositives).toBe(1);
    expect(s.falseNegatives).toBe(1);
    expect(s.falsePositives).toBe(1);
    expect(s.missing).toEqual(['Romans 8:28']);
    expect(s.spurious).toEqual(['Acts 2:1']);
  });

  it('treats duplicate labels as a single reference', () => {
    const s = scoreCase({
      id: 't',
      expected: ['John 3:16'],
      predicted: ['John 3:16', 'John 3:16'],
    });
    expect(s.truePositives).toBe(1);
    expect(s.falsePositives).toBe(0);
  });

  it('aggregates precision / recall / F1 across cases', () => {
    const m = computeAccuracy([
      { id: 'a', expected: ['John 3:16'], predicted: ['John 3:16'] },
      { id: 'b', expected: ['Romans 8:28'], predicted: [] }, // a miss
      { id: 'c', expected: [], predicted: ['Acts 2:1'] }, // a spurious hit
    ]);
    expect(m.truePositives).toBe(1);
    expect(m.falseNegatives).toBe(1);
    expect(m.falsePositives).toBe(1);
    expect(m.precision).toBeCloseTo(0.5, 5);
    expect(m.recall).toBeCloseTo(0.5, 5);
    expect(m.f1).toBeCloseTo(0.5, 5);
  });

  it('defines an empty corpus as perfect (no false signal)', () => {
    const m = computeAccuracy([{ id: 'e', expected: [], predicted: [] }]);
    // Zero-denominator convention: precision and recall are both 1, so their
    // harmonic mean is 1 too — a clean empty corpus reads as perfect, not failed.
    expect(m.precision).toBe(1);
    expect(m.recall).toBe(1);
    expect(m.f1).toBe(1);
    expect(falsePositiveCount([{ id: 'e', expected: [], predicted: [] }])).toBe(0);
  });
});

describe('scriptureDetect text-accuracy GATE (regression floors)', () => {
  const scored = scoreCorpus(SCRIPTURE_CORPUS);
  const metrics = computeAccuracy(scored);

  it('corpus is large enough and carries an adversarial subset', () => {
    expect(SCRIPTURE_CORPUS.length).toBeGreaterThanOrEqual(20);
    const adversarial = SCRIPTURE_CORPUS.filter((c) => c.kind === 'adversarial');
    expect(adversarial.length).toBeGreaterThanOrEqual(8);
    // Adversarial cases must, by definition, expect zero references.
    for (const c of adversarial) expect(c.expected).toHaveLength(0);
  });

  it('emits ZERO false positives on the adversarial set', () => {
    const adversarial = scored.filter((c) =>
      SCRIPTURE_CORPUS.find((x) => x.id === c.id && x.kind === 'adversarial'),
    );
    const fp = falsePositiveCount(adversarial);
    if (fp > 0) {
      const offenders = adversarial
        .map(scoreCase)
        .filter((s) => s.falsePositives > 0)
        .map((s) => `${s.id}: ${s.spurious.join(', ')}`);
      throw new Error(`Adversarial false positives (must be 0):\n${offenders.join('\n')}`);
    }
    expect(fp).toBe(0);
  });

  it('meets recall / precision / F1 floors on the full corpus', () => {
    // Diagnostics for any case the extractor regresses on.
    const failures = metrics.perCase.filter((s) => s.falseNegatives > 0 || s.falsePositives > 0);
    if (failures.length > 0) {
      // Surface the offending fixtures in the failure message.
      const detail = failures
        .map(
          (s) => `${s.id}: missing=[${s.missing.join(', ')}] spurious=[${s.spurious.join(', ')}]`,
        )
        .join('\n');
      console.error(`Detector regressions:\n${detail}`);
    }

    // FLOORS — regressions below these fail CI (CLAUDE.md §5.8, spec §6.3).
    expect(metrics.recall).toBeGreaterThanOrEqual(0.9);
    expect(metrics.precision).toBeGreaterThanOrEqual(0.95);
    expect(metrics.f1).toBeGreaterThanOrEqual(0.9);
  });

  it('reports the achieved numbers (informational, also asserts current state)', () => {
    // The current extractor scores a clean sweep of the corpus; lock that in so a
    // silent drop (e.g. a new alias breaking a case) is caught, not just the floor.
    console.log(
      `[scripture text-accuracy] precision=${metrics.precision.toFixed(3)} ` +
        `recall=${metrics.recall.toFixed(3)} f1=${metrics.f1.toFixed(3)} ` +
        `TP=${metrics.truePositives} FP=${metrics.falsePositives} FN=${metrics.falseNegatives} ` +
        `cases=${SCRIPTURE_CORPUS.length}`,
    );
    expect(metrics.precision).toBe(1);
    expect(metrics.recall).toBe(1);
    expect(metrics.f1).toBe(1);
    expect(metrics.falsePositives).toBe(0);
    expect(metrics.falseNegatives).toBe(0);
  });
});
