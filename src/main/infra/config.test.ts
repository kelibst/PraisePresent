import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig, setConfig, allowConnectSource } from './config';

beforeEach(() => setConfig({ connectSources: [] }));

describe('app config', () => {
  it('defaults connectSources to empty', () => {
    expect(getConfig().connectSources).toEqual([]);
  });

  it('allowConnectSource adds an origin once (idempotent)', () => {
    allowConnectSource('https://bible.example');
    allowConnectSource('https://bible.example');
    expect(getConfig().connectSources).toEqual(['https://bible.example']);
  });

  it('setConfig validates shape', () => {
    expect(() => setConfig({ connectSources: ['https://a', 'https://b'] })).not.toThrow();
    expect(getConfig().connectSources).toHaveLength(2);
  });
});
