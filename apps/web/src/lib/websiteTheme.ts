/**
 * Shared utilities for website theming and typography
 */

import { WebsiteSettings } from '@breeder/types';

/**
 * Expert Breeder brand color constants
 */
export const EXPERT_BREEDER_COLORS = {
  orange: '#FF8A1E', // Primary CTA color
  navy: '#0B2E4E', // Primary brand color
  blue: '#4DB3E6', // Puppy Blue accent
  skyBlue: '#A9DBF4', // Light Sky Blue
  powderBlue: '#D8F0FB', // Soft Powder Blue
  white: '#FFFFFF', // Clean White
  gray: '#E6EAF0', // Soft Gray
  charcoal: '#1F2933', // Dark Charcoal
} as const;

/**
 * Get theme colors with fallbacks to Expert Breeder brand colors
 */
export function getThemeColors(settings: WebsiteSettings) {
  return {
    primary: settings.theme.primaryColor || EXPERT_BREEDER_COLORS.navy,
    accent: settings.theme.accentColor || EXPERT_BREEDER_COLORS.orange,
    blue: EXPERT_BREEDER_COLORS.blue,
  };
}

/**
 * Convert font family setting to inline CSS font-family value
 * Used for inline styles in components
 */
export function getFontFamily(fontFamily?: string): string {
  switch (fontFamily) {
    case 'serif':
      return 'Georgia, serif';
    case 'mono':
      return 'Courier New, monospace';
    case 'display':
      return 'Playfair Display, serif';
    case 'elegant':
      return 'Cormorant Garamond, serif';
    case 'playful':
      return 'Comic Sans MS, cursive';
    case 'handwritten':
      return 'Brush Script MT, cursive';
    case 'modern':
      return 'Montserrat, sans-serif';
    case 'classic':
      return 'Times New Roman, serif';
    case 'luxury':
      return 'Didot, Bodoni MT, serif';
    default:
      return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
}

/**
 * Convert font family setting to Tailwind CSS class
 * Used for className props in components
 */
export function getFontFamilyClass(fontFamily?: string): string {
  const fontMap: Record<string, string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    display: 'font-display',
    elegant: 'font-elegant',
    playful: 'font-playful',
    handwritten: 'font-handwritten',
    modern: 'font-modern',
    classic: 'font-classic',
    luxury: 'font-luxury',
  };
  return fontMap[fontFamily || 'sans'] || 'font-sans';
}

/**
 * Get logo URL with fallback to Expert Breeder logo
 */
export function getLogoUrl(settings: WebsiteSettings): string {
  return settings.logoUrl || '/expert-breeder-logo.png';
}

/**
 * Get business name with fallback
 */
export function getBusinessName(settings: WebsiteSettings): string {
  return settings.businessName || settings.kennelName || 'Expert Breeder';
}
