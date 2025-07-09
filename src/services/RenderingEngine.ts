import { DisplayInfo } from "./DisplayManager";
import { renderingEngineObserver } from "@/lib/renderingEngineMiddleware";

// Types based on the schema
export interface Slide {
  id: string;
  presentationId: string;
  type: 'text' | 'media' | 'richtext';
  content: any;
  order: number;
  styling: SlideStyle;
  animations?: AnimationConfig;
  transitions?: TransitionConfig;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  textContent?: TextContent;
  mediaContent?: MediaContent;
  richTextContent?: RichTextContent;
}

export interface TextContent {
  id: string;
  slideId: string;
  text: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  textAlign: string;
  textColor: string;
  backgroundColor: string;
  lineHeight: number;
  padding: PaddingConfig;
  textEffects?: TextEffects;
  typography?: TypographyConfig;
}

export interface MediaContent {
  id: string;
  slideId: string;
  mediaItemId: string;
  displayMode: 'fit' | 'fill' | 'stretch' | 'center';
  positioning: PositionConfig;
  scaling: ScalingConfig;
  playbackSettings: PlaybackSettings;
  overlays?: OverlayConfig;
}

export interface RichTextContent {
  id: string;
  slideId: string;
  blocks: RichTextBlock[];
  styling: RichTextStyle;
  formatting: FormattingConfig;
  version: string;
  metadata?: any;
}

export interface RichTextBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'code' | 'divider';
  content: string;
  styling?: BlockStyle;
  order: number;
}

// Styling interfaces
export interface SlideStyle {
  background: BackgroundStyle;
  layout: LayoutStyle;
  effects: EffectStyle;
  responsive: ResponsiveStyle;
}

export interface BackgroundStyle {
  type: 'color' | 'gradient' | 'image' | 'video';
  color?: string;
  gradient?: GradientConfig;
  image?: ImageConfig;
  video?: VideoConfig;
}

export interface GradientConfig {
  colors: string[];
  direction: number;
  type: 'linear' | 'radial';
}

export interface ImageConfig {
  url: string;
  opacity: number;
  blur: number;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'stretch';
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
}

export interface VideoConfig {
  url: string;
  opacity: number;
  muted: boolean;
  loop: boolean;
  autoplay: boolean;
}

export interface LayoutStyle {
  padding: PaddingConfig;
  margin: MarginConfig;
  alignment: 'left' | 'center' | 'right' | 'justify';
  flexDirection: 'row' | 'column';
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch';
}

export interface PaddingConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MarginConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface EffectStyle {
  shadow: ShadowConfig;
  border: BorderConfig;
  blur: number;
  opacity: number;
}

export interface ShadowConfig {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface BorderConfig {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  color: string;
  radius: number;
}

export interface ResponsiveStyle {
  breakpoints: Record<string, Partial<SlideStyle>>;
}

// Animation and transition interfaces
export interface AnimationConfig {
  entrance?: AnimationEffect;
  exit?: AnimationEffect;
  emphasis?: AnimationEffect[];
  duration: number;
  delay: number;
  easing: string;
}

export interface AnimationEffect {
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'bounce' | 'flip';
  direction?: 'up' | 'down' | 'left' | 'right' | 'in' | 'out';
  intensity: number;
  duration: number;
}

export interface TransitionConfig {
  type: 'fade' | 'slide' | 'push' | 'cover' | 'uncover' | 'none';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration: number;
  easing: string;
}

// Content processing interfaces
export interface TextEffects {
  outline: OutlineConfig;
  shadow: TextShadowConfig;
  glow: GlowConfig;
}

export interface OutlineConfig {
  width: number;
  color: string;
}

export interface TextShadowConfig {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface GlowConfig {
  color: string;
  intensity: number;
  spread: number;
}

export interface TypographyConfig {
  letterSpacing: number;
  wordSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration: 'none' | 'underline' | 'overline' | 'line-through';
}

export interface PositionConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface ScalingConfig {
  scaleX: number;
  scaleY: number;
  rotation: number;
  skewX: number;
  skewY: number;
}

export interface PlaybackSettings {
  autoplay: boolean;
  loop: boolean;
  volume: number;
  startTime: number;
  endTime: number;
  speed: number;
}

export interface OverlayConfig {
  elements: OverlayElement[];
}

export interface OverlayElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  position: PositionConfig;
  styling: any;
}

export interface RichTextStyle {
  baseFont: string;
  baseFontSize: number;
  baseColor: string;
  lineHeight: number;
  blockSpacing: number;
}

export interface BlockStyle {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  padding?: PaddingConfig;
  margin?: MarginConfig;
  border?: BorderConfig;
}

export interface FormattingConfig {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  highlight: string;
}

// Rendering engine class
export class RenderingEngine {
  private static instance: RenderingEngine;
  private currentSlide: Slide | null = null;
  private currentTheme: SlideTheme | null = null;
  private displayInfo: DisplayInfo | null = null;

  private constructor() {}

