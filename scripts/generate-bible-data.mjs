// Generate the bundled, offline Bible datasets (P3-D1 Scripture).
//
// Fetches each configured PUBLIC-DOMAIN translation from getbible v2 at BUILD
// time, normalizes it to a compact array-of-arrays shape, gzips it, and writes
// one bundle per translation into the repo so the app hydrates SQLite from them
// with NO network at runtime (offline-first — CLAUDE.md §1.5). The output is
// committed so builds are reproducible offline.
//
//   Source:   https://api.getbible.net/v2/<key>.json
//   Coverage: each must be the canonical 66-book Protestant canon.
//
// Run with:  node scripts/generate-bible-data.mjs
//            node scripts/generate-bible-data.mjs web kjv   (subset by key)
//
// Output: resources/bible/<abbr>.json.gz — an object:
//   { translation, abbreviation, license, source, books, verses }
//   verses: array of [bookNr, chapter, verse, text]  (compact rows)
//   books:  the canonical 66-book metadata table (number, name, abbreviation,
//           testament, osisId) — getbible lacks abbrev/testament, so the canon
//           is authored here (BOOKS below) and the verse names are reconciled
//           against it.
//
// LICENSING GATE (R17 / CLAUDE.md §7): we only bundle public-domain text. Each
// translation declares the license string we EXPECT getbible to report; if
// upstream changes it, we fail loudly rather than silently shipping something
// non-free. `bundleLicense` is the license we record in our bundle.
//
//   NOTE on KJV: getbible tags its KJV data file "GPL", but the King James
//   Version *text* is public domain in the United States (the "GPL" applies to
//   getbible's packaging, not to the uncopyrightable verse text). We extract
//   only the verse text into our own format and record it as Public Domain.
//   (UK readers: the KJV is under perpetual Crown copyright administered by
//   Cambridge University Press; it is nonetheless universally distributed by
//   church-presentation software. Flagged for the maintainer.)

import { gzipSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'resources', 'bible');
const V2 = (key) => `https://api.getbible.net/v2/${key}.json`;

// The public-domain set to seed. `key` is the getbible v2 key; `abbr` is the
// short display code and the output filename stem; `expectLicense` is the exact
// string getbible currently reports (asserted, fail-loud); `bundleLicense` is
// what we stamp into our bundle.
const TRANSLATIONS = [
  { key: 'web', abbr: 'WEB', expectLicense: 'Public Domain', bundleLicense: 'Public Domain' },
  { key: 'kjv', abbr: 'KJV', expectLicense: 'GPL', bundleLicense: 'Public Domain' },
  { key: 'asv', abbr: 'ASV', expectLicense: 'Public Domain', bundleLicense: 'Public Domain' },
  { key: 'ylt', abbr: 'YLT', expectLicense: 'Public Domain', bundleLicense: 'Public Domain' },
  {
    key: 'basicenglish',
    abbr: 'BBE',
    expectLicense: 'Public Domain',
    bundleLicense: 'Public Domain',
  },
  { key: 'wb', abbr: 'WBT', expectLicense: 'Public Domain', bundleLicense: 'Public Domain' },
];

// Canonical 66-book table. getbible numbers books 1..66 in this same order, so
// `nr` is the join key. testament: OT (1..39) / NT (40..66). osisId is the
// standard OSIS abbreviation (also used as the short display abbreviation).
const BOOKS = [
  ['Genesis', 'Gen', 'OT'],
  ['Exodus', 'Exod', 'OT'],
  ['Leviticus', 'Lev', 'OT'],
  ['Numbers', 'Num', 'OT'],
  ['Deuteronomy', 'Deut', 'OT'],
  ['Joshua', 'Josh', 'OT'],
  ['Judges', 'Judg', 'OT'],
  ['Ruth', 'Ruth', 'OT'],
  ['1 Samuel', '1Sam', 'OT'],
  ['2 Samuel', '2Sam', 'OT'],
  ['1 Kings', '1Kgs', 'OT'],
  ['2 Kings', '2Kgs', 'OT'],
  ['1 Chronicles', '1Chr', 'OT'],
  ['2 Chronicles', '2Chr', 'OT'],
  ['Ezra', 'Ezra', 'OT'],
  ['Nehemiah', 'Neh', 'OT'],
  ['Esther', 'Esth', 'OT'],
  ['Job', 'Job', 'OT'],
  ['Psalms', 'Ps', 'OT'],
  ['Proverbs', 'Prov', 'OT'],
  ['Ecclesiastes', 'Eccl', 'OT'],
  ['Song of Solomon', 'Song', 'OT'],
  ['Isaiah', 'Isa', 'OT'],
  ['Jeremiah', 'Jer', 'OT'],
  ['Lamentations', 'Lam', 'OT'],
  ['Ezekiel', 'Ezek', 'OT'],
  ['Daniel', 'Dan', 'OT'],
  ['Hosea', 'Hos', 'OT'],
  ['Joel', 'Joel', 'OT'],
  ['Amos', 'Amos', 'OT'],
  ['Obadiah', 'Obad', 'OT'],
  ['Jonah', 'Jonah', 'OT'],
  ['Micah', 'Mic', 'OT'],
  ['Nahum', 'Nah', 'OT'],
  ['Habakkuk', 'Hab', 'OT'],
  ['Zephaniah', 'Zeph', 'OT'],
  ['Haggai', 'Hag', 'OT'],
  ['Zechariah', 'Zech', 'OT'],
  ['Malachi', 'Mal', 'OT'],
  ['Matthew', 'Matt', 'NT'],
  ['Mark', 'Mark', 'NT'],
  ['Luke', 'Luke', 'NT'],
  ['John', 'John', 'NT'],
  ['Acts', 'Acts', 'NT'],
  ['Romans', 'Rom', 'NT'],
  ['1 Corinthians', '1Cor', 'NT'],
  ['2 Corinthians', '2Cor', 'NT'],
  ['Galatians', 'Gal', 'NT'],
  ['Ephesians', 'Eph', 'NT'],
  ['Philippians', 'Phil', 'NT'],
  ['Colossians', 'Col', 'NT'],
  ['1 Thessalonians', '1Thess', 'NT'],
  ['2 Thessalonians', '2Thess', 'NT'],
  ['1 Timothy', '1Tim', 'NT'],
  ['2 Timothy', '2Tim', 'NT'],
  ['Titus', 'Titus', 'NT'],
  ['Philemon', 'Phlm', 'NT'],
  ['Hebrews', 'Heb', 'NT'],
  ['James', 'Jas', 'NT'],
  ['1 Peter', '1Pet', 'NT'],
  ['2 Peter', '2Pet', 'NT'],
  ['1 John', '1John', 'NT'],
  ['2 John', '2John', 'NT'],
  ['3 John', '3John', 'NT'],
  ['Jude', 'Jude', 'NT'],
  ['Revelation', 'Rev', 'NT'],
];

