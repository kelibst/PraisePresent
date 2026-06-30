import type { ScriptureReference } from '@/shared/schemas/scripture';

// Labeled fixture corpus for the text-level scripture-detection accuracy harness
// (CLAUDE.md §5.8, Phase-4 spec §6.3). Each case pairs a free-text snippet with
// the canonical references a correct detector should surface. This is DATA only
// — no extraction logic lives here (the extractor stays in scriptureDetect.ts).
//
// The `kind` tag splits the corpus into:
//   - 'positive'    : real references that MUST be detected (drives recall).
//   - 'adversarial' : book-like English words, numbers-as-prose, and junk that
//                     MUST yield zero references (drives the FP=0 gate).
//
// Labels carry the canonical strings the detector emits (e.g. "John 3:16",
// "Psalms 23") so the harness can compare against `DetectedReference.canonical`
// without re-deriving any Bible data.

export type CorpusKind = 'positive' | 'adversarial';

export type CorpusCase = {
  id: string;
  kind: CorpusKind;
  text: string;
  // Canonical labels expected, in any order. Empty = no references expected.
  expected: string[];
  // Short note on what the case exercises (book form, number form, noise…).
  note: string;
};

// A label string like "John 3:16" carries the same canonical shape the detector
// produces; this keeps the harness from re-implementing the formatter.
export type ReferenceLabel = string;

// Sanity guard used by the metrics tests: the canonical the detector emits must
// be a plain string. Re-exported so the test file shares one ScriptureReference
// import surface (avoids an unused-import lint in some toolchains).
export type _LabeledReference = ScriptureReference;

