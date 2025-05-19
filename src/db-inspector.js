const Database = require('better-sqlite3');
const path = require('path');

// Path to your Bible SQLite file
const dbPath = path.join(__dirname, 'db/EN-English/kjv.sqlite');

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
  console.log('Tables in the database:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
    // Get schema for each table
    const schema = db.prepare(`PRAGMA table_info(${table.name});`).all();
    console.log('  Columns:');
    schema.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // Show sample data
    console.log('  Sample data:');
    const sampleData = db.prepare(`SELECT * FROM ${table.name} LIMIT 1;`).all();
    console.log(JSON.stringify(sampleData, null, 2));
    console.log('\n');
  });
  
  db.close();
} catch (error) {
  console.error('Error inspecting database:', error.message);
} 