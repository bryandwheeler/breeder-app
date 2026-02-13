import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, Key, RefreshCw, Trash2, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useTpwIntegrationStore } from '@breeder/firebase';
import { useToast } from '@/hooks/use-toast';

export function TpwIntegrationSettings() {
  const { currentUser } = useAuth();
  const { settings, recentDeliveries, loading, subscribeToSettings, loadRecentDeliveries, generateApiKey, revokeApiKey, updateSettings } = useTpwIntegrationStore();
  const { toast } = useToast();

  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToSettings(currentUser.uid);
    loadRecentDeliveries(currentUser.uid);
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (settings?.webhookUrl) setWebhookUrl(settings.webhookUrl);
  }, [settings?.webhookUrl]);

  const handleCopy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const result = await generateApiKey();
      setNewApiKey(result.apiKey);
      setNewWebhookSecret(result.webhookSecret);
      toast({ title: 'API Key Generated', description: 'Copy your key now — it will only be shown once.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to generate API key', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeApiKey();
      setNewApiKey(null);
      setNewWebhookSecret(null);
      toast({ title: 'API Key Revoked', description: 'Integration has been disabled.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke key', variant: 'destructive' });
    }
  };

  const handleToggle = async (field: string, value: boolean) => {
    try {
      await updateSettings({ [field]: value });
    } catch {
      toast({ title: 'Error', description: 'Failed to update setting', variant: 'destructive' });
    }
  };

  const handleSaveWebhookUrl = async () => {
    try {
      await updateSettings({ webhookUrl, webhookEnabled: !!webhookUrl });
      toast({ title: 'Saved', description: 'Webhook URL updated' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  if (loading) return <Card className="p-6"><p className="text-muted-foreground">Loading...</p></Card>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            ThePuppyWag.com Integration
          </CardTitle>
          <CardDescription>
            Sync your puppy listings and breeder profile with ThePuppyWag.com marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Section */}
          <div className="space-y-3">
            <h4 className="font-medium">API Key</h4>
            {!settings?.apiKeyHash ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generate an API key to enable ThePuppyWag to access your listings.
                </p>
                <Button onClick={handleGenerateKey} disabled={generating}>
                  {generating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  Generate API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{settings.apiKeyPrefix}</Badge>
                  <Badge variant={settings.enabled ? 'default' : 'secondary'}>
                    {settings.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <Button variant="destructive" size="sm" onClick={handleRevoke}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke Key
                </Button>
              </div>
            )}

            {/* Show newly generated key (one-time) */}
            {newApiKey && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p className="font-medium">Copy your API key now — it will not be shown again.</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded break-all flex-1">{newApiKey}</code>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(newApiKey, 'apiKey')}>
                      {copied === 'apiKey' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {newWebhookSecret && (
                    <>
                      <p className="text-xs mt-2">Webhook signing secret:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded break-all flex-1">{newWebhookSecret}</code>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(newWebhookSecret, 'secret')}>
                          {copied === 'secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Data Sharing Toggles */}
          {settings?.apiKeyHash && (
            <>
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Data Sharing</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Puppies</Label>
                      <p className="text-xs text-muted-foreground">Allow ThePuppyWag to list your available puppies</p>
                    </div>
                    <Switch checked={settings.sharePuppies} onCheckedChange={(v) => handleToggle('sharePuppies', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Breeder Profile</Label>
                      <p className="text-xs text-muted-foreground">Share your kennel name, bio, and location</p>
                    </div>
                    <Switch checked={settings.shareBreederProfile} onCheckedChange={(v) => handleToggle('shareBreederProfile', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Photos</Label>
                      <p className="text-xs text-muted-foreground">Include puppy and profile photos</p>
                    </div>
                    <Switch checked={settings.sharePhotos} onCheckedChange={(v) => handleToggle('sharePhotos', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Pricing</Label>
                      <p className="text-xs text-muted-foreground">Include puppy prices in listings</p>
                    </div>
                    <Switch checked={settings.sharePricing} onCheckedChange={(v) => handleToggle('sharePricing', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Master Toggle</Label>
                      <p className="text-xs text-muted-foreground">Enable or disable all data sharing</p>
                    </div>
                    <Switch checked={settings.enabled} onCheckedChange={(v) => handleToggle('enabled', v)} />
                  </div>
                </div>
              </div>

              {/* Webhook Config */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Webhook (Push Notifications)</h4>
                <p className="text-xs text-muted-foreground">
                  When puppies or your profile change, Expert Breeder will POST events to this URL.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://thepuppywag.com/webhooks/expertbreeder"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <Button onClick={handleSaveWebhookUrl} size="sm">Save</Button>
                </div>
                {settings.webhookEnabled && settings.webhookUrl && (
                  <Badge variant="outline" className="text-green-600">Webhooks enabled</Badge>
                )}
              </div>

              {/* Recent Webhook Deliveries */}
              {recentDeliveries.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium">Recent Webhook Deliveries</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recentDeliveries.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                        <div>
                          <span className="font-mono text-xs">{d.event}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(d.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <Badge variant={d.status === 'delivered' ? 'default' : d.status === 'pending' ? 'secondary' : 'destructive'}>
                          {d.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
