import { Helmet } from 'react-helmet-async';
import { WebsiteSettings } from '@breeder/types';

interface PublicWebsiteSEOProps {
  settings: WebsiteSettings;
  page?: 'home' | 'about' | 'puppies' | 'contact';
  title?: string;
  description?: string;
  image?: string;
}

/**
 * SEO component for public website pages
 * Adds meta tags for search engines and social media sharing
 */
export function PublicWebsiteSEO({
  settings,
  page = 'home',
  title,
  description,
  image,
}: PublicWebsiteSEOProps) {
  // Generate page-specific titles and descriptions
  const pageTitle = title || getPageTitle(settings, page);
  const pageDescription = description || getPageDescription(settings, page);
  const pageImage = image || settings.mainImageUrl || '/expert-breeder-logo.png';
  const siteName = settings.kennelName || 'Expert Breeder';
  const canonicalUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name='description' content={pageDescription} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel='canonical' href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property='og:type' content='website' />
      <meta property='og:url' content={canonicalUrl} />
      <meta property='og:title' content={pageTitle} />
      <meta property='og:description' content={pageDescription} />
      <meta property='og:image' content={pageImage} />
      <meta property='og:site_name' content={siteName} />

      {/* Twitter */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:url' content={canonicalUrl} />
      <meta name='twitter:title' content={pageTitle} />
      <meta name='twitter:description' content={pageDescription} />
      <meta name='twitter:image' content={pageImage} />

      {/* Additional Meta Tags */}
      <meta name='robots' content='index, follow' />
      <meta name='googlebot' content='index, follow' />

      {/* Location-based meta tags */}
      {settings.city && <meta name='geo.placename' content={settings.city} />}
      {settings.state && <meta name='geo.region' content={settings.state} />}

      {/* Keywords */}
      <meta
        name='keywords'
        content={getKeywords(settings)}
      />
    </Helmet>
  );
}

function getPageTitle(settings: WebsiteSettings, page: string): string {
  const baseName = settings.kennelName || 'Expert Breeder';
  const breed = settings.primaryBreed || 'Dog';

  switch (page) {
    case 'home':
      return `${baseName} - ${breed} Breeder | ${settings.tagline || 'Quality Puppies'}`;
    case 'about':
      return `About ${baseName} - ${breed} Breeder`;
    case 'puppies':
      return `Available ${breed} Puppies - ${baseName}`;
    case 'contact':
      return `Contact ${baseName} - ${breed} Breeder`;
    default:
      return baseName;
  }
}

function getPageDescription(settings: WebsiteSettings, page: string): string {
  const baseName = settings.kennelName || 'Expert Breeder';
  const breed = settings.primaryBreed || 'puppies';
  const location = [settings.city, settings.state].filter(Boolean).join(', ');

  switch (page) {
    case 'home':
      return (
        settings.tagline ||
        `${baseName} - Professional ${breed} breeder ${location ? `in ${location}` : ''}. Quality ${breed} puppies with health guarantees and lifetime support.`
      );
    case 'about':
      return (
        settings.about?.substring(0, 155) ||
        `Learn about ${baseName}, a trusted ${breed} breeder ${location ? `in ${location}` : ''}. Dedicated to breeding healthy, well-socialized puppies.`
      );
    case 'puppies':
      return `Browse our available ${breed} puppies from ${baseName}. Health tested parents, health guarantees, and lifetime breeder support included.`;
    case 'contact':
      return `Contact ${baseName} for inquiries about ${breed} puppies ${location ? `in ${location}` : ''}. We'd love to help you find your perfect companion.`;
    default:
      return `${baseName} - Professional ${breed} breeder`;
  }
}

function getKeywords(settings: WebsiteSettings): string {
  const keywords = [
    settings.primaryBreed,
    'puppies for sale',
    'dog breeder',
    settings.kennelName,
    'puppy',
    'dogs',
    'breeder',
  ];

  if (settings.city) keywords.push(settings.city);
  if (settings.state) keywords.push(settings.state);
  if (settings.otherBreeds) keywords.push(...settings.otherBreeds);

  keywords.push('health tested', 'health guarantee', 'AKC', 'registered');

  return keywords.filter(Boolean).join(', ');
}
