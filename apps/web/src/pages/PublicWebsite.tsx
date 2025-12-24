// Public website page router for website builder
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWebsiteStore } from '@breeder/firebase';
import { WebsiteSettings } from '@breeder/types';
import { Loader2 } from 'lucide-react';
import { PublicWebsiteHome } from '@/components/PublicWebsiteHome';
import { PublicWebsiteAbout } from '@/components/PublicWebsiteAbout';
import { PublicWebsiteContact } from '@/components/PublicWebsiteContact';
import { PublicWebsitePuppies } from '@/components/PublicWebsitePuppies';

export function PublicWebsite() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const [websiteSettings, setWebsiteSettings] =
    useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { getWebsiteSettings } = useWebsiteStore();

  const page = searchParams.get('page') || 'home';

  useEffect(() => {
    if (!userId) return;

    const loadWebsite = async () => {
      try {
        setLoading(true);
        const settings = await getWebsiteSettings(userId);
        setWebsiteSettings(settings);
      } catch (error) {
        console.error('Error loading website settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWebsite();
  }, [userId, getWebsiteSettings]);

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

  // Render the appropriate page
  switch (page) {
    case 'about':
      return <PublicWebsiteAbout settings={websiteSettings} />;
    case 'contact':
      return <PublicWebsiteContact settings={websiteSettings} />;
    case 'puppies':
      return <PublicWebsitePuppies settings={websiteSettings} />;
    default:
      return <PublicWebsiteHome settings={websiteSettings} />;
  }
}
