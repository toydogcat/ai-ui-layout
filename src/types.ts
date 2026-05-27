export interface ExtractedColor {
  hex: string;
  name: string;
  ratio: number; // percentage, e.g. 45
  role: string;  // e.g. "Main Background", "CTA Button", "Primary Typography"
  isDark: boolean;
}

export interface DesignSuggestion {
  category: 'layout' | 'typography' | 'color' | 'accessibility' | 'spacing';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  before: string; // Problematic state
  after: string;  // Correct/optimized state
}

export interface WireframeElement {
  id: string;
  type: 'header' | 'hero' | 'gallery' | 'form' | 'sidebar' | 'card' | 'footer' | 'navigation' | 'generic';
  label: string;
  alignment: string; // Description of recommended alignment
  optimalSpacing: string; // Description of spacing, margins, gaps
  colorRole: 'background' | 'primary' | 'secondary' | 'accent' | 'text' | 'card-bg';
  contents: string[];
}

export interface AlternativeThemeColor {
  name: string;
  originalHex: string;
  newHex: string;
  role: string;
  tailwindClass: string;
}

export interface AlternativeTheme {
  id: string;
  themeName: string;
  description: string;
  colors: AlternativeThemeColor[];
}

export interface OptimizationResult {
  extractedColors: ExtractedColor[];
  suggestions: DesignSuggestion[];
  reconstructedWireframe: WireframeElement[];
  colorConversions: AlternativeTheme[];
  generalReview: string; // Brief summary review of the original design
}
