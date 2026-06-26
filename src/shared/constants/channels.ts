// Central IPC channel registry — one namespace per domain (CLAUDE.md §5.3).
// Domains beyond these (scripture/songs/media/plans/ai) are added in later
// phases as their schemas land.
export const CHANNELS = {
  settings: {
    get: 'settings:get',
    set: 'settings:set',
  },
  present: {
    setState: 'present:set-state', // renderer -> main (invoke)
    state: 'present:state', // main -> audience window (event push)
  },
} as const;
