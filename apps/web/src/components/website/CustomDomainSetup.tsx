import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteStore } from '@breeder/firebase';
import { DomainStatus } from '@breeder/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import { httpsCallable, getFunctions } from 'firebase/functions';

interface CustomDomainSetupProps {
  disabled?: boolean;
}

const CNAME_TARGET = 'websites.expertbreeder.com';

const STATUS_CONFIG: Record<DomainStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: 'Pending Setup',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  verifying: {
    label: 'Verifying DNS',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  verified: {
    label: 'DNS Verified',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  active: {
    label: 'Active',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  failed: {
    label: 'Verification Failed',
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  suspended: {
    label: 'Suspended',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

export function CustomDomainSetup({ disabled = false }: CustomDomainSetupProps) {
  const { currentUser } = useAuth();
  const { websiteSettings, updateDomainSettings } = useWebsiteStore();
  const { toast } = useToast();

  const [domain, setDomain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const currentDomain = websiteSettings?.domain?.customDomain;
  const currentStatus = websiteSettings?.domain?.customDomainStatus || 'pending';
  const verificationError = websiteSettings?.domain?.verificationError;
  const statusConfig = STATUS_CONFIG[currentStatus];

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const validateDomain = (value: string): string | null => {
    if (!value) return 'Domain is required';

    // Remove protocol if present
    let cleanDomain = value.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Basic domain validation
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(cleanDomain)) {
      return 'Please enter a valid domain (e.g., www.yourkennel.com)';
    }

    // Don't allow expertbreeder.com subdomains
    if (cleanDomain.endsWith('.expertbreeder.com') || cleanDomain === 'expertbreeder.com') {
      return 'Cannot use expertbreeder.com domains. Use the Subdomain feature instead.';
    }

    return null;
  };

  const handleSaveDomain = async () => {
    if (!currentUser || disabled) return;

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();

    const error = validateDomain(cleanDomain);
    if (error) {
      toast({
        title: 'Invalid Domain',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateDomainSettings(currentUser.uid, {
        customDomain: cleanDomain,
        customDomainStatus: 'pending',
        verificationError: undefined,
      });

      toast({
        title: 'Domain Saved',
        description: 'Please configure your DNS settings to complete setup',
      });
      setDomain('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save domain',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!currentUser || !currentDomain) return;

    setIsVerifying(true);
    try {
      // Call Firebase Function to verify domain
      const functions = getFunctions();
      const verifyDomain = httpsCallable(functions, 'verifyCustomDomain');

      const result = await verifyDomain({ domain: currentDomain });
      const data = result.data as { success: boolean; status: DomainStatus; error?: string };

      if (data.success) {
        toast({
          title: 'Domain Verified',
          description: 'Your custom domain is now active',
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: data.error || 'DNS records not found. Please check your configuration.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      // If function doesn't exist yet, show a helpful message
      if (error.code === 'functions/not-found') {
        toast({
          title: 'Verification Pending',
          description: 'Domain verification service is being set up. Please try again later.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Verification Error',
          description: error.message || 'Failed to verify domain',
          variant: 'destructive',
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      await updateDomainSettings(currentUser.uid, {
        customDomain: undefined,
        customDomainStatus: undefined,
        customDomainVerifiedAt: undefined,
        verificationError: undefined,
        sslStatus: undefined,
      });

      toast({
        title: 'Domain Removed',
        description: 'Your custom domain has been removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove domain',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // If no custom domain is configured, show setup form
  if (!currentDomain) {
    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Custom Domain Setup</AlertTitle>
          <AlertDescription>
            Connect your own domain (e.g., www.yourkennel.com) to your Expert Breeder website.
            You'll need access to your domain's DNS settings to complete the setup.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customDomain">Your Domain</Label>
            <div className="flex gap-2">
              <Input
                id="customDomain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="www.yourkennel.com"
                disabled={disabled || isSaving}
              />
              <Button
                onClick={handleSaveDomain}
                disabled={disabled || isSaving || !domain}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add Domain'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your domain without http:// or https://
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Custom domain is configured, show status and DNS instructions
  return (
    <div className="space-y-6">
      {/* Current Domain Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">{currentDomain}</CardTitle>
                <CardDescription>Custom domain</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={statusConfig.color}>
              {statusConfig.icon}
              <span className="ml-1">{statusConfig.label}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Error</AlertTitle>
              <AlertDescription>{verificationError}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyDomain}
              disabled={isVerifying || currentStatus === 'active'}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {currentStatus === 'active' ? 'Verified' : 'Verify DNS'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveDomain}
              disabled={isSaving}
            >
              Remove Domain
            </Button>
            {currentStatus === 'active' && (
              <a
                href={`https://${currentDomain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Site
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      {currentStatus !== 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DNS Configuration</CardTitle>
            <CardDescription>
              Add the following CNAME record to your domain's DNS settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              {/* Record Type */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Type</p>
                  <p className="font-mono">CNAME</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Name/Host</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono">{currentDomain.startsWith('www.') ? 'www' : '@'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopy(currentDomain.startsWith('www.') ? 'www' : '@', 'Host')}
                    >
                      {copied === 'Host' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Value/Target</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs break-all">{CNAME_TARGET}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => handleCopy(CNAME_TARGET, 'Target')}
                    >
                      {copied === 'Target' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>DNS Propagation</AlertTitle>
              <AlertDescription>
                DNS changes can take up to 48 hours to propagate, though most changes take effect within a few hours.
                Click "Verify DNS" after making changes to check if the configuration is complete.
              </AlertDescription>
            </Alert>

            {/* Common DNS Provider Instructions */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Where to add DNS records:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>GoDaddy:</strong> DNS Management → Add Record → CNAME</li>
                <li><strong>Namecheap:</strong> Advanced DNS → Add New Record → CNAME</li>
                <li><strong>Cloudflare:</strong> DNS → Records → Add Record → CNAME</li>
                <li><strong>Google Domains:</strong> DNS → Custom Records → CNAME</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SSL Status */}
      {currentStatus === 'verified' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>SSL Certificate Provisioning</AlertTitle>
          <AlertDescription>
            Your DNS is verified. We're now provisioning an SSL certificate for your domain.
            This may take a few minutes.
          </AlertDescription>
        </Alert>
      )}

      {currentStatus === 'active' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Domain Active</AlertTitle>
          <AlertDescription className="text-green-700">
            Your custom domain is fully configured and active. Visitors can now access your website at{' '}
            <a
              href={`https://${currentDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              https://{currentDomain}
            </a>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
