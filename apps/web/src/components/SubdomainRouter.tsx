import { useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useWebsiteStore, useBreederStore } from '@breeder/firebase';
import { WebsiteSettings, BreederProfile } from '@breeder/types';
import { PublicWebsiteHome } from '@/components/PublicWebsiteHome';
import { PublicWebsiteAbout } from '@/components/PublicWebsiteAbout';
import { PublicWebsiteContact } from '@/components/PublicWebsiteContact';
import { PublicWebsitePuppies } from '@/components/PublicWebsitePuppies';
import { PublicWebsiteSeo } from '@/components/website/PublicWebsiteSeo';
import { detectSubdomain, SubdomainInfo } from '@/lib/subdomainRouter';
import { Loader2 } from 'lucide-react';

interface SubdomainRouterProps {
  children: ReactNode;
}

/**
 * Wrapper component that checks if the user is accessing via a subdomain.
 * If so, renders the public website directly instead of the main app.
 */
export function SubdomainRouter({ children }: SubdomainRouterProps) {
  const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubdomain = async () => {
      try {
        const info = await detectSubdomain();
        setSubdomainInfo(info);
      } catch (error) {
        console.error('Error detecting subdomain:', error);
        setSubdomainInfo({ isSubdomain: false, subdomain: null, breederId: null });
      } finally {
        setLoading(false);
      }
    };

    checkSubdomain();
  }, []);

  // Show loading while checking subdomain
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If accessing via subdomain, show the public website
  if (subdomainInfo?.isSubdomain && subdomainInfo.breederId) {
    // Render the public website with the resolved breeder ID
    return <PublicWebsiteByBreederId breederId={subdomainInfo.breederId} />;
  }

  // If subdomain but breeder not found, show 404
  if (subdomainInfo?.isSubdomain && !subdomainInfo.breederId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Website Not Found</h1>
          <p className="text-muted-foreground">
            The subdomain "{subdomainInfo.subdomain}" is not registered.
          </p>
          <a href="https://expertbreeder.com" className="text-primary hover:underline mt-4 block">
            Go to Expert Breeder
          </a>
        </div>
      </div>
    );
  }

  // Not a subdomain, render the main app
  return <>{children}</>;
}

// Internal component to render public website by breeder ID
function PublicWebsiteByBreederId({ breederId }: { breederId: string }) {
  const [searchParams] = useSearchParams();
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null);
  const [breederProfile, setBreederProfile] = useState<BreederProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const { getWebsiteSettings } = useWebsiteStore();
  const { getPublicProfile } = useBreederStore();

  const page = searchParams.get('page') || 'home';

  useEffect(() => {
    const loadWebsite = async () => {
      try {
        setPageLoading(true);
        const [settings, profile] = await Promise.all([
          getWebsiteSettings(breederId),
          getPublicProfile(breederId),
        ]);
        setWebsiteSettings(settings);
        setBreederProfile(profile);
      } catch (error) {
        console.error('Error loading website settings:', error);
      } finally {
        setPageLoading(false);
      }
    };

    loadWebsite();
  }, [breederId, getWebsiteSettings, getPublicProfile]);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!websiteSettings || !websiteSettings.websiteEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Website not available</p>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    switch (page) {
      case 'about':
        return 'About Us';
      case 'contact':
        return 'Contact';
      case 'puppies':
        return 'Available Puppies';
      default:
        return undefined;
    }
  };

  const renderPage = () => {
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
  };

  return (
    <HelmetProvider>
      <PublicWebsiteSeo
        settings={websiteSettings}
        profile={breederProfile}
        pageTitle={getPageTitle()}
      />
      {renderPage()}
    </HelmetProvider>
  );
}
