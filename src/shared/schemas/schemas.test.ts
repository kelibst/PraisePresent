import { describe, it, expect } from 'vitest';
import { settingsGetRequest, settingsSetRequest } from './settings';
import { presentState } from './present';

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
