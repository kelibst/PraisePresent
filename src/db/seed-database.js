/**
 * Bible Database Seeding Script
 * 
 * This script creates SQLite databases from JSON Bible files.
 * Run with: node seed-database.js
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Paths
const JSON_DIR = path.join(__dirname, 'jsonBible');
const OUTPUT_DIR = path.join(__dirname, 'EN-English');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Process each JSON file
const jsonFiles = fs.readdirSync(JSON_DIR).filter(file => file.endsWith('.json'));
console.log(`Found ${jsonFiles.length} JSON Bible files to process`);

// Process Bible JSON file
function processBibleFile(jsonFile) {
  const bibleId = path.basename(jsonFile, '.json');
  console.log(`Processing ${bibleId}...`);
  
  const jsonPath = path.join(JSON_DIR, jsonFile);
  const dbPath = path.join(OUTPUT_DIR, `${bibleId}.sqlite`);
  
  // Skip if database already exists
  if (fs.existsSync(dbPath)) {
    console.log(`Database for ${bibleId} already exists, skipping.`);
    return;
  }
  
  // Read JSON file
  console.log(`Reading ${jsonFile}...`);
  const bibleData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Create and initialize database
  console.log(`Creating database: ${dbPath}`);
  const db = new sqlite3.Database(dbPath);
  
  db.serialize(() => {
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS meta (
        field TEXT PRIMARY KEY,
        value TEXT
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL
      )
    `);
    
    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_book_chapter_verse ON verses (book, chapter, verse)`);
    
    // Extract and add metadata
    if (bibleData.metadata) {
      console.log('Adding metadata to database...');
      // Insert metadata from the JSON
      const metaStmt = db.prepare('INSERT INTO meta (field, value) VALUES (?, ?)');
      
      // Process metadata from JSON
      for (const [field, value] of Object.entries(bibleData.metadata)) {
        if (value !== null && value !== undefined) {
          metaStmt.run(field, value.toString());
        }
      }
      
      metaStmt.finalize();
    } else {
      // If no metadata exists, create some default entries
      console.log('Adding default metadata to database...');
      const metaStmt = db.prepare('INSERT INTO meta (field, value) VALUES (?, ?)');
      const defaultMeta = {
        name: bibleId.toUpperCase(),
        shortname: bibleId.toUpperCase(),
        module: bibleId,
        language: 'English',
        hasStrongs: bibleId.includes('_strongs') || bibleId.includes('strongs') || bibleId.endsWith('s') ? 'true' : 'false'
      };
      
      for (const [field, value] of Object.entries(defaultMeta)) {
        metaStmt.run(field, value);
      }
      
      metaStmt.finalize();
    }
    
    // Process verses
    console.log('Adding verses to database...');
    try {
      if (bibleData.verses && Array.isArray(bibleData.verses)) {
        const insertVerseStmt = db.prepare('INSERT INTO verses (book, chapter, verse, text) VALUES (?, ?, ?, ?)');
        db.run('BEGIN TRANSACTION');
        
        // Insert each verse from the array
        let verseCount = 0;
        for (const verse of bibleData.verses) {
          if (verse.book && verse.chapter && verse.verse && verse.text) {
            insertVerseStmt.run(verse.book, verse.chapter, verse.verse, verse.text);
            verseCount++;
            
            // Log progress periodically
            if (verseCount % 5000 === 0) {
              console.log(`  ...${verseCount} verses processed`);
            }
          }
        }
        
        db.run('COMMIT');
        insertVerseStmt.finalize();
        console.log(`Successfully added ${verseCount} verses to ${bibleId}.sqlite`);
      } else {
        console.error(`Error: Unexpected verse format in ${jsonFile}`);
      }
    } catch (error) {
      db.run('ROLLBACK');
      console.error(`Error adding verses to ${bibleId}:`, error);
    }
  });
  
  // Close database
  db.close((err) => {
    if (err) {
      console.error(`Error closing database ${bibleId}:`, err);
    } else {
      console.log(`Completed processing ${bibleId}`);
    }
  });
}

// Process all JSON files
console.log('Starting database seeding process...');
let processedCount = 0;

// Process files one at a time to avoid memory issues
function processNextFile(index) {
  if (index >= jsonFiles.length) {
    console.log(`Database seeding completed. Processed ${processedCount} of ${jsonFiles.length} files.`);
    return;
  }
  
  try {
    processBibleFile(jsonFiles[index]);
    processedCount++;
  } catch (error) {
    console.error(`Error processing ${jsonFiles[index]}:`, error);
  }
  
  // Process next file
  processNextFile(index + 1);
}

// Start processing files
processNextFile(0); 