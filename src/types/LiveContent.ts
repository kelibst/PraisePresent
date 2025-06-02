/**
 * Types for Live Display Content Management
 * Defines the structure of content that can be displayed on the live presentation screen
 */

// Base interface for all live content
export interface BaseLiveContent {
  id: string;
  type: LiveContentType;
  timestamp: number;
  duration?: number; // Optional duration in milliseconds
}

// Scripture content for live display
export interface LiveScripture extends BaseLiveContent {
  type: 'scripture';
  reference: string; // e.g., "John 3:16"
  text: string;
  translation: string; // e.g., "KJV", "NIV"
  book: string;
  chapter: number;
  verse: number;
  styling?: ScriptureStyleOptions;
}

// Song content for live display
export interface LiveSong extends BaseLiveContent {
  type: 'song';
  title: string;
  lyrics: string;
  artist?: string;
  album?: string;
  verse?: number; // Current verse/section
  totalVerses?: number;
  styling?: SongStyleOptions;
}

// Announcement content for live display
export interface LiveAnnouncement extends BaseLiveContent {
  type: 'announcement';
  title: string;
  content: string;
  subtitle?: string;
  category?: 'general' | 'urgent' | 'prayer' | 'event';
  styling?: AnnouncementStyleOptions;
}

// Custom slide content
export interface LiveSlide extends BaseLiveContent {
  type: 'slide';
  title: string;
  content: string;
  subtitle?: string;
  backgroundImage?: string;
  styling?: SlideStyleOptions;
}

// Media content (images, videos)
export interface LiveMedia extends BaseLiveContent {
  type: 'media';
  title?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  autoPlay?: boolean;
  loop?: boolean;
  styling?: MediaStyleOptions;
}

// Special display modes
export interface LiveBlackScreen extends BaseLiveContent {
  type: 'black';
}

export interface LiveLogo extends BaseLiveContent {
  type: 'logo';
  logoUrl?: string;
  title?: string;
  subtitle?: string;
}

// Union type for all live content
export type LiveContentItem = 
  | LiveScripture 
  | LiveSong 
  | LiveAnnouncement 
  | LiveSlide 
  | LiveMedia 
  | LiveBlackScreen 
  | LiveLogo;

export type LiveContentType = 
  | 'scripture' 
  | 'song' 
  | 'announcement' 
  | 'slide' 
  | 'media' 
  | 'black' 
  | 'logo';

// Styling options for different content types
export interface BaseStyleOptions {
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: number;
  animation?: TransitionAnimation;
}

export interface ScriptureStyleOptions extends BaseStyleOptions {
  showReference?: boolean;
  showTranslation?: boolean;
  referencePosition?: 'top' | 'bottom';
  verseNumbers?: boolean;
}

export interface SongStyleOptions extends BaseStyleOptions {
  showTitle?: boolean;
  showArtist?: boolean;
  lineSpacing?: number;
  stanzaSpacing?: number;
}

export interface AnnouncementStyleOptions extends BaseStyleOptions {
  showCategory?: boolean;
  urgencyLevel?: 'normal' | 'high' | 'urgent';
  iconUrl?: string;
}

export interface SlideStyleOptions extends BaseStyleOptions {
  backgroundOpacity?: number;
  overlayColor?: string;
}

export interface MediaStyleOptions extends BaseStyleOptions {
  objectFit?: 'cover' | 'contain' | 'fill';
  opacity?: number;
}

// Transition and animation options
export interface TransitionAnimation {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number; // in milliseconds
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  direction?: 'up' | 'down' | 'left' | 'right'; // for slide animations
}

// Display mode settings
export interface LiveDisplayMode {
  mode: 'presentation' | 'preview' | 'black' | 'logo';
  content?: LiveContentItem;
  isActive: boolean;
  lastUpdated: number;
}

// Live display status
export interface LiveDisplayStatus {
  isConnected: boolean;
  displayId: number | null;
  currentContent: LiveContentItem | null;
  mode: LiveDisplayMode;
  windowStatus: {
    isVisible: boolean;
    isFullscreen: boolean;
    bounds?: { x: number; y: number; width: number; height: number };
  };
  lastHeartbeat?: number;
}

// Content transition settings
export interface ContentTransition {
  enabled: boolean;
  defaultTransition: TransitionAnimation;
  scriptureTransition?: TransitionAnimation;
  songTransition?: TransitionAnimation;
  announcementTransition?: TransitionAnimation;
  mediaTransition?: TransitionAnimation;
}

// Live content queue for service management
export interface LiveContentQueue {
  items: LiveContentItem[];
  currentIndex: number;
  autoAdvance: boolean;
  autoAdvanceDelay: number; // in milliseconds
}

// Error types for live display
export interface LiveDisplayError {
  code: string;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
}

// Events for live display communication
export interface LiveDisplayEvent {
  type: 'content-update' | 'mode-change' | 'error' | 'heartbeat' | 'display-change';
  payload: any;
  timestamp: number;
}

// Utility types for content creation
export type CreateLiveContentInput<T extends LiveContentType> = 
  T extends 'scripture' ? Omit<LiveScripture, 'id' | 'timestamp'> :
  T extends 'song' ? Omit<LiveSong, 'id' | 'timestamp'> :
  T extends 'announcement' ? Omit<LiveAnnouncement, 'id' | 'timestamp'> :
  T extends 'slide' ? Omit<LiveSlide, 'id' | 'timestamp'> :
  T extends 'media' ? Omit<LiveMedia, 'id' | 'timestamp'> :
  T extends 'black' ? Omit<LiveBlackScreen, 'id' | 'timestamp'> :
  T extends 'logo' ? Omit<LiveLogo, 'id' | 'timestamp'> :
  never;

// Helper type for content updates
export type UpdateLiveContentInput<T extends LiveContentItem> = Partial<Omit<T, 'id' | 'type' | 'timestamp'>>; 