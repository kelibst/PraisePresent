// Central IPC channel registry — one namespace per domain (CLAUDE.md §5.3).
// Domains beyond `settings` (scripture/songs/media/plans/present/ai) are added
// in later phases as their schemas land.
export const CHANNELS = {
  settings: {
    get: 'settings:get',
    set: 'settings:set',
  },
} as const;
