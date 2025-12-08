import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Save } from 'lucide-react';
import { useWebsiteStore } from '@/store/websiteStore';
import { useAuth } from '@/contexts/AuthContext';
import { WebsiteTheme } from '@/types/website';
import { ImageUploadCropper } from '@/components/ImageUploadCropper';

const FONT_FAMILIES = [
  { value: 'sans', label: 'Sans-Serif - Modern & Clean', preview: 'font-sans' },
  { value: 'serif', label: 'Serif - Classic & Elegant', preview: 'font-serif' },
  {
    value: 'mono',
    label: 'Monospace - Technical & Code',
    preview: 'font-mono',
  },
  {
    value: 'display',
    label: 'Display - Bold & Decorative',
    preview: 'font-bold text-2xl',
  },
  {
    value: 'elegant',
    label: 'Elegant - Refined & Professional',
    preview: 'font-light tracking-wide',
  },
  {
    value: 'playful',
    label: 'Playful - Fun & Friendly',
    preview: 'font-semibold',
  },
  {
    value: 'handwritten',
    label: 'Handwritten - Personal & Warm',
    preview: 'font-cursive',
  },
  {
    value: 'modern',
    label: 'Modern - Sleek & Contemporary',
    preview: 'font-sans font-light',
  },
  {
    value: 'classic',
    label: 'Classic - Timeless & Traditional',
    preview: 'font-serif tracking-tight',
  },
  {
    value: 'luxury',
    label: 'Luxury - Premium & Sophisticated',
    preview: 'font-serif font-light tracking-widest',
  },
];

const HEADER_STYLES = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Simple logo and nav in a single line',
    icon: '━━━',
  },
  {
    value: 'full',
    label: 'Full Header',
    description: 'Logo left, navigation right with color background',
    icon: '▭━━',
  },
  {
    value: 'banner',
    label: 'Banner',
    description: 'Large centered logo with tagline',
    icon: '▭\n━',
  },
  {
    value: 'centered',
    label: 'Centered',
    description: 'Centered logo above centered navigation',
    icon: '▭\n━',
  },
  {
    value: 'split',
    label: 'Split',
    description: 'Logo left with split navigation',
    icon: '▭◂━▸',
  },
  {
    value: 'overlay',
    label: 'Overlay',
    description: 'Transparent header over hero image',
    icon: '◻━━',
  },
];

