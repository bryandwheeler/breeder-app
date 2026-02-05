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
import {
  AlertCircle,
  Check,
  Copy,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  FileSignature,
  TestTube,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { SignNowConfig, DEFAULT_SIGNNOW_CONFIG } from '@breeder/types';

export function SignNowSettings() {
  const [config, setConfig] = useState<SignNowConfig>(DEFAULT_SIGNNOW_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load SignNow config from Firestore
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configRef = doc(db, 'adminSettings', 'signNow');
        const configDoc = await getDoc(configRef);

        if (configDoc.exists()) {
          setConfig({
            ...DEFAULT_SIGNNOW_CONFIG,
            ...(configDoc.data() as Partial<SignNowConfig>),
          });
        }
      } catch (err) {
        console.error('Error loading SignNow config:', err);
        setError('Failed to load SignNow configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Generate basic auth token from client credentials
  const generateBasicAuthToken = (clientId: string, clientSecret: string): string => {
    if (!clientId || !clientSecret) return '';
    return btoa(`${clientId}:${clientSecret}`);
  };

  // Update basic auth token when credentials change
  useEffect(() => {
    const newToken = generateBasicAuthToken(config.clientId, config.clientSecret);
    if (newToken !== config.basicAuthToken) {
      setConfig((prev) => ({ ...prev, basicAuthToken: newToken }));
    }
  }, [config.clientId, config.clientSecret, config.basicAuthToken]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!config.clientId.trim()) {
        throw new Error('Client ID is required');
      }
      if (!config.clientSecret.trim()) {
        throw new Error('Client Secret is required');
      }

      // Save to Firestore
      const configRef = doc(db, 'adminSettings', 'signNow');
      await setDoc(configRef, {
        ...config,
        isConfigured: Boolean(config.clientId && config.clientSecret),
        updatedAt: new Date().toISOString(),
      });

      setSuccess('SignNow settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!config.clientId || !config.clientSecret) {
        throw new Error('Please enter Client ID and Client Secret first');
      }

      // Test by attempting to get an access token
      const apiUrl = config.testMode
        ? 'https://api-eval.signnow.com'
        : 'https://api.signnow.com';

      const response = await fetch(`${apiUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${config.basicAuthToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials&scope=*',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || `API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.access_token) {
        setSuccess('Connection successful! SignNow API is working.');
        setConfig((prev) => ({
          ...prev,
          lastVerified: new Date().toISOString(),
        }));
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Connection test failed';
      setError(message);
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const maskValue = (value: string): string => {
    if (!value || value.length < 8) return '••••••••';
    return `${value.slice(0, 4)}${'•'.repeat(value.length - 8)}${value.slice(-4)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
            <p className='text-muted-foreground'>
              Loading SignNow configuration...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Status Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className='bg-green-50 border-green-200'>
          <Check className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-800'>
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <FileSignature className='h-5 w-5' />
                SignNow E-Signature
              </CardTitle>
              <CardDescription>
                {config.isConfigured
                  ? 'SignNow is configured and ready for e-signatures'
                  : 'Configure SignNow to enable digital contract signing'}
              </CardDescription>
            </div>
            <Badge
              variant={config.isConfigured ? 'default' : 'secondary'}
              className={config.isConfigured ? 'bg-green-600' : ''}
            >
              {config.isConfigured ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <p className='text-sm font-medium'>Mode</p>
              <Badge variant={config.testMode ? 'secondary' : 'default'}>
                {config.testMode ? 'Sandbox (Test)' : 'Production'}
              </Badge>
            </div>
            <div>
              <p className='text-sm font-medium'>API URL</p>
              <p className='text-sm text-muted-foreground font-mono'>
                {config.testMode ? 'api-eval.signnow.com' : 'api.signnow.com'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium'>Last Verified</p>
              <p className='text-sm text-muted-foreground'>
                {config.lastVerified
                  ? new Date(config.lastVerified).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Get these from your SignNow Developer Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Client ID */}
          <div className='space-y-2'>
            <Label htmlFor='client-id'>Client ID</Label>
            <div className='flex gap-2'>
              <Input
                id='client-id'
                type={showKeys ? 'text' : 'password'}
                value={config.clientId}
                onChange={(e) =>
                  setConfig({ ...config, clientId: e.target.value })
                }
                placeholder='Your SignNow Client ID'
                className='font-mono text-sm'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(config.clientId, 'clientId')}
                disabled={!config.clientId}
              >
                {copiedField === 'clientId' ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Found in SignNow Dashboard → API → Applications
            </p>
          </div>

          {/* Client Secret */}
          <div className='space-y-2'>
            <Label htmlFor='client-secret'>Client Secret</Label>
            <div className='flex gap-2'>
              <Input
                id='client-secret'
                type={showKeys ? 'text' : 'password'}
                value={config.clientSecret}
                onChange={(e) =>
                  setConfig({ ...config, clientSecret: e.target.value })
                }
                placeholder='Your SignNow Client Secret'
                className='font-mono text-sm'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(config.clientSecret, 'clientSecret')}
                disabled={!config.clientSecret}
              >
                {copiedField === 'clientSecret' ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Keep this secret! Used for API authentication
            </p>
          </div>

          {/* Show/Hide Keys */}
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowKeys(!showKeys)}
            className='w-full'
          >
            {showKeys ? (
              <>
                <EyeOff className='h-4 w-4 mr-2' />
                Hide Credentials
              </>
            ) : (
              <>
                <Eye className='h-4 w-4 mr-2' />
                Show Credentials
              </>
            )}
          </Button>

          {/* Basic Auth Token (auto-generated) */}
          {config.basicAuthToken && (
            <div className='space-y-2'>
              <Label>Basic Auth Token (Auto-generated)</Label>
              <div className='flex gap-2'>
                <Input
                  type='text'
                  value={showKeys ? config.basicAuthToken : maskValue(config.basicAuthToken)}
                  readOnly
                  className='font-mono text-sm bg-muted'
                />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => copyToClipboard(config.basicAuthToken, 'basicAuth')}
                >
                  {copiedField === 'basicAuth' ? (
                    <Check className='h-4 w-4 text-green-600' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>
                Base64 encoded credentials for API authentication
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Configure webhooks to receive signing events
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='webhook-secret'>Webhook Secret</Label>
            <div className='flex gap-2'>
              <Input
                id='webhook-secret'
                type={showKeys ? 'text' : 'password'}
                value={config.webhookSecret}
                onChange={(e) =>
                  setConfig({ ...config, webhookSecret: e.target.value })
                }
                placeholder='Your webhook signing secret'
                className='font-mono text-sm'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(config.webhookSecret, 'webhook')}
                disabled={!config.webhookSecret}
              >
                {copiedField === 'webhook' ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Used to verify webhook requests from SignNow
            </p>
          </div>

          <Alert className='bg-blue-50 border-blue-200'>
            <AlertCircle className='h-4 w-4 text-blue-600' />
            <AlertDescription className='text-blue-800'>
              <strong>Webhook URL:</strong> Configure this URL in your SignNow dashboard
              <code className='block mt-1 p-2 bg-blue-100 rounded text-xs break-all'>
                https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/handleSignNowWebhook
              </code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Mode</CardTitle>
          <CardDescription>
            Switch between sandbox (test) and production mode
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert className='bg-yellow-50 border-yellow-200'>
            <AlertCircle className='h-4 w-4 text-yellow-600' />
            <AlertDescription className='text-yellow-800'>
              Use Sandbox mode during development and testing. Switch to
              Production only when ready to process real contracts.
            </AlertDescription>
          </Alert>
          <div className='flex gap-2'>
            <Button
              onClick={() =>
                setConfig({
                  ...config,
                  testMode: true,
                  apiUrl: 'https://api-eval.signnow.com',
                })
              }
              variant={config.testMode ? 'default' : 'outline'}
              className='flex-1'
            >
              <TestTube className='h-4 w-4 mr-2' />
              Sandbox Mode
            </Button>
            <Button
              onClick={() =>
                setConfig({
                  ...config,
                  testMode: false,
                  apiUrl: 'https://api.signnow.com',
                })
              }
              variant={!config.testMode ? 'default' : 'outline'}
              className='flex-1'
            >
              Production Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Test Connection</CardTitle>
          <CardDescription>
            Verify your SignNow credentials are working
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleTestConnection}
            disabled={testing || !config.clientId || !config.clientSecret}
            variant='outline'
            className='w-full'
          >
            {testing ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
                Testing Connection...
              </>
            ) : (
              <>
                <TestTube className='h-4 w-4 mr-2' />
                Test API Connection
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className='p-6'>
          <Button
            onClick={handleSave}
            disabled={saving}
            size='lg'
            className='w-full'
          >
            <Save className='h-4 w-4 mr-2' />
            {saving ? 'Saving...' : 'Save SignNow Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card className='bg-muted/50'>
        <CardContent className='p-6'>
          <p className='text-sm text-muted-foreground mb-4'>
            Need help setting up SignNow? Visit their developer documentation.
          </p>
          <Button variant='outline' size='sm' asChild>
            <a
              href='https://docs.signnow.com/'
              target='_blank'
              rel='noopener noreferrer'
            >
              <ExternalLink className='h-4 w-4 mr-2' />
              SignNow Developer Docs
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
