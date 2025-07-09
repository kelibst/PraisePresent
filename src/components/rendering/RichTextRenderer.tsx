import React from 'react';
import { ProcessedRichTextContent, ProcessedRichTextBlock } from '@/services/RenderingEngine';

interface RichTextRendererProps {
  content: ProcessedRichTextContent;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
  const containerStyle: React.CSSProperties = {
    fontFamily: content.styling.baseFont,
    fontSize: content.styling.baseFontSize,
    color: content.styling.baseColor,
    lineHeight: content.styling.lineHeight,
    width: '100%',
    height: '100%',
    padding: '20px',
    overflowY: 'auto',
  };

  const sortedBlocks = [...content.blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="richtext-renderer" style={containerStyle}>
      {sortedBlocks.map((block, index) => (
        <RichTextBlock
          key={block.id || index}
          block={block}
          baseStyle={content.styling}
          spacing={content.styling.blockSpacing}
        />
      ))}
    </div>
  );
};

interface RichTextBlockProps {
  block: ProcessedRichTextBlock;
  baseStyle: any;
  spacing: number;
}

const RichTextBlock: React.FC<RichTextBlockProps> = ({ block, baseStyle, spacing }) => {
  const blockStyle: React.CSSProperties = {
    marginBottom: `${spacing}px`,
    fontSize: block.styling.fontSize || baseStyle.baseFontSize,
    fontWeight: block.styling.fontWeight || 'normal',
    color: block.styling.color || baseStyle.baseColor,
    backgroundColor: block.styling.backgroundColor || 'transparent',
    padding: block.styling.padding ? 
      `${block.styling.padding.top}px ${block.styling.padding.right}px ${block.styling.padding.bottom}px ${block.styling.padding.left}px` : 
      '0',
    margin: block.styling.margin ? 
      `${block.styling.margin.top}px ${block.styling.margin.right}px ${block.styling.margin.bottom}px ${block.styling.margin.left}px` : 
      '0',
    border: block.styling.border ? 
      `${block.styling.border.width}px ${block.styling.border.style} ${block.styling.border.color}` : 
      'none',
    borderRadius: block.styling.border?.radius ? `${block.styling.border.radius}px` : '0',
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading':
        return <h2 style={blockStyle}>{block.content}</h2>;
      case 'paragraph':
        return <p style={blockStyle}>{block.content}</p>;
      case 'list':
        return renderList(block.content, blockStyle);
      case 'quote':
        return (
          <blockquote style={{ ...blockStyle, fontStyle: 'italic', borderLeft: '4px solid #ccc', paddingLeft: '16px' }}>
            {block.content}
          </blockquote>
        );
      case 'code':
        return (
          <pre style={{ ...blockStyle, backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', fontFamily: 'monospace' }}>
            <code>{block.content}</code>
          </pre>
        );
      case 'divider':
        return <hr style={{ ...blockStyle, border: 'none', borderTop: '1px solid #ccc', margin: '20px 0' }} />;
      default:
        return <div style={blockStyle}>{block.content}</div>;
    }
  };

  return (
    <div className={`richtext-block richtext-block-${block.type}`}>
      {renderBlockContent()}
    </div>
  );
};

const renderList = (content: string, style: React.CSSProperties) => {
  const items = content.split('\n').filter(item => item.trim());
  
  return (
    <ul style={style}>
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: '8px' }}>
          {item.replace(/^[-*+]\s*/, '')}
        </li>
      ))}
    </ul>
  );
};

export default RichTextRenderer; 