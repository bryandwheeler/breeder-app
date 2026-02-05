// Notification Preferences Component
// Allows users to manage how they receive platform notifications
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Users, Link2, Save, Loader2 } from 'lucide-react';
import {
  NotificationPreferences as NotificationPreferencesType,
  NotificationPreference,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@breeder/types';

interface NotificationRowProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  preference: NotificationPreference;
  onUpdate: (pref: NotificationPreference) => void;
}

function NotificationRow({ title, description, icon, preference, onUpdate }: NotificationRowProps) {
  const toggleChannel = (channel: 'email' | 'sms' | 'in_app') => {
    const channels = preference.channels.includes(channel)
      ? preference.channels.filter(c => c !== channel)
      : [...preference.channels, channel];
    onUpdate({ ...preference, channels });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <div className="flex items-center gap-4 ml-8 sm:ml-0">
        <div className="flex items-center gap-2">
          <Switch
            id={`${title}-enabled`}
            checked={preference.enabled}
            onCheckedChange={(enabled) => onUpdate({ ...preference, enabled })}
          />
          <Label htmlFor={`${title}-enabled`} className="text-sm">
            {preference.enabled ? 'On' : 'Off'}
          </Label>
        </div>
        {preference.enabled && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleChannel('email')}
              className={`p-2 rounded-md transition-colors ${
                preference.channels.includes('email')
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              title="Email notifications"
            >
              <Mail className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleChannel('in_app')}
              className={`p-2 rounded-md transition-colors ${
                preference.channels.includes('in_app')
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              title="In-app notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationPreferences() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferencesType>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [phone, setPhone] = useState('');

  // Load user's notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.notificationPreferences) {
            setPreferences({
              ...DEFAULT_NOTIFICATION_PREFERENCES,
              ...data.notificationPreferences,
            });
          }
          if (data.phone) {
            setPhone(data.phone);
          }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        notificationPreferences: preferences,
        phone: phone || null,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'Preferences Saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (
    key: keyof NotificationPreferencesType,
    value: NotificationPreference
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control how you receive notifications from Expert Breeder. Platform emails are sent from
          notifications@expertbreeder.com.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Social Notifications */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Community Notifications
          </h3>
          <div className="bg-muted/50 rounded-lg p-4">
            <NotificationRow
              title="Friend Request Received"
              description="When another breeder sends you a friend request"
              icon={<Users className="h-4 w-4" />}
              preference={preferences.friendRequestReceived}
              onUpdate={(p) => updatePreference('friendRequestReceived', p)}
            />
            <NotificationRow
              title="Friend Request Accepted"
              description="When a breeder accepts your friend request"
              icon={<Users className="h-4 w-4" />}
              preference={preferences.friendRequestAccepted}
              onUpdate={(p) => updatePreference('friendRequestAccepted', p)}
            />
            <NotificationRow
              title="New Message"
              description="When you receive a direct message from a friend"
              icon={<MessageSquare className="h-4 w-4" />}
              preference={preferences.newMessage}
              onUpdate={(p) => updatePreference('newMessage', p)}
            />
          </div>
        </div>

        {/* Dog Connection Notifications */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Dog Connection Notifications
          </h3>
          <div className="bg-muted/50 rounded-lg p-4">
            <NotificationRow
              title="Connection Request Received"
              description="When another breeder requests to connect with your dog"
              icon={<Link2 className="h-4 w-4" />}
              preference={preferences.connectionRequestReceived}
              onUpdate={(p) => updatePreference('connectionRequestReceived', p)}
            />
            <NotificationRow
              title="Connection Approved"
              description="When your dog connection request is approved"
              icon={<Link2 className="h-4 w-4" />}
              preference={preferences.connectionRequestApproved}
              onUpdate={(p) => updatePreference('connectionRequestApproved', p)}
            />
            <NotificationRow
              title="Connection Declined"
              description="When your dog connection request is declined"
              icon={<Link2 className="h-4 w-4" />}
              preference={preferences.connectionRequestDeclined}
              onUpdate={(p) => updatePreference('connectionRequestDeclined', p)}
            />
          </div>
        </div>

        {/* Phone Number for SMS (Future) */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-2">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number (for future SMS notifications)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                SMS notifications coming soon. Add your number now to be ready.
              </p>
            </div>
          </div>
        </div>

        {/* Email Digest Settings */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-2">Email Frequency</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emailDigest">Email Digest</Label>
              <Select
                value={preferences.emailDigest || 'instant'}
                onValueChange={(value) =>
                  setPreferences((prev) => ({
                    ...prev,
                    emailDigest: value as 'instant' | 'daily' | 'weekly' | 'none',
                  }))
                }
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant - Send emails immediately</SelectItem>
                  <SelectItem value="daily">Daily Digest - One email per day</SelectItem>
                  <SelectItem value="weekly">Weekly Digest - One email per week</SelectItem>
                  <SelectItem value="none">None - No email notifications</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Control how often you receive email notifications
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
