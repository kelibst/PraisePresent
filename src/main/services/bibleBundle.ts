import { app } from 'electron';
import { gunzipSync } from 'node:zlib';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Locates and decodes the bundled Bible datasets. The .gz files ship via forge
// `extraResource` (→ process.resourcesPath in the packaged app); in dev they
// live under the repo's resources/ — but app.getAppPath() points at the Vite
// build dir (.vite/build), so we also walk up to the repo root. Main-process
// only — uses node:fs / node:zlib (CLAUDE.md §5.2).

// Compact verse row from the generator: [bookNumber, chapter, verse, text].
type VerseRow = [number, number, number, string];

export type BibleBundle = {
  translation: string;
  abbreviation: string;
  license: string;
  source: string;
  books: {
    number: number;
    name: string;
    abbreviation: string;
    osisId: string;
    testament: string;
  }[];
  verses: VerseRow[];
};

const RELATIVE_DIR = path.join('resources', 'bible');

// Resolve the directory that holds the *.json.gz translation bundles.
function resolveBundleDir(): string {
  const appPath = app.getAppPath();
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'bible')]
    : [
        // Dev: app.getAppPath() is the Vite build dir (.vite/build). The repo
        // root holds resources/, two levels up.
        path.join(appPath, RELATIVE_DIR),
        path.join(appPath, '..', '..', RELATIVE_DIR),
      ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(`Bible bundle dir not found (looked in: ${candidates.join(', ')})`);
}

function decodeBundle(file: string): BibleBundle {
  const gz = readFileSync(file);
  const json = gunzipSync(gz).toString('utf8');
  return JSON.parse(json) as BibleBundle;
}

// Load every bundled translation (one .json.gz per translation). WEB sorts
// first so it stays the seed default when no preference is stored.
export function loadBibleBundles(): BibleBundle[] {
  const dir = resolveBundleDir();
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json.gz'))
    .sort((a, b) => (a === 'web.json.gz' ? -1 : b === 'web.json.gz' ? 1 : a.localeCompare(b)));
  if (files.length === 0) throw new Error(`No Bible bundles found in ${dir}`);
  return files.map((f) => decodeBundle(path.join(dir, f)));
}
