import { describe, it, expect } from 'vitest';
import type { PresentSlide } from '@/shared/schemas/present';
import { deckPassageLabel } from './LiveCockpit';

// Pure helper that builds the deck sub-header label from slide references.
const slide = (reference?: string): PresentSlide => ({ id: reference ?? 'x', lines: [''], reference });

describe('deckPassageLabel', () => {
  it('returns empty for an empty deck or refs with no references', () => {
    expect(deckPassageLabel([])).toBe('');
    expect(deckPassageLabel([slide(), slide()])).toBe('');
  });

  it('returns the single reference when first and last match', () => {
    expect(deckPassageLabel([slide('John 3:16')])).toBe('John 3:16');
  });

  it('collapses a contiguous verse range to "Book c:v–v"', () => {
    expect(deckPassageLabel([slide('John 3:16'), slide('John 3:17'), slide('John 3:18')])).toBe(
      'John 3:16–18',
    );
  });

  it('falls back to "first – last" when references have no trailing digit', () => {
    expect(deckPassageLabel([slide('Psalm 23'), slide('Selah')])).toBe('Psalm 23 – Selah');
  });

  it('falls back to "first – last" across different books/chapters', () => {
    expect(deckPassageLabel([slide('John 3:16'), slide('Acts 2:1')])).toBe('John 3:16 – Acts 2:1');
  });
});
