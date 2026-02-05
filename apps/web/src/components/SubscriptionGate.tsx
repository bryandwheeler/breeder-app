import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, Crown, ArrowRight } from 'lucide-react';
import { SubscriptionTier } from '@breeder/types';
import { useWebsiteFeatures } from '@/hooks/useWebsiteFeatures';

interface SubscriptionGateProps {
  // The feature being gated
  feature: 'website' | 'subdomain' | 'customDomain' | 'advancedSeo' | 'allPresets' | 'customPages';
  // Content to show when user has access
  children: ReactNode;
  // Optional: specific tier required (otherwise determined by feature)
  requiredTier?: SubscriptionTier;
  // Optional: custom message
  message?: string;
  // Optional: show as inline badge instead of full card
  variant?: 'card' | 'inline' | 'overlay';
  // Optional: hide the gate entirely (just don't render children)
  hideGate?: boolean;
}

const TIER_DISPLAY: Record<SubscriptionTier, { name: string; icon: ReactNode; color: string }> = {
  free: {
    name: 'Free',
    icon: null,
    color: 'text-gray-500',
  },
  builder: {
    name: 'Builder',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-blue-600',
  },
  pro: {
    name: 'Pro',
    icon: <Crown className="h-4 w-4" />,
    color: 'text-amber-600',
  },
};

const FEATURE_CONFIG: Record<string, { title: string; description: string; requiredTier: SubscriptionTier }> = {
  website: {
    title: 'Website Builder',
    description: 'Create your own professional kennel website with custom branding and pages.',
    requiredTier: 'builder',
  },
  subdomain: {
    title: 'Custom Subdomain',
    description: 'Get your own subdomain like yourkennel.expertbreeder.com.',
    requiredTier: 'builder',
  },
  customDomain: {
    title: 'Custom Domain',
    description: 'Use your own domain name (www.yourkennel.com) for your website.',
    requiredTier: 'pro',
  },
  advancedSeo: {
    title: 'Advanced SEO',
    description: 'Control how your website appears in search engines with advanced meta tags and Open Graph settings.',
    requiredTier: 'pro',
  },
  allPresets: {
    title: 'Premium Themes',
    description: 'Access all premium theme presets for a unique, professional look.',
    requiredTier: 'pro',
  },
  customPages: {
    title: 'Custom Pages',
    description: 'Create additional pages for your website beyond the basics.',
    requiredTier: 'builder',
  },
};

export function SubscriptionGate({
  feature,
  children,
  requiredTier,
  message,
  variant = 'card',
  hideGate = false,
}: SubscriptionGateProps) {
  const { subscriptionTier, loading, canAccessWebsite, canUseSubdomain, canUseCustomDomain, canAccessAdvancedSeo, canAccessAllPresets, maxCustomPages } = useWebsiteFeatures();

  // Determine if user has access
  const hasAccess = (): boolean => {
    switch (feature) {
      case 'website':
        return canAccessWebsite;
      case 'subdomain':
        return canUseSubdomain;
      case 'customDomain':
        return canUseCustomDomain;
      case 'advancedSeo':
        return canAccessAdvancedSeo;
      case 'allPresets':
        return canAccessAllPresets;
      case 'customPages':
        return maxCustomPages > 0;
      default:
        return false;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  // User has access - show children
  if (hasAccess()) {
    return <>{children}</>;
  }

  // User doesn't have access
  if (hideGate) {
    return null;
  }

  const config = FEATURE_CONFIG[feature];
  const tierRequired = requiredTier || config?.requiredTier || 'builder';
  const tierDisplay = TIER_DISPLAY[tierRequired];
  const displayMessage = message || config?.description;

  // Inline variant - just a badge
  if (variant === 'inline') {
    return (
      <Badge variant="outline" className="gap-1.5 cursor-not-allowed">
        <Lock className="h-3 w-3" />
        {tierDisplay.name} Required
      </Badge>
    );
  }

  // Overlay variant - semi-transparent overlay with upgrade prompt
  if (variant === 'overlay') {
    return (
      <div className="relative">
        <div className="opacity-30 pointer-events-none blur-sm">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-6 max-w-sm">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4 ${tierDisplay.color}`}>
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">{config?.title || 'Feature Locked'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {displayMessage}
            </p>
            <Button asChild size="sm">
              <Link to="/account" className="gap-2">
                Upgrade to {tierDisplay.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card variant - full upgrade card
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-2">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mx-auto mb-2 ${tierDisplay.color}`}>
          <Lock className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg">{config?.title || 'Feature Locked'}</CardTitle>
        <CardDescription>{displayMessage}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Available with</span>
          <Badge variant="secondary" className={`gap-1 ${tierDisplay.color}`}>
            {tierDisplay.icon}
            {tierDisplay.name}
          </Badge>
        </div>
        <Button asChild>
          <Link to="/account" className="gap-2">
            Upgrade Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Simple hook to check if user can access a specific feature
export function useCanAccessFeature(feature: SubscriptionGateProps['feature']): boolean {
  const { canAccessWebsite, canUseSubdomain, canUseCustomDomain, canAccessAdvancedSeo, canAccessAllPresets, maxCustomPages } = useWebsiteFeatures();

  switch (feature) {
    case 'website':
      return canAccessWebsite;
    case 'subdomain':
      return canUseSubdomain;
    case 'customDomain':
      return canUseCustomDomain;
    case 'advancedSeo':
      return canAccessAdvancedSeo;
    case 'allPresets':
      return canAccessAllPresets;
    case 'customPages':
      return maxCustomPages > 0;
    default:
      return false;
  }
}
