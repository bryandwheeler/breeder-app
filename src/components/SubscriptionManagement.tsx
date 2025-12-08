import { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAdminStore } from '@/store/adminStore';
import { Plus, Trash2, Check, X, Calendar } from 'lucide-react';
import {
  SubscriptionTierConfig,
  SubscriptionTier,
  CouponCode,
  TrialConfig,
} from '@/types/admin';

const DEFAULT_TIER_CONFIGS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  free: {
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      dogManagement: {
        name: 'Dog Management',
        description: 'Manage your dogs',
        enabled: true,
      },
      litterTracking: {
        name: 'Litter Tracking',
        description: 'Track litters and puppies',
        enabled: true,
      },
      basicReports: {
        name: 'Basic Reports',
        description: 'View basic statistics',
        enabled: true,
      },
      customerCRM: {
        name: 'Customer CRM',
        description: 'Basic customer management',
        enabled: false,
      },
      advancedAnalytics: {
        name: 'Advanced Analytics',
        description: 'Detailed analytics and insights',
        enabled: false,
      },
      emailNotifications: {
        name: 'Email Notifications',
        description: 'Automated email notifications',
        enabled: false,
      },
      waitlistManagement: {
        name: 'Waitlist Management',
        description: 'Manage puppy waitlists',
        enabled: false,
      },
      publicWebsite: {
        name: 'Public Website',
        description: 'Public breeder website',
        enabled: false,
      },
      healthTracking: {
        name: 'Health Tracking',
        description: 'Comprehensive health records',
        enabled: false,
      },
      contractGeneration: {
        name: 'Contract Generation',
        description: 'Generate breeding contracts',
        enabled: false,
      },
    },
    maxDogs: 5,
    maxLitters: 2,
    maxCustomers: 10,
    maxWaitlistEntries: 20,
  },
  builder: {
    name: 'builder',
    displayName: 'Builder',
    description: 'For growing breeding programs',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: {
      dogManagement: {
        name: 'Dog Management',
        description: 'Manage your dogs',
        enabled: true,
      },
      litterTracking: {
        name: 'Litter Tracking',
        description: 'Track litters and puppies',
        enabled: true,
      },
      basicReports: {
        name: 'Basic Reports',
        description: 'View basic statistics',
        enabled: true,
      },
      customerCRM: {
        name: 'Customer CRM',
        description: 'Basic customer management',
        enabled: true,
      },
      advancedAnalytics: {
        name: 'Advanced Analytics',
        description: 'Detailed analytics and insights',
        enabled: true,
      },
      emailNotifications: {
        name: 'Email Notifications',
        description: 'Automated email notifications',
        enabled: true,
      },
      waitlistManagement: {
        name: 'Waitlist Management',
        description: 'Manage puppy waitlists',
        enabled: true,
      },
      publicWebsite: {
        name: 'Public Website',
        description: 'Public breeder website',
        enabled: true,
      },
      healthTracking: {
        name: 'Health Tracking',
        description: 'Comprehensive health records',
        enabled: false,
      },
      contractGeneration: {
        name: 'Contract Generation',
        description: 'Generate breeding contracts',
        enabled: false,
      },
    },
    maxDogs: 25,
    maxLitters: 10,
    maxCustomers: 100,
    maxWaitlistEntries: 200,
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    description: 'Complete solution for professional breeders',
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: {
      dogManagement: {
        name: 'Dog Management',
        description: 'Manage your dogs',
        enabled: true,
      },
      litterTracking: {
        name: 'Litter Tracking',
        description: 'Track litters and puppies',
        enabled: true,
      },
      basicReports: {
        name: 'Basic Reports',
        description: 'View basic statistics',
        enabled: true,
      },
      customerCRM: {
        name: 'Customer CRM',
        description: 'Basic customer management',
        enabled: true,
      },
      advancedAnalytics: {
        name: 'Advanced Analytics',
        description: 'Detailed analytics and insights',
        enabled: true,
      },
      emailNotifications: {
        name: 'Email Notifications',
        description: 'Automated email notifications',
        enabled: true,
      },
      waitlistManagement: {
        name: 'Waitlist Management',
        description: 'Manage puppy waitlists',
        enabled: true,
      },
      publicWebsite: {
        name: 'Public Website',
        description: 'Public breeder website',
        enabled: true,
      },
      healthTracking: {
        name: 'Health Tracking',
        description: 'Comprehensive health records',
        enabled: true,
      },
      contractGeneration: {
        name: 'Contract Generation',
        description: 'Generate breeding contracts',
        enabled: true,
      },
    },
    maxDogs: 100,
    maxLitters: 50,
    maxCustomers: 500,
    maxWaitlistEntries: 1000,
  },
};

