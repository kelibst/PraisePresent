// PURE accuracy metrics for the text-level scripture detector (CLAUDE.md §5.8,
// Phase-4 spec §6.3). Given per-case (expected vs predicted) canonical-reference
// labels, it computes corpus-level precision / recall / F1 and a raw
// false-positive count. No DB, no electron, no Bible data — it only counts string
// labels, so it runs under Vitest without any native binary (§5.2). The detector
// itself stays in scriptureDetect.ts; this module never extracts.

// One scored case: the references a labeler expected, and what the detector
// produced for the same text. Canonical strings ("John 3:16") are the unit.
export type ScoredCase = {
  id: string;
  expected: string[];
  predicted: string[];
};

// Confusion counts plus the derived rates. All rates are in [0, 1]. When a
// denominator is zero (e.g. no expected items) the rate is defined as 1, which
// is the convention that keeps a clean empty corpus from looking like a failure.
export type AccuracyMetrics = {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1: number;
  // Per-case detail, useful for pinpointing which fixture regressed.
  perCase: CaseScore[];
};

export type CaseScore = {
  id: string;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  missing: string[]; // expected but not predicted
  spurious: string[]; // predicted but not expected
};

// Deduplicate a label list into a set, treating canonical strings as
// case-sensitive identifiers (the detector emits a single canonical casing).
function toSet(labels: string[]): Set<string> {
  return new Set(labels);
}

// Score a single case: intersection = TP, expected-only = FN, predicted-only = FP.
export function scoreCase(c: ScoredCase): CaseScore {
  const expected = toSet(c.expected);
  const predicted = toSet(c.predicted);

  let truePositives = 0;
  const missing: string[] = [];
  for (const label of expected) {
    if (predicted.has(label)) truePositives += 1;
    else missing.push(label);
  }

  const spurious: string[] = [];
  for (const label of predicted) {
    if (!expected.has(label)) spurious.push(label);
  }

  return {
    id: c.id,
    truePositives,
    falsePositives: spurious.length,
    falseNegatives: missing.length,
    missing,
    spurious,
  };
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator === 0) return 1;
  return numerator / denominator;
}

// Aggregate a corpus into precision / recall / F1 and confusion totals.
export function computeAccuracy(cases: ScoredCase[]): AccuracyMetrics {
  const perCase = cases.map(scoreCase);

  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  for (const s of perCase) {
    truePositives += s.truePositives;
    falsePositives += s.falsePositives;
    falseNegatives += s.falseNegatives;
  }

  const precision = safeRatio(truePositives, truePositives + falsePositives);
  const recall = safeRatio(truePositives, truePositives + falseNegatives);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    precision,
    recall,
    f1,
    perCase,
  };
}

// Sum the false positives the detector emitted across a set of cases. Used by the
// adversarial gate, where the floor is an exact zero (no book-like English word
// or junk may surface a reference). Spec §6.3.
export function falsePositiveCount(cases: ScoredCase[]): number {
  return cases.reduce((total, c) => total + scoreCase(c).falsePositives, 0);
}