export function WebsiteCustomizer() {
  const { currentUser } = useAuth();
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
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');

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
      });
    }
  }, [websiteSettings]);

  const handleThemeChange = (key: keyof WebsiteTheme, value: string) => {
    setTheme((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleSaveBranding = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateWebsiteSettings(currentUser.uid, {
        businessName: branding.businessName,
        logoUrl: branding.logoUrl,
        logoUrlDark: branding.logoUrlDark,
        mainImageUrl: branding.mainImageUrl,
      });
      alert('Branding saved successfully!');
    } catch (error) {
      console.error('Error saving branding:', error);
      alert('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!theme || !currentUser) return;
    setSaving(true);
    try {
      await updateTheme(currentUser.uid, theme);
      alert('Theme saved successfully!');
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  if (!theme) {
    return <div>Loading theme...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Palette className='h-5 w-5' />
          Website Theme & Customization
        </CardTitle>
        <CardDescription>
          Customize your breeder website appearance
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='branding'>Branding</TabsTrigger>
            <TabsTrigger value='colors'>Colors</TabsTrigger>
            <TabsTrigger value='typography'>Typography</TabsTrigger>
            <TabsTrigger value='layout'>Layout</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value='branding' className='space-y-6'>
            {/* Business Name */}
            <div className='space-y-2'>
              <Label htmlFor='businessName'>Business/Kennel Name</Label>
              <Input
                id='businessName'
                value={branding.businessName}
                onChange={(e) =>
                  setBranding({ ...branding, businessName: e.target.value })
                }
                placeholder='e.g., Expert Breeder Kennels'
              />
              <p className='text-xs text-muted-foreground'>
                Displayed in the top navigation bar
              </p>
            </div>

            {/* Logo Upload - Light and Dark Versions */}
            <div className='space-y-4'>
              <div>
                <h3 className='font-semibold mb-2 flex items-center gap-2'>
                  Logo Variants
                  <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded'>
                    Light & Dark
                  </span>
                </h3>
                <p className='text-sm text-muted-foreground mb-3'>
                  Upload different logo versions for light and dark backgrounds
                </p>
              </div>

              {/* Light Logo */}
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
                    if (typeof imageUrl === 'string') {
                      setBranding({ ...branding, logoUrl: imageUrl });
                    }
                  }}
                />
                {branding.logoUrl && (
                  <div className='mt-3'>
                    <p className='text-xs font-medium text-muted-foreground mb-2'>
                      Preview:
                    </p>
                    <img
                      src={branding.logoUrl}
                      alt='Light logo preview'
                      className='h-16 w-auto object-contain border rounded bg-white p-2'
                    />
                  </div>
                )}
              </div>

              {/* Dark Logo */}
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
                    if (typeof imageUrl === 'string') {
                      setBranding({ ...branding, logoUrlDark: imageUrl });
                    }
                  }}
                />
                {branding.logoUrlDark && (
                  <div className='mt-3'>
                    <p className='text-xs font-medium text-white mb-2'>
                      Preview:
                    </p>
                    <img
                      src={branding.logoUrlDark}
                      alt='Dark logo preview'
                      className='h-16 w-auto object-contain border rounded bg-slate-800 p-2'
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Main Image Upload */}
            <div>
              <ImageUploadCropper
                title='Main Hero Image'
                description='Upload and crop your hero image for the homepage (recommended: landscape, 1920x600px)'
                aspectRatio={16 / 6}
                imageType='hero'
                onImageSave={(imageUrl) => {
                  if (typeof imageUrl === 'string') {
                    setBranding({ ...branding, mainImageUrl: imageUrl });
                  }
                }}
              />
              {branding.mainImageUrl && (
                <div className='mt-3'>
                  <p className='text-xs font-medium text-muted-foreground mb-2'>
                    Preview:
                  </p>
                  <img
                    src={branding.mainImageUrl}
                    alt='Hero image preview'
                    className='w-full h-32 object-cover border rounded'
                  />
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value='colors' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Primary Color */}
              <div className='space-y-2'>
                <Label htmlFor='primary-color'>Primary Color</Label>
                <div className='flex items-center gap-2'>
                  <input
                    id='primary-color'
                    type='color'
                    value={theme.primaryColor}
                    onChange={(e) =>
                      handleThemeChange('primaryColor', e.target.value)
                    }
                    className='h-10 w-14 rounded cursor-pointer'
                  />
                  <Input
                    type='text'
                    value={theme.primaryColor}
                    onChange={(e) =>
                      handleThemeChange('primaryColor', e.target.value)
                    }
                    placeholder='#3b82f6'
                    className='flex-1'
                  />
                </div>
                <div
                  className='h-16 rounded border'
                  style={{ backgroundColor: theme.primaryColor }}
                ></div>
              </div>

              {/* Secondary Color */}
              <div className='space-y-2'>
                <Label htmlFor='secondary-color'>Secondary Color</Label>
                <div className='flex items-center gap-2'>
                  <input
                    id='secondary-color'
                    type='color'
                    value={theme.secondaryColor}
                    onChange={(e) =>
                      handleThemeChange('secondaryColor', e.target.value)
                    }
                    className='h-10 w-14 rounded cursor-pointer'
                  />
                  <Input
                    type='text'
                    value={theme.secondaryColor}
                    onChange={(e) =>
                      handleThemeChange('secondaryColor', e.target.value)
                    }
                    placeholder='#1f2937'
                    className='flex-1'
                  />
                </div>
                <div
                  className='h-16 rounded border'
                  style={{ backgroundColor: theme.secondaryColor }}
                ></div>
              </div>

              {/* Accent Color */}
              <div className='space-y-2'>
                <Label htmlFor='accent-color'>Accent Color</Label>
                <div className='flex items-center gap-2'>
                  <input
                    id='accent-color'
                    type='color'
                    value={theme.accentColor}
                    onChange={(e) =>
                      handleThemeChange('accentColor', e.target.value)
                    }
                    className='h-10 w-14 rounded cursor-pointer'
                  />
                  <Input
                    type='text'
                    value={theme.accentColor}
                    onChange={(e) =>
                      handleThemeChange('accentColor', e.target.value)
                    }
                    placeholder='#fbbf24'
                    className='flex-1'
                  />
                </div>
                <div
                  className='h-16 rounded border'
                  style={{ backgroundColor: theme.accentColor }}
                ></div>
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value='typography' className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='font-family'>Font Family</Label>
              <Select
                value={theme.fontFamily}
                onValueChange={(value) =>
                  handleThemeChange(
                    'fontFamily',
                    value as
                      | 'sans'
                      | 'serif'
                      | 'mono'
                      | 'display'
                      | 'elegant'
                      | 'playful'
                  )
                }
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

            {/* Font Preview */}
            <div className='border rounded-lg p-6 space-y-3'>
              <div
                style={{
                  fontFamily:
                    theme.fontFamily === 'sans'
                      ? 'system-ui, -apple-system, sans-serif'
                      : theme.fontFamily === 'serif'
                      ? 'Georgia, serif'
                      : theme.fontFamily === 'mono'
                      ? 'Courier, monospace'
                      : theme.fontFamily === 'display'
                      ? 'Georgia, serif'
                      : theme.fontFamily === 'elegant'
                      ? 'Garamond, serif'
                      : theme.fontFamily === 'playful'
                      ? 'Comic Sans MS, cursive'
                      : theme.fontFamily === 'handwritten'
                      ? 'Brush Script MT, cursive'
                      : theme.fontFamily === 'modern'
                      ? 'Inter, Helvetica Neue, sans-serif'
                      : theme.fontFamily === 'classic'
                      ? 'Times New Roman, serif'
                      : 'Didot, Bodoni MT, serif',
                }}
              >
                <h3 className='text-2xl font-bold'>Heading Preview</h3>
                <p className='text-gray-600 text-base'>
                  This is how your body text will look with the selected font.
                </p>
                <p className='text-sm text-gray-500 mt-2'>
                  {
                    FONT_FAMILIES.find((f) => f.value === theme.fontFamily)
                      ?.label
                  }
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value='layout' className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='header-style'>Header Style</Label>
              <Select
                value={theme.headerStyle}
                onValueChange={(value) =>
                  handleThemeChange(
                    'headerStyle',
                    value as
                      | 'minimal'
                      | 'full'
                      | 'banner'
                      | 'centered'
                      | 'split'
                      | 'overlay'
                  )
                }
              >
                <SelectTrigger id='header-style'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEADER_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div>
                        <div className='font-medium'>{style.label}</div>
                        <div className='text-xs text-muted-foreground'>
                          {style.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visual Header Previews */}
            <div className='space-y-3'>
              <p className='text-sm font-medium'>Header Preview</p>

              {/* Minimal Preview */}
              {theme.headerStyle === 'minimal' && (
                <div className='border rounded-lg overflow-hidden bg-white'>
                  <div
                    className='p-3 flex items-center justify-between border-b'
                    style={{ borderColor: theme.primaryColor }}
                  >
                    <div className='flex items-center gap-2'>
                      {branding.logoUrl && (
                        <img
                          src={branding.logoUrl}
                          alt='Logo'
                          className='h-6 w-auto object-contain'
                        />
                      )}
                      <span
                        className='text-sm font-bold'
                        style={{ color: theme.primaryColor }}
                      >
                        {branding.businessName || 'Your Business'}
                      </span>
                    </div>
                    <div
                      className='flex gap-3 text-xs'
                      style={{ color: theme.primaryColor }}
                    >
                      <span>Home</span>
                      <span>About</span>
                      <span>Contact</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Header Preview */}
              {theme.headerStyle === 'full' && (
                <div className='border rounded-lg overflow-hidden'>
                  <div
                    className='p-3'
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <div className='flex items-center justify-between text-white'>
                      <div className='flex items-center gap-2'>
                        {branding.logoUrl && (
                          <img
                            src={branding.logoUrl}
                            alt='Logo'
                            className='h-6 w-auto object-contain'
                          />
                        )}
                        <span className='text-sm font-bold'>
                          {branding.businessName || 'Your Business'}
                        </span>
                      </div>
                      <div className='flex gap-3 text-xs'>
                        <span>Home</span>
                        <span>About</span>
                        <span>Contact</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Banner Preview */}
              {theme.headerStyle === 'banner' && (
                <div className='border rounded-lg overflow-hidden'>
                  <div
                    className='p-6 text-center text-white'
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {branding.logoUrl && (
                      <img
                        src={branding.logoUrl}
                        alt='Logo'
                        className='h-10 w-auto mx-auto mb-2 object-contain'
                      />
                    )}
                    <h3 className='text-lg font-bold mb-1'>
                      {branding.businessName || 'Your Business'}
                    </h3>
                    <p className='text-xs opacity-90'>Your tagline here</p>
                    <div className='flex justify-center gap-3 text-xs mt-3 pt-3 border-t border-white/20'>
                      <span>Home</span>
                      <span>About</span>
                      <span>Contact</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Centered Preview */}
              {theme.headerStyle === 'centered' && (
                <div className='border rounded-lg overflow-hidden bg-white'>
                  <div className='p-4 text-center'>
                    {branding.logoUrl && (
                      <img
                        src={branding.logoUrl}
                        alt='Logo'
                        className='h-8 w-auto mx-auto mb-2 object-contain'
                      />
                    )}
                    <div
                      className='text-sm font-bold mb-3'
                      style={{ color: theme.primaryColor }}
                    >
                      {branding.businessName || 'Your Business'}
                    </div>
                    <div
                      className='flex justify-center gap-4 text-xs'
                      style={{ color: theme.primaryColor }}
                    >
                      <span>Home</span>
                      <span>About</span>
                      <span>Puppies</span>
                      <span>Contact</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Split Preview */}
              {theme.headerStyle === 'split' && (
                <div className='border rounded-lg overflow-hidden bg-white'>
                  <div className='p-3 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {branding.logoUrl && (
                        <img
                          src={branding.logoUrl}
                          alt='Logo'
                          className='h-6 w-auto object-contain'
                        />
                      )}
                      <span
                        className='text-sm font-bold'
                        style={{ color: theme.primaryColor }}
                      >
                        {branding.businessName || 'Your Business'}
                      </span>
                    </div>
                    <div
                      className='flex gap-3 text-xs items-center'
                      style={{ color: theme.primaryColor }}
                    >
                      <span>Home</span>
                      <span>About</span>
                      <span className='text-gray-300'>|</span>
                      <span>Puppies</span>
                      <span>Contact</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay Preview */}
              {theme.headerStyle === 'overlay' && (
                <div className='border rounded-lg overflow-hidden relative'>
                  <div className='h-24 bg-gradient-to-r from-blue-400 to-purple-400'></div>
                  <div className='absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/50 to-transparent'>
                    <div className='flex items-center justify-between text-white'>
                      <div className='flex items-center gap-2'>
                        {branding.logoUrl && (
                          <img
                            src={branding.logoUrl}
                            alt='Logo'
                            className='h-6 w-auto object-contain drop-shadow'
                          />
                        )}
                        <span className='text-sm font-bold drop-shadow'>
                          {branding.businessName || 'Your Business'}
                        </span>
                      </div>
                      <div className='flex gap-3 text-xs drop-shadow'>
                        <span>Home</span>
                        <span>About</span>
                        <span>Contact</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className='flex justify-end'>
          <Button
            onClick={
              activeTab === 'branding' ? handleSaveBranding : handleSaveTheme
            }
            disabled={saving}
          >
            <Save className='h-4 w-4 mr-2' />
            {saving
              ? 'Saving...'
              : `Save ${activeTab === 'branding' ? 'Branding' : 'Theme'}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
