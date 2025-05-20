/**
 * Verify Bible Database Content
 * 
 * This script checks the content of SQLite databases to ensure they're valid.
 * Run with: node verify-database.js
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Paths
const DB_DIR = path.join(__dirname, 'EN-English');
const BIBLE_ID = 'kjv'; // Change to verify a different Bible

const dbPath = path.join(DB_DIR, `${BIBLE_ID}.sqlite`);
console.log(`Verifying database: ${dbPath}`);

// Check if file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found: ${dbPath}`);
  process.exit(1);
}

// Open database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log('Connected to the database.');
  
  // Check metadata
  db.all('SELECT * FROM meta', [], (err, rows) => {
    if (err) {
      console.error(`Error querying metadata: ${err.message}`);
    } else {
      console.log(`Metadata (${rows.length} rows):`);
      rows.forEach((row) => {
        console.log(`  ${row.field}: ${row.value}`);
      });
    }
    
    // Check verses
    db.get('SELECT COUNT(*) as count FROM verses', [], (err, row) => {
      if (err) {
        console.error(`Error counting verses: ${err.message}`);
      } else {
        console.log(`Total verses: ${row.count}`);
        
        // Check some specific verses
        checkVerse(1, 1, 1); // Genesis 1:1
        checkVerse(43, 3, 16); // John 3:16
        checkVerse(19, 23, 1); // Psalm 23:1
      }
    });
  });
});

// Function to check a specific verse
function checkVerse(book, chapter, verse) {
  db.get(
    'SELECT * FROM verses WHERE book = ? AND chapter = ? AND verse = ?',
    [book, chapter, verse],
    (err, row) => {
      if (err) {
        console.error(`Error fetching verse: ${err.message}`);
      } else if (row) {
        console.log(`Verse ${book}:${chapter}:${verse}: "${row.text}"`);
      } else {
        console.log(`Verse ${book}:${chapter}:${verse} not found.`);
      }
      
      // If this is the last verse check, close the database
      if (book === 19 && chapter === 23 && verse === 1) {
        db.close((err) => {
          if (err) {
            console.error(`Error closing database: ${err.message}`);
          } else {
            console.log('Database connection closed.');
          }
        });
      }
    }
  );
} 