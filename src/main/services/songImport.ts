import type { SongSection } from '@/shared/schemas/song';

// Plain-text song import (pure — no DB, unit-tested directly). Blank-line
// separated blocks become sections; a leading "[Label]" line names the section,
// otherwise it's "Verse N". Label keywords map to a section kind.
export function parsePlainText(text: string): SongSection[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block, i): SongSection => {
    const lines = block.split('\n');
    const header = lines[0].match(/^\[(.+)\]$/);
    const label = header ? header[1].trim() : `Verse ${i + 1}`;
    const content = header ? lines.slice(1).join('\n').trim() : block;
    const lower = label.toLowerCase();
    const kind: SongSection['kind'] = lower.includes('chorus')
      ? 'chorus'
      : lower.includes('bridge')
        ? 'bridge'
        : 'verse';
    return { kind, label, content, sortOrder: i };
  });
}