const books = BOOKS.map(([name, osisId, testament], i) => ({
  number: i + 1,
  name,
  abbreviation: osisId,
  osisId,
  testament,
}));

async function buildTranslation(cfg) {
  const url = V2(cfg.key);
  console.log(`\n[${cfg.abbr}] Fetching ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const raw = await res.json();

  // Licensing gate (R17): assert the license is exactly what we vetted.
  if (raw.distribution_license !== cfg.expectLicense) {
    throw new Error(
      `License changed upstream: expected "${cfg.expectLicense}", got "${raw.distribution_license}". ` +
        `Re-vet before bundling.`,
    );
  }
  if (!Array.isArray(raw.books) || raw.books.length !== 66) {
    throw new Error(`Expected 66 books, got ${raw.books?.length} — not the Protestant canon.`);
  }

  // Compact verse rows: [bookNr, chapter, verse, text].
  const verses = [];
  for (const book of raw.books) {
    const meta = BOOKS[book.nr - 1];
    if (!meta) throw new Error(`No canon entry for book nr ${book.nr}`);
    for (const chapter of book.chapters) {
      for (const v of chapter.verses) {
        const text = String(v.text ?? '').trim();
        if (!text) continue;
        verses.push([book.nr, v.chapter, v.verse, text]);
      }
    }
  }
  if (verses.length < 30000) {
    throw new Error(`Only ${verses.length} verses — suspiciously incomplete.`);
  }

  const bundle = {
    translation: raw.translation,
    abbreviation: cfg.abbr,
    license: cfg.bundleLicense,
    source: url,
    books,
    verses,
  };

  const json = JSON.stringify(bundle);
  const gz = gzipSync(json, { level: 9 });
  const outFile = path.join(OUT_DIR, `${cfg.key}.json.gz`);
  writeFileSync(outFile, gz);

  return {
    abbr: cfg.abbr,
    name: raw.translation,
    verses: verses.length,
    rawMb: (json.length / 1024 / 1024).toFixed(2),
    gzMb: (gz.length / 1024 / 1024).toFixed(2),
    file: path.basename(outFile),
  };
}

async function main() {
  const argKeys = process.argv.slice(2).map((s) => s.toLowerCase());
  const targets = argKeys.length
    ? TRANSLATIONS.filter((t) => argKeys.includes(t.key) || argKeys.includes(t.abbr.toLowerCase()))
    : TRANSLATIONS;

  if (!targets.length) {
    throw new Error(`No matching translations for: ${argKeys.join(', ')}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const ok = [];
  const failed = [];
  for (const cfg of targets) {
    try {
      ok.push(await buildTranslation(cfg));
    } catch (e) {
      console.error(`[${cfg.abbr}] FAILED: ${e.message}`);
      failed.push({ abbr: cfg.abbr, error: e.message });
    }
  }

  console.log('\n=== Summary ===');
  for (const r of ok) {
    console.log(
      `  ✓ ${r.abbr.padEnd(4)} ${r.name.padEnd(28)} ${String(r.verses).padStart(6)} verses  ` +
        `${r.gzMb} MB gz  (${r.file})`,
    );
  }
  for (const r of failed) {
    console.log(`  ✗ ${r.abbr.padEnd(4)} ${r.error}`);
  }

  if (failed.length) {
    console.error(`\n${failed.length} translation(s) failed.`);
    process.exit(1);
  }
  console.log(`\nWrote ${ok.length} bundle(s) to ${OUT_DIR}`);
}

main().catch((e) => {
  console.error('generate-bible-data failed:', e.message);
  process.exit(1);
});
