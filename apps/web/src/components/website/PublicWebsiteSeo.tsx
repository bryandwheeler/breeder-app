import { Helmet } from 'react-helmet-async';
import { WebsiteSettings, BreederProfile } from '@breeder/types';

interface PublicWebsiteSeoProps {
  settings: WebsiteSettings;
  profile?: BreederProfile | null;
  pageTitle?: string;
  pageDescription?: string;
}

export function PublicWebsiteSeo({
  settings,
  profile,
  pageTitle,
  pageDescription,
}: PublicWebsiteSeoProps) {
  const kennelName = profile?.kennelName || profile?.breederName || 'Breeder Website';
  const seo = settings.seo;

  // Build the title
  let title = pageTitle || kennelName;
  if (seo?.metaTitleTemplate && pageTitle) {
    title = seo.metaTitleTemplate
      .replace('{{pageTitle}}', pageTitle)
      .replace('{{kennelName}}', kennelName);
  } else if (seo?.metaTitle) {
    title = seo.metaTitle;
  }

  // Build the description
  const description = pageDescription || seo?.metaDescription || profile?.about?.substring(0, 160) || '';

  // OG tags
  const ogTitle = seo?.ogTitle || title;
  const ogDescription = seo?.ogDescription || description;
  const ogImage = seo?.ogImage || profile?.coverPhoto || profile?.logo;

  // Twitter handle
  const twitterHandle = seo?.twitterHandle;

  // NoIndex flag
  const noIndex = seo?.noIndex || !settings.websiteEnabled;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:type" content="website" />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}

      {/* Additional meta */}
      <meta name="author" content={kennelName} />
    </Helmet>
  );
}
