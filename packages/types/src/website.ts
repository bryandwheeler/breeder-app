// Website builder and customization types

// Domain settings for subdomain and custom domain support
export type DomainStatus = 'pending' | 'pending_verification' | 'verifying' | 'verified' | 'active' | 'failed' | 'suspended';
export type SslStatus = 'pending' | 'provisioning' | 'active' | 'failed';

export interface DomainSettings {
  // Subdomain (claimed by breeder)
  subdomain: string; // e.g., "happypaws" for happypaws.expertbreeder.com
  subdomainAvailable: boolean;
  subdomainClaimedAt?: string;

  // Custom domain (Pro tier only)
  customDomain?: string; // e.g., "www.happypawskennel.com"
  customDomainStatus?: DomainStatus;
  customDomainVerifiedAt?: string;
  cnameTarget: string; // "expert-breeder.web.app" for Firebase Hosting
  sslStatus?: SslStatus;
  verificationError?: string;
  lastVerificationAttempt?: string;

  // Firebase Hosting verification
  verificationToken?: string; // TXT record value for domain ownership verification
  acmeChallengeToken?: string; // TXT record value for SSL/ACME challenge (_acme-challenge subdomain)
  aRecords?: string[]; // A record IPs provided by Firebase Hosting
  firebaseHostingStatus?: string; // Raw status from Firebase Hosting API
}

// Enhanced SEO settings
export interface SeoSettings {
  metaTitle?: string; // Default page title
  metaTitleTemplate?: string; // e.g., "{{pageTitle}} | {{kennelName}}"
  metaDescription?: string;

  // Open Graph
  ogImage?: string; // URL to OG image
  ogTitle?: string;
  ogDescription?: string;

  // Social
  twitterHandle?: string;
  facebookAppId?: string;

  // Advanced
  canonicalUrl?: string;
  noIndex?: boolean; // Hide from search engines
}

// Theme preset for quick website styling
export type ThemePresetCategory = 'professional' | 'playful' | 'elegant' | 'modern';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  thumbnail?: string; // Preview image URL
  theme: WebsiteTheme;
  category: ThemePresetCategory;
  isPremium: boolean; // Pro-only presets
  order: number; // Display order
  isActive: boolean; // Can be disabled by admin
  createdAt: string;
  updatedAt: string;
}

// Reserved subdomains that cannot be claimed
export const RESERVED_SUBDOMAINS = [
  'admin', 'api', 'www', 'app', 'mail', 'email', 'support', 'help',
  'blog', 'docs', 'dev', 'staging', 'test', 'demo', 'portal',
  'dashboard', 'login', 'signup', 'register', 'account', 'settings',
  'static', 'assets', 'cdn', 'images', 'media', 'files',
  'expertbreeder', 'expert-breeder', 'breeder',
];

export interface WebsiteTheme {
  primaryColor: string; // hex color
  secondaryColor: string; // hex color
  accentColor: string; // hex color
  fontFamily:
    | 'sans'
    | 'serif'
    | 'mono'
    | 'display'
    | 'elegant'
    | 'playful'
    | 'handwritten'
    | 'modern'
    | 'classic'
    | 'luxury'; // CSS font family
  headerStyle: 'minimal' | 'full' | 'banner' | 'centered' | 'split' | 'overlay'; // header layout option
}

export interface WebsitePage {
  id: string;
  title: string;
  slug: string; // URL slug
  content: string; // Rich text content
  published: boolean;
  order: number; // Display order
  template: 'about' | 'contact' | 'custom';
}

export interface AvailablePuppyListing {
  id: string;
  dogId?: string; // Reference to parent dog
  litterId?: string; // Reference to litter
  name: string;
  breed: string;
  gender: 'male' | 'female';
  dateOfBirth?: string;
  description: string;
  price: number;
  photos: string[]; // URLs to photos
  available: boolean;
  reserved: boolean;
  adoptedDate?: string;
  adoptedTo?: string;
  featured: boolean; // Show on homepage
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteSettings {
  userId: string;
  theme: WebsiteTheme;
  siteName: string;
  siteTagline?: string;
  siteDescription?: string;
  pages: WebsitePage[];
  puppyListings: AvailablePuppyListing[];
  enablePuppyShop: boolean;
  enableGallery: boolean;
  enableBlog: boolean;
  contactFormEmail: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  menuItems: {
    label: string;
    page: string;
    order?: number;
  }[];
  showPricing: boolean;
  createdAt: string;
  updatedAt: string;

  // Branding
  logoUrl?: string; // URL to logo image
  logoUrlDark?: string; // URL to dark mode logo image
  businessName?: string; // Business/kennel name for header
  mainImageUrl?: string; // Hero/main image URL
  heroOverlayOpacity?: number; // 0-100, overlay opacity on hero image

  // Domain settings (subdomain/custom domain)
  domain?: DomainSettings;

  // SEO settings
  seo?: SeoSettings;

  // Theme preset tracking
  appliedPresetId?: string;

  // Website enabled/published state
  websiteEnabled: boolean;
  publishedAt?: string;

  // Breeder profile fields
  kennelName?: string;
  tagline?: string;
  about?: string;
  philosophy?: string;
  experience?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  primaryBreed?: string;
  otherBreeds?: string[];
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
}

export interface WebsitePageContent {
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroImage?: string;
    featuredPuppies?: AvailablePuppyListing[];
  };
  about: {
    title: string;
    content: string;
    photos?: string[];
    breederName: string;
    experience: string;
    philosophy: string;
  };
  contact: {
    title: string;
    description: string;
    phone?: string;
    email: string;
    address?: string;
  };
  availablePuppies: {
    title: string;
    description: string;
    listings: AvailablePuppyListing[];
  };
}
