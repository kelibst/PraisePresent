import { describe, it, expect } from 'vitest';
import { settingsGetRequest, settingsSetRequest } from './settings';
import { presentState } from './present';
import { planCreate } from './plan';
import { referenceLookup, keywordSearch } from './scripture';

describe('settings schemas', () => {
  it('accepts a valid get request', () => {
    expect(settingsGetRequest.safeParse({ key: 'theme' }).success).toBe(true);
  });
  it('rejects an empty key', () => {
    expect(settingsGetRequest.safeParse({ key: '' }).success).toBe(false);
  });
  it('rejects a missing/typed value on set', () => {
    expect(settingsSetRequest.safeParse({ key: 'k' }).success).toBe(false);
    expect(settingsSetRequest.safeParse({ key: 'k', value: 42 }).success).toBe(false);
    expect(settingsSetRequest.safeParse({ key: 'k', value: 'v' }).success).toBe(true);
  });
});

describe('present state schema', () => {
  it('accepts a slide state', () => {
    expect(presentState.safeParse({ mode: 'slide', slide: { text: 'hi' } }).success).toBe(true);
  });
  it('accepts black with null slide', () => {
    expect(presentState.safeParse({ mode: 'black', slide: null }).success).toBe(true);
  });
  it('rejects an unknown mode', () => {
    expect(presentState.safeParse({ mode: 'explode', slide: null }).success).toBe(false);
  });
});

describe('plan schema', () => {
  it('accepts a plan with a song item and a custom item', () => {
    const res = planCreate.safeParse({
      name: 'Sunday',
      scheduledFor: null,
      notes: '',
      items: [
        { kind: 'song', refId: 1, title: 'Grace', content: '', sortOrder: 0 },
        { kind: 'custom', refId: null, title: 'Welcome', content: 'Hi', sortOrder: 1 },
      ],
    });
    expect(res.success).toBe(true);
  });
  it('rejects an empty name and an unknown item kind', () => {
    expect(
      planCreate.safeParse({ name: '', scheduledFor: null, notes: '', items: [] }).success,
    ).toBe(false);
    expect(
      planCreate.safeParse({
        name: 'x',
        scheduledFor: null,
        notes: '',
        items: [{ kind: 'banana', refId: null, title: 't', content: '', sortOrder: 0 }],
      }).success,
    ).toBe(false);
  });
});

describe('scripture schemas', () => {
  it('accepts a reference lookup and rejects an empty query', () => {
    expect(referenceLookup.safeParse({ query: 'John 3:16' }).success).toBe(true);
    expect(referenceLookup.safeParse({ query: '' }).success).toBe(false);
  });
  it('defaults keyword search limit to 50 and caps it', () => {
    const parsed = keywordSearch.safeParse({ query: 'love' });
    expect(parsed.success && parsed.data.limit).toBe(50);
    expect(keywordSearch.safeParse({ query: 'love', limit: 999 }).success).toBe(false);
  });
});
