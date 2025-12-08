import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailStore } from '@/store/emailStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, RefreshCw, Trash2, Check, X, AlertCircle, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { OAuthSetupDialog } from '@/components/OAuthSetupDialog';
import { OAuthCredentials } from '@/types/email';

export function EmailSettings() {
  const { currentUser } = useAuth();
  const { integration, loading, loadIntegration, deleteIntegration, saveIntegration } =
    useEmailStore();

  const [syncEnabled, setSyncEnabled] = useState(false);
  const [autoLink, setAutoLink] = useState(true);
  const [oauthSetupOpen, setOauthSetupOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'outlook'>('gmail');

  useEffect(() => {
    if (currentUser?.uid) {
      loadIntegration(currentUser.uid);
    }
  }, [currentUser, loadIntegration]);

  useEffect(() => {
    if (integration) {
      setSyncEnabled(integration.syncEnabled);
      setAutoLink(integration.autoLinkCustomers);
    }
  }, [integration]);

  const handleStartSetup = (provider: 'gmail' | 'outlook') => {
    setSelectedProvider(provider);
    setOauthSetupOpen(true);
  };

  const handleOAuthComplete = async (credentials: OAuthCredentials) => {
    if (!currentUser) return;

    try {
      // Store credentials temporarily - will initiate OAuth flow next
      sessionStorage.setItem('pending_oauth_credentials', JSON.stringify(credentials));

      // Initiate OAuth flow with user's credentials
      const authUrl = credentials.provider === 'gmail'
        ? buildGmailAuthUrl(credentials.clientId, credentials.redirectUri)
        : buildOutlookAuthUrl(credentials.clientId, credentials.redirectUri);

      toast({
        title: 'Redirecting...',
        description: 'You will be redirected to authorize email access',
      });

      // Redirect to OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error starting OAuth:', error);
      toast({
        title: 'Error',
        description: 'Failed to start authorization process',
        variant: 'destructive',
      });
    } finally {
      setOauthSetupOpen(false);
    }
  };

  const buildGmailAuthUrl = (clientId: string, redirectUri: string) => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const buildOutlookAuthUrl = (clientId: string, redirectUri: string) => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/User.Read',
      ].join(' '),
    });
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your email? This will not delete any synced data.')) {
      try {
        await deleteIntegration();
        toast({
          title: 'Email Disconnected',
          description: 'Your email account has been disconnected.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to disconnect email account.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    if (!integration || !currentUser) return;

    try {
      await saveIntegration({
        ...integration,
        syncEnabled: enabled,
        userId: currentUser.uid,
      });
      setSyncEnabled(enabled);
      toast({
        title: enabled ? 'Sync Enabled' : 'Sync Disabled',
        description: enabled
          ? 'Email syncing is now active.'
          : 'Email syncing has been paused.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update sync settings.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAutoLink = async (enabled: boolean) => {
    if (!integration || !currentUser) return;

    try {
      await saveIntegration({
        ...integration,
        autoLinkCustomers: enabled,
        userId: currentUser.uid,
      });
      setAutoLink(enabled);
      toast({
        title: 'Auto-Link Updated',
        description: enabled
          ? 'Emails will be automatically linked to customers.'
          : 'Auto-linking has been disabled.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update auto-link settings.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading email settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Integration
          </CardTitle>
          <CardDescription>
            Connect your email to sync conversations and send emails directly from the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!integration ? (
            <>
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Each breeder sets up their own email integration with their own OAuth credentials.
                  Follow the guided setup process to connect your email account.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Mail className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Gmail</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Connect your Gmail account to sync emails
                        </p>
                        <Button onClick={() => handleStartSetup('gmail')} className="w-full">
                          <Settings className="h-4 w-4 mr-2" />
                          Set Up Gmail
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Outlook</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Connect your Outlook account to sync emails
                        </p>
                        <Button onClick={() => handleStartSetup('outlook')} className="w-full">
                          <Settings className="h-4 w-4 mr-2" />
                          Set Up Outlook
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Connected Account */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    integration.provider === 'gmail' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <Mail className={`h-5 w-5 ${
                      integration.provider === 'gmail' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{integration.email}</p>
                      {integration.isActive ? (
                        <Badge className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Disconnected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {integration.provider}
                      {integration.lastSyncedAt && (
                        <> · Last synced {new Date(integration.lastSyncedAt).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              {/* Sync Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync-enabled">Email Syncing</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync new emails from your inbox
                    </p>
                  </div>
                  <Switch
                    id="sync-enabled"
                    checked={syncEnabled}
                    onCheckedChange={handleToggleSync}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-link">Auto-Link to Customers</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically match emails to customer records by email address
                    </p>
                  </div>
                  <Switch
                    id="auto-link"
                    checked={autoLink}
                    onCheckedChange={handleToggleAutoLink}
                  />
                </div>
              </div>

              {/* Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Email syncing runs in the background. Emails will be automatically
                  imported and linked to customer records based on email addresses.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to enable email integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">1</Badge>
              <div>
                <p className="font-medium">Create OAuth Credentials</p>
                <p className="text-muted-foreground">
                  For Gmail: Visit Google Cloud Console and create OAuth 2.0 credentials
                  <br />
                  For Outlook: Visit Azure Portal and register an application
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">2</Badge>
              <div>
                <p className="font-medium">Add Environment Variables</p>
                <p className="text-muted-foreground">
                  Add the following to your <code>.env</code> file:
                  <br />
                  <code>VITE_GMAIL_CLIENT_ID=your_client_id</code>
                  <br />
                  <code>VITE_GMAIL_CLIENT_SECRET=your_client_secret</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">3</Badge>
              <div>
                <p className="font-medium">Configure Redirect URIs</p>
                <p className="text-muted-foreground">
                  Add these redirect URIs to your OAuth app:
                  <br />
                  <code>{window.location.origin}/auth/gmail/callback</code>
                  <br />
                  <code>{window.location.origin}/auth/outlook/callback</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">4</Badge>
              <div>
                <p className="font-medium">Connect Your Account</p>
                <p className="text-muted-foreground">
                  Click the connect button above to authorize access to your email
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OAuth Setup Dialog */}
      <OAuthSetupDialog
        open={oauthSetupOpen}
        setOpen={setOauthSetupOpen}
        provider={selectedProvider}
        onComplete={handleOAuthComplete}
      />
    </div>
  );
}
