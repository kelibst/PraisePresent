// Unified Content Type System for PraisePresent
// This file defines all content types used throughout the application

// Base content interface
export interface BaseContent {
  id: string;
  type: ContentType;
  metadata?: ContentMetadata;
}

// Content metadata
export interface ContentMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
}

// Main content type discriminated union
export type Content = 
  | SlideContent
  | TextContent
  | MediaContent
  | RichTextContent
  | SystemContent;

// Content type enum
export type ContentType = 
  | 'slide'
  | 'text'
  | 'media'
  | 'richtext'
  | 'system';

// Slide content (from database/RenderingEngine)
export interface SlideContent extends BaseContent {
  type: 'slide';
  data: SlideData;
}

export interface SlideData {
  slideId: string;
  presentationId: string;
  slideType: 'text' | 'media' | 'richtext';
  content: any;
  styling: SlideStyle;
  animations?: AnimationConfig;
  transitions?: TransitionConfig;
  order: number;
  isActive: boolean;
}

// Text content
export interface TextContent extends BaseContent {
  type: 'text';
  data: TextData;
}

export interface TextData {
  text: string;
  styling: TextStyling;
  effects?: TextEffects;
}

export interface TextStyling {
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textColor: string;
  backgroundColor: string;
  lineHeight: number;
  padding: PaddingConfig;
}

export interface TextEffects {
  outline?: OutlineConfig;
  shadow?: TextShadowConfig;
  glow?: GlowConfig;
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

// Media content
export interface MediaContent extends BaseContent {
  type: 'media';
  data: MediaData;
}

export interface MediaData {
  url: string;
  mediaType: 'image' | 'video' | 'audio';
  displayMode: 'fit' | 'fill' | 'stretch' | 'center';
  positioning: PositionConfig;
  scaling: ScalingConfig;
  playbackSettings?: PlaybackSettings;
  overlays?: OverlayConfig[];
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
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  position: PositionConfig;
  styling: any;
}

// Rich text content
export interface RichTextContent extends BaseContent {
  type: 'richtext';
  data: RichTextData;
}

export interface RichTextData {
  blocks: RichTextBlock[];
  styling: RichTextStyling;
  formatting: FormattingConfig;
}

export interface RichTextBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'code' | 'divider';
  content: string;
  styling?: BlockStyling;
  order: number;
}

export interface RichTextStyling {
  baseFont: string;
  baseFontSize: number;
  baseColor: string;
  lineHeight: number;
  blockSpacing: number;
}

export interface BlockStyling {
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

// System content (for special display states)
export interface SystemContent extends BaseContent {
  type: 'system';
  data: SystemData;
}

export type SystemData = 
  | BlackScreenData
  | LogoScreenData
  | PlaceholderData
  | ErrorData;

export interface BlackScreenData {
  variant: 'black';
  duration?: number;
}

export interface LogoScreenData {
  variant: 'logo';
  logoUrl?: string;
  title?: string;
  subtitle?: string;
}

export interface PlaceholderData {
  variant: 'placeholder';
  title: string;
  subtitle?: string;
  timestamp?: string;
}

export interface ErrorData {
  variant: 'error';
  message: string;
  details?: string;
}

// Common styling interfaces
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

export interface BorderConfig {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  color: string;
  radius: number;
}

// Slide styling (from RenderingEngine)
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

// Type guards for content types
export const isSlideContent = (content: Content): content is SlideContent => 
  content.type === 'slide';

export const isTextContent = (content: Content): content is TextContent => 
  content.type === 'text';

export const isMediaContent = (content: Content): content is MediaContent => 
  content.type === 'media';

export const isRichTextContent = (content: Content): content is RichTextContent => 
  content.type === 'richtext';

export const isSystemContent = (content: Content): content is SystemContent => 
  content.type === 'system';

// System content type guards
export const isBlackScreen = (data: SystemData): data is BlackScreenData => 
  data.variant === 'black';

export const isLogoScreen = (data: SystemData): data is LogoScreenData => 
  data.variant === 'logo';

export const isPlaceholder = (data: SystemData): data is PlaceholderData => 
  data.variant === 'placeholder';

export const isError = (data: SystemData): data is ErrorData => 
  data.variant === 'error';

// Content validation
export const validateContent = (content: any): content is Content => {
  return (
    content &&
    typeof content === 'object' &&
    typeof content.id === 'string' &&
    typeof content.type === 'string' &&
    ['slide', 'text', 'media', 'richtext', 'system'].includes(content.type) &&
    content.data !== undefined
  );
};

// Content creation helpers
export const createTextContent = (id: string, text: string, styling: TextStyling): TextContent => ({
  id,
  type: 'text',
  data: {
    text,
    styling,
  },
});

export const createMediaContent = (id: string, url: string, mediaType: 'image' | 'video' | 'audio'): MediaContent => ({
  id,
  type: 'media',
  data: {
    url,
    mediaType,
    displayMode: 'fit',
    positioning: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
    scaling: { scaleX: 1, scaleY: 1, rotation: 0, skewX: 0, skewY: 0 },
  },
});

export const createSystemContent = (id: string, variant: SystemData['variant'], data: Partial<SystemData> = {}): SystemContent => ({
  id,
  type: 'system',
  data: {
    variant,
    ...data,
  } as SystemData,
});

export const createPlaceholderContent = (id: string, title: string, subtitle?: string): SystemContent => 
  createSystemContent(id, 'placeholder', {
    variant: 'placeholder',
    title,
    subtitle,
    timestamp: new Date().toLocaleTimeString(),
  });

export const createBlackScreenContent = (id: string): SystemContent => 
  createSystemContent(id, 'black', { variant: 'black' });

export const createLogoScreenContent = (id: string, title?: string, subtitle?: string): SystemContent => 
  createSystemContent(id, 'logo', { 
    variant: 'logo',
    title: title || 'PraisePresent',
    subtitle: subtitle || 'Live Display System',
  }); 