export const SCRIPTURE_CORPUS: CorpusCase[] = [
  // --- positive: explicit digit references ---------------------------------
  {
    id: 'pos-explicit-john316',
    kind: 'positive',
    text: 'Please turn with me to John 3:16 this morning.',
    expected: ['John 3:16'],
    note: 'explicit digit chapter:verse in prose',
  },
  {
    id: 'pos-explicit-range',
    kind: 'positive',
    text: 'Read 1 Corinthians 13:4-7 with me.',
    expected: ['1 Corinthians 13:4-7'],
    note: 'explicit verse range with ordinal book',
  },
  {
    id: 'pos-explicit-dot-sep',
    kind: 'positive',
    text: 'Our text is Romans 8.28 for today.',
    expected: ['Romans 8:28'],
    note: 'dot as chapter/verse separator',
  },
  {
    id: 'pos-explicit-abbrev',
    kind: 'positive',
    text: 'Compare Gen 1:1 with the opening of the Gospel.',
    expected: ['Genesis 1:1'],
    note: 'OSIS-style abbreviation resolves to full name',
  },
  {
    id: 'pos-explicit-verses-keyword',
    kind: 'positive',
    text: 'Look at Ephesians 2 verses 8 through 9.',
    expected: ['Ephesians 2:8-9'],
    note: 'spelled "verses N through M" range',
  },
  {
    id: 'pos-explicit-multiword-digits',
    kind: 'positive',
    text: 'song of solomon 2 1 speaks of the rose of Sharon.',
    expected: ['Song of Solomon 2:1'],
    note: 'multiword book name with space-separated digits',
  },

  // --- positive: spoken-number forms ---------------------------------------
  {
    id: 'pos-spoken-john316',
    kind: 'positive',
    text: 'open to john three sixteen',
    expected: ['John 3:16'],
    note: 'spoken chapter:verse (units + teen)',
  },
  {
    id: 'pos-spoken-romans828',
    kind: 'positive',
    text: 'romans eight twenty eight reminds us of his sovereignty',
    expected: ['Romans 8:28'],
    note: 'spoken tens+unit verse',
  },
  {
    id: 'pos-spoken-chapter-verse-keyword',
    kind: 'positive',
    text: 'romans chapter eight verse twenty eight',
    expected: ['Romans 8:28'],
    note: 'spoken "chapter X verse Y" phrasing',
  },
  {
    id: 'pos-spoken-hundreds-psalm',
    kind: 'positive',
    text: 'turn to psalm one hundred nineteen',
    expected: ['Psalms 119'],
    note: 'spoken hundreds whole-chapter (book+chapter only)',
  },

  // --- positive: ordinal / roman / multiword books -------------------------
  {
    id: 'pos-ordinal-first-john',
    kind: 'positive',
    text: 'look at first john four eight, God is love',
    expected: ['1 John 4:8'],
    note: 'spoken ordinal prefix "first"',
  },
  {
    id: 'pos-ordinal-second-cor',
    kind: 'positive',
    text: 'second corinthians five seventeen tells of the new creation',
    expected: ['2 Corinthians 5:17'],
    note: 'spoken ordinal prefix "second"',
  },
  {
    id: 'pos-roman-third-john',
    kind: 'positive',
    text: 'iii john 1 2 is a blessing for health',
    expected: ['3 John 1:2'],
    note: 'roman-numeral ordinal prefix "iii"',
  },
  {
    id: 'pos-digit-ordinal-first-thess',
    kind: 'positive',
    text: 'We close in 1 Thessalonians 5:16-18.',
    expected: ['1 Thessalonians 5:16-18'],
    note: 'digit ordinal prefix, multiword book, range',
  },

  // --- positive: book+chapter (no verse, lower confidence) -----------------
  {
    id: 'pos-book-chapter-psalm23',
    kind: 'positive',
    text: 'We are reading Psalm 23 today.',
    expected: ['Psalms 23'],
    note: 'bare book+chapter, no verse',
  },
  {
    id: 'pos-book-chapter-genesis1',
    kind: 'positive',
    text: 'The sermon walks through Genesis 1 verse by verse.',
    expected: ['Genesis 1'],
    note: 'book+chapter where the "verse" idiom has no number → stays whole-chapter',
  },

  // --- positive: punctuation noise + multiples -----------------------------
  {
    id: 'pos-multi-mixed-forms',
    kind: 'positive',
    text: 'Turn to John three sixteen, then Romans 8:28 this morning.',
    expected: ['John 3:16', 'Romans 8:28'],
    note: 'mixed spoken + digit forms, comma noise',
  },
  {
    id: 'pos-multi-dedup',
    kind: 'positive',
    text: 'Compare John 3:16 with Romans 8:28, then John 3:16 again.',
    expected: ['John 3:16', 'Romans 8:28'],
    note: 'duplicate reference is deduped to one hit',
  },
  {
    id: 'pos-clamp-range',
    kind: 'positive',
    text: 'john 3:16-200 collapses an impossible end verse',
    expected: ['John 3:16'],
    note: 'out-of-range verse end clamps to start',
  },
  {
    id: 'pos-paren-noise',
    kind: 'positive',
    text: 'The promise (Philippians 4:13) carried them through.',
    expected: ['Philippians 4:13'],
    note: 'reference wrapped in parentheses',
  },

  // --- adversarial: book-like English words → NO references ----------------
  {
    id: 'adv-is-isaiah',
    kind: 'adversarial',
    text: 'she is 16 years old and very bright',
    expected: [],
    note: '"is" must not match Isaiah',
  },
  {
    id: 'adv-so-song',
    kind: 'adversarial',
    text: 'so 2 of them came to the front',
    expected: [],
    note: '"so" must not match Song of Solomon',
  },
  {
    id: 'adv-am-amos',
    kind: 'adversarial',
    text: 'I am 3 minutes late for the meeting',
    expected: [],
    note: '"am" must not match Amos',
  },
  {
    id: 'adv-ex-exodus',
    kind: 'adversarial',
    text: 'we have ex 2 options on the table',
    expected: [],
    note: '"ex" must not match Exodus',
  },
  {
    id: 'adv-re-revelation',
    kind: 'adversarial',
    text: 're 5 items were returned to the store',
    expected: [],
    note: '"re" must not match Revelation',
  },
  {
    id: 'adv-job-noun',
    kind: 'adversarial',
    text: 'He started a new job this year.',
    expected: [],
    note: 'book word "job" with no following number is not a reference',
  },
  {
    id: 'adv-numbers-prose',
    kind: 'adversarial',
    text: 'I have 3 apples and 5 oranges in 2024.',
    expected: [],
    note: 'bare digits with no book word',
  },
  {
    id: 'adv-year',
    kind: 'adversarial',
    text: 'back in the year 2024 we met for the first time',
    expected: [],
    note: 'out-of-range chapter (a year) is rejected',
  },
  {
    id: 'adv-spoken-numbers-only',
    kind: 'adversarial',
    text: 'count to three sixteen and then stop',
    expected: [],
    note: 'spoken numbers with no preceding book word',
  },
  {
    id: 'adv-junk',
    kind: 'adversarial',
    text: '!!! ??? --- 99999 @@@ zzzz',
    expected: [],
    note: 'pure junk yields nothing and never throws',
  },
  {
    id: 'adv-empty',
    kind: 'adversarial',
    text: '   ',
    expected: [],
    note: 'whitespace-only input yields nothing',
  },
];
