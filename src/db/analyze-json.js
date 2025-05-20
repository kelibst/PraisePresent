/**
 * Analyze Bible JSON Structure
 * 
 * This script analyzes a single JSON Bible file to determine its structure.
 * Run with: node analyze-json.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const JSON_DIR = path.join(__dirname, 'jsonBible');
const SAMPLE_FILE = 'kjv.json'; // Change to any file you want to analyze

const jsonPath = path.join(JSON_DIR, SAMPLE_FILE);
console.log(`Analyzing ${SAMPLE_FILE}...`);

try {
  // Read a small portion of the file to determine structure
  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  
  // Try to parse it
  const data = JSON.parse(fileContent);
  
  // Analyze structure
  console.log('Data type:', typeof data);
  
  if (Array.isArray(data)) {
    console.log('Structure: Array');
    if (data.length > 0) {
      console.log('First element:', JSON.stringify(data[0], null, 2));
    }
  } else if (typeof data === 'object') {
    console.log('Structure: Object');
    const keys = Object.keys(data);
    console.log('Top-level keys:', keys);
    
    // Check metadata
    if (data.metadata) {
      console.log('Metadata:', JSON.stringify(data.metadata, null, 2).slice(0, 500) + '...');
    }
    
    // Check verses
    if (data.verses) {
      console.log('Verses structure:', typeof data.verses);
      
      if (Array.isArray(data.verses)) {
        console.log('Verses count:', data.verses.length);
        console.log('First verse sample:', JSON.stringify(data.verses[0], null, 2));
        console.log('Genesis 1:1 (if exists):', data.verses.find(v => v.book === 1 && v.chapter === 1 && v.verse === 1));
      } else if (typeof data.verses === 'object') {
        const verseKeys = Object.keys(data.verses);
        console.log('Verses organization:', verseKeys.slice(0, 5), verseKeys.length > 5 ? `...and ${verseKeys.length - 5} more` : '');
        
        // Try to find structure pattern
        const firstVerseKey = verseKeys[0];
        console.log(`First verse key: ${firstVerseKey}, type:`, typeof data.verses[firstVerseKey]);
        console.log('First verse sample:', JSON.stringify(data.verses[firstVerseKey], null, 2).slice(0, 500) + '...');
      }
    }
  }
  
  console.log('Analysis complete.');
} catch (error) {
  console.error('Error analyzing JSON file:', error);
} 