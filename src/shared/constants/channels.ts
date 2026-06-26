// Central IPC channel registry — one namespace per domain (CLAUDE.md §5.3).
// Domains beyond these (scripture/media/plans/ai) are added in later phases as
// their schemas land.
export const CHANNELS = {
  settings: {
    get: 'settings:get',
    set: 'settings:set',
  },
  present: {
    setDeck: 'present:set-deck', // renderer -> main (invoke): replace the live deck
    next: 'present:next', // renderer -> main: advance one slide (clamped)
    prev: 'present:prev', // renderer -> main: go back one slide (clamped)
    goto: 'present:goto', // renderer -> main: jump to an index (clamped)
    black: 'present:black', // renderer -> main: fail-safe black
    blank: 'present:blank', // renderer -> main: dim/blank, keep deck
    clear: 'present:clear', // renderer -> main: clear slide, keep deck
    getState: 'present:get-state', // renderer -> main: current live state (on mount)
    state: 'present:state', // main -> presenter + audience windows (event push)
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
    estimate: 'plans:estimate',
  },
  scripture: {
    listTranslations: 'scripture:list-translations',
    listBooks: 'scripture:list-books',
    lookupReference: 'scripture:lookup-reference',
    searchKeyword: 'scripture:search-keyword',
  },
} as const;
