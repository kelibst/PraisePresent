import type { PresentSlide } from '@/shared/schemas/present';

// Pure helpers that turn domain text into a projectable deck (CLAUDE.md §5.1).
// Shared so songs/scripture/plans build decks the same way; no side effects.

// Split a text block into trimmed, non-empty lines.
export function textToLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// One slide per text block, INDEX-STABLE: `deck[i]` always corresponds to
// `blocks[i]`, so a clickable list can pass its own index as the start index
// without desync. An empty block keeps its slot with a safe placeholder line
// (its label/reference, else a single space) instead of vanishing — the
// operator can still see/skip it (CLAUDE.md §5.7 fail-safe + reviewer finding #1).
export function blocksToDeck(
  blocks: Array<{ text: string; label?: string; reference?: string }>,
  idPrefix = 'slide',
): PresentSlide[] {
  return blocks.map((block, i) => {
    const lines = textToLines(block.text);
    const safeLines = lines.length > 0 ? lines : [block.label ?? block.reference ?? ' '];
    return { id: `${idPrefix}-${i}`, lines: safeLines, reference: block.reference };
  });
}

// A single-slide deck from one text block (e.g. a plan item).
export function singleSlideDeck(text: string, reference?: string, id = 'slide-0'): PresentSlide[] {
  const lines = textToLines(text);
  if (lines.length === 0) return [];
  return [{ id, lines, reference }];
}
