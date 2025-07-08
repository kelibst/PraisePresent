import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample users
  console.log('👤 Creating users...');
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@church.org',
      fullName: 'Admin User',
      role: 'admin',
      preferences: JSON.stringify({
        theme: 'dark',
        fontSize: 16,
        defaultBibleVersion: 'NIV'
      })
    }
  });

  const operator = await prisma.user.create({
    data: {
      username: 'operator',
      email: 'operator@church.org',
      fullName: 'Operator User',
      role: 'operator'
    }
  });

  // Create Bible translations and versions
  console.log('📖 Creating Bible translations and versions...');
  const englishTranslation = await prisma.translation.create({
    data: {
      name: 'English',
      code: 'en',
      isDefault: true,
      versions: {
        create: [
          {
            name: 'NIV',
            fullName: 'New International Version',
            isDefault: true,
            year: 1978,
            publisher: 'Biblica'
          },
          {
            name: 'KJV',
            fullName: 'King James Version',
            year: 1611,
            publisher: 'Church of England'
          }
        ]
      }
    }
  });

  // Create sample books
  console.log('📚 Creating Bible books...');
  const genesis = await prisma.book.create({
    data: {
      id: 1,
      name: 'Genesis',
      shortName: 'Gen',
      testament: 'OT',
      category: 'Law',
      chapters: 50,
      order: 1
    }
  });

  const john = await prisma.book.create({
    data: {
      id: 43,
      name: 'John',
      shortName: 'John',
      testament: 'NT',
      category: 'Gospel',
      chapters: 21,
      order: 43
    }
  });

  // Create sample verses
  console.log('📜 Creating Bible verses...');
  const john316 = await prisma.verse.create({
    data: {
      bookId: john.id,
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
      versionId: (await prisma.version.findFirst({ where: { name: 'NIV' } }))!.id
    }
  });

  // Create sample topics
  console.log('🏷️ Creating topics...');
  const salvationTopic = await prisma.topic.create({
    data: {
      name: 'Salvation',
      description: 'God\'s plan of salvation through Jesus Christ',
      topicVerses: {
        create: {
          verseId: john316.id
        }
      }
    }
  });

  // Create sample songs
  console.log('🎵 Creating songs...');
  const amazingGrace = await prisma.song.create({
    data: {
      title: 'Amazing Grace',
      artist: 'John Newton',
      lyrics: 'Amazing grace, how sweet the sound\nThat saved a wretch like me.\nI once was lost, but now am found,\nWas blind, but now I see.',
      ccliNumber: '4755360',
      key: 'G',
      tempo: '70',
      tags: JSON.stringify(['hymn', 'worship', 'grace']),
      category: 'hymn',
      copyright: '© Public Domain'
    }
  });

  // Create sample media
  console.log('🖼️ Creating media items...');
  const backgroundImage = await prisma.mediaItem.create({
    data: {
      filename: 'worship-background.jpg',
      originalName: 'worship-background.jpg',
      path: '/media/backgrounds/worship-background.jpg',
      type: 'image',
      mimeType: 'image/jpeg',
      size: 1024000,
      width: 1920,
      height: 1080,
      tags: JSON.stringify(['worship', 'background']),
      category: 'backgrounds'
    }
  });

  // Create backgrounds
  console.log('🎨 Creating backgrounds...');
  const defaultBackground = await prisma.background.create({
    data: {
      name: 'Default Gradient',
      type: 'gradient',
      settings: JSON.stringify({
        colors: ['#2D3748', '#1A202C'],
        angle: 135
      }),
      isDefault: true
    }
  });

  const imageBackground = await prisma.background.create({
    data: {
      name: 'Worship Background',
      type: 'image',
      settings: JSON.stringify({
        fit: 'cover',
        opacity: 0.8
      }),
      mediaItemId: backgroundImage.id
    }
  });

  // Create sample service
  console.log('⛪ Creating sample service...');
  const sundayService = await prisma.service.create({
    data: {
      name: 'Sunday Morning Service',
      date: new Date('2024-03-24T09:00:00Z'),
      type: 'Sunday Morning',
      description: 'Regular Sunday morning worship service',
      duration: 90
    }
  });

  // Create service items
  console.log('📝 Creating service items...');
  await prisma.serviceItem.create({
    data: {
      serviceId: sundayService.id,
      type: 'song',
      title: 'Opening Worship',
      order: 1,
      duration: 15,
      songId: amazingGrace.id,
      settings: JSON.stringify({
        repeat: true,
        key: 'G'
      })
    }
  });

  // Create slides
  console.log('🎬 Creating slides...');
  await prisma.slide.create({
    data: {
      title: 'Welcome',
      content: JSON.stringify({
        text: 'Welcome to Our Church',
        fontSize: 48,
        textAlign: 'center'
      }),
      backgroundId: defaultBackground.id,
      order: 1,
      duration: 10,
      transition: 'fade'
    }
  });

  await prisma.slide.create({
    data: {
      title: 'Amazing Grace - Verse 1',
      content: JSON.stringify({
        text: 'Amazing grace, how sweet the sound\nThat saved a wretch like me',
        fontSize: 40,
        textAlign: 'center'
      }),
      backgroundId: imageBackground.id,
      order: 2,
      duration: 15,
      transition: 'crossfade',
      songId: amazingGrace.id
    }
  });

  // Create notes
  console.log('📔 Creating notes...');
  await prisma.note.create({
    data: {
      content: 'Remember to adjust sound levels for the worship team',
      userId: operator.id
    }
  });

  // Create preview items
  console.log('👁️ Creating preview items...');
  await prisma.previewItem.create({
    data: {
      type: 'song',
      content: JSON.stringify({
        songId: amazingGrace.id,
        slides: ['verse1', 'chorus']
      }),
      userId: operator.id
    }
  });

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 