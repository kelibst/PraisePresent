// Central IPC channel registry — one namespace per domain (CLAUDE.md §5.3).
// Domains beyond these (scripture/media/plans/ai) are added in later phases as
// their schemas land.
export const CHANNELS = {
  settings: {
    get: 'settings:get',
    set: 'settings:set',
  },
  display: {
    list: 'display:list', // renderer -> main: enumerate connected displays
    getAudience: 'display:get-audience', // renderer -> main: read persisted audience choice
    setAudience: 'display:set-audience', // renderer -> main: choose + persist + re-place
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
  ai: {
    submitText: 'ai:submit-text', // renderer -> main: detect references in text
  },
  media: {
    list: 'media:list', // renderer -> main: all library items
    import: 'media:import', // renderer -> main: open OS file picker, add chosen
    add: 'media:add', // renderer -> main: register known paths (picker/drag-drop)
    remove: 'media:remove', // renderer -> main: remove a library item
  },
  scripture: {
    listTranslations: 'scripture:list-translations',
    listBooks: 'scripture:list-books',
    getChapter: 'scripture:get-chapter',
    lookupReference: 'scripture:lookup-reference',
    searchKeyword: 'scripture:search-keyword',
  },
} as const;
