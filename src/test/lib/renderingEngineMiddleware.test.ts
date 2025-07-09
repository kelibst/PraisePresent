import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { renderingEngineMiddleware } from '@/lib/renderingEngineMiddleware';
import { renderingEngine } from '@/services/RenderingEngine';
import displayReducer, { setDisplays, setLiveDisplayContent } from '@/lib/displaySlice';
import { mockDisplays } from '../utils/test-utils';

// Mock the renderingEngine
const mockRenderingEngine = {
  setDisplayInfo: vi.fn(),
  setTheme: vi.fn(),
  renderSlide: vi.fn(),
  processTextContent: vi.fn(),
  processMediaContent: vi.fn(),
  processRichTextContent: vi.fn(),
  clearContent: vi.fn(),
  getDisplayMetrics: vi.fn(),
};

// Mock the renderingEngine import
vi.mock('@/services/RenderingEngine', () => ({
  renderingEngine: mockRenderingEngine,
}));

describe('renderingEngineMiddleware', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create store with middleware
    store = configureStore({
      reducer: {
        display: displayReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(renderingEngineMiddleware),
    });
  });

  it('should call renderingEngine.setDisplayInfo when displays are set', () => {
    // Dispatch action to set displays
    store.dispatch(setDisplays(mockDisplays));

    // Verify renderingEngine.setDisplayInfo was called for each display
    expect(mockRenderingEngine.setDisplayInfo).toHaveBeenCalledTimes(2);
    expect(mockRenderingEngine.setDisplayInfo).toHaveBeenCalledWith(mockDisplays[0]);
    expect(mockRenderingEngine.setDisplayInfo).toHaveBeenCalledWith(mockDisplays[1]);
  });

  it('should call renderingEngine methods when live display content is set', () => {
    // First set displays
    store.dispatch(setDisplays(mockDisplays));
    vi.clearAllMocks();

    // Set live display content
    const textContent = {
      id: 'test-text',
      type: 'text' as const,
      data: {
        text: 'Hello World',
        styling: {
          fontSize: '24px',
          fontFamily: 'Arial',
          fontWeight: 'normal',
          textAlign: 'center' as const,
          textColor: '#000000',
          backgroundColor: '#ffffff',
          lineHeight: 1.2,
          padding: { top: 10, right: 10, bottom: 10, left: 10 },
        },
      },
    };

    store.dispatch(setLiveDisplayContent(textContent));

    // Verify appropriate rendering method was called
    // Note: The actual behavior depends on the middleware implementation
    // This test assumes the middleware processes content updates
    expect(mockRenderingEngine.processTextContent).toHaveBeenCalledWith(textContent);
  });

  it('should handle media content updates', () => {
    // Set displays first
    store.dispatch(setDisplays(mockDisplays));
    vi.clearAllMocks();

    const mediaContent = {
      id: 'test-media',
      type: 'media' as const,
      data: {
        url: 'https://example.com/image.jpg',
        mediaType: 'image' as const,
        displayMode: 'fit' as const,
        positioning: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
        scaling: { scaleX: 1, scaleY: 1, rotation: 0, skewX: 0, skewY: 0 },
      },
    };

    store.dispatch(setLiveDisplayContent(mediaContent));

    expect(mockRenderingEngine.processMediaContent).toHaveBeenCalledWith(mediaContent);
  });

  it('should handle system content updates', () => {
    // Set displays first
    store.dispatch(setDisplays(mockDisplays));
    vi.clearAllMocks();

    const systemContent = {
      id: 'test-system',
      type: 'system' as const,
      data: {
        variant: 'black' as const,
      },
    };

    store.dispatch(setLiveDisplayContent(systemContent));

    // For system content, the middleware might call clearContent or handle differently
    expect(mockRenderingEngine.clearContent).toHaveBeenCalled();
  });

  it('should handle null content (clear content)', () => {
    // Set displays first
    store.dispatch(setDisplays(mockDisplays));
    vi.clearAllMocks();

    store.dispatch(setLiveDisplayContent(null));

    expect(mockRenderingEngine.clearContent).toHaveBeenCalled();
  });

  it('should not fail if renderingEngine methods throw errors', () => {
    // Make renderingEngine method throw an error
    mockRenderingEngine.setDisplayInfo.mockImplementation(() => {
      throw new Error('Test error');
    });

    // This should not crash the store
    expect(() => {
      store.dispatch(setDisplays(mockDisplays));
    }).not.toThrow();
  });
}); 