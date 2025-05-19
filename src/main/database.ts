import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

// Database cache
const connections: Record<string, Database.Database> = {};

// Get the path to the database directory
const dbDir = path.join(app.getPath('userData'), 'db');
console.log('Database directory:', dbDir);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  // Copy from the development db folder to the userData folder
  const devDbDir = path.join(app.getAppPath(), 'src', 'db');
  console.log('Development database directory:', devDbDir);
  
  if (fs.existsSync(devDbDir)) {
    console.log('Found development database directory, copying to user data directory');
    fs.mkdirSync(dbDir, { recursive: true });
    fs.cpSync(devDbDir, dbDir, { recursive: true });
  } else {
    console.error('Development database directory not found:', devDbDir);
  }
}

// Database connection function
function getConnection(bibleId: string): Database.Database {
  if (connections[bibleId]) {
    return connections[bibleId];
  }

  const dbPath = path.join(dbDir, bibleId + '.sqlite');
  // Check in EN-English subfolder if not found
  const enDbPath = path.join(dbDir, 'EN-English', bibleId + '.sqlite');
  
  console.log('Looking for database:', bibleId);
  console.log('Checking path:', dbPath);
  console.log('Checking EN path:', enDbPath);
  
  let finalPath = '';
  if (fs.existsSync(dbPath)) {
    console.log('Found at root path');
    finalPath = dbPath;
  } else if (fs.existsSync(enDbPath)) {
    console.log('Found at EN-English path');
    finalPath = enDbPath;
  } else {
    const error = `Database file for ${bibleId} not found`;
    console.error(error);
    throw new Error(error);
  }

  console.log('Opening database connection to:', finalPath);
  const db = new Database(finalPath, { readonly: true });
  connections[bibleId] = db;
  return db;
}

// Interface for metadata records
interface MetaData {
  field: string;
  value: string;
}

// Bible interface
interface Bible {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  hasStrongs: boolean;
}

// Setup IPC handlers
export function setupDatabaseIPC() {
  console.log('Setting up database IPC handlers');
  
  // Get available Bibles
  ipcMain.handle('db:get-bibles', (event) => {
    console.log('IPC: db:get-bibles called from', event.sender.getURL());
    
    try {
      const englishDir = path.join(dbDir, 'EN-English');
      console.log('Looking for English Bibles in:', englishDir);
      
      if (!fs.existsSync(englishDir)) {
        console.error(`English Bible directory not found at ${englishDir}`);
        return [];
      }

      const files = fs.readdirSync(englishDir);
      console.log('Found files:', files);
      
      const bibles: Bible[] = [];
      
      for (const file of files) {
        if (file.endsWith('.sqlite')) {
          const bibleId = file.replace('.sqlite', '');
          console.log('Processing Bible:', bibleId);
          
          try {
            const db = getConnection(bibleId);
            
            // Get Bible metadata from the database
            const stmt = db.prepare('SELECT * FROM meta WHERE field = ?');
            const metaData = stmt.get('name') as MetaData | undefined;
            const name = metaData ? metaData.value : bibleId.toUpperCase();
            
            // Determine if it has Strong's numbers
            const hasStrongs = bibleId.includes('_strongs') || bibleId.includes('strongs') || bibleId.endsWith('s');
            
            bibles.push({
              id: bibleId,
              name: name,
              abbreviation: bibleId.toUpperCase(),
              language: 'English',
              hasStrongs
            });
            
            console.log('Added Bible:', name);
          } catch (error) {
            console.error(`Error loading Bible ${bibleId}:`, error);
          }
        }
      }
      
      console.log('Returning bibles:', bibles.length);
      return bibles;
    } catch (error) {
      console.error('Error getting Bibles:', error);
      return [];
    }
  });

  // Get scripture by reference
  ipcMain.handle('db:get-scripture', (event, bibleId: string, book: number, chapter: number, fromVerse: number, toVerse: number) => {
    console.log('IPC: db:get-scripture called with', { bibleId, book, chapter, fromVerse, toVerse });
    
    try {
      const db = getConnection(bibleId);
      
      const query = `
        SELECT id, book, chapter, verse, text
        FROM verses 
        WHERE book = ? AND chapter = ? AND verse >= ? AND verse <= ?
        ORDER BY verse
      `;
      
      const stmt = db.prepare(query);
      const verses = stmt.all(book, chapter, fromVerse, toVerse);
      
      console.log(`Found ${verses.length} verses`);
      
      if (verses.length === 0) {
        return null;
      }

      // Add bibleId to each verse
      verses.forEach((verse: any) => {
        verse.bibleId = bibleId;
      });

      // Generate reference (e.g., "John 3:16-18")
      const bookNames = [
        'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
        'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
        '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
        'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
        'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
        'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
        'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
        'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
        'Matthew', 'Mark', 'Luke', 'John', 'Acts',
        'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
        'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
        '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
        'James', '1 Peter', '2 Peter', '1 John', '2 John',
        '3 John', 'Jude', 'Revelation'
      ];
      
      const bookName = bookNames[book - 1] || `Book ${book}`;
      const reference = verses.length === 1
        ? `${bookName} ${chapter}:${fromVerse}`
        : `${bookName} ${chapter}:${fromVerse}-${toVerse}`;
      
      const result = {
        reference,
        verses,
        translation: bibleId.split('/').pop()?.toUpperCase() || bibleId.toUpperCase()
      };
      
      console.log('Returning scripture reference:', reference);
      return result;
    } catch (error) {
      console.error('Error getting scripture:', error);
      return null;
    }
  });
  
  console.log('Database IPC handlers setup complete');
} 