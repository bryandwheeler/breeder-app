import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function InstagramCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Instagram connection...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'Authorization was denied or cancelled');

      // Send error message to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'instagram-oauth-error',
            error: errorDescription || error,
          },
          window.location.origin
        );

        // Close popup after a delay
        setTimeout(() => {
          window.close();
        }, 2000);
      }
      return;
    }

    if (code) {
      setStatus('success');
      setMessage('Instagram account authorized successfully!');

      // Send success message to parent window with authorization code
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'instagram-oauth-success',
            code,
          },
          window.location.origin
        );

        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      }
    } else {
      setStatus('error');
      setMessage('No authorization code received');

      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'instagram-oauth-error',
            error: 'No authorization code received',
          },
          window.location.origin
        );
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center space-y-4">
          {status === 'processing' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-semibold">Processing...</h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
              <h2 className="text-xl font-semibold text-green-700">Success!</h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">
                This window will close automatically...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-600" />
              <h2 className="text-xl font-semibold text-red-700">Connection Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">
                You can close this window and try again.
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
