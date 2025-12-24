import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailStore } from '@breeder/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GmailCallback() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { saveIntegration } = useEmailStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          throw new Error(`Authorization failed: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        // Get stored OAuth credentials from session storage
        const credentialsJson = sessionStorage.getItem('pending_oauth_credentials');
        if (!credentialsJson) {
          throw new Error('OAuth credentials not found. Please start the setup process again.');
        }

        const credentials = JSON.parse(credentialsJson);

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            redirect_uri: credentials.redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
        }

        const tokens = await tokenResponse.json();

        // Get user's email address
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userInfo = await userInfoResponse.json();

        // Save integration to Firestore
        await saveIntegration({
          userId: currentUser.uid,
          provider: 'gmail',
          email: userInfo.email,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          isActive: true,
          syncEnabled: false,
          autoLinkCustomers: true,
        });

        // Clear session storage
        sessionStorage.removeItem('pending_oauth_credentials');

        setStatus('success');

        // Redirect to settings after 2 seconds
        setTimeout(() => {
          navigate('/settings');
        }, 2000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        setStatus('error');
      }
    };

    handleCallback();
  }, [currentUser, navigate, saveIntegration]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Connecting Gmail...'}
            {status === 'success' && 'Gmail Connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Please wait while we complete the authorization...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <p className="text-muted-foreground">
                Your Gmail account has been successfully connected!
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to settings...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="text-muted-foreground">
                Failed to connect Gmail account
              </p>
              <p className="text-sm text-destructive">
                {errorMessage}
              </p>
              <Button onClick={() => navigate('/settings')}>
                Back to Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
