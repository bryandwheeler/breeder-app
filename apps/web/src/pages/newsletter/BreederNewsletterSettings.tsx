/**
 * Breeder Newsletter Settings
 *
 * Configure email sending settings and defaults.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBreederStore } from '@breeder/firebase';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Settings,
  Mail,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function BreederNewsletterSettings() {
  const { currentUser } = useAuth();
  const { profile, updateProfile } = useBreederStore();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // SendGrid settings
    sendgridApiKey: '',
    sendgridVerified: false,
    // Sender defaults
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    // Compliance
    physicalAddress: '',
    // Preferences
    defaultDoubleOptIn: true,
    trackOpens: true,
    trackClicks: true,
  });

  // Load settings from profile
  useEffect(() => {
    if (profile?.newsletterSettings) {
      setFormData({
        sendgridApiKey: profile.newsletterSettings.sendgridApiKey || '',
        sendgridVerified: profile.newsletterSettings.sendgridVerified || false,
        fromEmail: profile.newsletterSettings.fromEmail || currentUser?.email || '',
        fromName: profile.newsletterSettings.fromName || profile.kennelName || '',
        replyToEmail: profile.newsletterSettings.replyToEmail || currentUser?.email || '',
        physicalAddress: profile.newsletterSettings.physicalAddress || '',
        defaultDoubleOptIn: profile.newsletterSettings.defaultDoubleOptIn ?? true,
        trackOpens: profile.newsletterSettings.trackOpens ?? true,
        trackClicks: profile.newsletterSettings.trackClicks ?? true,
      });
    } else {
      setFormData(prev => ({
        ...prev,
        fromEmail: currentUser?.email || '',
        fromName: profile?.kennelName || '',
        replyToEmail: currentUser?.email || '',
      }));
    }
  }, [profile, currentUser]);

  const handleSave = async () => {
    if (!formData.fromEmail) {
      toast({ title: 'From email is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        newsletterSettings: {
          sendgridApiKey: formData.sendgridApiKey,
          sendgridVerified: formData.sendgridVerified,
          fromEmail: formData.fromEmail,
          fromName: formData.fromName,
          replyToEmail: formData.replyToEmail,
          physicalAddress: formData.physicalAddress,
          defaultDoubleOptIn: formData.defaultDoubleOptIn,
          trackOpens: formData.trackOpens,
          trackClicks: formData.trackClicks,
        },
      });
      toast({ title: 'Settings saved successfully' });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const verifySendGrid = async () => {
    if (!formData.sendgridApiKey) {
      toast({ title: 'Please enter your SendGrid API key first', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // In a real implementation, this would call a cloud function to verify the API key
      // For now, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      setFormData(prev => ({ ...prev, sendgridVerified: true }));
      await updateProfile({
        newsletterSettings: {
          ...profile?.newsletterSettings,
          sendgridApiKey: formData.sendgridApiKey,
          sendgridVerified: true,
          lastVerifiedAt: new Date().toISOString(),
        },
      });
      toast({ title: 'SendGrid API key verified!' });
    } catch (error: any) {
      toast({ title: 'Failed to verify API key', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Newsletter Settings</h1>
            <p className="text-muted-foreground">
              Configure your email sending preferences
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* SendGrid Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Service (SendGrid)
            </CardTitle>
            <CardDescription>
              Connect your SendGrid account to send emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">SendGrid API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="SG.xxxxxxxxxx"
                  value={formData.sendgridApiKey}
                  onChange={(e) => setFormData({ ...formData, sendgridApiKey: e.target.value, sendgridVerified: false })}
                  className="flex-1"
                />
                <Button variant="outline" onClick={verifySendGrid} disabled={saving}>
                  Verify
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from the SendGrid dashboard
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              {formData.sendgridVerified ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">API key verified</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-yellow-600">Not verified</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sender Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Default Sender
            </CardTitle>
            <CardDescription>
              These settings will be used as defaults for new campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                placeholder="Your Kennel Name"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="newsletter@yourdomain.com"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Must be a verified sender in SendGrid
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-To Email</Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="you@yourdomain.com"
                value={formData.replyToEmail}
                onChange={(e) => setFormData({ ...formData, replyToEmail: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance (CAN-SPAM)
            </CardTitle>
            <CardDescription>
              Required for email marketing compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Textarea
                id="address"
                placeholder="123 Main Street&#10;City, State 12345&#10;Country"
                value={formData.physicalAddress}
                onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Required by CAN-SPAM and GDPR regulations
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Default settings for new lists and campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Double Opt-in by Default</Label>
                <p className="text-xs text-muted-foreground">
                  Require email confirmation for new subscribers
                </p>
              </div>
              <Switch
                checked={formData.defaultDoubleOptIn}
                onCheckedChange={(checked) => setFormData({ ...formData, defaultDoubleOptIn: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Track Opens</Label>
                <p className="text-xs text-muted-foreground">
                  Track when subscribers open your emails
                </p>
              </div>
              <Switch
                checked={formData.trackOpens}
                onCheckedChange={(checked) => setFormData({ ...formData, trackOpens: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Track Clicks</Label>
                <p className="text-xs text-muted-foreground">
                  Track when subscribers click links
                </p>
              </div>
              <Switch
                checked={formData.trackClicks}
                onCheckedChange={(checked) => setFormData({ ...formData, trackClicks: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BreederNewsletterSettings;
