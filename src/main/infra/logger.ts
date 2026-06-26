import log from 'electron-log/main';

// Central main-process logger (CLAUDE.md §5.7). electron-log writes to the
// platform log directory under the app's userData by default; the console
// transport stays verbose in development. Renderer-side logging is wired
// through the preload bridge in a later phase.
log.initialize();
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

export { log };
export default log;
