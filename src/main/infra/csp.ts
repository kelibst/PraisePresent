import { app } from 'electron';
import { getConfig } from './config';

// Build the Content-Security-Policy from the base policy + any declaratively
// registered connect-src origins (config). Production locks script-src to 'self'
// (no inline/eval/remote); development relaxes for the Vite dev server only.
export function buildCsp(): string {
  const extra = getConfig().connectSources;
  const dev = !app.isPackaged;

  const connectSrc = [
    "connect-src 'self'",
    ...extra,
    ...(dev ? ['ws://localhost:*', 'http://localhost:*'] : []),
  ].join(' ');

  return [
    "default-src 'self'",
    dev ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    // app-media: is the DB-allowlisted local-media protocol (mediaProtocol.ts) —
    // images and video/audio on the audience window are served only through it.
    "img-src 'self' data: app-media:",
    "media-src 'self' app-media:",
    connectSrc,
    "object-src 'none'",
    "base-uri 'self'",
    ...(dev ? [] : ["form-action 'none'", "frame-ancestors 'none'"]),
  ].join('; ');
}
