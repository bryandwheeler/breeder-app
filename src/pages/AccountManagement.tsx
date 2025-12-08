import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { Card } from '@/components/ui/card';

export function AccountManagement() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold mb-2'>Account Management</h1>
        <p className='text-muted-foreground'>
          Manage your subscription, billing, and account settings
        </p>
      </div>

      <div className='space-y-6'>
        <Card className='p-6'>
          <div className='space-y-6'>
            <div>
              <h2 className='text-2xl font-semibold mb-4'>
                Subscription & Billing
              </h2>
              <SubscriptionStatus />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
