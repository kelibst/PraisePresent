import {
  Content,
  TextContent,
  MediaContent,
  SystemContent,
  isSlideContent,
  isTextContent,
  isMediaContent,
  isSystemContent,
  isBlackScreen,
  isLogoScreen,
  isPlaceholder,
  isError,
  validateContent,
  createTextContent,
  createMediaContent,
  createSystemContent,
  createPlaceholderContent,
  createBlackScreenContent,
  createLogoScreenContent,
} from '@/types/content';

describe('Content Type Guards', () => {
  const textContent: TextContent = {
    id: 'text-1',
    type: 'text',
    data: {
      text: 'Hello World',
      styling: {
        fontSize: '24px',
        fontFamily: 'Arial',
        fontWeight: 'normal',
        textAlign: 'center',
        textColor: '#000000',
        backgroundColor: '#ffffff',
        lineHeight: 1.2,
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
      },
    },
  };

  const mediaContent: MediaContent = {
    id: 'media-1',
    type: 'media',
    data: {
      url: 'https://example.com/image.jpg',
      mediaType: 'image',
      displayMode: 'fit',
      positioning: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
      scaling: { scaleX: 1, scaleY: 1, rotation: 0, skewX: 0, skewY: 0 },
    },
  };

  const systemContent: SystemContent = {
    id: 'system-1',
    type: 'system',
    data: {
      variant: 'black',
    },
  };

  it('should correctly identify text content', () => {
    expect(isTextContent(textContent)).toBe(true);
    expect(isTextContent(mediaContent)).toBe(false);
    expect(isTextContent(systemContent)).toBe(false);
  });

  it('should correctly identify media content', () => {
    expect(isMediaContent(mediaContent)).toBe(true);
    expect(isMediaContent(textContent)).toBe(false);
    expect(isMediaContent(systemContent)).toBe(false);
  });

  it('should correctly identify system content', () => {
    expect(isSystemContent(systemContent)).toBe(true);
    expect(isSystemContent(textContent)).toBe(false);
    expect(isSystemContent(mediaContent)).toBe(false);
  });
});

describe('System Content Type Guards', () => {
  it('should correctly identify black screen', () => {
    const blackData = { variant: 'black' as const };
    const logoData = { variant: 'logo' as const };
    
    expect(isBlackScreen(blackData)).toBe(true);
    expect(isBlackScreen(logoData)).toBe(false);
  });

  it('should correctly identify logo screen', () => {
    const logoData = { variant: 'logo' as const };
    const blackData = { variant: 'black' as const };
    
    expect(isLogoScreen(logoData)).toBe(true);
    expect(isLogoScreen(blackData)).toBe(false);
  });

  it('should correctly identify placeholder', () => {
    const placeholderData = { variant: 'placeholder' as const, title: 'Test' };
    const errorData = { variant: 'error' as const, message: 'Error' };
    
    expect(isPlaceholder(placeholderData)).toBe(true);
    expect(isPlaceholder(errorData)).toBe(false);
  });

  it('should correctly identify error', () => {
    const errorData = { variant: 'error' as const, message: 'Error' };
    const placeholderData = { variant: 'placeholder' as const, title: 'Test' };
    
    expect(isError(errorData)).toBe(true);
    expect(isError(placeholderData)).toBe(false);
  });
});

describe('Content Validation', () => {
  it('should validate correct content', () => {
    const validContent: Content = {
      id: 'test-1',
      type: 'text',
      data: {
        text: 'Hello',
        styling: {
          fontSize: '16px',
          fontFamily: 'Arial',
          fontWeight: 'normal',
          textAlign: 'left',
          textColor: '#000000',
          backgroundColor: '#ffffff',
          lineHeight: 1.2,
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
    };

    expect(validateContent(validContent)).toBe(true);
  });

  it('should reject invalid content', () => {
    expect(validateContent(null)).toBe(false);
    expect(validateContent(undefined)).toBe(false);
    expect(validateContent({})).toBe(false);
    expect(validateContent({ id: 'test' })).toBe(false);
    expect(validateContent({ id: 'test', type: 'invalid' })).toBe(false);
  });
});

describe('Content Creation Helpers', () => {
  it('should create text content', () => {
    const styling = {
      fontSize: '24px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      textColor: '#000000',
      backgroundColor: '#ffffff',
      lineHeight: 1.2,
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
    };

    const content = createTextContent('test-text', 'Hello World', styling);

    expect(content.id).toBe('test-text');
    expect(content.type).toBe('text');
    expect(content.data.text).toBe('Hello World');
    expect(content.data.styling).toEqual(styling);
  });

  it('should create media content', () => {
    const content = createMediaContent('test-media', 'https://example.com/image.jpg', 'image');

    expect(content.id).toBe('test-media');
    expect(content.type).toBe('media');
    expect(content.data.url).toBe('https://example.com/image.jpg');
    expect(content.data.mediaType).toBe('image');
    expect(content.data.displayMode).toBe('fit');
  });

  it('should create system content', () => {
    const content = createSystemContent('test-system', 'black');

    expect(content.id).toBe('test-system');
    expect(content.type).toBe('system');
    expect(content.data.variant).toBe('black');
  });

  it('should create placeholder content', () => {
    const content = createPlaceholderContent('test-placeholder', 'Test Title', 'Test Subtitle');

    expect(content.id).toBe('test-placeholder');
    expect(content.type).toBe('system');
    expect(content.data.variant).toBe('placeholder');
    expect((content.data as any).title).toBe('Test Title');
    expect((content.data as any).subtitle).toBe('Test Subtitle');
  });

  it('should create black screen content', () => {
    const content = createBlackScreenContent('test-black');

    expect(content.id).toBe('test-black');
    expect(content.type).toBe('system');
    expect(content.data.variant).toBe('black');
  });

  it('should create logo screen content', () => {
    const content = createLogoScreenContent('test-logo', 'Custom Title', 'Custom Subtitle');

    expect(content.id).toBe('test-logo');
    expect(content.type).toBe('system');
    expect(content.data.variant).toBe('logo');
    expect((content.data as any).title).toBe('Custom Title');
    expect((content.data as any).subtitle).toBe('Custom Subtitle');
  });

  it('should create logo screen content with defaults', () => {
    const content = createLogoScreenContent('test-logo');

    expect(content.id).toBe('test-logo');
    expect(content.type).toBe('system');
    expect(content.data.variant).toBe('logo');
    expect((content.data as any).title).toBe('PraisePresent');
    expect((content.data as any).subtitle).toBe('Live Display System');
  });
}); 