  public static getInstance(): RenderingEngine {
    if (!RenderingEngine.instance) {
      RenderingEngine.instance = new RenderingEngine();
    }
    return RenderingEngine.instance;
  }

  public setDisplayInfo(displayInfo: DisplayInfo): void {
    this.displayInfo = displayInfo;
    // Notify observers of state change
    renderingEngineObserver.notify({
      type: 'DISPLAY_INFO_CHANGED',
      displayInfo: displayInfo,
    });
  }

  public setTheme(theme: SlideTheme): void {
    this.currentTheme = theme;
    // Notify observers of state change
    renderingEngineObserver.notify({
      type: 'THEME_CHANGED',
      theme: theme,
    });
  }

  public async renderSlide(slide: Slide): Promise<RenderedSlide> {
    this.currentSlide = slide;

    // Apply theme to slide styling
    const themedStyling = this.applyTheme(slide.styling);

    // Process content based on slide type
    let processedContent: ProcessedContent;
    switch (slide.type) {
      case 'text':
        processedContent = await this.processTextContent(slide.textContent!, themedStyling);
        break;
      case 'media':
        processedContent = await this.processMediaContent(slide.mediaContent!, themedStyling);
        break;
      case 'richtext':
        processedContent = await this.processRichTextContent(slide.richTextContent!, themedStyling);
        break;
      default:
        throw new Error(`Unknown slide type: ${slide.type}`);
    }

    // Apply animations and transitions
    const animationData = this.prepareAnimations(slide.animations);
    const transitionData = this.prepareTransitions(slide.transitions);

    const renderedSlide = {
      id: slide.id,
      type: slide.type,
      styling: themedStyling,
      content: processedContent,
      animations: animationData,
      transitions: transitionData,
      bounds: this.calculateBounds(themedStyling),
    };

    // Notify observers of slide render
    renderingEngineObserver.notify({
      type: 'SLIDE_RENDERED',
      slide: renderedSlide,
    });

    return renderedSlide;
  }

  private applyTheme(styling: SlideStyle): SlideStyle {
    if (!this.currentTheme) return styling;

    // Merge theme with slide styling
    return {
      ...styling,
      background: {
        ...styling.background,
        color: styling.background.color || this.currentTheme.colorPalette.primary,
      },
      layout: {
        ...styling.layout,
        // Apply theme typography
      },
      effects: {
        ...styling.effects,
        // Apply theme effects
      },
      responsive: styling.responsive,
    };
  }

  private async processTextContent(textContent: TextContent, styling: SlideStyle): Promise<ProcessedTextContent> {
    // Load fonts if needed
    await this.loadFont(textContent.fontFamily);

    // Process text effects
    const processedEffects = this.processTextEffects(textContent.textEffects);

    // Calculate text metrics
    const textMetrics = this.calculateTextMetrics(textContent);

    return {
      type: 'text',
      text: textContent.text,
      styling: {
        fontSize: textContent.fontSize,
        fontFamily: textContent.fontFamily,
        fontWeight: textContent.fontWeight,
        textAlign: textContent.textAlign,
        textColor: textContent.textColor,
        backgroundColor: textContent.backgroundColor,
        lineHeight: textContent.lineHeight,
        padding: textContent.padding,
      },
      effects: processedEffects,
      metrics: textMetrics,
    };
  }

  private async processMediaContent(mediaContent: MediaContent, styling: SlideStyle): Promise<ProcessedMediaContent> {
    // Load media asset
    const mediaAsset = await this.loadMediaAsset(mediaContent.mediaItemId);

    // Calculate positioning
    const positioning = this.calculateMediaPosition(mediaContent, styling);

    return {
      type: 'media',
      asset: mediaAsset,
      displayMode: mediaContent.displayMode,
      positioning,
      scaling: mediaContent.scaling,
      playbackSettings: mediaContent.playbackSettings,
      overlays: mediaContent.overlays,
    };
  }

  private async processRichTextContent(richTextContent: RichTextContent, styling: SlideStyle): Promise<ProcessedRichTextContent> {
    // Process each block
    const processedBlocks = await Promise.all(
      richTextContent.blocks.map(block => this.processRichTextBlock(block, richTextContent.styling))
    );

    return {
      type: 'richtext',
      blocks: processedBlocks,
      styling: richTextContent.styling,
      formatting: richTextContent.formatting,
    };
  }

  private async processRichTextBlock(block: RichTextBlock, baseStyle: RichTextStyle): Promise<ProcessedRichTextBlock> {
    const blockStyle = { ...baseStyle, ...block.styling };

    return {
      id: block.id,
      type: block.type,
      content: block.content,
      styling: blockStyle,
      order: block.order,
    };
  }

  private async loadFont(fontFamily: string): Promise<void> {
    // Implementation for font loading
    if (document.fonts) {
      try {
        await document.fonts.load(`16px ${fontFamily}`);
      } catch (error) {
        console.warn(`Failed to load font: ${fontFamily}`, error);
      }
    }
  }

