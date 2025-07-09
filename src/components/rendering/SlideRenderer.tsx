import React, { useEffect, useRef, useState } from 'react';
import { renderingEngine, RenderedSlide, Slide, SlideTheme } from '@/services/RenderingEngine';
import { TextRenderer } from '@/components/rendering/TextRenderer';
import { MediaRenderer } from '@/components/rendering/MediaRenderer';
import { RichTextRenderer } from '@/components/rendering/RichTextRenderer';
import { AnimationController } from '@/components/rendering/AnimationController';
import { TransitionController } from '@/components/rendering/TransitionController';

interface SlideRendererProps {
  slide: Slide;
  theme?: SlideTheme;
  isActive?: boolean;
  onAnimationComplete?: () => void;
  onTransitionComplete?: () => void;
  className?: string;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  theme,
  isActive = false,
  onAnimationComplete,
  onTransitionComplete,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderedSlide, setRenderedSlide] = useState<RenderedSlide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processSlide = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Set theme if provided
        if (theme) {
          renderingEngine.setTheme(theme);
        }

        // Render the slide
        const rendered = await renderingEngine.renderSlide(slide);
        setRenderedSlide(rendered);
      } catch (err) {
        console.error('Error rendering slide:', err);
        setError(err instanceof Error ? err.message : 'Failed to render slide');
      } finally {
        setIsLoading(false);
      }
    };

    processSlide();
  }, [slide, theme]);

  if (isLoading) {
    return (
      <div className={`slide-renderer loading ${className}`}>
        <div className="loading-spinner">Loading slide...</div>
      </div>
    );
  }

  if (error || !renderedSlide) {
    return (
      <div className={`slide-renderer error ${className}`}>
        <div className="error-message">
          {error || 'Failed to render slide'}
        </div>
      </div>
    );
  }

  const backgroundStyle = generateBackgroundStyle(renderedSlide.styling.background);
  const layoutStyle = generateLayoutStyle(renderedSlide.styling.layout);
  const effectStyle = generateEffectStyle(renderedSlide.styling.effects);

  const containerStyle = {
    ...backgroundStyle,
    ...layoutStyle,
    ...effectStyle,
    width: '100%',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  return (
    <div
      ref={containerRef}
      className={`slide-renderer ${slide.type} ${isActive ? 'active' : ''} ${className}`}
      style={containerStyle}
    >
      <TransitionController
        transitions={renderedSlide.transitions}
        isActive={isActive}
        onComplete={onTransitionComplete}
      >
        <AnimationController
          animations={renderedSlide.animations}
          isActive={isActive}
          onComplete={onAnimationComplete}
        >
          <div className="slide-content">
            {renderContent(renderedSlide)}
          </div>
        </AnimationController>
      </TransitionController>
    </div>
  );
};

const renderContent = (renderedSlide: RenderedSlide) => {
  switch (renderedSlide.content.type) {
    case 'text':
      return <TextRenderer content={renderedSlide.content} />;
    case 'media':
      return <MediaRenderer content={renderedSlide.content} />;
    case 'richtext':
      return <RichTextRenderer content={renderedSlide.content} />;
    default:
      return <div>Unknown content type</div>;
  }
};

const generateBackgroundStyle = (background: any) => {
  const style: React.CSSProperties = {};

  switch (background.type) {
    case 'color':
      style.backgroundColor = background.color;
      break;
    case 'gradient':
      const { colors, direction, type } = background.gradient;
      const gradientType = type === 'radial' ? 'radial-gradient' : 'linear-gradient';
      const gradientDirection = type === 'radial' ? 'circle' : `${direction}deg`;
      style.background = `${gradientType}(${gradientDirection}, ${colors.join(', ')})`;
      break;
    case 'image':
      style.backgroundImage = `url(${background.image.url})`;
      style.backgroundSize = background.image.position === 'stretch' ? 'cover' : 'contain';
      style.backgroundPosition = background.image.position;
      style.backgroundRepeat = background.image.repeat;
      style.opacity = background.image.opacity;
      if (background.image.blur > 0) {
        style.filter = `blur(${background.image.blur}px)`;
      }
      break;
    case 'video':
      // Video backgrounds are handled separately
      break;
  }

  return style;
};

const generateLayoutStyle = (layout: any) => {
  return {
    padding: `${layout.padding.top}px ${layout.padding.right}px ${layout.padding.bottom}px ${layout.padding.left}px`,
    margin: `${layout.margin.top}px ${layout.margin.right}px ${layout.margin.bottom}px ${layout.margin.left}px`,
    display: 'flex',
    flexDirection: layout.flexDirection,
    justifyContent: layout.justifyContent,
    alignItems: layout.alignItems,
    textAlign: layout.alignment,
  };
};

const generateEffectStyle = (effects: any) => {
  const style: React.CSSProperties = {};

  if (effects.shadow) {
    const { x, y, blur, spread, color } = effects.shadow;
    style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }

  if (effects.border) {
    const { width, style: borderStyle, color, radius } = effects.border;
    style.border = `${width}px ${borderStyle} ${color}`;
    style.borderRadius = `${radius}px`;
  }

  if (effects.blur > 0) {
    style.filter = `blur(${effects.blur}px)`;
  }

  if (effects.opacity < 1) {
    style.opacity = effects.opacity;
  }

  return style;
};

export default SlideRenderer; 