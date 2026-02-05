// Tawk.to Settings Component for Admin Panel
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TawkToConfig, DEFAULT_TAWKTO_CONFIG, DEFAULT_BUSINESS_HOURS } from '@breeder/types';
import { MessageCircle, Save, Loader2, ExternalLink, Clock } from 'lucide-react';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export function TawkToSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TawkToConfig>(DEFAULT_TAWKTO_CONFIG);

  // Load configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const docRef = doc(db, 'adminSettings', 'liveChat');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.tawkTo) {
            setConfig({
              ...DEFAULT_TAWKTO_CONFIG,
              ...data.tawkTo,
              businessHours: {
                ...DEFAULT_BUSINESS_HOURS,
                ...(data.tawkTo.businessHours || {}),
              },
            });
          }
        }
      } catch (error) {
        console.error('Error loading Tawk.to config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load live chat settings.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [toast]);

  // Save configuration
  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'adminSettings', 'liveChat');
      await setDoc(docRef, { tawkTo: config }, { merge: true });
      toast({
        title: 'Settings Saved',
        description: 'Live chat configuration has been updated.',
      });
    } catch (error) {
      console.error('Error saving Tawk.to config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save live chat settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Update config field
  const updateConfig = (field: keyof TawkToConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  // Update business hours for a specific day
  const updateBusinessHours = (
    day: string,
    field: 'enabled' | 'open' | 'close',
    value: boolean | string
  ) => {
    setConfig((prev) => ({
      ...prev,
      businessHours: {
        ...DEFAULT_BUSINESS_HOURS,
        ...prev.businessHours,
        [day]: {
          ...(prev.businessHours?.[day as keyof typeof DEFAULT_BUSINESS_HOURS] ||
            DEFAULT_BUSINESS_HOURS[day as keyof typeof DEFAULT_BUSINESS_HOURS]),
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Tawk.to Live Chat
          </CardTitle>
          <CardDescription>
            Configure live chat support using Tawk.to (free service).
            <a
              href="https://www.tawk.to/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-primary hover:underline inline-flex items-center"
            >
              Visit Tawk.to <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Live Chat</Label>
              <p className="text-sm text-muted-foreground">
                Show the chat widget on your website
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig('enabled', checked)}
            />
          </div>

          {/* Property and Widget IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property ID</Label>
              <Input
                id="propertyId"
                value={config.propertyId}
                onChange={(e) => updateConfig('propertyId', e.target.value)}
                placeholder="e.g., 64a1b2c3d4e5f6g7h8i9j0"
              />
              <p className="text-xs text-muted-foreground">
                Found in Tawk.to Dashboard &gt; Administration &gt; Property Settings
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="widgetId">Widget ID</Label>
              <Input
                id="widgetId"
                value={config.widgetId}
                onChange={(e) => updateConfig('widgetId', e.target.value)}
                placeholder="e.g., 1abc2def3ghi"
              />
              <p className="text-xs text-muted-foreground">
                Found in the embed code URL
              </p>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Display Options</h3>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show on All Pages</Label>
                <p className="text-sm text-muted-foreground">
                  Display widget across the entire platform
                </p>
              </div>
              <Switch
                checked={config.showOnAllPages}
                onCheckedChange={(checked) =>
                  updateConfig('showOnAllPages', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excludedPaths">Excluded Paths</Label>
              <Input
                id="excludedPaths"
                value={config.excludedPaths?.join(', ') || ''}
                onChange={(e) =>
                  updateConfig(
                    'excludedPaths',
                    e.target.value.split(',').map((p) => p.trim()).filter(Boolean)
                  )
                }
                placeholder="/admin, /login, /settings"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of paths where the widget should be hidden
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Pass User Info</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send logged-in user's name and email to chat
                </p>
              </div>
              <Switch
                checked={config.passUserInfo}
                onCheckedChange={(checked) => updateConfig('passUserInfo', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="widgetPosition">Widget Position</Label>
              <Select
                value={config.widgetPosition || 'right'}
                onValueChange={(value) => updateConfig('widgetPosition', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">Bottom Right</SelectItem>
                  <SelectItem value="left">Bottom Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours
          </CardTitle>
          <CardDescription>
            Set when live support is available. Outside these hours, an offline
            message will be shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Business Hours</Label>
              <p className="text-sm text-muted-foreground">
                Show availability based on schedule
              </p>
            </div>
            <Switch
              checked={config.businessHoursEnabled}
              onCheckedChange={(checked) =>
                updateConfig('businessHoursEnabled', checked)
              }
            />
          </div>

          {config.businessHoursEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={config.timezone || 'America/New_York'}
                  onValueChange={(value) => updateConfig('timezone', value)}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">
                      Eastern Time (ET)
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time (CT)
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time (MT)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time (PT)
                    </SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {DAYS_OF_WEEK.map(({ key, label }) => {
                  const dayHours =
                    config.businessHours?.[key as keyof typeof DEFAULT_BUSINESS_HOURS] ||
                    DEFAULT_BUSINESS_HOURS[key as keyof typeof DEFAULT_BUSINESS_HOURS];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-28">
                        <Switch
                          checked={dayHours.enabled}
                          onCheckedChange={(checked) =>
                            updateBusinessHours(key, 'enabled', checked)
                          }
                        />
                        <span className="ml-2 text-sm font-medium">{label}</span>
                      </div>
                      {dayHours.enabled ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={dayHours.open}
                            onChange={(e) =>
                              updateBusinessHours(key, 'open', e.target.value)
                            }
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={dayHours.close}
                            onChange={(e) =>
                              updateBusinessHours(key, 'close', e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Closed
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="offlineMessage">Offline Message</Label>
                <Textarea
                  id="offlineMessage"
                  value={config.offlineMessage || ''}
                  onChange={(e) => updateConfig('offlineMessage', e.target.value)}
                  placeholder="We're currently offline. Please leave a message or submit a support ticket."
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Sign up for a free account at{' '}
              <a
                href="https://www.tawk.to/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                tawk.to
              </a>
            </li>
            <li>Create a new property for Expert Breeder</li>
            <li>
              Go to Administration &gt; Property Settings to find your Property ID
            </li>
            <li>
              Go to Administration &gt; Chat Widget &gt; Widget Code to find your
              Widget ID (the second ID in the URL)
            </li>
            <li>Enter both IDs above and enable live chat</li>
            <li>Configure your team members in the Tawk.to dashboard</li>
            <li>
              Optionally set up canned responses and shortcuts in Tawk.to for
              faster replies
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