  private async loadMediaAsset(mediaItemId: string): Promise<MediaAsset> {
    // Implementation for media asset loading
    // This would typically fetch from your media storage
    return {
      id: mediaItemId,
      url: `/api/media/${mediaItemId}`,
      type: 'image', // This would be determined from the media item
      metadata: {},
    };
  }

  private processTextEffects(effects?: TextEffects): ProcessedTextEffects {
    if (!effects) return {};

    return {
      outline: effects.outline,
      shadow: effects.shadow,
      glow: effects.glow,
    };
  }

  private calculateTextMetrics(textContent: TextContent): TextMetrics {
    // Calculate text dimensions and positioning
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return { width: 0, height: 0, lines: [] };
    }

    // Apply display scaling factor if available
    const scaleFactor = this.displayInfo?.scaleFactor || 1;
    
    ctx.font = `${textContent.fontWeight} ${textContent.fontSize} ${textContent.fontFamily}`;
    const metrics = ctx.measureText(textContent.text);

    return {
      width: metrics.width * scaleFactor,
      height: (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * scaleFactor,
      lines: textContent.text.split('\n').map(line => ({
        text: line,
        width: ctx.measureText(line).width * scaleFactor,
      })),
    };
  }

  private calculateMediaPosition(mediaContent: MediaContent, styling: SlideStyle): CalculatedPosition {
    if (!this.displayInfo) {
      throw new Error('Display information not available. Call setDisplayInfo() first.');
    }
    
    const displayBounds = this.displayInfo.bounds;
    
    return {
      x: mediaContent.positioning.x,
      y: mediaContent.positioning.y,
      width: mediaContent.positioning.width || displayBounds.width,
      height: mediaContent.positioning.height || displayBounds.height,
      zIndex: mediaContent.positioning.zIndex || 0,
    };
  }

  private prepareAnimations(animations?: AnimationConfig): PreparedAnimations {
    if (!animations) return {};

    return {
      entrance: animations.entrance,
      exit: animations.exit,
      emphasis: animations.emphasis,
      duration: animations.duration,
      delay: animations.delay,
      easing: animations.easing,
    };
  }

  private prepareTransitions(transitions?: TransitionConfig): PreparedTransitions {
    if (!transitions) return {};

    return {
      type: transitions.type,
      direction: transitions.direction,
      duration: transitions.duration,
      easing: transitions.easing,
    };
  }

  private calculateBounds(styling: SlideStyle): BoundingBox {
    if (!this.displayInfo) {
      throw new Error('Display information not available. Call setDisplayInfo() first.');
    }
    
    const displayBounds = this.displayInfo.bounds;
    
    return {
      x: styling.layout.margin.left,
      y: styling.layout.margin.top,
      width: displayBounds.width - styling.layout.margin.left - styling.layout.margin.right,
      height: displayBounds.height - styling.layout.margin.top - styling.layout.margin.bottom,
    };
  }
}

// Additional interfaces for processed content
export interface RenderedSlide {
  id: string;
  type: string;
  styling: SlideStyle;
  content: ProcessedContent;
  animations: PreparedAnimations;
  transitions: PreparedTransitions;
  bounds: BoundingBox;
}

export interface ProcessedContent {
  type: 'text' | 'media' | 'richtext';
}

export interface ProcessedTextContent extends ProcessedContent {
  type: 'text';
  text: string;
  styling: {
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    textAlign: string;
    textColor: string;
    backgroundColor: string;
    lineHeight: number;
    padding: PaddingConfig;
  };
  effects: ProcessedTextEffects;
  metrics: TextMetrics;
}

export interface ProcessedMediaContent extends ProcessedContent {
  type: 'media';
  asset: MediaAsset;
  displayMode: string;
  positioning: CalculatedPosition;
  scaling: ScalingConfig;
  playbackSettings: PlaybackSettings;
  overlays?: OverlayConfig;
}

export interface ProcessedRichTextContent extends ProcessedContent {
  type: 'richtext';
  blocks: ProcessedRichTextBlock[];
  styling: RichTextStyle;
  formatting: FormattingConfig;
}

export interface ProcessedRichTextBlock {
  id: string;
  type: string;
  content: string;
  styling: BlockStyle;
  order: number;
}

export interface ProcessedTextEffects {
  outline?: OutlineConfig;
  shadow?: TextShadowConfig;
  glow?: GlowConfig;
}

export interface TextMetrics {
  width: number;
  height: number;
  lines: { text: string; width: number }[];
}

export interface MediaAsset {
  id: string;
  url: string;
  type: string;
  metadata: any;
}

export interface CalculatedPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface PreparedAnimations {
  entrance?: AnimationEffect;
  exit?: AnimationEffect;
  emphasis?: AnimationEffect[];
  duration?: number;
  delay?: number;
  easing?: string;
}

export interface PreparedTransitions {
  type?: string;
  direction?: string;
  duration?: number;
  easing?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SlideTheme {
  id: string;
  name: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  backgrounds: any;
  animations?: any;
  transitions?: any;
}

// Export singleton instance
export const renderingEngine = RenderingEngine.getInstance(); 