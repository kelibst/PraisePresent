import { z } from 'zod';

// Live presentation state. Owned by main and broadcast to the audience window
// (CLAUDE.md §5.3). `black` is the fail-safe (§5.7).
export const presentMode = z.enum(['slide', 'black', 'blank', 'clear']);

export const presentSlide = z.object({
  text: z.string(),
});

export const presentState = z.object({
  mode: presentMode,
  slide: presentSlide.nullable(),
});

export type PresentMode = z.infer<typeof presentMode>;
export type PresentSlide = z.infer<typeof presentSlide>;
export type PresentState = z.infer<typeof presentState>;
