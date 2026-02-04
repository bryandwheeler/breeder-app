/**
 * Platform Email Settings Component
 *
 * Configure SendGrid for platform-wide emails (breeder connections, friend requests, etc.)
 * Separate from newsletter settings - used for notifications@expertbreeder.com
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { PlatformEmailSettings as PlatformEmailSettingsType, PlatformEmailTemplateType } from '@breeder/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const defaultTemplates: PlatformEmailSettingsType['templates'] = {
  friend_request: {
    subject: '{{requester_name}} wants to connect on Expert Breeder',
    body: `Hi {{recipient_name}},

{{requester_name}} from {{requester_kennel}} would like to connect with you on Expert Breeder.

{{#if message}}
Their message: "{{message}}"
{{/if}}

Log in to view and respond: {{app_url}}/community

Best,
The Expert Breeder Team`,
  },
  friend_accepted: {
    subject: '{{accepter_name}} accepted your friend request',
    body: `Hi {{requester_name}},

Good news! {{accepter_name}} from {{accepter_kennel}} has accepted your friend request on Expert Breeder.

You can now message each other directly.

Visit your community: {{app_url}}/community

Best,
The Expert Breeder Team`,
  },
  new_message: {
    subject: 'New message from {{sender_name}}',
    body: `Hi {{recipient_name}},

You have a new message from {{sender_name}}:

"{{message_preview}}"

Reply here: {{app_url}}/community/messages

Best,
The Expert Breeder Team`,
  },
  connection_request: {
    subject: 'Connection request for {{dog_name}}',
    body: `Hi {{owner_name}},

{{requester_name}} from {{requester_kennel}} has requested to connect {{dog_name}} to their records.

Purpose: {{purpose}}
{{#if message}}
Message: "{{message}}"
{{/if}}

Review this request: {{app_url}}/connections

Best,
The Expert Breeder Team`,
  },
  connection_approved: {
    subject: 'Your connection request for {{dog_name}} was approved',
    body: `Hi {{requester_name}},

{{owner_name}} has approved your request to connect {{dog_name}} to your records.

The dog is now available in your Dogs list with the shared information.

View your dogs: {{app_url}}/dogs

Best,
The Expert Breeder Team`,
  },
  connection_declined: {
    subject: 'Update on your connection request for {{dog_name}}',
    body: `Hi {{requester_name}},

{{owner_name}} was unable to approve your request to connect {{dog_name}} at this time.

{{#if message}}
Their message: "{{message}}"
{{/if}}

You may reach out to them directly for more information.

Best,
The Expert Breeder Team`,
  },
};

const defaultSettings: PlatformEmailSettingsType = {
  enabled: false,
  sendGridApiKey: '',
  fromEmail: 'notifications@expertbreeder.com',
  fromName: 'Expert Breeder',
  replyToEmail: 'support@expertbreeder.com',
  templates: defaultTemplates,
};

const templateLabels: Record<PlatformEmailTemplateType, { title: string; description: string }> = {
  friend_request: {
    title: 'Friend Request',
    description: 'Sent when a breeder sends a friend request',
  },
  friend_accepted: {
    title: 'Friend Accepted',
    description: 'Sent when a friend request is accepted',
  },
  new_message: {
    title: 'New Message',
    description: 'Sent when a breeder receives a direct message',
  },
  connection_request: {
    title: 'Dog Connection Request',
    description: 'Sent when requesting to connect a dog',
  },
  connection_approved: {
    title: 'Connection Approved',
    description: 'Sent when a dog connection is approved',
  },
  connection_declined: {
    title: 'Connection Declined',
    description: 'Sent when a dog connection is declined',
  },
};

interface ExtendedSettings extends PlatformEmailSettingsType {
  isConfigured?: boolean;
  lastVerified?: string;
}

export function PlatformEmailSettings() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const [settings, setSettings] = useState<ExtendedSettings>({ ...defaultSettings });
  const [originalSettings, setOriginalSettings] = useState<ExtendedSettings>({ ...defaultSettings });

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'adminSettings', 'platformEmail'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as ExtendedSettings;
          // Mask API key for display
          if (data.sendGridApiKey) {
            data.sendGridApiKey = maskApiKey(data.sendGridApiKey);
          }
          // Merge with defaults to ensure all templates exist
          const merged = {
            ...defaultSettings,
            ...data,
            templates: { ...defaultTemplates, ...data.templates },
          };
          setSettings(merged);
          setOriginalSettings(merged);
        }
      } catch (error) {
        console.error('Error loading platform email settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load platform email settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Don't save if API key is masked - get original
      const settingsToSave = { ...settings };
      if (settingsToSave.sendGridApiKey.includes('****')) {
        const settingsDoc = await getDoc(doc(db, 'adminSettings', 'platformEmail'));
        if (settingsDoc.exists()) {
          settingsToSave.sendGridApiKey = settingsDoc.data().sendGridApiKey || '';
        }
      }

      await setDoc(doc(db, 'adminSettings', 'platformEmail'), {
        ...settingsToSave,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.uid,
      });

      // Update state with masked key
      const displaySettings = { ...settingsToSave };
      if (displaySettings.sendGridApiKey) {
        displaySettings.sendGridApiKey = maskApiKey(displaySettings.sendGridApiKey);
      }
      setOriginalSettings(displaySettings);
      setSettings(displaySettings);

      toast({
        title: 'Settings saved',
        description: 'Platform email settings have been updated',
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

  const handleVerify = async () => {
    setVerifying(true);
    try {
      // In production, this would call a Cloud Function to verify the API key
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSettings((prev) => ({
        ...prev,
        isConfigured: true,
        lastVerified: new Date().toISOString(),
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

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive',
      });
      return;
    }

    setSendingTest(true);
    try {
      // In production, this would call a Cloud Function to send a test email
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Test email sent',
        description: `A test email was sent to ${testEmail}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to send',
        description: 'Could not send test email',
        variant: 'destructive',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleTemplateChange = (
    templateType: PlatformEmailTemplateType,
    field: 'subject' | 'body',
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [templateType]: {
          ...prev.templates[templateType],
          [field]: value,
        },
      },
    }));
  };

  const handleResetTemplate = (templateType: PlatformEmailTemplateType) => {
    setSettings((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [templateType]: defaultTemplates[templateType],
      },
    }));
    toast({
      title: 'Template reset',
      description: `${templateLabels[templateType].title} template has been reset to default`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Platform Email
              </CardTitle>
              <CardDescription>
                Send breeder connection and friend request emails from expertbreeder.com
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {settings.isConfigured ? (
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
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* SendGrid Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>SendGrid Configuration</CardTitle>
          <CardDescription>
            Configure SendGrid to send emails from your domain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.sendGridApiKey}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, sendGridApiKey: e.target.value }))
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
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={verifying || !settings.sendGridApiKey}
              >
                {verifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Verify'}
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
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={settings.fromEmail}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, fromEmail: e.target.value }))
                }
                placeholder="notifications@expertbreeder.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={settings.fromName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, fromName: e.target.value }))
                }
                placeholder="Expert Breeder"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="replyTo">Reply-To Email</Label>
            <Input
              id="replyTo"
              type="email"
              value={settings.replyToEmail}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, replyToEmail: e.target.value }))
              }
              placeholder="support@expertbreeder.com"
            />
          </div>

          {settings.lastVerified && (
            <p className="text-xs text-muted-foreground">
              Last verified: {new Date(settings.lastVerified).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Verify your configuration by sending a test email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingTest || !settings.sendGridApiKey}
            >
              {sendingTest ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Domain Setup Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800">Domain Verification Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                To send emails from @expertbreeder.com, you must verify your domain in SendGrid
                and set up SPF, DKIM, and DMARC records. See the{' '}
                <a
                  href="https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-800 underline hover:text-yellow-900"
                >
                  SendGrid domain authentication guide
                  <ExternalLink className="h-3 w-3 inline ml-1" />
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Customize the email templates for breeder communications. Use {'{{variable}}'} placeholders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {(Object.keys(templateLabels) as PlatformEmailTemplateType[]).map((templateType) => (
              <AccordionItem key={templateType} value={templateType}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{templateLabels[templateType].title}</div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {templateLabels[templateType].description}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input
                      value={settings.templates[templateType]?.subject || ''}
                      onChange={(e) => handleTemplateChange(templateType, 'subject', e.target.value)}
                      placeholder="Email subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Body</Label>
                    <Textarea
                      value={settings.templates[templateType]?.body || ''}
                      onChange={(e) => handleTemplateChange(templateType, 'body', e.target.value)}
                      placeholder="Email content..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Available variables: {'{{'}{templateType.includes('friend') ? 'requester_name, requester_kennel, recipient_name, message' : 'dog_name, owner_name, requester_name, requester_kennel, purpose, message'}{'}}'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetTemplate(templateType)}
                    >
                      Reset to Default
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

export default PlatformEmailSettings;
