import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteStore } from '@breeder/firebase';
import { SeoSettings } from '@breeder/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Share2,
  Image,
  Save,
  Loader2,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SeoSettingsFormProps {
  disabled?: boolean;
}

export function SeoSettingsForm({ disabled = false }: SeoSettingsFormProps) {
  const { currentUser } = useAuth();
  const { websiteSettings, updateSeoSettings } = useWebsiteStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<SeoSettings>>({
    metaTitle: '',
    metaTitleTemplate: '{{pageTitle}} | {{kennelName}}',
    metaDescription: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterHandle: '',
    noIndex: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load existing SEO settings
  useEffect(() => {
    if (websiteSettings?.seo) {
      setFormData({
        metaTitle: websiteSettings.seo.metaTitle || '',
        metaTitleTemplate: websiteSettings.seo.metaTitleTemplate || '{{pageTitle}} | {{kennelName}}',
        metaDescription: websiteSettings.seo.metaDescription || '',
        ogTitle: websiteSettings.seo.ogTitle || '',
        ogDescription: websiteSettings.seo.ogDescription || '',
        ogImage: websiteSettings.seo.ogImage || '',
        twitterHandle: websiteSettings.seo.twitterHandle || '',
        noIndex: websiteSettings.seo.noIndex || false,
      });
    }
  }, [websiteSettings?.seo]);

  const handleSave = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      await updateSeoSettings(currentUser.uid, formData);
      toast({
        title: 'SEO Settings Saved',
        description: 'Your SEO settings have been updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save SEO settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const kennelName = websiteSettings?.kennelName || websiteSettings?.businessName || 'Your Kennel';

  // Preview helpers
  const getPreviewTitle = () => {
    const title = formData.metaTitle || 'Home';
    if (formData.metaTitleTemplate) {
      return formData.metaTitleTemplate
        .replace('{{pageTitle}}', title)
        .replace('{{kennelName}}', kennelName);
    }
    return title;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">
            <Search className="h-4 w-4 mr-2" />
            Basic SEO
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Info className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Basic SEO Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Default Page Title</Label>
            <Input
              id="metaTitle"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              placeholder="Home"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Used when a page doesn't have its own title
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaTitleTemplate">Title Template</Label>
            <Input
              id="metaTitleTemplate"
              value={formData.metaTitleTemplate}
              onChange={(e) => setFormData({ ...formData, metaTitleTemplate: e.target.value })}
              placeholder="{{pageTitle}} | {{kennelName}}"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Use {'{{pageTitle}}'} and {'{{kennelName}}'} as placeholders
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              placeholder="Describe your kennel in 150-160 characters for best results in search engines"
              rows={3}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              {formData.metaDescription?.length || 0}/160 characters
            </p>
          </div>

          {/* Google Search Preview */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Google Search Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-sans">
                <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                  {getPreviewTitle() || 'Page Title'}
                </p>
                <p className="text-green-700 text-sm truncate">
                  {websiteSettings?.domain?.subdomain
                    ? `${websiteSettings.domain.subdomain}.expertbreeder.com`
                    : 'yourkennel.expertbreeder.com'}
                </p>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {formData.metaDescription || 'Add a meta description to see how it appears in search results.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Sharing Tab */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="ogTitle">Social Share Title</Label>
            <Input
              id="ogTitle"
              value={formData.ogTitle}
              onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
              placeholder={kennelName}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Title when shared on Facebook, Twitter, etc. Leave empty to use page title.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogDescription">Social Share Description</Label>
            <Textarea
              id="ogDescription"
              value={formData.ogDescription}
              onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
              placeholder="A compelling description for social media shares"
              rows={2}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogImage">Social Share Image URL</Label>
            <Input
              id="ogImage"
              value={formData.ogImage}
              onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Recommended size: 1200x630 pixels
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterHandle">Twitter Handle</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="twitterHandle"
                value={formData.twitterHandle?.replace('@', '')}
                onChange={(e) =>
                  setFormData({ ...formData, twitterHandle: e.target.value.replace('@', '') })
                }
                placeholder="yourkennel"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Social Preview */}
          {formData.ogImage && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Social Share Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <img
                    src={formData.ogImage}
                    alt="Social preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="p-3">
                    <p className="font-medium truncate">
                      {formData.ogTitle || kennelName}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {formData.ogDescription || formData.metaDescription || 'Your kennel description'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                {formData.noIndex ? (
                  <EyeOff className="h-4 w-4 text-amber-500" />
                ) : (
                  <Eye className="h-4 w-4 text-green-500" />
                )}
                Search Engine Visibility
              </CardTitle>
              <CardDescription>
                Control whether search engines can index your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Hide from Search Engines</p>
                  <p className="text-sm text-muted-foreground">
                    When enabled, search engines will not index your website
                  </p>
                </div>
                <Switch
                  checked={formData.noIndex}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, noIndex: checked })
                  }
                  disabled={disabled}
                />
              </div>
            </CardContent>
          </Card>

          {formData.noIndex && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> Your website will not appear in Google, Bing, or other search engines.
                This is useful while building your site, but you'll want to disable this when you're ready to go live.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || disabled}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save SEO Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
