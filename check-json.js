const fs = require('fs');
const path = require('path');

// Check the KJV JSON file structure
const kjvPath = path.join(__dirname, 'src', 'database', 'json', 'kjv.json');

try {
  console.log('Reading KJV JSON file...');
  const jsonData = fs.readFileSync(kjvPath, 'utf8');
  const data = JSON.parse(jsonData);
  
  console.log('Total verses:', data.length);
  console.log('First verse:', JSON.stringify(data[0], null, 2));
  
  // Look for John 3:16
  const john316 = data.find(v => v.book === 43 && v.chapter === 3 && v.verse === 16);
  console.log('\nJohn 3:16:');
  console.log(john316 ? JSON.stringify(john316, null, 2) : 'Not found');
  
  // Check book numbers
  const uniqueBooks = [...new Set(data.map(v => v.book))].sort((a, b) => a - b);
  console.log('\nUnique book numbers:', uniqueBooks);
  
} catch (error) {
  console.error('Error:', error.message);
} 