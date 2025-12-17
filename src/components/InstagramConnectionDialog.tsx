import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Instagram,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { InstagramAccount } from '@/types/messaging';
import { auth } from '@/lib/firebase';

interface InstagramConnectionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  existingAccount?: InstagramAccount | null;
  onConnectionComplete?: (account: InstagramAccount) => void;
}

export function InstagramConnectionDialog({
  open,
  setOpen,
  existingAccount,
  onConnectionComplete,
}: InstagramConnectionDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const META_APP_ID = import.meta.env.VITE_META_APP_ID || '';
  const REDIRECT_URI = `${window.location.origin}/auth/instagram/callback`;

  useEffect(() => {
    // Listen for OAuth callback messages from popup window
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'instagram-oauth-success') {
        const { code } = event.data;
        await handleOAuthCallback(code);
      } else if (event.data.type === 'instagram-oauth-error') {
        setConnectionStatus('error');
        setErrorMessage(event.data.error || 'Failed to connect Instagram account');
        setIsConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = () => {
    if (!META_APP_ID) {
      toast({
        title: 'Configuration Error',
        description: 'Meta App ID is not configured. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setErrorMessage(null);

    // Required Instagram permissions
    const scopes = [
      'instagram_basic',
      'instagram_manage_messages',
      'pages_messaging',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');

    // Build Instagram OAuth URL
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.append('client_id', META_APP_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', crypto.randomUUID()); // CSRF protection

    // Open OAuth popup
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      authUrl.toString(),
      'Instagram Login',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call backend to exchange code for access token
      const response = await fetch('/api/instagram/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          code,
          redirectUri: REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to connect Instagram account');
      }

      const account: InstagramAccount = await response.json();

      setConnectionStatus('success');
      setIsConnecting(false);

      toast({
        title: 'Instagram Connected!',
        description: `Successfully connected @${account.instagramUsername}`,
      });

      onConnectionComplete?.(account);
    } catch (error: any) {
      console.error('Instagram connection error:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
      setIsConnecting(false);

      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect Instagram account',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !existingAccount) return;

      const response = await fetch(`/api/instagram/disconnect/${existingAccount.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Instagram account');
      }

      toast({
        title: 'Instagram Disconnected',
        description: 'Your Instagram account has been disconnected',
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect Instagram account',
        variant: 'destructive',
      });
    }
  };

  const handleRefreshToken = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !existingAccount) return;

      const response = await fetch(`/api/instagram/refresh-token/${existingAccount.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      toast({
        title: 'Token Refreshed',
        description: 'Instagram connection has been refreshed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to refresh token',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Instagram Messaging Integration
          </DialogTitle>
          <DialogDescription>
            Connect your Instagram Business account to manage direct messages from customers
          </DialogDescription>
        </DialogHeader>

        {/* Existing Connection Info */}
        {existingAccount && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {existingAccount.instagramProfilePicture && (
                    <img
                      src={existingAccount.instagramProfilePicture}
                      alt={existingAccount.instagramUsername}
                      className="h-12 w-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">@{existingAccount.instagramUsername}</p>
                    <p className="text-sm text-muted-foreground">
                      {existingAccount.followersCount?.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(existingAccount.connectionStatus)}>
                  {existingAccount.connectionStatus}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Facebook Page</p>
                  <p className="font-medium">{existingAccount.facebookPageName || 'Connected'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Webhook Status</p>
                  <p className="font-medium flex items-center gap-1">
                    {existingAccount.webhookSubscribed ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-red-600" />
                        Inactive
                      </>
                    )}
                  </p>
                </div>
                {existingAccount.lastTokenRefresh && (
                  <div>
                    <p className="text-muted-foreground">Last Token Refresh</p>
                    <p className="font-medium">
                      {new Date(existingAccount.lastTokenRefresh).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {existingAccount.tokenExpiresAt && (
                  <div>
                    <p className="text-muted-foreground">Token Expires</p>
                    <p className="font-medium">
                      {new Date(existingAccount.tokenExpiresAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {existingAccount.lastError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Last Error:</strong> {existingAccount.lastError.message}
                    <br />
                    <span className="text-xs">
                      {new Date(existingAccount.lastError.timestamp).toLocaleString()}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleRefreshToken} size="sm" variant="outline">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Refresh Token
                </Button>
                <Button onClick={handleDisconnect} size="sm" variant="destructive">
                  Disconnect
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* New Connection Flow */}
        {!existingAccount && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Requirements:</strong>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  <li>Instagram Business or Creator account</li>
                  <li>Facebook Page connected to your Instagram account</li>
                  <li>Admin access to both the Instagram account and Facebook Page</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">How It Works</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Connect Instagram" below to authorize access</li>
                <li>Select your Facebook Page that's linked to your Instagram Business account</li>
                <li>Grant the necessary permissions for messaging</li>
                <li>Start receiving and responding to Instagram DMs in your unified inbox</li>
              </ol>
            </Card>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2 text-blue-900">What You Can Do</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li>View all Instagram DMs in one unified inbox</li>
                <li>Respond to messages directly from the app</li>
                <li>Link Instagram conversations to customer records</li>
                <li>Track message history and response times</li>
                <li>Automatically match Instagram users to existing customers</li>
              </ul>
            </Card>

            {connectionStatus === 'error' && errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {connectionStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Instagram account connected successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {existingAccount ? 'Close' : 'Cancel'}
          </Button>
          {!existingAccount && (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !META_APP_ID}
              className="gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Instagram className="h-4 w-4" />
                  Connect Instagram
                </>
              )}
            </Button>
          )}
        </DialogFooter>

        {/* Meta Setup Instructions */}
        {!existingAccount && (
          <div className="border-t pt-4">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                Don't have a Meta App set up? Click here for setup instructions
              </summary>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <p>To use Instagram messaging, you need to:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Create a Meta App at{' '}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Meta for Developers <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>Add the Instagram product to your app</li>
                  <li>Configure Instagram Messaging in your app settings</li>
                  <li>Set up webhooks for message delivery</li>
                  <li>Add your Meta App ID to your environment configuration</li>
                </ol>
                <p className="text-xs mt-2">
                  For detailed setup instructions, see the{' '}
                  <a
                    href="https://developers.facebook.com/docs/messenger-platform/instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Meta Instagram Messaging API documentation
                  </a>
                  .
                </p>
              </div>
            </details>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
