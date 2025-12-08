import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteStore } from '@/store/websiteStore';
import { WebsiteCustomizer } from '@/components/WebsiteCustomizer';
import { PuppyShopManager } from '@/components/PuppyShopManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, Lock } from 'lucide-react';

export function WebsiteDesign() {
  const { currentUser } = useAuth();
  const { websiteSettings } = useWebsiteStore();

  // TODO: Replace with actual subscription check
  // For now, we'll assume all users have website access
  const hasWebsiteAccess = true;
  // const subscriptionTier = 'builder'; // or 'pro'

  const publicUrl = currentUser
    ? `${window.location.origin}/website/${currentUser.uid}`
    : '';

  if (!hasWebsiteAccess) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>Website Design</h1>
          <p className='text-muted-foreground'>
            Create and customize your breeder website
          </p>
        </div>

        <Card className='p-12 text-center space-y-4 border-2 border-dashed'>
          <Lock className='h-16 w-16 mx-auto text-muted-foreground' />
          <div>
            <h3 className='text-xl font-semibold mb-2'>
              Website Feature Locked
            </h3>
            <p className='text-muted-foreground mb-4'>
              Website customization is only available on the Builder plan and
              higher.
            </p>
            <Button>Upgrade to Builder Plan</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Website Design</h1>
          <p className='text-muted-foreground'>
            Create and customize your breeder website
          </p>
        </div>
        {websiteSettings && (
          <a href={publicUrl} target='_blank' rel='noopener noreferrer'>
            <Button variant='outline'>
              <Eye className='h-4 w-4 mr-2' />
              View Live Website
            </Button>
          </a>
        )}
      </div>

      <div className='space-y-6'>
        {/* Website Customizer */}
        <Card className='p-6'>
          <h2 className='text-2xl font-semibold mb-6'>
            Customize Your Website
          </h2>
          <WebsiteCustomizer />
        </Card>

        {/* Puppy Shop Manager */}
        <Card className='p-6'>
          <h2 className='text-2xl font-semibold mb-6'>Available Puppies</h2>
          <PuppyShopManager />
        </Card>
      </div>
    </div>
  );
}
