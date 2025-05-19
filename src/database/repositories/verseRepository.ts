import { DatabaseManager } from '../connection';
import { Verse, Scripture } from '../models/bible';

export class VerseRepository {
  private dbManager: DatabaseManager;
  private readonly bookNames = [
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

  constructor(dbDir: string) {
    this.dbManager = DatabaseManager.getInstance(dbDir);
  }

  public getVerseByReference(bibleId: string, book: number, chapter: number, verse: number): Verse | null {
    try {
      const db = this.dbManager.getConnection(bibleId);
      
      const query = `
        SELECT id, book, chapter, verse, text
        FROM verses 
        WHERE book = ? AND chapter = ? AND verse = ?
      `;
      
      const stmt = db.prepare(query);
      const result = stmt.get(book, chapter, verse) as Omit<Verse, 'bibleId'> | undefined;
      
      if (!result) return null;
      
      return {
        ...result,
        bibleId
      };
    } catch (error) {
      console.error(`Error getting verse: ${error}`);
      return null;
    }
  }

  public getScripture(bibleId: string, book: number, chapter: number, fromVerse: number, toVerse: number): Scripture | null {
    try {
      const db = this.dbManager.getConnection(bibleId);
      
      const query = `
        SELECT id, book, chapter, verse, text
        FROM verses 
        WHERE book = ? AND chapter = ? AND verse >= ? AND verse <= ?
        ORDER BY verse
      `;
      
      const stmt = db.prepare(query);
      const results = stmt.all(book, chapter, fromVerse, toVerse) as Omit<Verse, 'bibleId'>[];
      
      if (results.length === 0) {
        return null;
      }

      const verses: Verse[] = results.map(result => ({
        ...result,
        bibleId
      }));

      // Generate reference (e.g., "John 3:16-18")
      const bookName = this.getBookName(book);
      const reference = verses.length === 1
        ? `${bookName} ${chapter}:${fromVerse}`
        : `${bookName} ${chapter}:${fromVerse}-${toVerse}`;
      
      return {
        reference,
        verses,
        translation: bibleId.split('/').pop()?.toUpperCase() || bibleId.toUpperCase()
      };
    } catch (error) {
      console.error(`Error getting scripture: ${error}`);
      return null;
    }
  }

  // Helper method to get book name from book number
  private getBookName(book: number): string {
    return this.bookNames[book - 1] || `Book ${book}`;
  }
}
