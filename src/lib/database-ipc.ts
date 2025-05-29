// IPC client for database operations in renderer process
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

export class DatabaseIPC {
  // Translation operations
  async loadTranslations() {
    return await window.electronAPI.invoke('db:loadTranslations');
  }

  // Version operations
  async loadVersions(translationId?: string) {
    return await window.electronAPI.invoke('db:loadVersions', translationId);
  }

  // Book operations
  async loadBooks() {
    return await window.electronAPI.invoke('db:loadBooks');
  }

  // Verse operations
  async loadVerses({ versionId, bookId, chapter }: { versionId: string; bookId: number; chapter: number }) {
    return await window.electronAPI.invoke('db:loadVerses', { versionId, bookId, chapter });
  }

  // Search operations
  async searchVerses({ query, versionId }: { query: string; versionId?: string }) {
    return await window.electronAPI.invoke('db:searchVerses', { query, versionId });
  }

  // Database setup operations
  async seedDatabase() {
    return await window.electronAPI.invoke('db:seed');
  }

  async importBibles() {
    return await window.electronAPI.invoke('db:importBibles');
  }

  async importBiblesSQLite() {
    return await window.electronAPI.invoke('db:importBiblesSQLite');
  }

  async importSingleBibleSQLite(versionName: string) {
    return await window.electronAPI.invoke('db:importSingleBibleSQLite', versionName);
  }

  async getImportStats() {
    return await window.electronAPI.invoke('db:getImportStats');
  }

  // Song operations (for future use)
  async loadSongs({ search, limit = 50 }: { search?: string; limit?: number } = {}) {
    return await window.electronAPI.invoke('db:loadSongs', { search, limit });
  }

  // Service operations (for future use)
  async loadServices(limit = 20) {
    return await window.electronAPI.invoke('db:loadServices', limit);
  }

  // Settings operations
  async getSetting(key: string) {
    return await window.electronAPI.invoke('db:getSetting', key);
  }

  async setSetting({ key, value, type = 'string', category }: { key: string; value: string; type?: string; category?: string }) {
    return await window.electronAPI.invoke('db:setSetting', { key, value, type, category });
  }
}

// Export singleton instance
export const databaseIPC = new DatabaseIPC(); 