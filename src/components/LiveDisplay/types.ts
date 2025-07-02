export interface LiveDisplayTheme {
  backgroundColor: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  textColor: string;
  subtitleColor: string;
  referenceColor: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  padding: number;
  textShadow: boolean;
  alignment: "left" | "center" | "right";
  animation: "none" | "fade" | "slide" | "zoom";
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

export interface LiveContent {
  type:
    | "scripture"
    | "song"
    | "announcement"
    | "media"
    | "slide"
    | "universal-slide"
    | "black"
    | "logo"
    | "placeholder";
  title?: string;
  content?: string | any;
  verse?: string;
  reference?: string;
  lines?: string[];
  subtitle?: string;
  translation?: string;
  universalSlide?: any; // For Universal Slide data
}

export const DEFAULT_LIVE_DISPLAY_THEME: LiveDisplayTheme = {
  backgroundColor: "#ffffff",
  backgroundGradient: "linear-gradient(135deg, #1e1e1e 0%, #000000 100%)",
  textColor: "#ffffff",
  subtitleColor: "#cccccc",
  referenceColor: "#60a5fa",
  fontSize: 5,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lineHeight: 1.3,
  padding: 2,
  textShadow: true,
  alignment: "center",
  animation: "fade",
  borderColor: "#333333",
  borderWidth: 0,
  borderRadius: 0,
}; 