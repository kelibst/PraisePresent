const path = require('path');

// Simple test to check if we can access the database
async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Import Prisma client directly
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    
    // Test basic queries
    const translationCount = await db.translation.count();
    console.log(`✓ Found ${translationCount} translation(s)`);
    
    const bookCount = await db.book.count();
    console.log(`✓ Found ${bookCount} book(s)`);
    
    const topicCount = await db.topic.count();
    console.log(`✓ Found ${topicCount} topic(s)`);
    
    // Check if KJV translation exists
    const kjv = await db.translation.findUnique({
      where: { name: 'KJV' }
    });
    
    if (kjv) {
      console.log(`✓ KJV translation found: ${kjv.fullName}`);
    } else {
      console.log('✗ KJV translation not found');
    }
    
    await db.$disconnect();
    console.log('✓ Database test completed successfully');
    
  } catch (error) {
    console.error('✗ Database test failed:', error.message);
  }
}

testDatabase(); 