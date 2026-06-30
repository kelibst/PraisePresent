import { vi } from 'vitest';

// Unit tests run under Node, but main-process modules import electron and
// electron-log (and the native better-sqlite3 binary is built for Electron's
// ABI). Mock those so we can test pure logic — the validation harness, schemas,
// config, and migration idempotency — without a real Electron runtime. The DB
// itself is exercised by the e2e suite (settings persist across restart).
vi.mock('electron-log/main', () => ({
  default: {
    initialize: vi.fn(),
    transports: { file: { level: 'info' }, console: { level: 'debug' } },
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  app: { isPackaged: false, getPath: vi.fn(() => '/tmp') },
}));
