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

  // Group presets by category
  const categories = ['professional', 'modern', 'playful', 'elegant'] as const;
  const categoryLabels: Record<(typeof categories)[number], string> = {
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

          return (
            <Card
              key={preset.id}
              className={cn(
                'overflow-hidden transition-all cursor-pointer hover:shadow-md',
                applied && 'ring-2 ring-primary',
                locked && 'opacity-75'
              )}
              onClick={() => !locked && handleApplyPreset(preset)}
            >
              {/* Theme Preview */}
              <div
                className="h-24 relative"
                style={{
                  background: `linear-gradient(135deg, ${preset.theme.primaryColor} 0%, ${preset.theme.secondaryColor} 100%)`,
                }}
              >
                {/* Accent color dot */}
                <div
                  className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white"
                  style={{ backgroundColor: preset.theme.accentColor }}
                />

                {/* Applied badge */}
                {applied && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-white text-primary">
                      <Check className="h-3 w-3 mr-1" />
                      Applied
                    </Badge>
                  </div>
                )}

                {/* Premium badge */}
                {preset.isPremium && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
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
                  <Badge variant="outline" className="shrink-0">
                    {categoryLabels[preset.category]}
                  </Badge>
                </div>

                {/* Font preview */}
                <div className="mt-3 text-xs text-muted-foreground">
                  Font: <span className="font-medium capitalize">{preset.theme.fontFamily}</span>
                  {' · '}
                  Header: <span className="font-medium capitalize">{preset.theme.headerStyle}</span>
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
