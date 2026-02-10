import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';
import { useWebsiteStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { WebsiteTheme } from '@breeder/types';
import { ImageUploadCropper } from '@/components/ImageUploadCropper';
import { CollapsibleFormSection } from '@/components/ui/collapsible-form-section';
import { useToast } from '@/hooks/use-toast';

const FONT_FAMILIES = [
  { value: 'sans', label: 'Sans-Serif - Modern & Clean' },
  { value: 'serif', label: 'Serif - Classic & Elegant' },
  { value: 'mono', label: 'Monospace - Technical & Code' },
  { value: 'display', label: 'Display - Bold & Decorative' },
  { value: 'elegant', label: 'Elegant - Refined & Professional' },
  { value: 'playful', label: 'Playful - Fun & Friendly' },
  { value: 'handwritten', label: 'Handwritten - Personal & Warm' },
  { value: 'modern', label: 'Modern - Sleek & Contemporary' },
  { value: 'classic', label: 'Classic - Timeless & Traditional' },
  { value: 'luxury', label: 'Luxury - Premium & Sophisticated' },
];

const HEADER_STYLES = [
  { value: 'minimal', label: 'Minimal', description: 'Simple logo and nav in a single line' },
  { value: 'full', label: 'Full Header', description: 'Logo left, navigation right with color background' },
  { value: 'banner', label: 'Banner', description: 'Large centered logo with tagline' },
  { value: 'centered', label: 'Centered', description: 'Centered logo above centered navigation' },
  { value: 'split', label: 'Split', description: 'Logo left with split navigation' },
  { value: 'overlay', label: 'Overlay', description: 'Transparent header over hero image' },
];

export function WebsiteCustomizer() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const {
    websiteSettings,
    subscribeToWebsiteSettings,
    updateTheme,
    updateWebsiteSettings,
  } = useWebsiteStore();
  const [theme, setTheme] = useState<WebsiteTheme | null>(null);
  const [branding, setBranding] = useState({
    businessName: '',
    logoUrl: '',
    logoUrlDark: '',
    mainImageUrl: '',
    heroOverlayOpacity: 85,
  });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      subscribeToWebsiteSettings(currentUser.uid);
    }
  }, [currentUser, subscribeToWebsiteSettings]);

  useEffect(() => {
    if (websiteSettings?.theme) {
      setTheme(websiteSettings.theme);
    }
    if (websiteSettings) {
      setBranding({
        businessName: websiteSettings.businessName || '',
        logoUrl: websiteSettings.logoUrl || '',
        logoUrlDark: websiteSettings.logoUrlDark || '',
        mainImageUrl: websiteSettings.mainImageUrl || '',
        heroOverlayOpacity: websiteSettings.heroOverlayOpacity ?? 85,
      });
    }
  }, [websiteSettings]);

  const handleThemeChange = (key: keyof WebsiteTheme, value: string) => {
    setTheme((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleSaveBranding = async () => {
    if (!currentUser) return;
    setSaving('branding');
    try {
      await updateWebsiteSettings(currentUser.uid, {
        businessName: branding.businessName,
        logoUrl: branding.logoUrl,
        logoUrlDark: branding.logoUrlDark,
        mainImageUrl: branding.mainImageUrl,
        heroOverlayOpacity: branding.heroOverlayOpacity,
      });
      toast({ title: 'Saved', description: 'Branding updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save branding', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveTheme = async () => {
    if (!theme || !currentUser) return;
    setSaving('theme');
    try {
      await updateTheme(currentUser.uid, theme);
      toast({ title: 'Saved', description: 'Theme updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save theme', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  if (!theme) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  const fontFamilyStyle = (ff: string) => {
    const map: Record<string, string> = {
      sans: 'system-ui, -apple-system, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Courier, monospace',
      display: 'Georgia, serif',
      elegant: 'Garamond, serif',
      playful: 'Comic Sans MS, cursive',
      handwritten: 'Brush Script MT, cursive',
      modern: 'Inter, Helvetica Neue, sans-serif',
      classic: 'Times New Roman, serif',
      luxury: 'Didot, Bodoni MT, serif',
    };
    return map[ff] || 'system-ui, sans-serif';
  };

  return (
    <div className='space-y-3'>
      {/* Branding */}
      <CollapsibleFormSection
        title='Branding'
        description='Business name, logos, and hero image'
        defaultOpen={false}
        collapsedIndicator={branding.businessName || 'Not set'}
      >
        <div className='space-y-5'>
          <div className='space-y-2'>
            <Label htmlFor='businessName'>Business/Kennel Name</Label>
            <Input
              id='businessName'
              value={branding.businessName}
              onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
              placeholder='e.g., Expert Breeder Kennels'
            />
            <p className='text-xs text-muted-foreground'>
              Displayed in the header navigation bar
            </p>
          </div>

          <div className='space-y-4'>
            <div>
              <h4 className='font-medium text-sm mb-1'>Logo Variants</h4>
              <p className='text-xs text-muted-foreground mb-3'>
                Upload logos for light and dark backgrounds
              </p>
            </div>

            <div className='border rounded-lg p-4 bg-blue-50'>
              <h4 className='font-medium mb-2 text-sm flex items-center gap-2'>
                <div className='w-4 h-4 rounded bg-white border'></div>
                Light Logo
              </h4>
              <ImageUploadCropper
                title='Light Logo'
                description='Logo for light backgrounds'
                aspectRatio={1.5}
                imageType='logo'
                onImageSave={(imageUrl) => {
                  if (typeof imageUrl === 'string') setBranding({ ...branding, logoUrl: imageUrl });
                }}
              />
              {branding.logoUrl && (
                <div className='mt-3'>
                  <img src={branding.logoUrl} alt='Light logo' className='h-12 w-auto object-contain border rounded bg-white p-2' />
                </div>
              )}
            </div>

            <div className='border rounded-lg p-4 bg-slate-900'>
              <h4 className='font-medium mb-2 text-sm flex items-center gap-2 text-white'>
                <div className='w-4 h-4 rounded bg-slate-700 border'></div>
                Dark Logo
              </h4>
              <ImageUploadCropper
                title='Dark Logo'
                description='Logo for dark backgrounds'
                aspectRatio={1.5}
                imageType='logo'
                onImageSave={(imageUrl) => {
                  if (typeof imageUrl === 'string') setBranding({ ...branding, logoUrlDark: imageUrl });
                }}
              />
              {branding.logoUrlDark && (
                <div className='mt-3'>
                  <img src={branding.logoUrlDark} alt='Dark logo' className='h-12 w-auto object-contain border rounded bg-slate-800 p-2' />
                </div>
              )}
            </div>
          </div>

          <div>
            <ImageUploadCropper
              title='Main Hero Image'
              description='Homepage hero image (recommended: landscape, 1920x600px)'
              aspectRatio={16 / 6}
              imageType='hero'
              onImageSave={(imageUrl) => {
                if (typeof imageUrl === 'string') setBranding({ ...branding, mainImageUrl: imageUrl });
              }}
            />
            {branding.mainImageUrl && (
              <div className='mt-3 space-y-3'>
                {/* Live hero preview with overlay */}
                <div className='relative rounded overflow-hidden border' style={{ height: '140px' }}>
                  <img src={branding.mainImageUrl} alt='Hero' className='w-full h-full object-cover' />
                  <div
                    className='absolute inset-0'
                    style={{
                      backgroundColor: theme?.primaryColor || '#000',
                      opacity: (branding.heroOverlayOpacity ?? 85) / 100,
                    }}
                  />
                  <div className='absolute inset-0 flex flex-col items-center justify-center text-white'>
                    <span className='text-sm font-bold drop-shadow-sm' style={{ fontFamily: theme?.fontFamily ? undefined : undefined }}>
                      {branding.businessName || 'Your Kennel Name'}
                    </span>
                    <span className='text-[10px] opacity-80 mt-0.5'>Your tagline here</span>
                  </div>
                </div>
                <div>
                  <label className='text-xs font-medium text-muted-foreground mb-1 block'>
                    Overlay Opacity: {branding.heroOverlayOpacity}%
                  </label>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    step='5'
                    value={branding.heroOverlayOpacity}
                    onChange={(e) => setBranding({ ...branding, heroOverlayOpacity: parseInt(e.target.value) })}
                    className='w-full'
                  />
                  <div className='flex justify-between text-[10px] text-muted-foreground'>
                    <span>Image visible</span>
                    <span>More color overlay</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className='flex justify-end'>
            <Button onClick={handleSaveBranding} disabled={saving === 'branding'} size='sm'>
              {saving === 'branding' ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Save className='h-4 w-4 mr-2' />}
              Save Branding
            </Button>
          </div>
        </div>
      </CollapsibleFormSection>

      {/* Colors */}
      <CollapsibleFormSection
        title='Colors'
        description='Primary, secondary, and accent colors'
        defaultOpen={false}
        collapsedIndicator={
          <div className='flex gap-1'>
            <div className='w-4 h-4 rounded-full border border-stone-200' style={{ backgroundColor: theme.primaryColor }} />
            <div className='w-4 h-4 rounded-full border border-stone-200' style={{ backgroundColor: theme.secondaryColor }} />
            <div className='w-4 h-4 rounded-full border border-stone-200' style={{ backgroundColor: theme.accentColor }} />
          </div>
        }
      >
        <div className='space-y-5'>
          {/* Live Preview */}
          <div className='border rounded-xl overflow-hidden'>
            <div className='text-xs text-muted-foreground px-3 py-1.5 bg-muted/50 border-b'>
              Live Preview
            </div>
            <div>
              <div className='h-7 flex items-center px-3 gap-2 text-white' style={{ backgroundColor: theme.primaryColor }}>
                <span className='text-[9px] font-bold'>{branding.businessName || 'Your Kennel'}</span>
                <div className='flex-1' />
                <div className='flex gap-2'>
                  <span className='text-[8px] opacity-75'>Home</span>
                  <span className='text-[8px] opacity-75'>About</span>
                  <span className='text-[8px] opacity-75'>Puppies</span>
                </div>
              </div>
              <div className='h-12 flex items-center justify-center gap-3' style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
                <span className='text-white text-xs font-bold'>Welcome to Our Kennel</span>
                <span className='text-white text-[8px] px-2 py-0.5 rounded-full' style={{ backgroundColor: theme.accentColor }}>View Puppies</span>
              </div>
              <div className='h-8 bg-stone-50 px-3 py-2 flex items-center gap-3'>
                <div className='space-y-1 flex-1'>
                  <div className='h-1.5 rounded-full w-2/3' style={{ backgroundColor: theme.primaryColor + '25' }} />
                  <div className='h-1.5 rounded-full w-1/3' style={{ backgroundColor: theme.secondaryColor + '20' }} />
                </div>
                <div className='w-5 h-5 rounded' style={{ backgroundColor: theme.accentColor + '20' }} />
              </div>
              <div className='h-4 flex items-center justify-center' style={{ backgroundColor: theme.primaryColor }}>
                <span className='text-white text-[6px] opacity-60'>© Your Kennel</span>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2 border rounded-lg p-3'>
              <Label className='text-xs font-semibold'>Primary Color</Label>
              <p className='text-[11px] text-muted-foreground'>Headers, footer, nav, headings</p>
              <div className='flex items-center gap-2'>
                <input type='color' value={theme.primaryColor} onChange={(e) => handleThemeChange('primaryColor', e.target.value)} className='h-9 w-12 rounded cursor-pointer' />
                <Input type='text' value={theme.primaryColor} onChange={(e) => handleThemeChange('primaryColor', e.target.value)} className='flex-1 h-9 text-xs' />
              </div>
            </div>
            <div className='space-y-2 border rounded-lg p-3'>
              <Label className='text-xs font-semibold'>Secondary Color</Label>
              <p className='text-[11px] text-muted-foreground'>Hero gradients, placeholders</p>
              <div className='flex items-center gap-2'>
                <input type='color' value={theme.secondaryColor} onChange={(e) => handleThemeChange('secondaryColor', e.target.value)} className='h-9 w-12 rounded cursor-pointer' />
                <Input type='text' value={theme.secondaryColor} onChange={(e) => handleThemeChange('secondaryColor', e.target.value)} className='flex-1 h-9 text-xs' />
              </div>
            </div>
            <div className='space-y-2 border rounded-lg p-3'>
              <Label className='text-xs font-semibold'>Accent Color</Label>
              <p className='text-[11px] text-muted-foreground'>Buttons, links, prices, CTAs</p>
              <div className='flex items-center gap-2'>
                <input type='color' value={theme.accentColor} onChange={(e) => handleThemeChange('accentColor', e.target.value)} className='h-9 w-12 rounded cursor-pointer' />
                <Input type='text' value={theme.accentColor} onChange={(e) => handleThemeChange('accentColor', e.target.value)} className='flex-1 h-9 text-xs' />
              </div>
            </div>
          </div>

          <div className='flex justify-end'>
            <Button onClick={handleSaveTheme} disabled={saving === 'theme'} size='sm'>
              {saving === 'theme' ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Save className='h-4 w-4 mr-2' />}
              Save Colors
            </Button>
          </div>
        </div>
      </CollapsibleFormSection>

      {/* Typography */}
      <CollapsibleFormSection
        title='Typography'
        description='Font family for your website'
        defaultOpen={false}
        collapsedIndicator={FONT_FAMILIES.find((f) => f.value === theme.fontFamily)?.label?.split(' - ')[0] || 'Sans-Serif'}
      >
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='font-family'>Font Family</Label>
            <Select
              value={theme.fontFamily}
              onValueChange={(value) => handleThemeChange('fontFamily', value)}
            >
              <SelectTrigger id='font-family'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='border rounded-lg p-5 space-y-2' style={{ fontFamily: fontFamilyStyle(theme.fontFamily) }}>
            <h3 className='text-2xl font-bold'>Heading Preview</h3>
            <p className='text-gray-600 text-base'>This is how your body text will look.</p>
            <p className='text-sm text-gray-400'>
              {FONT_FAMILIES.find((f) => f.value === theme.fontFamily)?.label}
            </p>
          </div>

          <div className='flex justify-end'>
            <Button onClick={handleSaveTheme} disabled={saving === 'theme'} size='sm'>
              {saving === 'theme' ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Save className='h-4 w-4 mr-2' />}
              Save Typography
            </Button>
          </div>
        </div>
      </CollapsibleFormSection>

      {/* Header Layout */}
      <CollapsibleFormSection
        title='Header Layout'
        description='Navigation style for your website'
        defaultOpen={false}
        collapsedIndicator={HEADER_STYLES.find((s) => s.value === theme.headerStyle)?.label || 'Full'}
      >
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='header-style'>Header Style</Label>
            <Select
              value={theme.headerStyle}
              onValueChange={(value) => handleThemeChange('headerStyle', value)}
            >
              <SelectTrigger id='header-style'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEADER_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <div>
                      <div className='font-medium'>{style.label}</div>
                      <div className='text-xs text-muted-foreground'>{style.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Header Preview */}
          <div className='space-y-2'>
            <p className='text-xs font-medium text-muted-foreground'>Preview</p>

            {(() => {
              const blogEnabled = websiteSettings?.enableBlog;
              const favoritesEnabled = websiteSettings?.enableFavoriteThings;
              let navItems = ['Home', 'About', 'Puppies'];
              if (blogEnabled) navItems.push('Blog');
              if (favoritesEnabled) navItems.push('Favorites');
              navItems.push('Contact');
              const bizName = branding.businessName || 'Your Business';

              return (
                <>
                  {theme.headerStyle === 'minimal' && (
                    <div className='border rounded-lg overflow-hidden bg-white'>
                      <div className='p-3 flex items-center justify-between border-b' style={{ borderColor: theme.primaryColor }}>
                        <span className='text-sm font-bold' style={{ color: theme.primaryColor }}>{bizName}</span>
                        <div className='flex gap-3 text-xs' style={{ color: theme.primaryColor }}>
                          {navItems.map((item) => <span key={item}>{item}</span>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {theme.headerStyle === 'full' && (
                    <div className='border rounded-lg overflow-hidden'>
                      <div className='p-3' style={{ backgroundColor: theme.primaryColor }}>
                        <div className='flex items-center justify-between text-white'>
                          <span className='text-sm font-bold'>{bizName}</span>
                          <div className='flex gap-3 text-xs'>
                            {navItems.map((item) => <span key={item}>{item}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {theme.headerStyle === 'banner' && (
                    <div className='border rounded-lg overflow-hidden'>
                      <div className='p-5 text-center text-white' style={{ backgroundColor: theme.primaryColor }}>
                        <h3 className='text-lg font-bold mb-1'>{bizName}</h3>
                        <p className='text-xs opacity-90'>Your tagline here</p>
                        <div className='flex justify-center gap-3 text-xs mt-3 pt-3 border-t border-white/20'>
                          {navItems.map((item) => <span key={item}>{item}</span>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {theme.headerStyle === 'centered' && (
                    <div className='border rounded-lg overflow-hidden bg-white'>
                      <div className='p-4 text-center'>
                        <div className='text-sm font-bold mb-3' style={{ color: theme.primaryColor }}>{bizName}</div>
                        <div className='flex justify-center gap-4 text-xs' style={{ color: theme.primaryColor }}>
                          {navItems.map((item) => <span key={item}>{item}</span>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {theme.headerStyle === 'split' && (
                    <div className='border rounded-lg overflow-hidden bg-white'>
                      <div className='p-3 flex items-center justify-between'>
                        <span className='text-sm font-bold' style={{ color: theme.primaryColor }}>{bizName}</span>
                        <div className='flex gap-3 text-xs items-center' style={{ color: theme.primaryColor }}>
                          {navItems.slice(0, Math.ceil(navItems.length / 2)).map((item) => <span key={item}>{item}</span>)}
                          <span className='text-gray-300'>|</span>
                          {navItems.slice(Math.ceil(navItems.length / 2)).map((item) => <span key={item}>{item}</span>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {theme.headerStyle === 'overlay' && (
                    <div className='border rounded-lg overflow-hidden relative'>
                      <div className='h-20 bg-gradient-to-r from-blue-400 to-purple-400'></div>
                      <div className='absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/50 to-transparent'>
                        <div className='flex items-center justify-between text-white'>
                          <span className='text-sm font-bold drop-shadow'>{bizName}</span>
                          <div className='flex gap-3 text-xs drop-shadow'>
                            {navItems.map((item) => <span key={item}>{item}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className='flex justify-end'>
            <Button onClick={handleSaveTheme} disabled={saving === 'theme'} size='sm'>
              {saving === 'theme' ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Save className='h-4 w-4 mr-2' />}
              Save Layout
            </Button>
          </div>
        </div>
      </CollapsibleFormSection>
    </div>
  );
}
