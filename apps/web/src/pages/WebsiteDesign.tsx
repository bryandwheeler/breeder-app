import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteStore } from '@breeder/firebase';
import { WebsiteCustomizer } from '@/components/WebsiteCustomizer';
import { Link } from 'react-router-dom';
import { SubdomainSetup } from '@/components/website/SubdomainSetup';
import { ThemePresetGallery } from '@/components/website/ThemePresetGallery';
import { SeoSettingsForm } from '@/components/website/SeoSettingsForm';
import { CustomDomainSetup } from '@/components/website/CustomDomainSetup';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useWebsiteFeatures } from '@/hooks/useWebsiteFeatures';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CollapsibleFormSection, FormSectionGroup } from '@/components/ui/collapsible-form-section';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Eye,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  ShoppingBag,
  FileText,
  Heart,
  Save,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ValueProposition } from '@breeder/types';

export function WebsiteDesign() {
  const { currentUser } = useAuth();
  const { websiteSettings, publishWebsite, unpublishWebsite, updateWebsiteSettings } = useWebsiteStore();
  const { canAccessWebsite, canUseCustomDomain, canAccessAdvancedSeo, subscriptionTier, loading } = useWebsiteFeatures();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Why Choose Us state
  const defaultCards: ValueProposition[] = [
    { title: 'Quality Breeding', description: 'Committed to breeding healthy, well-socialized puppies' },
    { title: 'Health Guaranteed', description: 'All puppies come with health guarantees and certifications' },
    { title: 'Lifetime Support', description: 'We provide ongoing support and guidance to all our families' },
  ];
  const [whyChooseUsTitle, setWhyChooseUsTitle] = useState('');
  const [whyChooseUsCards, setWhyChooseUsCards] = useState<ValueProposition[]>(defaultCards);

  // Contact Info state
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  // Sync from store
  useEffect(() => {
    if (websiteSettings) {
      setWhyChooseUsTitle(websiteSettings.whyChooseUsTitle || '');
      if (websiteSettings.whyChooseUs?.length) {
        setWhyChooseUsCards(websiteSettings.whyChooseUs);
      }
      setContactInfo({
        email: websiteSettings.email || '',
        phone: websiteSettings.phone || '',
        city: websiteSettings.city || '',
        state: websiteSettings.state || '',
        zipCode: websiteSettings.zipCode || '',
        country: websiteSettings.country || '',
      });
    }
  }, [websiteSettings]);

  const handleSaveWhyChooseUs = async () => {
    if (!currentUser) return;
    setSaving('whyChooseUs');
    try {
      await updateWebsiteSettings(currentUser.uid, {
        whyChooseUsTitle: whyChooseUsTitle || undefined,
        whyChooseUs: whyChooseUsCards,
      });
      toast({ title: 'Saved', description: '"Why Choose Us" section updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveContactInfo = async () => {
    if (!currentUser) return;
    setSaving('contact');
    try {
      await updateWebsiteSettings(currentUser.uid, {
        email: contactInfo.email || undefined,
        phone: contactInfo.phone || undefined,
        city: contactInfo.city || undefined,
        state: contactInfo.state || undefined,
        zipCode: contactInfo.zipCode || undefined,
        country: contactInfo.country || undefined,
      });
      toast({ title: 'Saved', description: 'Contact information updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const updateCard = (index: number, field: keyof ValueProposition, value: string) => {
    setWhyChooseUsCards(prev => prev.map((card, i) => i === index ? { ...card, [field]: value } : card));
  };

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

      {/* All settings as collapsible sections */}
      <FormSectionGroup>
        {/* Theme Presets */}
        <CollapsibleFormSection
          title="Theme Presets"
          description="Choose from professionally designed theme presets or create your own"
          defaultOpen
        >
          <ThemePresetGallery
            canAccessPremium={subscriptionTier === 'pro'}
            onUpgradeClick={() => window.location.href = '/account'}
          />
        </CollapsibleFormSection>

        {/* Website Customizer (renders its own collapsible sections) */}
        <WebsiteCustomizer />

        {/* Domain Settings */}
        <CollapsibleFormSection
          title="Subdomain"
          description="Claim your custom subdomain on expertbreeder.com"
          defaultOpen={false}
          collapsedIndicator={
            websiteSettings?.domain?.subdomain
              ? `${websiteSettings.domain.subdomain}.expertbreeder.com`
              : undefined
          }
        >
          <SubdomainSetup />
        </CollapsibleFormSection>

        <CollapsibleFormSection
          title="Custom Domain"
          description="Use your own domain name for your website"
          defaultOpen={false}
          collapsedIndicator={
            !canUseCustomDomain ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pro</Badge>
            ) : websiteSettings?.domain?.customDomain ? (
              websiteSettings.domain.customDomain
            ) : undefined
          }
        >
          {canUseCustomDomain ? (
            <CustomDomainSetup />
          ) : (
            <SubscriptionGate feature="customDomain" variant="overlay">
              <CustomDomainSetup disabled />
            </SubscriptionGate>
          )}
        </CollapsibleFormSection>

        {/* SEO */}
        <CollapsibleFormSection
          title="SEO Settings"
          description="Optimize your website for search engines"
          defaultOpen={false}
          collapsedIndicator={
            !canAccessAdvancedSeo ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pro for Advanced</Badge>
            ) : undefined
          }
        >
          <SeoSettingsForm disabled={!canAccessAdvancedSeo && subscriptionTier !== 'builder'} />
        </CollapsibleFormSection>

        {/* Puppy Listings */}
        <CollapsibleFormSection
          title="Available Puppies"
          description="Puppies shown on your website are managed from your litter pages"
          defaultOpen={false}
          collapsedIndicator={
            websiteSettings?.puppyListings?.length
              ? `${websiteSettings.puppyListings.length} listed`
              : undefined
          }
        >
          {websiteSettings?.puppyListings && websiteSettings.puppyListings.length > 0 ? (
            <div className='space-y-3'>
              {websiteSettings.puppyListings.map((listing) => (
                <div key={listing.id} className='flex items-center justify-between p-3 border rounded-lg'>
                  <div className='flex items-center gap-3'>
                    {listing.photos && listing.photos.length > 0 ? (
                      <img src={listing.photos[0]} alt={listing.name} className='w-10 h-10 rounded object-cover' />
                    ) : (
                      <div className='w-10 h-10 rounded bg-muted flex items-center justify-center text-lg'>🐾</div>
                    )}
                    <div>
                      <div className='font-medium'>{listing.name}</div>
                      <div className='text-xs text-muted-foreground'>
                        {listing.breed} &middot; {listing.gender === 'male' ? 'Male' : 'Female'}
                        {listing.price > 0 && ` · $${listing.price.toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {listing.featured && <Badge variant='secondary'>Featured</Badge>}
                    <Badge variant={listing.available ? 'default' : 'outline'}>
                      {listing.reserved ? 'Reserved' : listing.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>No puppies are currently shown on your website.</p>
          )}
          <div className='mt-4'>
            <Link to='/litters'>
              <Button variant='outline' size='sm'>
                <ShoppingBag className='mr-2 h-4 w-4' />
                Manage from Litters
              </Button>
            </Link>
          </div>
        </CollapsibleFormSection>

        {/* Why Choose Us */}
        <CollapsibleFormSection
          title="Why Choose Us"
          description="Edit the value propositions shown on your homepage"
          defaultOpen={false}
          collapsedIndicator={whyChooseUsTitle || 'Why Choose Us'}
        >
          <div className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='why-choose-us-title'>Section Heading</Label>
              <Input
                id='why-choose-us-title'
                value={whyChooseUsTitle}
                onChange={(e) => setWhyChooseUsTitle(e.target.value)}
                placeholder='Why Choose Us'
              />
              <p className='text-xs text-muted-foreground'>Leave blank to use the default "Why Choose Us"</p>
            </div>

            {whyChooseUsCards.map((card, index) => (
              <div key={index} className='border rounded-lg p-4 space-y-3'>
                <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Card {index + 1}</p>
                <div className='space-y-2'>
                  <Label htmlFor={`card-title-${index}`}>Title</Label>
                  <Input
                    id={`card-title-${index}`}
                    value={card.title}
                    onChange={(e) => updateCard(index, 'title', e.target.value)}
                    placeholder={defaultCards[index]?.title || 'Card title'}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`card-desc-${index}`}>Description</Label>
                  <Textarea
                    id={`card-desc-${index}`}
                    value={card.description}
                    onChange={(e) => updateCard(index, 'description', e.target.value)}
                    placeholder={defaultCards[index]?.description || 'Card description'}
                    rows={2}
                  />
                </div>
              </div>
            ))}

            <div className='flex justify-end'>
              <Button onClick={handleSaveWhyChooseUs} disabled={saving === 'whyChooseUs'} size='sm'>
                {saving === 'whyChooseUs' ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Save className='h-4 w-4 mr-2' />}
                Save
              </Button>
            </div>
          </div>
        </CollapsibleFormSection>

        {/* Contact Information */}
        <CollapsibleFormSection
          title="Contact Information"
          description="Your contact details shown on the public website"
          defaultOpen={false}
          collapsedIndicator={contactInfo.email || 'Not set'}
        >
          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='contact-email' className='flex items-center gap-1.5'>
                  <Mail className='h-3.5 w-3.5' /> Email
                </Label>
                <Input
                  id='contact-email'
                  type='email'
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder='hello@yourkennel.com'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='contact-phone' className='flex items-center gap-1.5'>
                  <Phone className='h-3.5 w-3.5' /> Phone
                </Label>
                <Input
                  id='contact-phone'
                  type='tel'
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  placeholder='(555) 123-4567'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='space-y-2 col-span-2 md:col-span-1'>
                <Label htmlFor='contact-city' className='flex items-center gap-1.5'>
                  <MapPin className='h-3.5 w-3.5' /> City
                </Label>
                <Input
                  id='contact-city'
                  value={contactInfo.city}
                  onChange={(e) => setContactInfo({ ...contactInfo, city: e.target.value })}
                  placeholder='City'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='contact-state'>State</Label>
                <Input
                  id='contact-state'
                  value={contactInfo.state}
                  onChange={(e) => setContactInfo({ ...contactInfo, state: e.target.value })}
                  placeholder='State'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='contact-zip'>Zip Code</Label>
                <Input
                  id='contact-zip'
                  value={contactInfo.zipCode}
                  onChange={(e) => setContactInfo({ ...contactInfo, zipCode: e.target.value })}
                  placeholder='12345'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='contact-country'>Country</Label>
                <Input
                  id='contact-country'
                  value={contactInfo.country}
                  onChange={(e) => setContactInfo({ ...contactInfo, country: e.target.value })}
                  placeholder='US'
                />
              </div>
            </div>

            <div className='flex justify-end'>
              <Button onClick={handleSaveContactInfo} disabled={saving === 'contact'} size='sm'>
                {saving === 'contact' ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Save className='h-4 w-4 mr-2' />}
                Save Contact Info
              </Button>
            </div>
          </div>
        </CollapsibleFormSection>

        {/* Blog */}
        <CollapsibleFormSection
          title="Blog"
          description="Share news, tips, and updates on your website"
          defaultOpen={false}
          collapsedIndicator={websiteSettings?.enableBlog ? 'Enabled' : 'Disabled'}
        >
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label htmlFor='enable-blog'>Enable Blog</Label>
                <p className='text-xs text-muted-foreground'>Show the blog page and nav link on your public website</p>
              </div>
              <Switch
                id='enable-blog'
                checked={websiteSettings?.enableBlog ?? false}
                onCheckedChange={async (checked) => {
                  if (!currentUser) return;
                  await updateWebsiteSettings(currentUser.uid, { enableBlog: checked });
                  toast({ title: checked ? 'Blog enabled' : 'Blog disabled' });
                }}
              />
            </div>
            <div className='pt-2 border-t'>
              <Link to='/blog'>
                <Button variant='outline' size='sm'>
                  <FileText className='mr-2 h-4 w-4' />
                  Manage Blog Posts
                </Button>
              </Link>
            </div>
          </div>
        </CollapsibleFormSection>
        {/* Favorite Things */}
        <CollapsibleFormSection
          title="Favorite Things"
          description="Share recommended products and supplies on your website"
          defaultOpen={false}
          collapsedIndicator={websiteSettings?.enableFavoriteThings ? 'Enabled' : 'Disabled'}
        >
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label htmlFor='enable-favorite-things'>Enable Favorite Things</Label>
                <p className='text-xs text-muted-foreground'>Show a favorites page with product recommendations on your public website</p>
              </div>
              <Switch
                id='enable-favorite-things'
                checked={websiteSettings?.enableFavoriteThings ?? false}
                onCheckedChange={async (checked) => {
                  if (!currentUser) return;
                  await updateWebsiteSettings(currentUser.uid, { enableFavoriteThings: checked });
                  toast({ title: checked ? 'Favorite Things enabled' : 'Favorite Things disabled' });
                }}
              />
            </div>
            <div className='pt-2 border-t'>
              <Link to='/favorite-things'>
                <Button variant='outline' size='sm'>
                  <Heart className='mr-2 h-4 w-4' />
                  Manage Favorite Things
                </Button>
              </Link>
            </div>
          </div>
        </CollapsibleFormSection>
      </FormSectionGroup>
    </div>
  );
}
