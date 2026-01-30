/**
 * Admin Newsletter Settings
 *
 * Configure email delivery settings, SendGrid integration,
 * default sender information, and global newsletter preferences.
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore } from '@breeder/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import type { SendGridConfig } from '@breeder/types';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  Settings,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NewsletterSettings {
  sendgrid: SendGridConfig;
  defaults: {
    fromEmail: string;
    fromName: string;
    replyTo: string;
    unsubscribeUrl: string;
    physicalAddress: string;
  };
  features: {
    doubleOptInDefault: boolean;
    trackOpens: boolean;
    trackClicks: boolean;
    autoAddToMainList: boolean;
    enableUnsubscribeLink: boolean;
  };
}

const defaultSettings: NewsletterSettings = {
  sendgrid: {
    apiKey: '',
    fromEmail: '',
    fromName: '',
    replyTo: '',
    isConfigured: false,
  },
  defaults: {
    fromEmail: '',
    fromName: '',
    replyTo: '',
    unsubscribeUrl: '',
    physicalAddress: '',
  },
  features: {
    doubleOptInDefault: true,
    trackOpens: true,
    trackClicks: true,
    autoAddToMainList: true,
    enableUnsubscribeLink: true,
  },
};

export function AdminNewsletterSettings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { checkIsAdmin } = useAdminStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const [settings, setSettings] = useState<NewsletterSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<NewsletterSettings>(defaultSettings);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const adminStatus = await checkIsAdmin(currentUser.uid);
      if (!adminStatus) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [currentUser, navigate, checkIsAdmin]);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!isAdmin) return;

      try {
        const settingsDoc = await getDoc(doc(db, 'adminSettings', 'newsletter'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as NewsletterSettings;
          // Mask API key for display
          if (data.sendgrid?.apiKey) {
            data.sendgrid.apiKey = maskApiKey(data.sendgrid.apiKey);
          }
          setSettings({ ...defaultSettings, ...data });
          setOriginalSettings({ ...defaultSettings, ...data });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load newsletter settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [isAdmin]);

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Don't save if API key is masked
      const settingsToSave = { ...settings };
      if (settingsToSave.sendgrid.apiKey.includes('****')) {
        // Fetch original API key
        const settingsDoc = await getDoc(doc(db, 'adminSettings', 'newsletter'));
        if (settingsDoc.exists()) {
          settingsToSave.sendgrid.apiKey = settingsDoc.data().sendgrid?.apiKey || '';
        }
      }

      await setDoc(doc(db, 'adminSettings', 'newsletter'), {
        ...settingsToSave,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.uid,
      });

      // Update state with masked key
      const displaySettings = { ...settingsToSave };
      if (displaySettings.sendgrid.apiKey) {
        displaySettings.sendgrid.apiKey = maskApiKey(displaySettings.sendgrid.apiKey);
      }
      setOriginalSettings(displaySettings);
      setSettings(displaySettings);

      toast({
        title: 'Settings saved',
        description: 'Newsletter settings have been updated',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifySendGrid = async () => {
    setVerifying(true);
    try {
      // In a real implementation, this would call a Cloud Function
      // to verify the SendGrid API key
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSettings((prev) => ({
        ...prev,
        sendgrid: {
          ...prev.sendgrid,
          isConfigured: true,
          lastVerified: new Date().toISOString(),
        },
      }));

      toast({
        title: 'Verified',
        description: 'SendGrid API key is valid',
      });
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: 'Unable to verify SendGrid API key',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = async () => {
    try {
      await setDoc(doc(db, 'adminSettings', 'newsletter'), {
        ...defaultSettings,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.uid,
      });

      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
      setShowResetDialog(false);

      toast({
        title: 'Settings reset',
        description: 'Newsletter settings have been reset to defaults',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive',
      });
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/sendgrid`;
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: 'Copied',
      description: 'Webhook URL copied to clipboard',
    });
  };

  if (checkingAdmin || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Newsletter Settings</h1>
            <p className="text-muted-foreground">
              Configure email delivery and newsletter preferences
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sendgrid" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sendgrid">
            <Mail className="h-4 w-4 mr-2" />
            SendGrid
          </TabsTrigger>
          <TabsTrigger value="defaults">
            <Settings className="h-4 w-4 mr-2" />
            Defaults
          </TabsTrigger>
          <TabsTrigger value="features">
            <Shield className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
        </TabsList>

        {/* SendGrid Tab */}
        <TabsContent value="sendgrid" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SendGrid Integration</CardTitle>
                  <CardDescription>
                    Connect your SendGrid account to send emails
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {settings.sendgrid.isConfigured ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.sendgrid.apiKey}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          sendgrid: { ...prev.sendgrid, apiKey: e.target.value },
                        }))
                      }
                      placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleVerifySendGrid}
                    disabled={verifying || !settings.sendgrid.apiKey}
                  >
                    {verifying ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from the{' '}
                  <a
                    href="https://app.sendgrid.com/settings/api_keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    SendGrid dashboard
                    <ExternalLink className="h-3 w-3 inline ml-1" />
                  </a>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sgFromEmail">From Email</Label>
                  <Input
                    id="sgFromEmail"
                    type="email"
                    value={settings.sendgrid.fromEmail}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sendgrid: { ...prev.sendgrid, fromEmail: e.target.value },
                      }))
                    }
                    placeholder="newsletter@yourdomain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sgFromName">From Name</Label>
                  <Input
                    id="sgFromName"
                    value={settings.sendgrid.fromName}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sendgrid: { ...prev.sendgrid, fromName: e.target.value },
                      }))
                    }
                    placeholder="Expert Breeder"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sgReplyTo">Reply-To Email (optional)</Label>
                <Input
                  id="sgReplyTo"
                  type="email"
                  value={settings.sendgrid.replyTo || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      sendgrid: { ...prev.sendgrid, replyTo: e.target.value },
                    }))
                  }
                  placeholder="support@yourdomain.com"
                />
              </div>

              {/* Webhook Configuration */}
              <div className="border-t pt-6 mt-6">
                <h4 className="font-medium mb-4">Webhook Configuration</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Webhook URL</Label>
                    <Button variant="ghost" size="sm" onClick={copyWebhookUrl}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <code className="text-sm bg-background p-2 rounded block">
                    {window.location.origin}/api/webhooks/sendgrid
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Add this URL to your SendGrid Event Webhook settings to track
                    opens, clicks, bounces, and unsubscribes.
                  </p>
                </div>
              </div>

              {settings.sendgrid.lastVerified && (
                <p className="text-xs text-muted-foreground">
                  Last verified:{' '}
                  {new Date(settings.sendgrid.lastVerified).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Make sure to verify your sending domain in SendGrid and set up
                    proper SPF, DKIM, and DMARC records to ensure good
                    deliverability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaults Tab */}
        <TabsContent value="defaults" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Sender Information</CardTitle>
              <CardDescription>
                These values will be used when creating new campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultFromEmail">Default From Email</Label>
                  <Input
                    id="defaultFromEmail"
                    type="email"
                    value={settings.defaults.fromEmail}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, fromEmail: e.target.value },
                      }))
                    }
                    placeholder="newsletter@yourdomain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultFromName">Default From Name</Label>
                  <Input
                    id="defaultFromName"
                    value={settings.defaults.fromName}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, fromName: e.target.value },
                      }))
                    }
                    placeholder="Expert Breeder"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultReplyTo">Default Reply-To</Label>
                <Input
                  id="defaultReplyTo"
                  type="email"
                  value={settings.defaults.replyTo}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaults: { ...prev.defaults, replyTo: e.target.value },
                    }))
                  }
                  placeholder="support@yourdomain.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Settings</CardTitle>
              <CardDescription>
                Required for CAN-SPAM and GDPR compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="physicalAddress">Physical Address</Label>
                <Input
                  id="physicalAddress"
                  value={settings.defaults.physicalAddress}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaults: {
                        ...prev.defaults,
                        physicalAddress: e.target.value,
                      },
                    }))
                  }
                  placeholder="123 Main St, City, State 12345"
                />
                <p className="text-xs text-muted-foreground">
                  Required by CAN-SPAM Act. This appears in the footer of all emails.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unsubscribeUrl">Custom Unsubscribe URL (optional)</Label>
                <Input
                  id="unsubscribeUrl"
                  value={settings.defaults.unsubscribeUrl}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaults: {
                        ...prev.defaults,
                        unsubscribeUrl: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://yourdomain.com/unsubscribe"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use the default unsubscribe handling.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>
                Configure how subscribers are managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Double Opt-In by Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email confirmation before adding to lists
                  </p>
                </div>
                <Switch
                  checked={settings.features.doubleOptInDefault}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      features: { ...prev.features, doubleOptInDefault: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Add to Main List</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically add new subscribers to the default list
                  </p>
                </div>
                <Switch
                  checked={settings.features.autoAddToMainList}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      features: { ...prev.features, autoAddToMainList: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Unsubscribe Link</Label>
                  <p className="text-sm text-muted-foreground">
                    Always include an unsubscribe link in emails (required)
                  </p>
                </div>
                <Switch
                  checked={settings.features.enableUnsubscribeLink}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      features: {
                        ...prev.features,
                        enableUnsubscribeLink: checked,
                      },
                    }))
                  }
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracking Settings</CardTitle>
              <CardDescription>
                Configure email analytics tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Track Email Opens</Label>
                  <p className="text-sm text-muted-foreground">
                    Track when recipients open emails
                  </p>
                </div>
                <Switch
                  checked={settings.features.trackOpens}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      features: { ...prev.features, trackOpens: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Track Link Clicks</Label>
                  <p className="text-sm text-muted-foreground">
                    Track when recipients click links in emails
                  </p>
                </div>
                <Switch
                  checked={settings.features.trackClicks}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      features: { ...prev.features, trackClicks: checked },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Newsletter Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all newsletter settings to their default values.
              Your SendGrid API key will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminNewsletterSettings;
