import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function GoogleCalendarCallback() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting Google Calendar...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      setStatus('error');
      setMessage(error === 'access_denied'
        ? 'You declined the Google Calendar permission request.'
        : `Google returned an error: ${error}`
      );
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received from Google.');
      return;
    }

    if (!currentUser) {
      // Wait for auth to initialize
      return;
    }

    const exchangeCode = async () => {
      try {
        const redirectUri = `${window.location.origin}/oauth/google-calendar/callback`;
        const exchange = httpsCallable<
          { code: string; redirectUri: string },
          { success: boolean; googleEmail: string }
        >(functions, 'exchangeGoogleCalendarCode');

        const result = await exchange({ code, redirectUri });

        setStatus('success');
        setMessage(
          result.data.googleEmail
            ? `Connected to ${result.data.googleEmail}!`
            : 'Google Calendar connected successfully!'
        );

        // Close the popup after a brief delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } catch (err: unknown) {
        console.error('Error exchanging Google Calendar code:', err);
        setStatus('error');
        setMessage('Failed to connect Google Calendar. Please close this window and try again.');
      }
    };

    exchangeCode();
  }, [currentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 max-w-sm">
        {status === 'loading' && (
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
        )}
        {status === 'error' && (
          <XCircle className="h-12 w-12 text-red-600 mx-auto" />
        )}
        <p className="text-lg font-medium">{message}</p>
        {status !== 'loading' && (
          <p className="text-sm text-muted-foreground">
            You can close this window.
          </p>
        )}
      </div>
    </div>
  );
}
