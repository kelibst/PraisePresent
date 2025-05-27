# PraisePresent Database Setup

This document explains how to set up and use the SQLite database with Prisma ORM for the PraisePresent application.

## Overview

PraisePresent uses:
- **SQLite** as the database engine for local storage
- **Prisma** as the ORM for type-safe database operations
- **Multiple Bible translations** imported from JSON files
- **Comprehensive schema** covering all application features

## Quick Setup

Run the automated setup script:

```bash
npm run db:setup
```

This will:
1. Install Prisma dependencies
2. Generate the Prisma client
3. Create the database and apply the schema
4. Seed initial data (books, settings, default user)
5. Import the KJV Bible translation
6. Create basic topics for scripture search

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
npm install prisma @prisma/client sqlite3
```

### 2. Generate Prisma Client

```bash
npm run db:generate
```

### 3. Create Database

```bash
npm run db:push
```

### 4. Import Bible Data

```javascript
import { bibleImporter } from './src/lib/bible-importer.js';

// Import all available translations
await bibleImporter.importAllTranslations();

// Or import specific translation
await bibleImporter.importSingleTranslation('KJV');
```

## Database Schema

### Core Models

#### Bible & Scripture
- **Translation**: Bible translations (KJV, NIV, ESV, etc.)
- **Book**: Bible books with metadata
- **Verse**: Individual verses with full text
- **Topic**: Hierarchical topics for scripture organization
- **TopicVerse**: Links verses to topics

#### Content Management
- **Song**: Song lyrics, chords, and metadata
- **MediaItem**: Images, videos, audio files
- **Presentation**: Slide presentations
- **Template**: Reusable presentation templates
- **Slide**: Individual slides with content
- **Background**: Slide backgrounds

#### Service Planning
- **Service**: Church services with date/time
- **ServiceItem**: Individual items in a service order

#### System
- **User**: User accounts and preferences
- **Setting**: Application settings
- **Backup**: Backup metadata
- **ImportLog**: Import operation logs

## Available Bible Translations

The following translations are available for import:

- **KJV** - King James Version
- **ASV** - American Standard Version
- **ASVS** - ASV with Strong's Numbers
- **WEB** - World English Bible
- **NET** - New English Translation
- **Geneva** - Geneva Bible (1599)
- **Bishops** - Bishops' Bible (1568)
- **Coverdale** - Coverdale Bible (1535)
- **Tyndale** - Tyndale Bible
- **KJV_Strongs** - KJV with Strong's Numbers

## Database Operations

### Scripture Search

```javascript
import { databaseService } from './src/lib/database-service.js';

// Search by reference
const verses = await databaseService.searchScriptureByReference('John 3:16', 'KJV');

// Search by keyword
const results = await databaseService.searchScriptureByKeyword('love', 'KJV');

// Search by topic
const topicVerses = await databaseService.searchScriptureByTopic('Faith', 'KJV');
```

### Song Management

```javascript
// Get songs
const songs = await databaseService.getSongs('Amazing Grace');

// Create new song
const song = await databaseService.createSong({
  title: 'Amazing Grace',
  artist: 'John Newton',
  lyrics: '...',
  key: 'G',
  ccliNumber: '22025'
});

// Update usage tracking
await databaseService.updateSongUsage(song.id);
```

### Service Planning

```javascript
// Create service
const service = await databaseService.createService({
  name: 'Sunday Morning Service',
  date: new Date(),
  type: 'Sunday Morning'
});

// Add service items
await databaseService.addServiceItem(service.id, {
  type: 'song',
  title: 'Amazing Grace',
  songId: song.id,
  duration: 4
});
```

## Database Files

### Development
- Database: `prisma/dev.db`
- Schema: `prisma/schema.prisma`

### Production
- Database: `%APPDATA%/PraisePresent/praisepresent.db` (Windows)
- Database: `~/PraisePresent/praisepresent.db` (macOS/Linux)

## Useful Commands

```bash
# View database in Prisma Studio
npm run db:studio

# Reset database (careful!)
npx prisma db push --force-reset

# Generate client after schema changes
npm run db:generate

# View database schema
npx prisma db pull
```

## Import Statistics

After importing, you can check statistics:

```javascript
import { bibleImporter } from './src/lib/bible-importer.js';

// Get import stats
const stats = await bibleImporter.getImportStats();
console.log(stats);
// Output: { KJV: 31102, ASV: 31086, ... }

// Verify import integrity
const isValid = await bibleImporter.verifyImport('KJV');
```

## Backup and Restore

The application includes backup functionality:

```javascript
// Settings for backup
await databaseService.setSetting('backup.autoBackup', 'true');
await databaseService.setSetting('backup.frequency', 'daily');
await databaseService.setSetting('backup.location', '/path/to/backups');
```

## Performance Considerations

- **Indexing**: Key fields are indexed for fast searches
- **Batch Operations**: Large imports use batched inserts
- **Query Optimization**: Includes and relations are optimized
- **Full-Text Search**: Consider adding FTS for better text search

## Troubleshooting

### Common Issues

1. **Prisma Client Not Generated**
   ```bash
   npm run db:generate
   ```

2. **Database Lock Errors**
   - Ensure no other processes are using the database
   - Restart the application

3. **Import Failures**
   - Check that JSON files exist in `src/database/json/`
   - Verify file permissions
   - Check available disk space

4. **Schema Changes**
   ```bash
   npm run db:push
   npm run db:generate
   ```

### Logs

Check console output for detailed error messages during:
- Database initialization
- Bible imports
- Query operations

## Development

When modifying the schema:

1. Update `prisma/schema.prisma`
2. Run `npm run db:push`
3. Run `npm run db:generate`
4. Update TypeScript types if needed
5. Test with existing data

## Security

- Database files should be backed up regularly
- Consider encryption for sensitive deployments
- User permissions are role-based (admin, operator, viewer)
- Settings can store encrypted values

---

For more information, see the main project documentation and the Prisma documentation at https://prisma.io/docs 