// Public website page router for website builder
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWebsiteStore, useBreederStore } from '@breeder/firebase';
import { WebsiteSettings, BreederProfile } from '@breeder/types';
import { Loader2 } from 'lucide-react';
import { PublicWebsiteHome } from '@/components/PublicWebsiteHome';
import { PublicWebsiteAbout } from '@/components/PublicWebsiteAbout';
import { PublicWebsiteContact } from '@/components/PublicWebsiteContact';
import { PublicWebsitePuppies } from '@/components/PublicWebsitePuppies';
import { PublicWebsiteBlog } from '@/components/PublicWebsiteBlog';
import { PublicWebsiteBlogPost } from '@/components/PublicWebsiteBlogPost';
import { PublicWebsiteFavoriteThings } from '@/components/PublicWebsiteFavoriteThings';
import { PublicWebsiteSeo } from '@/components/website/PublicWebsiteSeo';

export function PublicWebsite() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const [websiteSettings, setWebsiteSettings] =
    useState<WebsiteSettings | null>(null);
  const [breederProfile, setBreederProfile] = useState<BreederProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { getWebsiteSettings } = useWebsiteStore();
  const { getPublicProfile } = useBreederStore();

  const page = searchParams.get('page') || 'home';
  const postSlug = searchParams.get('post') || '';

  useEffect(() => {
    if (!userId) return;

    const loadWebsite = async () => {
      try {
        setLoading(true);
        const [settings, profile] = await Promise.all([
          getWebsiteSettings(userId),
          getPublicProfile(userId),
        ]);
        setWebsiteSettings(settings);
        setBreederProfile(profile);
      } catch (error) {
        console.error('Error loading website settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWebsite();
  }, [userId, getWebsiteSettings, getPublicProfile]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!websiteSettings) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-lg text-muted-foreground'>Website not found</p>
        </div>
      </div>
    );
  }

  // Get page-specific title
  const getPageTitle = () => {
    switch (page) {
      case 'about':
        return 'About Us';
      case 'contact':
        return 'Contact';
      case 'puppies':
        return 'Available Puppies';
      case 'blog':
        return 'Blog';
      case 'favorite-things':
        return 'Favorite Things';
      default:
        return undefined; // Use default/homepage title
    }
  };

  // Render the appropriate page with SEO
  const renderPage = () => {
    switch (page) {
      case 'about':
        return <PublicWebsiteAbout settings={websiteSettings} />;
      case 'contact':
        return <PublicWebsiteContact settings={websiteSettings} />;
      case 'puppies':
        return <PublicWebsitePuppies settings={websiteSettings} />;
      case 'blog':
        if (postSlug) {
          return <PublicWebsiteBlogPost settings={websiteSettings} slug={postSlug} />;
        }
        return <PublicWebsiteBlog settings={websiteSettings} />;
      case 'favorite-things':
        return <PublicWebsiteFavoriteThings settings={websiteSettings} />;
      default:
        return <PublicWebsiteHome settings={websiteSettings} />;
    }
  };

  return (
    <>
      <PublicWebsiteSeo
        settings={websiteSettings}
        profile={breederProfile}
        pageTitle={getPageTitle()}
      />
      {renderPage()}
    </>
  );
}
