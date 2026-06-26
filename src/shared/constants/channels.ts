// Central IPC channel registry — one namespace per domain (CLAUDE.md §5.3).
// Domains beyond these (scripture/media/plans/ai) are added in later phases as
// their schemas land.
export const CHANNELS = {
  settings: {
    get: 'settings:get',
    set: 'settings:set',
  },
  present: {
    setState: 'present:set-state', // renderer -> main (invoke)
    state: 'present:state', // main -> audience window (event push)
  },
  songs: {
    list: 'songs:list',
    get: 'songs:get',
    create: 'songs:create',
    update: 'songs:update',
    delete: 'songs:delete',
    importText: 'songs:import-text',
  },
  plans: {
    list: 'plans:list',
    get: 'plans:get',
    create: 'plans:create',
    update: 'plans:update',
    delete: 'plans:delete',
  },
} as const;
