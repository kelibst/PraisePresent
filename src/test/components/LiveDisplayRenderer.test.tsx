import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { LiveDisplayRenderer } from '@/components/rendering/LiveDisplayRenderer';
import { setDisplays, setLiveDisplayContent, setLiveDisplayTheme } from '@/lib/displaySlice';
import { mockDisplays } from '../utils/test-utils';
import { 
  createTextContent, 
  createMediaContent, 
  createSystemContent,
  createPlaceholderContent 
} from '@/types/content';

const renderWithStore = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('LiveDisplayRenderer', () => {
  beforeEach(() => {
    // Set up mock displays
    store.dispatch(setDisplays(mockDisplays));
    
    // Clear any existing content
    store.dispatch(setLiveDisplayContent(null));
    store.dispatch(setLiveDisplayTheme(null));
  });

  it('should render with placeholder content initially', async () => {
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('PraisePresent Live Display')).toBeInTheDocument();
      expect(screen.getByText('Ready to display content')).toBeInTheDocument();
    });
  });

  it('should render text content', async () => {
    const textContent = createTextContent(
      'test-text',
      'Hello World',
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        textAlign: 'center',
        textColor: '#ffffff',
        backgroundColor: '#000000',
        lineHeight: 1.2,
        padding: { top: 10, right: 10, bottom: 10, left: 10 }
      }
    );

    store.dispatch(setLiveDisplayContent(textContent));
    
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  it('should render media content (image)', async () => {
    const mediaContent = createMediaContent(
      'test-image',
      'https://example.com/image.jpg',
      'image'
    );

    store.dispatch(setLiveDisplayContent(mediaContent));
    
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });
  });

  it('should render media content (video)', async () => {
    const mediaContent = createMediaContent(
      'test-video',
      'https://example.com/video.mp4',
      'video'
    );

    store.dispatch(setLiveDisplayContent(mediaContent));
    
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      const video = screen.getByRole('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
    });
  });

  it('should render black screen system content', async () => {
    const blackContent = createSystemContent('black-screen', 'black');

    store.dispatch(setLiveDisplayContent(blackContent));
    
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      const container = document.querySelector('.live-display-renderer');
      expect(container).toBeInTheDocument();
      // Check for black screen div
      const blackDiv = container?.querySelector('div[style*="background-color: rgb(0, 0, 0)"]');
      expect(blackDiv).toBeInTheDocument();
    });
  });

  it('should render logo screen system content', async () => {
    const logoContent = createSystemContent('logo-screen', 'logo', {
      title: 'Custom Title',
      subtitle: 'Custom Subtitle'
    });

    store.dispatch(setLiveDisplayContent(logoContent));
    
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
    });
  });

  it('should render placeholder system content', async () => {
    const placeholderContent = createPlaceholderContent(
      'test-placeholder',
      'Test Title',
      'Test Subtitle'
    );

    store.dispatch(setLiveDisplayContent(placeholderContent));
    
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    });
  });

  it('should render error system content', async () => {
    const errorContent = createSystemContent('error-screen', 'error', {
      message: 'Test Error',
      details: 'Error details'
    });

    store.dispatch(setLiveDisplayContent(errorContent));
    
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error: Test Error')).toBeInTheDocument();
      expect(screen.getByText('Error details')).toBeInTheDocument();
    });
  });

  it('should handle unknown content type', async () => {
    const unknownContent = {
      id: 'unknown',
      type: 'unknown',
      data: {}
    } as any;

    store.dispatch(setLiveDisplayContent(unknownContent));
    
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Unknown content type: unknown')).toBeInTheDocument();
    });
  });

  it('should handle null content', async () => {
    store.dispatch(setLiveDisplayContent(null));
    
    renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('No content to display')).toBeInTheDocument();
    });
  });

  it('should use display bounds from Redux store', async () => {
    const { container } = renderWithStore(<LiveDisplayRenderer displayId={1} />);
    
    await waitFor(() => {
      const displayRenderer = container.querySelector('.live-display-renderer');
      expect(displayRenderer).toBeInTheDocument();
      
      // Check that the container has the expected styling
      const styles = window.getComputedStyle(displayRenderer!);
      expect(styles.width).toBe('100vw');
      expect(styles.height).toBe('100vh');
    });
  });

  it('should apply custom className', async () => {
    const { container } = renderWithStore(
      <LiveDisplayRenderer displayId={1} className="custom-class" />
    );
    
    await waitFor(() => {
      const displayRenderer = container.querySelector('.live-display-renderer.custom-class');
      expect(displayRenderer).toBeInTheDocument();
    });
  });
}); 