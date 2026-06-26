import { describe, it, expect } from 'vitest';
import { parsePlainText } from './songImport';

describe('parsePlainText', () => {
  it('splits blank-line blocks into ordered verse sections', () => {
    const sections = parsePlainText('line a\nline b\n\nline c');
    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({ kind: 'verse', label: 'Verse 1', sortOrder: 0 });
    expect(sections[1]).toMatchObject({ label: 'Verse 2', sortOrder: 1, content: 'line c' });
  });

  it('uses [Label] headers and maps chorus/bridge kinds', () => {
    const sections = parsePlainText('[Chorus]\nsing\n\n[Bridge]\nrest\n\n[Verse 1]\ngo');
    expect(sections[0]).toMatchObject({ kind: 'chorus', label: 'Chorus', content: 'sing' });
    expect(sections[1]).toMatchObject({ kind: 'bridge', label: 'Bridge', content: 'rest' });
    expect(sections[2]).toMatchObject({ kind: 'verse', label: 'Verse 1', content: 'go' });
  });

  it('returns no sections for empty input', () => {
    expect(parsePlainText('   \n\n  ')).toEqual([]);
  });
});
