import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteStore, useThemePresetStore, seedThemePresets } from '@breeder/firebase';
import { ThemePreset } from '@breeder/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Palette, Lock, Loader2 } from 'lucide-react';
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
  const { websiteSettings, applyThemePreset } = useWebsiteStore();
  const { presets, loading, subscribeToPresets } = useThemePresetStore();
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);

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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply theme',
        variant: 'destructive',
      });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {/* Mini header bar */}
                <div
                  className="h-8 flex items-center px-3 gap-2"
                  style={{ backgroundColor: preset.theme.primaryColor }}
                >
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="flex-1" />
                  <div className="flex gap-2">
                    <div className="w-6 h-1.5 rounded-full bg-white/40" />
                    <div className="w-6 h-1.5 rounded-full bg-white/40" />
                    <div className="w-6 h-1.5 rounded-full bg-white/40" />
                  </div>
                </div>

                {/* Mini hero area */}
                <div
                  className="h-16 flex flex-col items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${preset.theme.primaryColor} 0%, ${preset.theme.secondaryColor} 100%)`,
                  }}
                >
                  <div
                    className="text-white text-xs font-bold truncate px-4"
                    style={{ fontFamily }}
                  >
                    Your Kennel Name
                  </div>
                  <div
                    className="mt-1 px-3 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: preset.theme.accentColor, fontSize: '7px' }}
                  >
                    View Puppies
                  </div>
                </div>

                {/* Mini content area */}
                <div className="h-12 bg-white px-3 py-2 flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: preset.theme.primaryColor + '30' }} />
                    <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: preset.theme.secondaryColor + '20' }} />
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: preset.theme.accentColor + '15' }}
                    />
                    <div
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: preset.theme.accentColor + '15' }}
                    />
                  </div>
                </div>

                {/* Applied badge */}
                {applied && (
                  <div className="absolute top-10 left-2">
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

                {/* Color swatches */}
                <div className="mt-3 flex items-center gap-3">
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
        Click a theme to apply it. You can still customize colors after applying a preset.
      </p>
    </div>
  );
}
