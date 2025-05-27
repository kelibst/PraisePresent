// Simple test to verify Bible data is properly loaded
async function testBibleData() {
  try {
    console.log('Testing Bible data...');
    
    // Import Prisma client directly
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    
    // Check translations
    const translations = await db.translation.findMany({
      orderBy: { name: 'asc' }
    });
    console.log(`✓ Found ${translations.length} translation(s):`);
    translations.forEach(t => {
      console.log(`  - ${t.name}: ${t.fullName}`);
    });
    
    // Check verse counts for each translation
    console.log('\nVerse counts by translation:');
    for (const translation of translations) {
      const verseCount = await db.verse.count({
        where: { translationId: translation.id }
      });
      console.log(`  - ${translation.name}: ${verseCount} verses`);
    }
    
    // Test a specific verse lookup
    console.log('\nTesting John 3:16 in KJV:');
    const kjv = translations.find(t => t.name === 'KJV');
    if (kjv) {
      const johnBook = await db.book.findFirst({
        where: { name: 'John' }
      });
      
      if (johnBook) {
        const verse = await db.verse.findFirst({
          where: {
            translationId: kjv.id,
            bookId: johnBook.id,
            chapter: 3,
            verse: 16
          },
          include: {
            book: true,
            translation: true
          }
        });
        
        if (verse) {
          console.log(`✓ ${verse.book.name} ${verse.chapter}:${verse.verse} (${verse.translation.name})`);
          console.log(`  "${verse.text}"`);
        } else {
          console.log('✗ John 3:16 not found in KJV');
        }
      }
    }
    
    await db.$disconnect();
    console.log('\n✓ Bible data test completed successfully');
    
  } catch (error) {
    console.error('✗ Bible data test failed:', error.message);
  }
}

testBibleData(); 