import React from 'react';
import { ProcessedTextContent } from '@/services/RenderingEngine';

interface TextRendererProps {
  content: ProcessedTextContent;
}

export const TextRenderer: React.FC<TextRendererProps> = ({ content }) => {
  const textStyle: React.CSSProperties = {
    fontSize: content.styling.fontSize,
    fontFamily: content.styling.fontFamily,
    fontWeight: content.styling.fontWeight,
    textAlign: content.styling.textAlign as any,
    color: content.styling.textColor,
    backgroundColor: content.styling.backgroundColor,
    lineHeight: content.styling.lineHeight,
    padding: `${content.styling.padding.top}px ${content.styling.padding.right}px ${content.styling.padding.bottom}px ${content.styling.padding.left}px`,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  };

  // Apply text effects
  if (content.effects.shadow) {
    const { x, y, blur, color } = content.effects.shadow;
    textStyle.textShadow = `${x}px ${y}px ${blur}px ${color}`;
  }

  if (content.effects.outline) {
    const { width, color } = content.effects.outline;
    textStyle.WebkitTextStroke = `${width}px ${color}`;
  }

  if (content.effects.glow) {
    const { color, intensity, spread } = content.effects.glow;
    textStyle.textShadow = `0 0 ${spread}px ${color}, 0 0 ${intensity * 2}px ${color}`;
  }

  return (
    <div className="text-renderer" style={textStyle}>
      {content.text}
    </div>
  );
};

export default TextRenderer; 