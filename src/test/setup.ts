import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock electron
global.window.electron = {
  displayManager: {
    getDisplays: vi.fn(),
    captureDisplay: vi.fn(),
    testDisplay: vi.fn(),
    saveSettings: vi.fn(),
    getSettings: vi.fn(),
    syncState: vi.fn(),
    initializeLiveDisplay: vi.fn(),
  },
  liveDisplay: {
    create: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    getStatus: vi.fn(),
    sendContent: vi.fn(),
    clearContent: vi.fn(),
    showBlack: vi.fn(),
    showLogo: vi.fn(),
    onContentUpdate: vi.fn(() => () => {}),
    onContentClear: vi.fn(() => () => {}),
    onShowBlack: vi.fn(() => () => {}),
    onShowLogo: vi.fn(() => () => {}),
    onThemeUpdate: vi.fn(() => () => {}),
  },
  notes: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    getCategories: vi.fn(),
    getTags: vi.fn(),
  },
}; 