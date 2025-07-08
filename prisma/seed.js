import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Bible versions
  console.log('📖 Creating Bible versions...');
  
  const bibleVersions = [
    {
      name: 'New International Version',
      abbreviation: 'NIV',
      language: 'en',
      copyright: '© 2011 by Biblica, Inc.',
      isDefault: true
    },
    {
      name: 'English Standard Version',
      abbreviation: 'ESV',
      language: 'en',
      copyright: '© 2001 by Crossway',
      isDefault: false
    },
    {
      name: 'New Living Translation',
      abbreviation: 'NLT',
      language: 'en',
      copyright: '© 2015 by Tyndale House Foundation',
      isDefault: false
    },
    {
      name: 'King James Version',
      abbreviation: 'KJV',
      language: 'en',
      copyright: 'Public Domain',
      isDefault: false
    }
  ];

  for (const version of bibleVersions) {
    await prisma.bibleVersion.upsert({
      where: { abbreviation: version.abbreviation },
      update: {},
      create: version
    });
  }

  // Create slide templates
  console.log('🎨 Creating slide templates...');
  
  const slideTemplates = [
    {
      name: 'Default Text',
      description: 'Simple text slide with centered content',
      type: 'TEXT' as const,
      layout: JSON.stringify({
        type: 'centered',
        padding: 40,
        alignment: 'center'
      }),
      defaultStyles: JSON.stringify({
        fontSize: 48,
        fontFamily: 'Arial',
        textColor: '#FFFFFF',
        backgroundColor: '#000000',
        textAlign: 'center'
      }),
      isDefault: true
    },
    {
      name: 'Default Lyrics',
      description: 'Song lyrics with verse structure',
      type: 'LYRICS' as const,
      layout: JSON.stringify({
        type: 'verse',
        padding: 40,
        alignment: 'center',
        showVerseInfo: true
      }),
      defaultStyles: JSON.stringify({
        fontSize: 44,
        fontFamily: 'Arial',
        textColor: '#FFFFFF',
        backgroundColor: '#1a1a1a',
        textAlign: 'center'
      }),
      isDefault: true
    },
    {
      name: 'Default Scripture',
      description: 'Bible verse with reference',
      type: 'SCRIPTURE' as const,
      layout: JSON.stringify({
        type: 'verse',
        padding: 50,
        alignment: 'center',
        showReference: true
      }),
      defaultStyles: JSON.stringify({
        fontSize: 40,
        fontFamily: 'Georgia',
        textColor: '#FFFFFF',
        backgroundColor: '#2d3748',
        textAlign: 'center'
      }),
      isDefault: true
    },
    {
      name: 'Default Announcement',
      description: 'Announcement slide with title and content',
      type: 'ANNOUNCEMENT' as const,
      layout: JSON.stringify({
        type: 'title-content',
        padding: 40,
        alignment: 'center'
      }),
      defaultStyles: JSON.stringify({
        fontSize: 36,
        fontFamily: 'Arial',
        textColor: '#FFFFFF',
        backgroundColor: '#4a5568',
        textAlign: 'center'
      }),
      isDefault: true
    },
    {
      name: 'Default Media',
      description: 'Media slide with overlay text',
      type: 'MEDIA' as const,
      layout: JSON.stringify({
        type: 'fullscreen',
        padding: 20,
        overlayPosition: 'bottom'
      }),
      defaultStyles: JSON.stringify({
        fontSize: 32,
        fontFamily: 'Arial',
        textColor: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.7)',
        textAlign: 'center'
      }),
      isDefault: true
    }
  ];

  for (const template of slideTemplates) {
    await prisma.slideTemplate.create({
      data: template as any
    });
  }

  // Create sample church
  console.log('⛪ Creating sample church...');
  
  const sampleChurch = await prisma.church.create({
    data: {
      name: 'Sample Church',
      address: '123 Main Street',
      city: 'Sample City',
      state: 'SC',
      zipCode: '12345',
      country: 'USA',
      timezone: 'America/New_York',
      ccliLicense: '12345678'
    }
  });

  // Create church settings
  console.log('⚙️ Creating church settings...');
  
  await prisma.churchSettings.upsert({
    where: { churchId: sampleChurch.id },
    update: {},
    create: {
      churchId: sampleChurch.id,
      defaultFontFamily: 'Arial',
      defaultFontSize: 48,
      defaultTextColor: '#FFFFFF',
      defaultBackgroundColor: '#000000',
      defaultAudioLevel: 0.8,
      microphoneEnabled: true,
      audioFadeTime: 3,
      autoStartServices: false,
      showServiceTimer: true,
      defaultServiceLength: 90,
      aiSuggestionsEnabled: true,
      voiceCommandsEnabled: false,
      autoLyricSync: true
    }
  });

  // Create sample user
  console.log('👤 Creating sample user...');
  
  const sampleUser = await prisma.user.upsert({
    where: { email: 'admin@samplechurch.com' },
    update: {},
    create: {
      email: 'admin@samplechurch.com',
      name: 'Church Admin',
      role: 'ADMIN',
      churchId: sampleChurch.id
    }
  });

  // Create user preferences
  console.log('🎯 Creating user preferences...');
  
  const defaultBible = await prisma.bibleVersion.findFirst({
    where: { isDefault: true }
  });

  await prisma.userPreferences.upsert({
    where: { userId: sampleUser.id },
    update: {},
    create: {
      userId: sampleUser.id,
      theme: 'system',
      fontSize: 16,
      preferredBibleId: defaultBible?.id,
      autoAdvanceSlides: false,
      showClockOnSlides: true
    }
  });

  // Create sample songs
  console.log('🎵 Creating sample songs...');
  
  const sampleSongs = [
    {
      title: 'Amazing Grace',
      artist: 'John Newton',
      key: 'G',
      tempo: 90,
      ccliNumber: '22025',
      copyright: 'Public Domain',
      lyrics: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.

Through many dangers, toils and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.`,
      tags: JSON.stringify(['classic', 'hymn', 'grace']),
      churchId: sampleChurch.id
    },
    {
      title: 'How Great Thou Art',
      artist: 'Carl Boberg',
      key: 'Bb',
      tempo: 80,
      ccliNumber: '14181',
      copyright: '© 1953 S. K. Hine',
      lyrics: `O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed

Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art

When through the woods and forest glades I wander
And hear the birds sing sweetly in the trees
When I look down from lofty mountain grandeur
And hear the brook and feel the gentle breeze`,
      tags: JSON.stringify(['worship', 'hymn', 'praise']),
      churchId: sampleChurch.id
    }
  ];

  for (const song of sampleSongs) {
    await prisma.song.create({
      data: song
    });
  }

  // Create sample service
  console.log('🎉 Creating sample service...');
  
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
  nextSunday.setHours(10, 0, 0, 0);
  
  const serviceEndTime = new Date(nextSunday);
  serviceEndTime.setHours(11, 30, 0, 0);

  const sampleService = await prisma.service.create({
    data: {
      name: 'Sunday Morning Worship',
      date: nextSunday,
      startTime: nextSunday,
      endTime: serviceEndTime,
      type: 'SUNDAY_WORSHIP',
      status: 'PLANNED',
      notes: 'Sample service for demonstration',
      churchId: sampleChurch.id
    }
  });

  // Create service plan
  console.log('📋 Creating service plan...');
  
  const servicePlan = await prisma.servicePlan.upsert({
    where: { serviceId: sampleService.id },
    update: {},
    create: {
      serviceId: sampleService.id,
      theme: 'Grace and Worship',
      notes: 'Focus on God\'s amazing grace'
    }
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Created:
  - ${bibleVersions.length} Bible versions
  - ${slideTemplates.length} slide templates
  - 1 sample church with settings
  - 1 sample user with preferences
  - ${sampleSongs.length} sample songs
  - 1 sample service with plan
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 