export function SubscriptionManagement() {
  const { appSettings, updateAppSettings } = useAdminStore();
  const [newCoupon, setNewCoupon] = useState<Partial<CouponCode>>({
    type: 'percentage',
    maxUses: 100,
    value: 10,
    applicableTiers: ['free', 'builder', 'pro'],
  });
  const [newTrial, setNewTrial] = useState<Partial<TrialConfig>>({
    durationDays: 14,
    tier: 'builder',
  });

  const tierConfigs = useMemo(() => {
    return appSettings?.subscriptionTiers || DEFAULT_TIER_CONFIGS;
  }, [appSettings?.subscriptionTiers]);

  const coupons = useMemo(() => {
    return appSettings?.coupons || [];
  }, [appSettings?.coupons]);

  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.value) {
      alert('Please fill in all required fields');
      return;
    }

    const coupon: CouponCode = {
      code: newCoupon.code.toUpperCase(),
      description: newCoupon.description || '',
      type: newCoupon.type || 'percentage',
      value: newCoupon.value,
      maxUses: newCoupon.maxUses || 100,
      usedCount: 0,
      expiryDate:
        newCoupon.expiryDate ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      applicableTiers: newCoupon.applicableTiers || ['free', 'builder', 'pro'],
      active: true,
    };

    const updated = [...coupons, coupon];
    try {
      await updateAppSettings({ coupons: updated });
      setNewCoupon({
        type: 'percentage',
        maxUses: 100,
        value: 10,
        applicableTiers: ['free', 'builder', 'pro'],
      });
      alert('Coupon added successfully');
    } catch (error) {
      console.error('Error adding coupon:', error);
      alert('Failed to add coupon');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Delete coupon ${code}?`)) return;
    const updated = coupons.filter((c) => c.code !== code);
    try {
      await updateAppSettings({ coupons: updated });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const handleToggleCoupon = async (code: string) => {
    const updated = coupons.map((c) =>
      c.code === code ? { ...c, active: !c.active } : c
    );
    try {
      await updateAppSettings({ coupons: updated });
    } catch (error) {
      console.error('Error updating coupon:', error);
      alert('Failed to update coupon');
    }
  };

  const handleSaveTrial = async () => {
    if (!newTrial.durationDays || !newTrial.tier) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await updateAppSettings({
        trial: {
          durationDays: newTrial.durationDays,
          tier: newTrial.tier as SubscriptionTier,
          active: newTrial.active !== false,
        },
      });
      alert('Trial configuration saved successfully');
    } catch (error) {
      console.error('Error saving trial config:', error);
      alert('Failed to save trial configuration');
    }
  };

  const handleToggleTier = async (
    tier: SubscriptionTier,
    featureName: string
  ) => {
    const config = tierConfigs[tier];
    const updated = {
      ...tierConfigs,
      [tier]: {
        ...config,
        features: {
          ...config.features,
          [featureName]: {
            ...config.features[featureName],
            enabled: !config.features[featureName].enabled,
          },
        },
      },
    };

    try {
      await updateAppSettings({ subscriptionTiers: updated });
    } catch (error) {
      console.error('Error updating tier:', error);
      alert('Failed to update subscription tier');
    }
  };

  const handleUpdateTierLimits = async (
    tier: SubscriptionTier,
    field: 'maxDogs' | 'maxLitters' | 'maxCustomers' | 'maxWaitlistEntries',
    value: number
  ) => {
    const config = tierConfigs[tier];
    const updated = {
      ...tierConfigs,
      [tier]: {
        ...config,
        [field]: value,
      },
    };

    try {
      await updateAppSettings({ subscriptionTiers: updated });
    } catch (error) {
      console.error('Error updating tier limits:', error);
      alert('Failed to update tier limits');
    }
  };

  return (
    <div className='space-y-6'>
      <Tabs defaultValue='tiers' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='tiers'>Subscription Tiers</TabsTrigger>
          <TabsTrigger value='coupons'>Coupon Codes</TabsTrigger>
          <TabsTrigger value='trial'>Trial Configuration</TabsTrigger>
        </TabsList>

        {/* Subscription Tiers Tab */}
        <TabsContent value='tiers' className='space-y-4'>
          {(['free', 'builder', 'pro'] as SubscriptionTier[]).map(
            (tierName) => {
              const config = tierConfigs[tierName];
              return (
                <Card key={tierName}>
                  <CardHeader>
                    <CardTitle className='flex items-center justify-between'>
                      <span>{config.displayName}</span>
                      <Badge variant='outline'>{config.description}</Badge>
                    </CardTitle>
                    <CardDescription>
                      ${config.monthlyPrice}/mo or ${config.yearlyPrice}/year
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {/* Pricing */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor={`${tierName}-monthly`}>
                          Monthly Price
                        </Label>
                        <Input
                          id={`${tierName}-monthly`}
                          type='number'
                          value={config.monthlyPrice}
                          onChange={(e) => {
                            const updated = {
                              ...tierConfigs,
                              [tierName]: {
                                ...config,
                                monthlyPrice: parseFloat(e.target.value),
                              },
                            };
                            updateAppSettings({
                              subscriptionTiers: updated,
                            }).catch((error) =>
                              console.error('Error updating pricing:', error)
                            );
                          }}
                          min='0'
                          step='0.01'
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${tierName}-yearly`}>
                          Yearly Price
                        </Label>
                        <Input
                          id={`${tierName}-yearly`}
                          type='number'
                          value={config.yearlyPrice}
                          onChange={(e) => {
                            const updated = {
                              ...tierConfigs,
                              [tierName]: {
                                ...config,
                                yearlyPrice: parseFloat(e.target.value),
                              },
                            };
                            updateAppSettings({
                              subscriptionTiers: updated,
                            }).catch((error) =>
                              console.error('Error updating pricing:', error)
                            );
                          }}
                          min='0'
                          step='0.01'
                        />
                      </div>
                    </div>

                    {/* Limits */}
                    <div className='grid grid-cols-4 gap-4'>
                      <div>
                        <Label htmlFor={`${tierName}-dogs`}>Max Dogs</Label>
                        <Input
                          id={`${tierName}-dogs`}
                          type='number'
                          value={config.maxDogs}
                          onChange={(e) =>
                            handleUpdateTierLimits(
                              tierName,
                              'maxDogs',
                              parseInt(e.target.value)
                            )
                          }
                          min='1'
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${tierName}-litters`}>
                          Max Litters
                        </Label>
                        <Input
                          id={`${tierName}-litters`}
                          type='number'
                          value={config.maxLitters}
                          onChange={(e) =>
                            handleUpdateTierLimits(
                              tierName,
                              'maxLitters',
                              parseInt(e.target.value)
                            )
                          }
                          min='1'
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${tierName}-customers`}>
                          Max Customers
                        </Label>
                        <Input
                          id={`${tierName}-customers`}
                          type='number'
                          value={config.maxCustomers}
                          onChange={(e) =>
                            handleUpdateTierLimits(
                              tierName,
                              'maxCustomers',
                              parseInt(e.target.value)
                            )
                          }
                          min='1'
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${tierName}-waitlist`}>
                          Max Waitlist
                        </Label>
                        <Input
                          id={`${tierName}-waitlist`}
                          type='number'
                          value={config.maxWaitlistEntries}
                          onChange={(e) =>
                            handleUpdateTierLimits(
                              tierName,
                              'maxWaitlistEntries',
                              parseInt(e.target.value)
                            )
                          }
                          min='1'
                        />
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className='font-semibold mb-3'>Features</h4>
                      <div className='grid grid-cols-2 gap-3'>
                        {Object.entries(config.features).map(
                          ([featureKey, feature]) => (
                            <div
                              key={featureKey}
                              className='flex items-center gap-2 p-2 border rounded'
                            >
                              <Switch
                                checked={feature.enabled}
                                onCheckedChange={() =>
                                  handleToggleTier(tierName, featureKey)
                                }
                              />
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium'>
                                  {feature.name}
                                </p>
                                <p className='text-xs text-muted-foreground'>
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )}
        </TabsContent>

        {/* Coupon Codes Tab */}
        <TabsContent value='coupons' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Add New Coupon</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='coupon-code'>Coupon Code</Label>
                  <Input
                    id='coupon-code'
                    placeholder='e.g., LAUNCH20'
                    value={newCoupon.code || ''}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='coupon-desc'>Description</Label>
                  <Input
                    id='coupon-desc'
                    placeholder='e.g., Launch discount'
                    value={newCoupon.description || ''}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <Label htmlFor='coupon-type'>Type</Label>
                  <Select
                    value={newCoupon.type || 'percentage'}
                    onValueChange={(value) =>
                      setNewCoupon({
                        ...newCoupon,
                        type: value as 'percentage' | 'fixed',
                      })
                    }
                  >
                    <SelectTrigger id='coupon-type'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='percentage'>Percentage</SelectItem>
                      <SelectItem value='fixed'>Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='coupon-value'>
                    {newCoupon.type === 'percentage'
                      ? 'Discount %'
                      : 'Discount $'}
                  </Label>
                  <Input
                    id='coupon-value'
                    type='number'
                    value={newCoupon.value || 0}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        value: parseFloat(e.target.value),
                      })
                    }
                    min='0'
                    step={newCoupon.type === 'percentage' ? '1' : '0.01'}
                  />
                </div>
                <div>
                  <Label htmlFor='coupon-uses'>Max Uses</Label>
                  <Input
                    id='coupon-uses'
                    type='number'
                    value={newCoupon.maxUses || 100}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        maxUses: parseInt(e.target.value),
                      })
                    }
                    min='1'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='coupon-expiry'>Expiry Date</Label>
                  <Input
                    id='coupon-expiry'
                    type='date'
                    value={newCoupon.expiryDate || ''}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, expiryDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='coupon-tiers'>Applicable Tiers</Label>
                  <div className='flex gap-2 mt-2'>
                    {(['free', 'builder', 'pro'] as SubscriptionTier[]).map(
                      (tier) => (
                        <button
                          key={tier}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            (newCoupon.applicableTiers || []).includes(tier)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                          onClick={() => {
                            const current = newCoupon.applicableTiers || [];
                            setNewCoupon({
                              ...newCoupon,
                              applicableTiers: current.includes(tier)
                                ? current.filter((t) => t !== tier)
                                : [...current, tier],
                            });
                          }}
                        >
                          {tier.toUpperCase()}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <Button onClick={handleAddCoupon} className='w-full'>
                <Plus className='mr-2 h-4 w-4' />
                Add Coupon
              </Button>
            </CardContent>
          </Card>

          {/* Coupons List */}
          {coupons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Coupons ({coupons.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 max-h-96 overflow-y-auto'>
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.code}
                      className='border rounded-lg p-3 flex items-center justify-between hover:bg-muted/30'
                    >
                      <div className='flex-1 min-w-0'>
                        <div className='font-mono font-semibold'>
                          {coupon.code}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {coupon.description}
                        </div>
                        <div className='flex gap-4 text-xs text-muted-foreground mt-1'>
                          <span>
                            {coupon.type === 'percentage'
                              ? `${coupon.value}% off`
                              : `$${coupon.value} off`}
                          </span>
                          <span>
                            {coupon.usedCount}/{coupon.maxUses} used
                          </span>
                          <span>
                            Expires{' '}
                            {new Date(coupon.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleToggleCoupon(coupon.code)}
                        >
                          {coupon.active ? (
                            <Check className='h-4 w-4 text-green-600' />
                          ) : (
                            <X className='h-4 w-4 text-red-600' />
                          )}
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleDeleteCoupon(coupon.code)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trial Configuration Tab */}
        <TabsContent value='trial' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Trial Configuration
              </CardTitle>
              <CardDescription>
                Configure trial access for new users
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label className='flex items-center gap-2'>
                  <Switch
                    checked={newTrial.active !== false}
                    onCheckedChange={(checked) =>
                      setNewTrial({ ...newTrial, active: checked })
                    }
                  />
                  <span>Enable Trial Period</span>
                </Label>
              </div>

              {newTrial.active !== false && (
                <>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='trial-duration'>
                        Trial Duration (days)
                      </Label>
                      <Input
                        id='trial-duration'
                        type='number'
                        value={newTrial.durationDays || 14}
                        onChange={(e) =>
                          setNewTrial({
                            ...newTrial,
                            durationDays: parseInt(e.target.value),
                          })
                        }
                        min='1'
                      />
                    </div>
                    <div>
                      <Label htmlFor='trial-tier'>Trial Tier</Label>
                      <Select
                        value={newTrial.tier || 'builder'}
                        onValueChange={(value) =>
                          setNewTrial({
                            ...newTrial,
                            tier: value as SubscriptionTier,
                          })
                        }
                      >
                        <SelectTrigger id='trial-tier'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='free'>Free</SelectItem>
                          <SelectItem value='builder'>Builder</SelectItem>
                          <SelectItem value='pro'>Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='bg-blue-50 dark:bg-blue-950/20 p-3 rounded text-sm text-muted-foreground'>
                    New users will get {newTrial.durationDays} days of{' '}
                    <span className='font-semibold'>
                      {tierConfigs[newTrial.tier as SubscriptionTier]
                        ?.displayName || 'selected'}
                    </span>{' '}
                    tier access
                  </div>
                </>
              )}

              <Button onClick={handleSaveTrial} className='w-full'>
                Save Trial Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
