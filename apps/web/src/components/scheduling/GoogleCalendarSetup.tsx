import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { functions, db } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, Link2, Unlink, Loader2, CheckCircle2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

interface TokenData {
  googleEmail?: string;
  connectedAt?: { seconds: number };
}

export function GoogleCalendarSetup() {
  const { currentUser } = useAuth();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Listen for token document changes (real-time)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'googleCalendarTokens', currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          setTokenData(snap.data() as TokenData);
        } else {
          setTokenData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to Google Calendar tokens:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const handleConnect = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert('Google Calendar integration is not configured. Please set VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    setConnecting(true);

    const redirectUri = `${window.location.origin}/oauth/google-calendar/callback`;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: currentUser?.uid || '',
    });

    // Open in a popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      'google-calendar-auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for the popup to complete
    const checkInterval = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkInterval);
        setConnecting(false);
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? Existing calendar events will not be removed.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const disconnect = httpsCallable(functions, 'disconnectGoogleCalendar');
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      alert('Failed to disconnect Google Calendar. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const isConnected = !!tokenData;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Google Calendar Sync
          </Label>
          <p className="text-sm text-muted-foreground">
            Sync bookings with your Google Calendar
          </p>
        </div>
      </div>

      {isConnected ? (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Connected
              </p>
              {tokenData.googleEmail && (
                <p className="text-xs text-green-600 dark:text-green-500">
                  {tokenData.googleEmail}
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Unlink className="h-3 w-3 mr-1" />
            )}
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your Google Calendar to automatically create events when customers book appointments.
            New bookings will appear on your calendar, and cancelled bookings will be removed.
          </p>
          <Button
            variant="outline"
            onClick={handleConnect}
            disabled={connecting || !GOOGLE_CLIENT_ID}
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Connect Google Calendar
          </Button>
          {!GOOGLE_CLIENT_ID && (
            <p className="text-xs text-amber-600">
              Google Calendar integration requires configuration. Contact support.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
