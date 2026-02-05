import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionTier, WebsiteFeatures } from '@breeder/types';

// Default website features by subscription tier
const DEFAULT_WEBSITE_FEATURES: Record<SubscriptionTier, WebsiteFeatures> = {
  free: {
    enabled: false,
    subdomainAllowed: false,
    customDomainAllowed: false,
    themePresetsAccess: 'none',
    advancedSeoAccess: false,
    maxCustomPages: 0,
  },
  builder: {
    enabled: true,
    subdomainAllowed: true,
    customDomainAllowed: false,
    themePresetsAccess: 'basic',
    advancedSeoAccess: false,
    maxCustomPages: 5,
  },
  pro: {
    enabled: true,
    subdomainAllowed: true,
    customDomainAllowed: true,
    themePresetsAccess: 'all',
    advancedSeoAccess: true,
    maxCustomPages: 20,
  },
};

interface UseWebsiteFeaturesReturn {
  // Current subscription tier
  subscriptionTier: SubscriptionTier;
  // Website features based on tier
  features: WebsiteFeatures;
  // Loading state
  loading: boolean;
  // Helper functions
  canAccessWebsite: boolean;
  canUseSubdomain: boolean;
  canUseCustomDomain: boolean;
  canAccessAllPresets: boolean;
  canAccessAdvancedSeo: boolean;
  maxCustomPages: number;
  // Check if a preset is accessible (based on isPremium flag)
  canAccessPreset: (isPremium: boolean) => boolean;
  // Get the required tier for a feature
  requiredTierForFeature: (feature: keyof WebsiteFeatures) => SubscriptionTier;
  // Check if user needs to upgrade for a feature
  needsUpgradeFor: (feature: keyof WebsiteFeatures) => boolean;
}

export function useWebsiteFeatures(): UseWebsiteFeaturesReturn {
  const { currentUser } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionTier = async () => {
      if (!currentUser) {
        setSubscriptionTier('free');
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const tier = userDoc.data()?.subscriptionTier || 'free';
          setSubscriptionTier(tier);
        } else {
          setSubscriptionTier('free');
        }
      } catch (error) {
        console.error('Error fetching subscription tier:', error);
        setSubscriptionTier('free');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionTier();
  }, [currentUser]);

  const features = useMemo(() => {
    return DEFAULT_WEBSITE_FEATURES[subscriptionTier];
  }, [subscriptionTier]);

  const canAccessPreset = (isPremium: boolean): boolean => {
    if (!isPremium) return features.themePresetsAccess !== 'none';
    return features.themePresetsAccess === 'all';
  };

  const requiredTierForFeature = (feature: keyof WebsiteFeatures): SubscriptionTier => {
    // Check which tier first enables this feature
    const tiers: SubscriptionTier[] = ['free', 'builder', 'pro'];

    for (const tier of tiers) {
      const tierFeatures = DEFAULT_WEBSITE_FEATURES[tier];
      const value = tierFeatures[feature];

      // For boolean features, check if enabled
      if (typeof value === 'boolean' && value) {
        return tier;
      }
      // For themePresetsAccess, check for non-'none'
      if (feature === 'themePresetsAccess' && value !== 'none') {
        return tier;
      }
      // For maxCustomPages, check for > 0
      if (feature === 'maxCustomPages' && typeof value === 'number' && value > 0) {
        return tier;
      }
    }

    return 'pro'; // Default to pro if not found
  };

  const needsUpgradeFor = (feature: keyof WebsiteFeatures): boolean => {
    const currentFeatureValue = features[feature];

    // For boolean features
    if (typeof currentFeatureValue === 'boolean') {
      return !currentFeatureValue;
    }

    // For themePresetsAccess
    if (feature === 'themePresetsAccess') {
      return currentFeatureValue === 'none';
    }

    // For maxCustomPages
    if (feature === 'maxCustomPages') {
      return currentFeatureValue === 0;
    }

    return false;
  };

  return {
    subscriptionTier,
    features,
    loading,
    canAccessWebsite: features.enabled,
    canUseSubdomain: features.subdomainAllowed,
    canUseCustomDomain: features.customDomainAllowed,
    canAccessAllPresets: features.themePresetsAccess === 'all',
    canAccessAdvancedSeo: features.advancedSeoAccess,
    maxCustomPages: features.maxCustomPages,
    canAccessPreset,
    requiredTierForFeature,
    needsUpgradeFor,
  };
}

// Export the default features for use in other components
export { DEFAULT_WEBSITE_FEATURES };
