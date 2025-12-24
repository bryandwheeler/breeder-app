import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Zap, Crown, Sparkles, Loader2 } from 'lucide-react';
import { SubscriptionTier } from '@breeder/types';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { redirectToCheckout, redirectToPortal } from '@/lib/stripe';

interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  features: Record<string, boolean>;
  icon: React.ReactNode;
  color: string;
  recommended?: boolean;
}

const PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    icon: <Sparkles className='h-6 w-6' />,
    color: 'text-gray-600',
    features: {
      'Up to 10 dogs': true,
      'Up to 5 litters': true,
      'Basic profile': true,
      'Website builder': false,
      'Email notifications': false,
      'Advanced analytics': false,
      'Puppy shop': false,
      'Priority support': false,
    },
  },
  {
    tier: 'builder',
    name: 'Builder',
    description: 'Perfect for growing breeders',
    monthlyPrice: 29,
    icon: <Zap className='h-6 w-6' />,
    color: 'text-blue-600',
    recommended: true,
    features: {
      'Unlimited dogs': true,
      'Unlimited litters': true,
      'Full profile': true,
      'Website builder': true,
      'Email notifications': true,
      'Advanced analytics': false,
      'Puppy shop': true,
      'Priority support': false,
    },
  },
  {
    tier: 'pro',
    name: 'Pro',
    description: 'For established kennels',
    monthlyPrice: 79,
    icon: <Crown className='h-6 w-6' />,
    color: 'text-amber-600',
    features: {
      'Unlimited dogs': true,
      'Unlimited litters': true,
      'Full profile': true,
      'Website builder': true,
      'Email notifications': true,
      'Advanced analytics': true,
      'Puppy shop': true,
      'Priority support': true,
    },
  },
];

export function SubscriptionStatus() {
  const { currentUser } = useAuth();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<SubscriptionTier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const tier = userDoc.data()?.subscriptionTier || 'free';
          setCurrentTier(tier);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setCurrentTier('free');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [currentUser]);

  // Stripe Price IDs (configure these from your Stripe dashboard)
  const STRIPE_PRICE_IDS: Record<SubscriptionTier, string> = {
    free: '', // Free tier doesn't have a price ID
    builder: import.meta.env.VITE_STRIPE_PRICE_BUILDER || '',
    pro: import.meta.env.VITE_STRIPE_PRICE_PRO || '',
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!currentUser) return;

    setUpgrading(tier);
    try {
      const priceId = STRIPE_PRICE_IDS[tier];
      if (!priceId) {
        alert('Price ID not configured. Please contact support.');
        return;
      }

      const successUrl = `${window.location.origin}/account?success=true`;
      const cancelUrl = `${window.location.origin}/account?canceled=true`;

      await redirectToCheckout(priceId, successUrl, cancelUrl);
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!currentUser) return;

    setPortalLoading(true);
    try {
      const returnUrl = `${window.location.origin}/account`;
      await redirectToPortal(returnUrl);
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return <div className='text-center py-4'>Loading subscription...</div>;
  }

  const currentPlan = PLANS.find((p) => p.tier === currentTier);

  return (
    <div className='space-y-6'>
      {/* Current Subscription */}
      <Card className='p-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent'>
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-lg font-semibold mb-2'>Current Plan</h3>
            <div className='flex items-center gap-2 mb-2'>
              <Badge className='text-base font-semibold'>
                {currentPlan?.name}
              </Badge>
              {currentPlan?.recommended && (
                <Badge
                  variant='outline'
                  className='bg-amber-50 text-amber-700 border-amber-200'
                >
                  Recommended
                </Badge>
              )}
            </div>
            <p className='text-sm text-muted-foreground'>
              {currentPlan?.description}
            </p>
          </div>
          <div className={`text-3xl font-bold ${currentPlan?.color}`}>
            {currentPlan?.icon}
          </div>
        </div>
      </Card>

      {/* Pricing Cards */}
      <div>
        <h3 className='text-lg font-semibold mb-4'>Available Plans</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.tier === currentTier;
            const shouldUpgrade =
              plan.tier !== currentTier &&
              (currentTier === 'free' ||
                (currentTier === 'builder' && plan.tier === 'pro'));

            return (
              <Card
                key={plan.tier}
                className={`p-6 flex flex-col transition-all ${
                  isCurrentPlan
                    ? 'border-2 border-primary ring-2 ring-primary/20'
                    : 'border hover:border-primary/50'
                }`}
              >
                {/* Header */}
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='text-xl font-bold'>{plan.name}</h4>
                    <div className={`${plan.color}`}>{plan.icon}</div>
                  </div>
                  <p className='text-sm text-muted-foreground mb-4'>
                    {plan.description}
                  </p>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-3xl font-bold'>
                      ${plan.monthlyPrice}
                    </span>
                    <span className='text-muted-foreground'>/month</span>
                  </div>
                </div>

                {/* Features List */}
                <div className='flex-1 space-y-3 mb-6'>
                  {Object.entries(plan.features).map(([feature, enabled]) => (
                    <div
                      key={feature}
                      className='flex items-center gap-3 text-sm'
                    >
                      {enabled ? (
                        <Check className='h-5 w-5 text-green-600 flex-shrink-0' />
                      ) : (
                        <X className='h-5 w-5 text-gray-300 flex-shrink-0' />
                      )}
                      <span
                        className={enabled ? '' : 'text-gray-400 line-through'}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                {isCurrentPlan ? (
                  <Button disabled className='w-full' variant='outline'>
                    Current Plan
                  </Button>
                ) : shouldUpgrade ? (
                  <Button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={upgrading === plan.tier}
                    className='w-full'
                    variant={plan.recommended ? 'default' : 'outline'}
                  >
                    {upgrading === plan.tier && (
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    )}
                    {upgrading === plan.tier
                      ? 'Processing...'
                      : `Upgrade to ${plan.name}`}
                  </Button>
                ) : (
                  <Button disabled className='w-full' variant='outline'>
                    Downgrade (Contact Support)
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing Info */}
      <Card className='p-6'>
        <h3 className='font-semibold mb-4'>Billing Information</h3>
        <div className='space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Plan:</span>
            <span className='font-medium'>{currentPlan?.name}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Billing Cycle:</span>
            <span className='font-medium'>Monthly</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Next Billing:</span>
            <span className='font-medium'>
              {new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toLocaleDateString()}
            </span>
          </div>
          <div className='pt-4 border-t'>
            <Button
              onClick={handleManageBilling}
              disabled={portalLoading}
              variant='outline'
              size='sm'
              className='w-full'
            >
              {portalLoading && (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              )}
              {portalLoading ? 'Loading...' : 'Manage Billing'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Help Section */}
      <Card className='p-6 bg-blue-50 border-blue-200'>
        <h3 className='font-semibold mb-2'>Need Help?</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Have questions about our plans or need to downgrade? Our support team
          is here to help.
        </p>
        <Button variant='outline' size='sm'>
          Contact Support
        </Button>
      </Card>
    </div>
  );
}
