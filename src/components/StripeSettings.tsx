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
import { AlertCircle, Check, Copy, Save, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  priceBuilder: string;
  pricePro: string;
  webhookSecret: string;
  testMode: boolean;
  isConfigured: boolean;
}

const defaultConfig: StripeConfig = {
  publishableKey: '',
  secretKey: '',
  priceBuilder: '',
  pricePro: '',
  webhookSecret: '',
  testMode: true,
  isConfigured: false,
};

export function StripeSettings() {
  const [config, setConfig] = useState<StripeConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load Stripe config from Firestore
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configRef = doc(db, 'admin', 'stripeConfig');
        const configDoc = await getDoc(configRef);

        if (configDoc.exists()) {
          setConfig({
            ...defaultConfig,
            ...(configDoc.data() as Partial<StripeConfig>),
          });
        }
      } catch (err) {
        console.error('Error loading Stripe config:', err);
        setError('Failed to load Stripe configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!config.publishableKey.trim()) {
        throw new Error('Publishable key is required');
      }
      if (!config.secretKey.trim()) {
        throw new Error('Secret key is required');
      }
      if (!config.priceBuilder.trim()) {
        throw new Error('Builder price ID is required');
      }
      if (!config.pricePro.trim()) {
        throw new Error('Pro price ID is required');
      }
      if (!config.webhookSecret.trim()) {
        throw new Error('Webhook secret is required');
      }

      // Save to Firestore
      const configRef = doc(db, 'admin', 'stripeConfig');
      await setDoc(configRef, {
        ...config,
        isConfigured: true,
        updatedAt: new Date(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
            <p className='text-muted-foreground'>
              Loading Stripe configuration...
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
            Stripe settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Configuration Status</CardTitle>
              <CardDescription>
                {config.isConfigured
                  ? 'Stripe is configured and ready to use'
                  : 'Stripe needs to be configured'}
              </CardDescription>
            </div>
            <Badge
              variant={config.isConfigured ? 'default' : 'secondary'}
              className={config.isConfigured ? 'bg-green-600' : ''}
            >
              {config.isConfigured ? 'Configured' : 'Incomplete'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm font-medium'>Mode</p>
              <Badge variant={config.testMode ? 'secondary' : 'default'}>
                {config.testMode ? 'Test Mode' : 'Live Mode'}
              </Badge>
            </div>
            <div>
              <p className='text-sm font-medium'>Prices Configured</p>
              <p className='text-sm text-muted-foreground'>
                {config.priceBuilder && config.pricePro ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Get these from your Stripe Dashboard (Developers → API Keys)
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Publishable Key */}
          <div className='space-y-2'>
            <Label htmlFor='publishable-key'>Publishable Key</Label>
            <div className='flex gap-2'>
              <Input
                id='publishable-key'
                type={showKeys ? 'text' : 'password'}
                value={config.publishableKey}
                onChange={(e) =>
                  setConfig({ ...config, publishableKey: e.target.value })
                }
                placeholder='pk_test_...'
                className='font-mono text-sm'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() =>
                  copyToClipboard(config.publishableKey, 'publishable')
                }
              >
                {copiedField === 'publishable' ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Safe to expose in frontend code
            </p>
          </div>

          {/* Secret Key */}
          <div className='space-y-2'>
            <Label htmlFor='secret-key'>Secret Key</Label>
            <div className='flex gap-2'>
              <Input
                id='secret-key'
                type={showKeys ? 'text' : 'password'}
                value={config.secretKey}
                onChange={(e) =>
                  setConfig({ ...config, secretKey: e.target.value })
                }
                placeholder='sk_test_...'
                className='font-mono text-sm'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(config.secretKey, 'secret')}
              >
                {copiedField === 'secret' ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              ⚠️ Keep this secret! Never expose in frontend
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
                Hide Keys
              </>
            ) : (
              <>
                <Eye className='h-4 w-4 mr-2' />
                Show Keys
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Prices Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Prices</CardTitle>
          <CardDescription>
            Get Price IDs from your Stripe Dashboard (Products → Pricing)
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Builder Price */}
          <div className='space-y-2'>
            <Label htmlFor='price-builder'>
              Builder Plan Price ID
              <span className='text-muted-foreground ml-2 text-sm font-normal'>
                ($29/month)
              </span>
            </Label>
            <div className='flex gap-2'>
              <Input
                id='price-builder'
                value={config.priceBuilder}
                onChange={(e) =>
                  setConfig({ ...config, priceBuilder: e.target.value })
                }
                placeholder='price_...'
                className='font-mono text-sm'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(config.priceBuilder, 'builder')}
              >
                {copiedField === 'builder' ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>

          {/* Pro Price */}
          <div className='space-y-2'>
            <Label htmlFor='price-pro'>
              Pro Plan Price ID
              <span className='text-muted-foreground ml-2 text-sm font-normal'>
                ($79/month)
              </span>
            </Label>
            <div className='flex gap-2'>
              <Input
                id='price-pro'
                value={config.pricePro}
                onChange={(e) =>
                  setConfig({ ...config, pricePro: e.target.value })
                }
                placeholder='price_...'
                className='font-mono text-sm'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(config.pricePro, 'pro')}
              >
                {copiedField === 'pro' ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Secret</CardTitle>
          <CardDescription>
            Get this from Stripe Dashboard (Developers → Webhooks)
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Label htmlFor='webhook-secret'>Signing Secret</Label>
          <div className='flex gap-2'>
            <Input
              id='webhook-secret'
              type={showKeys ? 'text' : 'password'}
              value={config.webhookSecret}
              onChange={(e) =>
                setConfig({ ...config, webhookSecret: e.target.value })
              }
              placeholder='whsec_...'
              className='font-mono text-sm'
            />
            <Button
              variant='outline'
              size='icon'
              onClick={() => copyToClipboard(config.webhookSecret, 'webhook')}
            >
              {copiedField === 'webhook' ? (
                <Check className='h-4 w-4 text-green-600' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            ⚠️ Keep this secret! Used to verify webhook calls
          </p>
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Mode</CardTitle>
          <CardDescription>Switch between test and live mode</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert className='bg-blue-50 border-blue-200'>
            <AlertCircle className='h-4 w-4 text-blue-600' />
            <AlertDescription className='text-blue-800'>
              Use Test Mode during development. Switch to Live Mode only after
              testing everything.
            </AlertDescription>
          </Alert>
          <div className='flex gap-2'>
            <Button
              onClick={() => setConfig({ ...config, testMode: true })}
              variant={config.testMode ? 'default' : 'outline'}
              className='flex-1'
            >
              Test Mode
            </Button>
            <Button
              onClick={() => setConfig({ ...config, testMode: false })}
              variant={!config.testMode ? 'default' : 'outline'}
              className='flex-1'
            >
              Live Mode
            </Button>
          </div>
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
            {saving ? 'Saving...' : 'Save Stripe Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card className='bg-muted/50'>
        <CardContent className='p-6'>
          <p className='text-sm text-muted-foreground mb-4'>
            Need help setting up Stripe? Check the full setup guide.
          </p>
          <Button variant='outline' size='sm' asChild>
            <a href='/help' target='_blank' rel='noopener noreferrer'>
              View Setup Documentation
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
