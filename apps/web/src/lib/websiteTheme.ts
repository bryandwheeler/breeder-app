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
  const primary = settings.theme.primaryColor || '#3d3d3d';
  const secondary = settings.theme.secondaryColor || '#6b7280';
  const accent = settings.theme.accentColor || '#c45a6e';
  return { primary, secondary, accent };
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
      return '"Playfair Display", Georgia, serif';
    case 'elegant':
      return '"Cormorant Garamond", Garamond, serif';
    case 'playful':
      return 'Nunito, Quicksand, system-ui, sans-serif';
    case 'handwritten':
      return 'Caveat, Kalam, cursive';
    case 'modern':
      return 'Inter, Montserrat, system-ui, sans-serif';
    case 'classic':
      return '"Times New Roman", serif';
    case 'luxury':
      return '"Playfair Display", Didot, "Bodoni MT", serif';
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
 * @param settings - Website settings
 * @param forDarkBackground - If true, returns the dark mode logo (for use on dark backgrounds)
 */
export function getLogoUrl(settings: WebsiteSettings, forDarkBackground = false): string {
  if (forDarkBackground) {
    // For dark backgrounds, prefer dark logo, fall back to regular logo
    return settings.logoUrlDark || settings.logoUrl || '/expert-breeder-logo.png';
  }
  // For light backgrounds, use regular logo
  return settings.logoUrl || '/expert-breeder-logo.png';
}

/**
 * Get business name with fallback
 */
export function getBusinessName(settings: WebsiteSettings): string {
  return settings.businessName || settings.kennelName || 'Expert Breeder';
}
