import { ipcMain } from "electron";
import { getDatabase, initializeDatabase, seedDatabase } from "../lib/database";
import { bibleImporter } from "../lib/bible-importer";
import { sqliteBibleImporter } from "../lib/sqlite-bible-importer";

// Initialize database in main process
let db: any = null;

export async function initializeDatabaseMain() {
  try {
    db = initializeDatabase();
    console.log("Database initialized in main process");

    // Set up IPC handlers for database operations
    setupDatabaseIPC();

    return db;
  } catch (error) {
    console.error("Failed to initialize database in main process:", error);
    throw error;
  }
}

function setupDatabaseIPC() {
  // Translation operations
  ipcMain.handle("db:loadTranslations", async () => {
    try {
      const translations = await db.translation.findMany({
        orderBy: { name: "asc" },
      });
      // Serialize dates to avoid non-serializable values in Redux
      return translations.map((translation: any) => ({
        ...translation,
        createdAt: translation.createdAt?.toISOString(),
        updatedAt: translation.updatedAt?.toISOString(),
      }));
    } catch (error) {
      console.error("Error loading translations:", error);
      throw error;
    }
  });

  // Version operations
  ipcMain.handle("db:loadVersions", async (event, translationId?: string) => {
    try {
      const whereClause = translationId ? { translationId } : {};
      const versions = await db.version.findMany({
        where: whereClause,
        include: {
          translation: true,
        },
        orderBy: { name: "asc" },
      });
      // Serialize dates to avoid non-serializable values in Redux
      return versions.map((version: any) => ({
        ...version,
        createdAt: version.createdAt?.toISOString(),
        updatedAt: version.updatedAt?.toISOString(),
        translation: version.translation
          ? {
              ...version.translation,
              createdAt: version.translation.createdAt?.toISOString(),
              updatedAt: version.translation.updatedAt?.toISOString(),
            }
          : null,
      }));
    } catch (error) {
      console.error("Error loading versions:", error);
      throw error;
    }
  });

  // Book operations
  ipcMain.handle("db:loadBooks", async () => {
    try {
      const books = await db.book.findMany({
        orderBy: { order: "asc" },
      });
      return books;
    } catch (error) {
      console.error("Error loading books:", error);
      throw error;
    }
  });

  // Verse operations
  ipcMain.handle(
    "db:loadVerses",
    async (
      event,
      {
        versionId,
        bookId,
        chapter,
      }: { versionId: string; bookId: number; chapter: number }
    ) => {
      try {
        const verses = await db.verse.findMany({
          where: {
            versionId,
            bookId,
            chapter,
          },
          include: {
            book: true,
            version: {
              include: {
                translation: true,
              },
            },
          },
          orderBy: { verse: "asc" },
        });
        // Serialize dates to avoid non-serializable values in Redux
        return verses.map((verse: any) => ({
          ...verse,
          createdAt: verse.createdAt?.toISOString(),
          updatedAt: verse.updatedAt?.toISOString(),
          book: verse.book
            ? {
                ...verse.book,
                createdAt: verse.book.createdAt?.toISOString(),
                updatedAt: verse.book.updatedAt?.toISOString(),
              }
            : null,
          version: verse.version
            ? {
                ...verse.version,
                createdAt: verse.version.createdAt?.toISOString(),
                updatedAt: verse.version.updatedAt?.toISOString(),
                translation: verse.version.translation
                  ? {
                      ...verse.version.translation,
                      createdAt:
                        verse.version.translation.createdAt?.toISOString(),
                      updatedAt:
                        verse.version.translation.updatedAt?.toISOString(),
                    }
                  : null,
              }
            : null,
        }));
      } catch (error) {
        console.error("Error loading verses:", error);
        throw error;
      }
    }
  );

  // Search operations
  ipcMain.handle(
    "db:searchVerses",
    async (
      event,
      { query, versionId }: { query: string; versionId?: string }
    ) => {
      try {
        const whereClause: any = {
          text: {
            contains: query,
            mode: "insensitive",
          },
        };

        if (versionId) {
          whereClause.versionId = versionId;
        }

        const verses = await db.verse.findMany({
          where: whereClause,
          include: {
            book: true,
            version: {
              include: {
                translation: true,
              },
            },
          },
          take: 50, // Limit results
          orderBy: [
            { book: { order: "asc" } },
            { chapter: "asc" },
            { verse: "asc" },
          ],
        });
        // Serialize dates to avoid non-serializable values in Redux
        return verses.map((verse: any) => ({
          ...verse,
          createdAt: verse.createdAt?.toISOString(),
          updatedAt: verse.updatedAt?.toISOString(),
          book: verse.book
            ? {
                ...verse.book,
                createdAt: verse.book.createdAt?.toISOString(),
                updatedAt: verse.book.updatedAt?.toISOString(),
              }
            : null,
          version: verse.version
            ? {
                ...verse.version,
                createdAt: verse.version.createdAt?.toISOString(),
                updatedAt: verse.version.updatedAt?.toISOString(),
                translation: verse.version.translation
                  ? {
                      ...verse.version.translation,
                      createdAt:
                        verse.version.translation.createdAt?.toISOString(),
                      updatedAt:
                        verse.version.translation.updatedAt?.toISOString(),
                    }
                  : null,
              }
            : null,
        }));
      } catch (error) {
        console.error("Error searching verses:", error);
        throw error;
      }
    }
  );

  // Database setup operations
  ipcMain.handle("db:seed", async () => {
    try {
      await seedDatabase();
      await bibleImporter.createBasicTopics();
      return { success: true };
    } catch (error) {
      console.error("Error seeding database:", error);
      throw error;
    }
  });

  ipcMain.handle("db:importBibles", async () => {
    try {
      await bibleImporter.importAllVersions();
      return { success: true };
    } catch (error) {
      console.error("Error importing Bibles:", error);
      throw error;
    }
  });

  ipcMain.handle("db:importBiblesSQLite", async () => {
    try {
      await sqliteBibleImporter.importAllVersions();
      return { success: true };
    } catch (error) {
      console.error("Error importing Bibles from SQLite:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:importSingleBibleSQLite",
    async (event, versionName: string) => {
      try {
        await sqliteBibleImporter.importSingleVersionFromSQLite(versionName);
        return { success: true };
      } catch (error) {
        console.error("Error importing single Bible from SQLite:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("db:getImportStats", async () => {
    try {
      const stats = await sqliteBibleImporter.getImportStats();
      return stats;
    } catch (error) {
      console.error("Error getting import stats:", error);
      throw error;
    }
  });

  // Song operations (for future use)
  ipcMain.handle(
    "db:loadSongs",
    async (
      event,
      { search, limit = 50 }: { search?: string; limit?: number }
    ) => {
      try {
        const where = search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { artist: { contains: search, mode: "insensitive" } },
                { lyrics: { contains: search, mode: "insensitive" } },
              ],
            }
          : {};

        const songs = await db.song.findMany({
          where,
          orderBy: [{ lastUsed: "desc" }, { title: "asc" }],
          take: limit,
        });
        return songs;
      } catch (error) {
        console.error("Error loading songs:", error);
        throw error;
      }
    }
  );

  // Service operations (for future use)
  ipcMain.handle("db:loadServices", async (event, limit = 20) => {
    try {
      const services = await db.service.findMany({
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { date: "desc" },
        take: limit,
      });
      return services;
    } catch (error) {
      console.error("Error loading services:", error);
      throw error;
    }
  });

  // Settings operations
  ipcMain.handle("db:getSetting", async (event, key: string) => {
    try {
      const setting = await db.setting.findUnique({
        where: { key },
      });
      return setting?.value || null;
    } catch (error) {
      console.error("Error getting setting:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:setSetting",
    async (
      event,
      {
        key,
        value,
        type = "string",
        category,
      }: { key: string; value: string; type?: string; category?: string }
    ) => {
      try {
        const setting = await db.setting.upsert({
          where: { key },
          update: { value, type, category },
          create: { key, value, type, category },
        });
        return setting;
      } catch (error) {
        console.error("Error setting setting:", error);
        throw error;
      }
    }
  );
}

export { db };
