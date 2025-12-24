// Website builder and customization types

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
