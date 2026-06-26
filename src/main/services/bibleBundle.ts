import { app } from 'electron';
import { gunzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// Locates and decodes the bundled WEB dataset. The .gz ships via forge
// `extraResource` (→ process.resourcesPath in the packaged app); in dev it lives
// under the repo's resources/ — but app.getAppPath() points at the Vite build
// dir (.vite/build), so we also walk up to the repo root. Main-process only —
// uses node:fs / node:zlib (CLAUDE.md §5.2).

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

const RELATIVE = path.join('resources', 'bible', 'web.json.gz');

function resolveBundlePath(): string {
  const appPath = app.getAppPath();
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'bible', 'web.json.gz')]
    : [
        // Dev: app.getAppPath() is the Vite build dir (.vite/build). The repo
        // root holds resources/, two levels up.
        path.join(appPath, RELATIVE),
        path.join(appPath, '..', '..', RELATIVE),
      ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(`Bible bundle not found (looked in: ${candidates.join(', ')})`);
}

export function loadBibleBundle(): BibleBundle {
  const file = resolveBundlePath();
  const gz = readFileSync(file);
  const json = gunzipSync(gz).toString('utf8');
  return JSON.parse(json) as BibleBundle;
}
