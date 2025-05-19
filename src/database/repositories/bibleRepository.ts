import fs from 'fs';
import path from 'path';
import { DatabaseManager } from '../connection';
import { Bible } from '../models/bible';

interface MetaData {
  field: string;
  value: string;
}

export class BibleRepository {
  private dbManager: DatabaseManager;
  private bibles: Bible[] = [];
  private dbDir: string;

  constructor(dbDir: string) {
    this.dbDir = dbDir;
    this.dbManager = DatabaseManager.getInstance(dbDir);
    this.loadAvailableBibles();
  }

  private loadAvailableBibles(): void {
    try {
      const englishDir = path.join(this.dbDir, 'EN-English');
      if (!fs.existsSync(englishDir)) {
        console.error(`English Bible directory not found at ${englishDir}`);
        return;
      }

      const files = fs.readdirSync(englishDir);
      
      files.forEach(file => {
        if (file.endsWith('.sqlite')) {
          const bibleId = file.replace('.sqlite', '');
          try {
            const db = this.dbManager.getConnection(`EN-English/${bibleId}`);
            
            // Get Bible metadata from the database
            const metaData = db.prepare('SELECT * FROM meta WHERE field = ?').get('name') as MetaData | undefined;
            const name = metaData ? metaData.value : bibleId.toUpperCase();
            
            // Determine if it has Strong's numbers
            const hasStrongs = bibleId.includes('_strongs') || bibleId.includes('strongs') || bibleId.endsWith('s');
            
            this.bibles.push({
              id: bibleId,
              name: name,
              abbreviation: bibleId.toUpperCase(),
              language: 'English',
              hasStrongs
            });
          } catch (error) {
            console.error(`Error loading Bible ${bibleId}:`, error);
          }
        }
      });
    } catch (error) {
      console.error('Error loading available Bibles:', error);
    }
  }

  public getAllBibles(): Bible[] {
    return this.bibles;
  }

  public getBibleById(id: string): Bible | undefined {
    return this.bibles.find(bible => bible.id === id);
  }
}
