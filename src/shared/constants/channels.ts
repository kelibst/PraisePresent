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
  capability: {
    get: 'capability:get', // renderer -> main: resolved tier + hardware signals (B6a)
    setOverride: 'capability:set-override', // renderer -> main: set + persist the operator tier override
  },
  present: {
    setDeck: 'present:set-deck', // renderer -> main (invoke): replace the live deck
    next: 'present:next', // renderer -> main: advance one slide (clamped)
    prev: 'present:prev', // renderer -> main: go back one slide (clamped)
    goto: 'present:goto', // renderer -> main: jump to an index (clamped)
    setBackground: 'present:set-background', // renderer -> main: set/clear a slide background (clamped)
    updateText: 'present:update-text', // renderer -> main: replace a slide's text (clamped; locked rejected)
    setTransition: 'present:set-transition', // renderer -> main: change the transition only (cursor-only)
    black: 'present:black', // renderer -> main: fail-safe black
    blank: 'present:blank', // renderer -> main: dim/blank, keep deck
    clear: 'present:clear', // renderer -> main: clear slide, keep deck
    getState: 'present:get-state', // renderer -> main: current live state (on mount)
    // main -> windows (event pushes). The state is split so transport actions are
    // O(cursor), not O(whole deck): `deck` is the rarely-changing slides + a `rev`
    // revision; `cursor` is the frequently-changing {rev,index,mode,transition}.
    // The preload reconciler merges them back into one PresentState (B1).
    deck: 'present:deck', // main -> windows: full deck + rev (on deck-changing actions only)
    cursor: 'present:cursor', // main -> windows: {rev,index,mode,transition} (every transport action)
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
    listAgents: 'ai:list-agents', // renderer -> main: built-in transcription agents
    setAgent: 'ai:set-agent', // renderer -> main: choose the active agent
    setMode: 'ai:set-mode', // renderer -> main: passive | drive
    setEnabled: 'ai:set-enabled', // renderer -> main: hard kill-switch on/off
    setOnline: 'ai:set-online', // renderer -> main: cloud opt-in on/off
    setAutoProject: 'ai:set-auto-project', // renderer -> main: high-confidence auto-project guard
    setTranscriptOnly: 'ai:set-transcript-only', // renderer -> main: detection off, transcript on
    status: 'ai:status', // renderer -> main: current orchestrator status
    listSources: 'ai:list-sources', // renderer -> main: persist renderer-enumerated audio sources
    setSource: 'ai:set-source', // renderer -> main: choose the active audio source
    modelStatus: 'ai:model-status', // renderer -> main: local-model download manager state
    downloadModel: 'ai:download-model', // renderer -> main: trigger model download (no-op stub, R6)
    startListening: 'ai:start-listening', // renderer -> main: begin (stub in A1)
    stopListening: 'ai:stop-listening', // renderer -> main: stop listening
    setApiKey: 'ai:set-api-key', // renderer -> main: store a cloud key (safeStorage)
    hasKey: 'ai:has-key', // renderer -> main: boolean key-presence (never the value)
    clearApiKey: 'ai:clear-api-key', // renderer -> main: delete a stored key
    candidates: 'ai:candidates', // main -> presenter (event push): new candidates
    transcript: 'ai:transcript', // main -> presenter (event push): transcript segment
  },
  media: {
    list: 'media:list', // renderer -> main: all library items
    import: 'media:import', // renderer -> main: open OS file picker, add chosen
    add: 'media:add', // renderer -> main: register known paths (picker/drag-drop)
    remove: 'media:remove', // renderer -> main: remove a library item
  },
  search: {
    query: 'search:query', // renderer -> main: fan one query over scripture/songs/media
  },
  scripture: {
    listTranslations: 'scripture:list-translations',
    listBooks: 'scripture:list-books',
    getChapter: 'scripture:get-chapter',
    lookupReference: 'scripture:lookup-reference',
    searchKeyword: 'scripture:search-keyword',
  },
} as const;
