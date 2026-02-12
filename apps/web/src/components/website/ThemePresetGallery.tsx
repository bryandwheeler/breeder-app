import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteStore, useThemePresetStore, seedThemePresets } from '@breeder/firebase';
import { ThemePreset } from '@breeder/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Check, Palette, Lock, Loader2, Pencil, Plus, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFontFamily } from '@/lib/websiteTheme';

interface ThemePresetGalleryProps {
  canAccessPremium?: boolean;
  onUpgradeClick?: () => void;
}

export function ThemePresetGallery({
  canAccessPremium = false,
  onUpgradeClick,
}: ThemePresetGalleryProps) {
  const { currentUser } = useAuth();
  const { websiteSettings, applyThemePreset, updateTheme } = useWebsiteStore();
  const { presets, loading, subscribeToPresets } = useThemePresetStore();
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const [editingColors, setEditingColors] = useState(false);
  const [customColors, setCustomColors] = useState({
    primaryColor: '#3d3d3d',
    secondaryColor: '#6b7280',
    accentColor: '#c45a6e',
  });
  const [savingColors, setSavingColors] = useState(false);

  // Subscribe to presets and seed if empty
  useEffect(() => {
    const unsubscribe = subscribeToPresets();
    return () => unsubscribe();
  }, [subscribeToPresets]);

  // Seed presets if collection is empty (one-time setup)
  useEffect(() => {
    async function checkAndSeedPresets() {
      if (!loading && presets.length === 0 && !seeding) {
        setSeeding(true);
        try {
          await seedThemePresets();
        } catch (error) {
          console.error('Failed to seed theme presets:', error);
        } finally {
          setSeeding(false);
        }
      }
    }
    checkAndSeedPresets();
  }, [loading, presets.length, seeding]);

  // Sync custom colors with current theme
  useEffect(() => {
    if (websiteSettings?.theme) {
      setCustomColors({
        primaryColor: websiteSettings.theme.primaryColor || '#3d3d3d',
        secondaryColor: websiteSettings.theme.secondaryColor || '#6b7280',
        accentColor: websiteSettings.theme.accentColor || '#c45a6e',
      });
    }
  }, [websiteSettings?.theme]);

  const handleApplyPreset = async (preset: ThemePreset) => {
    if (!currentUser) return;

    if (preset.isPremium && !canAccessPremium) {
      toast({
        title: 'Premium Theme',
        description: 'Upgrade to Pro to access premium themes',
        variant: 'destructive',
      });
      return;
    }

    try {
      await applyThemePreset(currentUser.uid, preset.id, preset.theme);
      toast({
        title: 'Theme Applied',
        description: `${preset.name} theme has been applied to your website`,
      });
      setEditingColors(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply theme',
        variant: 'destructive',
      });
    }
  };

  const handleStartCustom = () => {
    setEditingColors(true);
  };

  const handleEditCurrentColors = () => {
    setEditingColors(true);
  };

  const handleSaveCustomColors = async () => {
    if (!currentUser) return;
    setSavingColors(true);
    try {
      await updateTheme(currentUser.uid, customColors);
      toast({
        title: 'Colors Updated',
        description: 'Your custom colors have been saved',
      });
      setEditingColors(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save colors',
        variant: 'destructive',
      });
    } finally {
      setSavingColors(false);
    }
  };

  const isApplied = (presetId: string) =>
    websiteSettings?.appliedPresetId === presetId;

  if (loading || seeding) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No theme presets available</p>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    professional: 'Professional',
    modern: 'Modern',
    playful: 'Playful',
    elegant: 'Elegant',
  };

  return (
    <div className="space-y-6">
      {/* Color Editor */}
      {editingColors && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Customize Theme Colors</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Edit colors below or pick a preset to start from
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingColors(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Live Preview */}
            <div className="border rounded-xl overflow-hidden bg-white">
              {/* Header */}
              <div
                className="h-7 flex items-center px-3 text-white"
                style={{ backgroundColor: customColors.primaryColor }}
              >
                <div className="w-3 h-3 rounded-full bg-white/25" />
                <span className="text-[8px] font-semibold ml-1.5 opacity-90">Your Kennel</span>
                <div className="flex-1" />
                <div className="flex gap-2.5">
                  <span className="text-[7px] opacity-60">Home</span>
                  <span className="text-[7px] opacity-60">Puppies</span>
                  <span className="text-[7px] opacity-60">About</span>
                  <span className="text-[7px] opacity-60">Contact</span>
                </div>
              </div>

              {/* Hero */}
              <div
                className="h-14 flex flex-col items-center justify-center"
                style={{ backgroundColor: customColors.primaryColor }}
              >
                <span className="text-white text-[10px] font-bold tracking-wide">Welcome to Our Kennel</span>
                <span
                  className="mt-1 text-white text-[7px] px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: customColors.accentColor }}
                >
                  View Available Puppies
                </span>
              </div>

              {/* Puppy Cards */}
              <div className="bg-stone-50 px-2.5 py-2">
                <div className="text-[7px] font-semibold mb-1.5" style={{ color: customColors.primaryColor }}>Available Puppies</div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 bg-white rounded-md overflow-hidden shadow-[0_0_2px_rgba(0,0,0,0.08)]">
                      <div className="h-8" style={{ backgroundColor: customColors.secondaryColor + '18' }} />
                      <div className="p-1">
                        <div className="h-1 w-3/4 rounded-full mb-0.5" style={{ backgroundColor: customColors.primaryColor + '20' }} />
                        <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: customColors.accentColor + '30' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div
                className="h-4 flex items-center justify-center"
                style={{ backgroundColor: customColors.primaryColor }}
              >
                <span className="text-white text-[5px] opacity-40">© 2026 Your Kennel</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Primary Color</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Headers, footer, navigation, headings
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.primaryColor}
                    onChange={(e) => setCustomColors({ ...customColors, primaryColor: e.target.value })}
                    className="h-9 w-12 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColors.primaryColor}
                    onChange={(e) => setCustomColors({ ...customColors, primaryColor: e.target.value })}
                    className="flex-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Secondary Color</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Hero gradients, placeholder backgrounds
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.secondaryColor}
                    onChange={(e) => setCustomColors({ ...customColors, secondaryColor: e.target.value })}
                    className="h-9 w-12 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColors.secondaryColor}
                    onChange={(e) => setCustomColors({ ...customColors, secondaryColor: e.target.value })}
                    className="flex-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Accent Color</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Buttons, links, prices, call-to-actions
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.accentColor}
                    onChange={(e) => setCustomColors({ ...customColors, accentColor: e.target.value })}
                    className="h-9 w-12 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColors.accentColor}
                    onChange={(e) => setCustomColors({ ...customColors, accentColor: e.target.value })}
                    className="flex-1 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingColors(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveCustomColors}
                disabled={savingColors}
              >
                {savingColors ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Colors
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Custom Theme Card */}
        <Card
          className={cn(
            'overflow-hidden transition-all cursor-pointer hover:shadow-md rounded-xl border-dashed border-2',
            !websiteSettings?.appliedPresetId && 'ring-2 ring-primary'
          )}
          onClick={handleStartCustom}
        >
          <div className="relative">
            <div className="h-36 bg-gradient-to-br from-stone-100 to-stone-50 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center">
                <Plus className="h-6 w-6 text-stone-500" />
              </div>
              <span className="text-sm font-medium text-stone-600">Create Custom Theme</span>
              <span className="text-xs text-stone-400">Pick your own colors</span>
            </div>
            {!websiteSettings?.appliedPresetId && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-white text-primary shadow-sm text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium">Custom Colors</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your own primary, secondary, and accent colors
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">Custom</Badge>
            </div>
            {websiteSettings?.theme && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex gap-1">
                  <div
                    className="w-5 h-5 rounded-full border border-stone-200"
                    style={{ backgroundColor: websiteSettings.theme.primaryColor }}
                    title="Primary"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-stone-200"
                    style={{ backgroundColor: websiteSettings.theme.secondaryColor }}
                    title="Secondary"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-stone-200"
                    style={{ backgroundColor: websiteSettings.theme.accentColor }}
                    title="Accent"
                  />
                </div>
                <span className="text-xs text-muted-foreground">Current colors</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preset Cards */}
        {presets.map((preset) => {
          const applied = isApplied(preset.id);
          const locked = preset.isPremium && !canAccessPremium;
          const fontFamily = getFontFamily(preset.theme.fontFamily);

          return (
            <Card
              key={preset.id}
              className={cn(
                'overflow-hidden transition-all cursor-pointer hover:shadow-md rounded-xl',
                applied && 'ring-2 ring-primary',
                locked && 'opacity-75'
              )}
              onClick={() => !locked && handleApplyPreset(preset)}
            >
              {/* Mini Website Preview */}
              <div className="relative">
                {/* Header */}
                <div
                  className="h-7 flex items-center px-3 text-white"
                  style={{ backgroundColor: preset.theme.primaryColor }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
                  <div
                    className="text-[7px] font-semibold ml-1.5 opacity-90"
                    style={{ fontFamily }}
                  >
                    Your Kennel
                  </div>
                  <div className="flex-1" />
                  <div className="flex gap-2">
                    <div className="w-5 h-1 rounded-full bg-white/35" />
                    <div className="w-5 h-1 rounded-full bg-white/35" />
                    <div className="w-5 h-1 rounded-full bg-white/35" />
                    <div className="w-5 h-1 rounded-full bg-white/35" />
                  </div>
                </div>

                {/* Hero */}
                <div
                  className="h-14 flex flex-col items-center justify-center"
                  style={{ backgroundColor: preset.theme.primaryColor }}
                >
                  <div
                    className="text-white text-[10px] font-bold tracking-wide"
                    style={{ fontFamily }}
                  >
                    Welcome to Our Kennel
                  </div>
                  <div
                    className="mt-1 px-2.5 py-0.5 rounded-full text-white text-[6px]"
                    style={{ backgroundColor: preset.theme.accentColor }}
                  >
                    View Available Puppies
                  </div>
                </div>

                {/* Puppy Cards Section */}
                <div className="bg-stone-50 px-2 py-1.5">
                  <div className="text-[6px] font-semibold mb-1" style={{ color: preset.theme.primaryColor }}>Available Puppies</div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-1 bg-white rounded overflow-hidden shadow-[0_0_2px_rgba(0,0,0,0.06)]">
                        <div className="h-7" style={{ backgroundColor: preset.theme.secondaryColor + '18' }} />
                        <div className="px-1 py-0.5">
                          <div className="h-[3px] w-3/4 rounded-full mb-0.5" style={{ backgroundColor: preset.theme.primaryColor + '20' }} />
                          <div className="h-[3px] w-1/2 rounded-full" style={{ backgroundColor: preset.theme.accentColor + '30' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="h-3.5 flex items-center justify-center"
                  style={{ backgroundColor: preset.theme.primaryColor }}
                >
                  <span className="text-white text-[4px] opacity-40">© 2026 Your Kennel</span>
                </div>

                {/* Applied badge */}
                {applied && (
                  <div className="absolute top-8 left-2">
                    <Badge className="bg-white text-primary shadow-sm text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Applied
                    </Badge>
                  </div>
                )}

                {/* Premium badge */}
                {preset.isPremium && (
                  <div className="absolute top-1 right-1">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                      Pro
                    </Badge>
                  </div>
                )}

                {/* Locked overlay */}
                {locked && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{preset.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {preset.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {categoryLabels[preset.category] || preset.category}
                  </Badge>
                </div>

                {/* Color swatches + edit button */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div
                        className="w-5 h-5 rounded-full border border-stone-200"
                        style={{ backgroundColor: preset.theme.primaryColor }}
                        title="Primary"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-stone-200"
                        style={{ backgroundColor: preset.theme.secondaryColor }}
                        title="Secondary"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-stone-200"
                        style={{ backgroundColor: preset.theme.accentColor }}
                        title="Accent"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      <span className="capitalize">{preset.theme.fontFamily}</span>
                      {' · '}
                      <span className="capitalize">{preset.theme.headerStyle}</span>
                    </span>
                  </div>
                  {applied && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCurrentColors();
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                  )}
                </div>

                {locked && onUpgradeClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpgradeClick();
                    }}
                  >
                    <Lock className="h-3 w-3 mr-2" />
                    Upgrade to Pro
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Click a theme to apply it, then use <strong>Edit</strong> to customize the colors.
        You can also create a fully custom theme with your own colors.
      </p>
    </div>
  );
}
