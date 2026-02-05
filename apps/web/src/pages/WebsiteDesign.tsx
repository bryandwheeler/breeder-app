import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteStore } from '@breeder/firebase';
import { WebsiteCustomizer } from '@/components/WebsiteCustomizer';
import { PuppyShopManager } from '@/components/PuppyShopManager';
import { SubdomainSetup } from '@/components/website/SubdomainSetup';
import { ThemePresetGallery } from '@/components/website/ThemePresetGallery';
import { SeoSettingsForm } from '@/components/website/SeoSettingsForm';
import { CustomDomainSetup } from '@/components/website/CustomDomainSetup';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useWebsiteFeatures } from '@/hooks/useWebsiteFeatures';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Globe,
  Palette,
  Layout,
  Search,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function WebsiteDesign() {
  const { currentUser } = useAuth();
  const { websiteSettings, publishWebsite, unpublishWebsite } = useWebsiteStore();
  const { canAccessWebsite, canUseCustomDomain, canAccessAdvancedSeo, subscriptionTier, loading } = useWebsiteFeatures();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Determine the website URL based on domain settings
  const getWebsiteUrl = () => {
    if (!currentUser) return '';

    // Custom domain takes priority (Pro tier)
    if (websiteSettings?.domain?.customDomain && websiteSettings?.domain?.customDomainStatus === 'active') {
      return `https://${websiteSettings.domain.customDomain}`;
    }

    // Subdomain (Builder+ tier)
    if (websiteSettings?.domain?.subdomain) {
      return `https://${websiteSettings.domain.subdomain}.expertbreeder.com`;
    }

    // Fallback to UID-based URL
    return `${window.location.origin}/website/${currentUser.uid}`;
  };

  const publicUrl = getWebsiteUrl();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: 'URL Copied',
        description: 'Website URL copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy URL to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublish = async () => {
    if (!currentUser) return;

    setPublishing(true);
    try {
      if (websiteSettings?.websiteEnabled) {
        await unpublishWebsite(currentUser.uid);
        toast({
          title: 'Website Unpublished',
          description: 'Your website is now hidden from the public',
        });
      } else {
        await publishWebsite(currentUser.uid);
        toast({
          title: 'Website Published',
          description: 'Your website is now live',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update website status',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show upgrade prompt for free users
  if (!canAccessWebsite) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Website Design</h1>
          <p className="text-muted-foreground">
            Create and customize your breeder website
          </p>
        </div>

        <SubscriptionGate feature="website">
          <div />
        </SubscriptionGate>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Website Design</h1>
          <p className="text-muted-foreground">
            Create and customize your breeder website
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Publish Status */}
          <Badge variant={websiteSettings?.websiteEnabled ? 'default' : 'secondary'}>
            {websiteSettings?.websiteEnabled ? 'Published' : 'Draft'}
          </Badge>

          {/* Publish/Unpublish Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePublish}
            disabled={publishing}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : websiteSettings?.websiteEnabled ? (
              'Unpublish'
            ) : (
              'Publish'
            )}
          </Button>

          {/* View Live Button */}
          {websiteSettings?.websiteEnabled && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy URL
              </Button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Live
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Website URL Display */}
      {websiteSettings?.websiteEnabled && (
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Your website:</span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {publicUrl.replace('https://', '')}
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="design" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="design" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Design</span>
          </TabsTrigger>
          <TabsTrigger value="domain" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Domain</span>
          </TabsTrigger>
          <TabsTrigger value="themes" className="gap-2">
            <Layout className="h-4 w-4" />
            <span className="hidden sm:inline">Themes</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="shop" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Shop</span>
          </TabsTrigger>
        </TabsList>

        {/* Design Tab */}
        <TabsContent value="design">
          <Card>
            <CardHeader>
              <CardTitle>Website Customizer</CardTitle>
              <CardDescription>
                Customize colors, fonts, and layout of your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebsiteCustomizer />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-6">
          {/* Subdomain Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Subdomain</CardTitle>
              <CardDescription>
                Claim your custom subdomain on expertbreeder.com
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubdomainSetup />
            </CardContent>
          </Card>

          {/* Custom Domain (Pro) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Domain</CardTitle>
                  <CardDescription>
                    Use your own domain name for your website
                  </CardDescription>
                </div>
                {!canUseCustomDomain && (
                  <Badge variant="secondary">Pro</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {canUseCustomDomain ? (
                <CustomDomainSetup />
              ) : (
                <SubscriptionGate feature="customDomain" variant="overlay">
                  <CustomDomainSetup disabled />
                </SubscriptionGate>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes">
          <Card>
            <CardHeader>
              <CardTitle>Theme Presets</CardTitle>
              <CardDescription>
                Choose from professionally designed theme presets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemePresetGallery
                canAccessPremium={subscriptionTier === 'pro'}
                onUpgradeClick={() => window.location.href = '/account'}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>
                    Optimize your website for search engines
                  </CardDescription>
                </div>
                {!canAccessAdvancedSeo && (
                  <Badge variant="secondary">Pro for Advanced</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <SeoSettingsForm disabled={!canAccessAdvancedSeo && subscriptionTier !== 'builder'} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shop Tab */}
        <TabsContent value="shop">
          <Card>
            <CardHeader>
              <CardTitle>Available Puppies</CardTitle>
              <CardDescription>
                Manage which puppies appear on your public website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PuppyShopManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
