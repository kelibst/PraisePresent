import { session } from 'electron';
import log from './logger';

// Explicit permission allow-list for the app's windows (CLAUDE.md §1.4). Without a
// handler Electron silently GRANTS every permission request; we instead allow only
// what the app actually needs and deny the rest by default.
//
// The Live-Detect feature needs the MICROPHONE (`media`) to capture audio for ASR
// (the one privileged Web API the renderer is allowed, §5.2). Everything else —
// geolocation, notifications, camera-only, MIDI, USB, opening external apps — is
// denied. We never load third-party pages (navigation is allow-listed to file:// +
// the dev server), so granting `media` to our own content carries no remote risk.

// The permissions the app's own windows may use. `media` covers microphone access.
const ALLOWED = new Set(['media']);

export function setupPermissions(): void {
  const ses = session.defaultSession;

  // Interactive requests (the getUserMedia prompt path).
  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    const granted = ALLOWED.has(permission);
    if (!granted) log.info(`Denied permission request: ${permission}`);
    callback(granted);
  });

  // Synchronous capability checks (e.g. `navigator.permissions.query`,
  // enumerateDevices labels). Mirror the same allow-list.
  ses.setPermissionCheckHandler((_webContents, permission) => ALLOWED.has(permission));
}
