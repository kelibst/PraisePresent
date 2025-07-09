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

  // Create sample media items
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

  // Create sample slide themes
  console.log('🎨 Creating slide themes...');
  const defaultTheme = await prisma.slideTheme.create({
    data: {
      name: 'Default Theme',
      colorPalette: JSON.stringify({
        primary: '#2D3748',
        secondary: '#4A5568',
        accent: '#3182CE',
        text: '#FFFFFF',
        background: '#1A202C'
      }),
      typography: JSON.stringify({
        headingFont: 'Arial, sans-serif',
        bodyFont: 'Arial, sans-serif',
        headingSize: '48px',
        bodySize: '24px'
      }),
      backgrounds: JSON.stringify({
        default: {
          type: 'gradient',
          colors: ['#2D3748', '#1A202C'],
          angle: 135
        }
      }),
      isDefault: true
    }
  });

  // Create sample slide templates
  console.log('📄 Creating slide templates...');
  const textTemplate = await prisma.slideTemplate.create({
    data: {
      name: 'Basic Text Slide',
      type: 'text',
      defaultContent: JSON.stringify({
        text: 'Sample text content',
        fontSize: '48px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        textColor: '#FFFFFF'
      }),
      defaultStyling: JSON.stringify({
        background: {
          type: 'color',
          color: '#2D3748'
        },
        padding: 40
      }),
      category: 'text',
      description: 'Basic text slide template',
      isPublic: true
    }
  });

  // Create sample notes
  console.log('📝 Creating sample notes...');
  const welcomeNote = await prisma.note.create({
    data: {
      title: 'Welcome Message',
      content: 'Welcome to our worship service today! We are glad you are here.',
      category: 'announcements',
      tags: JSON.stringify(['welcome', 'announcement']),
      userId: admin.id
    }
  });

  const sermonNote = await prisma.note.create({
    data: {
      title: 'Sermon Notes - Faith',
      content: 'Faith is the substance of things hoped for, the evidence of things not seen. (Hebrews 11:1)',
      category: 'sermon',
      tags: JSON.stringify(['sermon', 'faith', 'scripture']),
      userId: admin.id
    }
  });

  // Create presentations for the notes
  console.log('📊 Creating presentations...');
  const welcomePresentation = await prisma.presentation.create({
    data: {
      title: welcomeNote.title,
      description: 'Welcome message presentation',
      status: 'draft',
      metadata: JSON.stringify({
        type: 'note',
        category: welcomeNote.category,
        tags: JSON.parse(welcomeNote.tags || '[]')
      }),
      noteId: welcomeNote.id
    }
  });

  const sermonPresentation = await prisma.presentation.create({
    data: {
      title: sermonNote.title,
      description: 'Sermon notes presentation',
      status: 'draft',
      metadata: JSON.stringify({
        type: 'note',
        category: sermonNote.category,
        tags: JSON.parse(sermonNote.tags || '[]')
      }),
      noteId: sermonNote.id
    }
  });

  // Create slides for the presentations
  console.log('🎯 Creating slides...');
  const welcomeSlide = await prisma.slide.create({
    data: {
      presentationId: welcomePresentation.id,
      type: 'text',
      content: JSON.stringify({
        text: welcomeNote.content,
        fontSize: '48px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        textColor: '#FFFFFF'
      }),
      order: 1,
      styling: JSON.stringify({
        background: {
          type: 'color',
          color: '#2D3748'
        },
        layout: {
          type: 'default',
          padding: 40
        }
      })
    }
  });

  const sermonSlide = await prisma.slide.create({
    data: {
      presentationId: sermonPresentation.id,
      type: 'text',
      content: JSON.stringify({
        text: sermonNote.content,
        fontSize: '36px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        textColor: '#FFFFFF'
      }),
      order: 1,
      styling: JSON.stringify({
        background: {
          type: 'color',
          color: '#1A202C'
        },
        layout: {
          type: 'default',
          padding: 40
        }
      })
    }
  });

  // Create text content for the slides
  console.log('📝 Creating text content...');
  await prisma.textContent.create({
    data: {
      slideId: welcomeSlide.id,
      text: welcomeNote.content,
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      lineHeight: 1.2,
      padding: JSON.stringify({
        top: 40,
        right: 40,
        bottom: 40,
        left: 40
      })
    }
  });

  await prisma.textContent.create({
    data: {
      slideId: sermonSlide.id,
      text: sermonNote.content,
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      lineHeight: 1.2,
      padding: JSON.stringify({
        top: 40,
        right: 40,
        bottom: 40,
        left: 40
      })
    }
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`Created:`);
  console.log(`- 2 users (admin, operator)`);
  console.log(`- 1 media item`);
  console.log(`- 1 slide theme`);
  console.log(`- 1 slide template`);
  console.log(`- 2 notes`);
  console.log(`- 2 presentations`);
  console.log(`- 2 slides`);
  console.log(`- 2 text content items`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 