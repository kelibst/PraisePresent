# PraisePresent Testing Documentation

## Overview

This document describes the comprehensive testing setup implemented for the PraisePresent application, focusing on the Universal Slide Architecture and core conversion functionality.

## Testing Stack

### Core Testing Framework
- **Jest**: Primary testing framework with TypeScript support
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM elements
- **ts-jest**: TypeScript processor for Jest

### Configuration Files
- `jest.config.js`: Main Jest configuration
- `src/setupTests.ts`: Global test setup and custom matchers
- `src/lib/testUtils.ts`: Reusable test utilities and mock factories

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Features Tested

### 1. Slide Converters (`src/lib/slideConverters.ts`)

**Complete test coverage for all converter functions:**

#### `convertVerseToSlide`
- ✅ Converts Bible verses to Universal Slides
- ✅ Handles missing book/version data gracefully
- ✅ Supports version overrides
- ✅ Validates all required slide properties

#### `convertVersesToSlide`
- ✅ Converts multiple verses into single slide
- ✅ Handles empty verse arrays
- ✅ Maintains proper reference formatting

#### `convertSongSlideToSlide`
- ✅ Converts song slides with complete metadata
- ✅ Handles minimal song data
- ✅ Supports all slide types (verse, chorus, bridge, etc.)

#### `convertSongToSlides`
- ✅ Converts complete songs to slide collections
- ✅ Handles songs without structure
- ✅ Validates slide ordering

#### `convertNoteToSlide`
- ✅ Converts text notes to presentation slides
- ✅ Supports bullet points
- ✅ Handles empty content gracefully

#### `convertAnnouncementToSlide`
- ✅ Converts announcements with full options
- ✅ Supports all priority levels
- ✅ Handles minimal announcement data

#### `createBlankSlide`
- ✅ Creates blank slides for all content types
- ✅ Generates unique IDs consistently
- ✅ Applies appropriate templates

## Test Structure

### Mock Data Factories

The testing system includes comprehensive mock data factories:

```typescript
// Create consistent mock data
const mockVerse = createMockVerse({
  chapter: 3,
  verse: 16,
  text: "Custom verse text"
});

const mockSong = createMockSong({
  title: "Custom Song Title",
  key: "A",
  tempo: "120"
});
```

### Custom Matchers

Custom Jest matchers for slide validation:

```typescript
// Validates that an object is a proper Universal Slide
expect(slide).toBeValidUniversalSlide();
```

### Test Categories

1. **Unit Tests**: Individual function testing with isolated inputs
2. **Integration Tests**: Testing how converters work together
3. **Edge Case Tests**: Error handling and boundary conditions
4. **Performance Tests**: Timing and efficiency validation

## Coverage Goals

- **Branches**: 80%+ coverage
- **Functions**: 80%+ coverage
- **Lines**: 80%+ coverage
- **Statements**: 80%+ coverage

## Test File Organization

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── slideConverters.test.ts    # Comprehensive converter tests
│   │   └── example.test.ts            # Testing setup verification
│   ├── slideConverters.ts             # Code under test
│   └── testUtils.ts                   # Test utilities and mocks
├── setupTests.ts                      # Global test configuration
└── components/
    └── __tests__/                     # Component tests (future)
```

## Running Tests

### Initial Setup
```bash
# Install testing dependencies
npm install

# Run setup verification
npm test example.test.ts
```

### Development Workflow
```bash
# Run tests in watch mode while developing
npm run test:watch

# Run specific test file
npm test slideConverters.test.ts

# Run tests with detailed output
npm test -- --verbose
```

### Coverage Analysis
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Test Examples

### Basic Converter Test
```typescript
it('should convert verse to Universal Slide', () => {
  const mockVerse = createMockVerse();
  const slide = convertVerseToSlide(mockVerse);
  
  expect(slide).toBeValidUniversalSlide();
  expect(slide.type).toBe('scripture');
  expect(slide.title).toBe('John 3:16');
});
```

### Edge Case Test
```typescript
it('should handle missing book data', () => {
  const verseWithoutBook = createMockVerse({ book: undefined });
  const slide = convertVerseToSlide(verseWithoutBook);
  
  expect(slide.title).toBe('Unknown 3:16');
  expect(slide.content.verses[0].book).toBe('Unknown');
});
```

### Integration Test
```typescript
it('should create consistent timestamps across converters', () => {
  const verse = convertVerseToSlide(mockVerse);
  const song = convertSongSlideToSlide(mockSong, mockSlide);
  
  expect(verse.createdAt).toBe(song.createdAt);
  expect(verse.updatedAt).toBe(song.updatedAt);
});
```

## Mocking Strategy

### Date Consistency
All tests use consistent timestamps for predictable results:
```typescript
const MOCK_TIMESTAMP = 1640995200000; // 2022-01-01 00:00:00
Date.now = jest.fn(() => MOCK_TIMESTAMP);
```

### Electron API Mocking
Electron APIs are mocked for testing environment:
```typescript
window.electronAPI = {
  invoke: jest.fn(),
  send: jest.fn(),
  on: jest.fn()
};
```

## Best Practices

1. **Descriptive Test Names**: Each test clearly describes what it validates
2. **Isolated Tests**: Each test runs independently without side effects
3. **Comprehensive Coverage**: Tests cover happy path, edge cases, and errors
4. **Consistent Mocking**: Use factory functions for predictable mock data
5. **Performance Awareness**: Include performance regression tests

## Future Testing Expansion

### Planned Test Areas
1. **Component Testing**: React components with Testing Library
2. **Redux Store Testing**: State management and actions
3. **Database Integration**: SQLite operations and migrations
4. **End-to-End Testing**: Full application workflows
5. **Visual Regression**: Slide rendering consistency

### Test Data Management
- Expand mock data factories for complex scenarios
- Create test database fixtures
- Implement test data cleanup utilities

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure TypeScript paths are configured correctly
2. **Mock Issues**: Verify mock implementations match actual APIs
3. **Async Test Failures**: Use proper async/await patterns
4. **Coverage Issues**: Check that all code paths are exercised

### Debug Commands
```bash
# Run tests with debug output
npm test -- --verbose --no-coverage

# Run single test file
npm test -- --testPathPattern=slideConverters

# Run with Jest debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

This testing implementation provides a solid foundation for ensuring the reliability and maintainability of the PraisePresent application's core functionality. 