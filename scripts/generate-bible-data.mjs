// Generate the bundled, offline Bible dataset (P3-D1 Scripture).
//
// Fetches the World English Bible (WEB) from getbible v2 at BUILD time,
// normalizes it to a compact array-of-arrays shape, gzips it, and writes the
// bundle into the repo so the app hydrates SQLite from it with NO network at
// runtime (offline-first — CLAUDE.md §1.5). The output is committed so builds
// are reproducible offline.
//
//   Source:   https://api.getbible.net/v2/web.json
//   Text:     World English Bible (WEB)
//   License:  Public Domain (verified: distribution_license === "Public Domain")
//   Coverage: 66 books, 31,095 verses (Gen → Rev)
//   Provenance: ebible.org / Michael Paul Johnson
//
// Run with:  node scripts/generate-bible-data.mjs
//
// Output: resources/bible/web.json.gz — an object:
//   { translation, abbreviation, license, source, books, verses }
//   verses: array of [bookNr, chapter, verse, text]  (compact rows)
//   books:  the canonical 66-book metadata table (number, name, abbreviation,
//           testament, osisId) — getbible lacks abbrev/testament, so the canon
//           is authored here (BOOKS below) and the verse names are reconciled
//           against it.

import { gzipSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://api.getbible.net/v2/web.json';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'resources', 'bible');
const OUT_FILE = path.join(OUT_DIR, 'web.json.gz');

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

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const raw = await res.json();

  // Licensing gate (R17): refuse to bundle anything not public-domain.
  if (raw.distribution_license !== 'Public Domain') {
    throw new Error(
      `Refusing to bundle: license is "${raw.distribution_license}", not Public Domain`,
    );
  }
  if (!Array.isArray(raw.books) || raw.books.length !== 66) {
    throw new Error(`Expected 66 books, got ${raw.books?.length}`);
  }

  // Compact verse rows: [bookNr, chapter, verse, text].
  const verses = [];
  for (const book of raw.books) {
    const meta = BOOKS[book.nr - 1];
    if (!meta) throw new Error(`No canon entry for book nr ${book.nr}`);
    for (const chapter of book.chapters) {
      for (const v of chapter.verses) {
        verses.push([book.nr, v.chapter, v.verse, v.text.trim()]);
      }
    }
  }

  const books = BOOKS.map(([name, osisId, testament], i) => ({
    number: i + 1,
    name,
    abbreviation: osisId,
    osisId,
    testament,
  }));

  const bundle = {
    translation: raw.translation,
    abbreviation: raw.abbreviation,
    license: raw.distribution_license,
    source: SOURCE_URL,
    books,
    verses,
  };

  const json = JSON.stringify(bundle);
  const gz = gzipSync(json, { level: 9 });

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, gz);

  console.log(`Books:   ${books.length}`);
  console.log(`Verses:  ${verses.length}`);
  console.log(`JSON:    ${(json.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Gzipped: ${(gz.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Wrote:   ${OUT_FILE}`);
}

main().catch((e) => {
  console.error('generate-bible-data failed:', e.message);
  process.exit(1);
});
