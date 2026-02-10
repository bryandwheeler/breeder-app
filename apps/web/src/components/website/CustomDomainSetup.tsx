import { useState, useEffect } from 'react';
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

// Firebase Hosting target for CNAME (subdomains like www)
const CNAME_TARGET = 'expert-breeder.web.app';
// Firebase Hosting IP for A records (root/apex domains)
const FIREBASE_HOSTING_IP = '199.36.158.100';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: 'Pending Setup',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  pending_verification: {
    label: 'Awaiting Verification',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  verifying: {
    label: 'Verifying',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  verified: {
    label: 'Verified - Provisioning SSL',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
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
  const [isRemoving, setIsRemoving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const currentDomain = websiteSettings?.domain?.customDomain;
  const currentStatus = websiteSettings?.domain?.customDomainStatus || 'pending';
  const verificationError = websiteSettings?.domain?.verificationError;
  const verificationToken = websiteSettings?.domain?.verificationToken;
  const acmeChallengeToken = websiteSettings?.domain?.acmeChallengeToken;
  const aRecords = websiteSettings?.domain?.aRecords;
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;

  // Auto-refresh status when pending verification or verified (SSL provisioning)
  useEffect(() => {
    if (!currentDomain || !currentUser) return;
    if (currentStatus !== 'pending_verification' && currentStatus !== 'verified') return;

    const interval = setInterval(() => {
      handleCheckStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentDomain, currentStatus, currentUser]);

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
      // Call Firebase Function to add domain to Firebase Hosting
      const functions = getFunctions();
      const addDomain = httpsCallable(functions, 'addCustomDomainToHosting');

      const result = await addDomain({ domain: cleanDomain });
      const data = result.data as {
        success: boolean;
        domain: string;
        status: string;
        verificationToken?: string;
        aRecords?: string[];
        message: string;
      };

      if (data.success) {
        toast({
          title: 'Domain Added',
          description: data.message,
        });
        setDomain('');
      } else {
        throw new Error(data.message || 'Failed to add domain');
      }
    } catch (error: any) {
      console.error('Error adding domain:', error);

      // Fallback: save to Firestore directly if function fails
      try {
        await updateDomainSettings(currentUser.uid, {
          customDomain: cleanDomain,
          customDomainStatus: 'pending' as DomainStatus,
        });
        toast({
          title: 'Domain Saved',
          description: 'Domain saved. Please contact support to complete setup.',
        });
        setDomain('');
      } catch (fallbackError: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to add domain',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!currentUser || !currentDomain) return;

    setIsVerifying(true);
    try {
      const functions = getFunctions();
      const getStatus = httpsCallable(functions, 'getCustomDomainStatus');

      const result = await getStatus({ domain: currentDomain });
      const data = result.data as {
        success: boolean;
        status: string;
        sslStatus: string;
        message: string;
        verificationToken?: string;
        aRecords?: string[];
      };

      if (data.success) {
        if (data.status === 'active') {
          toast({
            title: 'Domain Active',
            description: 'Your custom domain is now live with SSL!',
          });
        } else {
          toast({
            title: 'Status Updated',
            description: data.message,
          });
        }
      }
    } catch (error: any) {
      console.error('Error checking status:', error);
      // Silent fail for auto-refresh, only show toast on manual check
      if (!error.code?.includes('not-found')) {
        toast({
          title: 'Status Check Failed',
          description: error.message || 'Could not check domain status',
          variant: 'destructive',
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!currentUser || !currentDomain) return;

    setIsRemoving(true);
    try {
      // Call Firebase Function to remove domain from Firebase Hosting
      const functions = getFunctions();
      const removeDomain = httpsCallable(functions, 'removeCustomDomainFromHosting');

      await removeDomain({ domain: currentDomain });

      toast({
        title: 'Domain Removed',
        description: 'Your custom domain has been removed',
      });
    } catch (error: any) {
      console.error('Error removing domain:', error);

      // Fallback: clear from Firestore directly
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
          description: 'Domain configuration cleared',
        });
      } catch (fallbackError: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to remove domain',
          variant: 'destructive',
        });
      }
    } finally {
      setIsRemoving(false);
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
            We'll automatically configure SSL certificates for secure HTTPS access.
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
              Enter your domain without http:// or https://. We recommend using www. prefix.
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
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>{verificationError}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckStatus}
              disabled={isVerifying || currentStatus === 'active'}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {currentStatus === 'active' ? 'Verified' : 'Check Status'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveDomain}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
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

      {/* All Required DNS Records - unified card */}
      {(currentStatus === 'pending_verification' || currentStatus === 'verified' || currentStatus === 'pending' || currentStatus === 'failed') && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-base">Required DNS Records</CardTitle>
            <CardDescription>
              Add all of the following records at your domain registrar's DNS settings for <strong>{currentDomain}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Record 1: A Record or CNAME */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                {currentDomain.startsWith('www.') ? 'CNAME Record' : 'A Record'} — Point Your Domain
              </p>
              {currentDomain.startsWith('www.') ? (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Type</p>
                    <p className="font-mono">CNAME</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Name/Host</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono">www</p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleCopy('www', 'Host')}>
                        {copied === 'Host' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Value/Target</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs break-all">{CNAME_TARGET}</p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => handleCopy(CNAME_TARGET, 'Target')}>
                        {copied === 'Target' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {(aRecords && aRecords.length > 0 ? aRecords : [FIREBASE_HOSTING_IP]).map((ip, index) => (
                    <div key={ip} className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Type</p>
                        <p className="font-mono">A</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Name/Host</p>
                        <p className="font-mono">@</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Value</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono">{ip}</p>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleCopy(ip, `IP ${index + 1}`)}>
                            {copied === `IP ${index + 1}` ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-1">
                    Root domains must use A records (not CNAME). Do NOT create a CNAME for your root domain.
                  </p>
                </>
              )}
            </div>

            {/* Record 2: Ownership TXT Record */}
            {verificationToken && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                  TXT Record — Domain Ownership Verification
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Type</p>
                    <p className="font-mono">TXT</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Name/Host</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono">@</p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleCopy('@', 'TXT Host')}>
                        {copied === 'TXT Host' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Value</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs break-all">{verificationToken}</p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => handleCopy(verificationToken, 'TXT Value')}>
                        {copied === 'TXT Value' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-amber-800">
                  This proves you own the domain. Required for Firebase to verify ownership.
                </p>
              </div>
            )}

            {/* Record 3: ACME Challenge TXT Record */}
            {acmeChallengeToken && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{verificationToken ? '3' : '2'}</span>
                  TXT Record — SSL Certificate Verification
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Type</p>
                    <p className="font-mono">TXT</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Name/Host</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono">_acme-challenge</p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleCopy('_acme-challenge', 'ACME Host')}>
                        {copied === 'ACME Host' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Value</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs break-all">{acmeChallengeToken}</p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => handleCopy(acmeChallengeToken, 'ACME Value')}>
                        {copied === 'ACME Value' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-800">
                  Required for SSL certificate issuance. Without this, your site won't have HTTPS.
                </p>
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>DNS Propagation</AlertTitle>
              <AlertDescription>
                DNS changes can take up to 48 hours to propagate, though most changes take effect within a few minutes.
                Click "Check Status" after making changes.
              </AlertDescription>
            </Alert>

            {/* WWW and Non-WWW Setup Guide */}
            <details className="text-sm border rounded-lg">
              <summary className="font-medium cursor-pointer hover:bg-muted/50 p-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span>Setting Up Both WWW and Non-WWW Versions</span>
              </summary>

              <div className="p-4 pt-0 space-y-4">
                {/* Explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-900 mb-2">Why does this matter?</p>
                  <p className="text-blue-800">
                    Visitors may type your domain with or without "www". Setting up both versions ensures
                    no one gets an error, and helps with search engine optimization (SEO).
                  </p>
                </div>

                {/* Root vs Subdomain Explanation */}
                <div className="space-y-3">
                  <p className="font-medium">Understanding DNS Record Types:</p>

                  <div className="grid gap-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">A Record</span>
                        Root/Apex Domain (yoursite.com)
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Root domains (without www) <strong>cannot use CNAME</strong> records due to DNS specification rules.
                        They must use A records pointing directly to an IP address.
                      </p>
                      <div className="mt-2 font-mono text-xs bg-white rounded p-2 border">
                        Type: A | Name: @ | Value: 199.36.158.100
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">CNAME</span>
                        Subdomain (www.yoursite.com)
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Subdomains like "www" <strong>can use CNAME</strong> records, which are easier to manage
                        because they point to a hostname instead of an IP address.
                      </p>
                      <div className="mt-2 font-mono text-xs bg-white rounded p-2 border">
                        Type: CNAME | Name: www | Value: {CNAME_TARGET}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Setup */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-3">Recommended: Set Up Both Versions</p>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      For the best experience, configure both your root domain and www subdomain:
                    </p>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="font-medium text-green-900 mb-2">Option 1: WWW as Primary (Recommended)</p>
                      <ol className="list-decimal list-inside space-y-1 text-green-800">
                        <li>Add your domain here as: <strong>www.yourdomain.com</strong></li>
                        <li>Create a CNAME record: www → {CNAME_TARGET}</li>
                        <li>Set up a redirect from yourdomain.com → www.yourdomain.com at your registrar</li>
                      </ol>
                      <p className="text-xs text-green-700 mt-2 italic">
                        Most domain registrars offer free "forwarding" or "redirect" options for this.
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="font-medium mb-2">Option 2: Root Domain as Primary</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Add your domain here as: <strong>yourdomain.com</strong> (no www)</li>
                        <li>Create an A record: @ → 199.36.158.100</li>
                        <li>Create a CNAME record: www → {CNAME_TARGET}</li>
                        <li>Both will work, but www will show as the alternate</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Provider-specific redirect instructions */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-3">How to Set Up Redirects (by provider):</p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold">GoDaddy:</p>
                      <p>Domains → Forwarding → Add forwarding from yourdomain.com to www.yourdomain.com</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold">Namecheap:</p>
                      <p>Domain List → Manage → Redirect Domain → Add URL Redirect</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold">Cloudflare:</p>
                      <p>Rules → Page Rules → Create "Forward URL" rule (or use Bulk Redirects)</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold">Google Domains:</p>
                      <p>Website → Forwarding → Add a forwarding address</p>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* Root Domain Warning - Always show for non-www domains */}
            {!currentDomain.startsWith('www.') && (
              <Alert variant="destructive" className="border-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important: Root Domain Requires A Record</AlertTitle>
                <AlertDescription>
                  <p>
                    Your domain <strong>{currentDomain}</strong> is a root/apex domain.
                  </p>
                  <p className="mt-2 font-semibold text-red-800">
                    Root domains CANNOT use CNAME records (DNS specification). You MUST use an A record:
                  </p>
                  <div className="mt-2 font-mono text-sm bg-red-100 rounded p-3 border border-red-200">
                    <div className="grid grid-cols-3 gap-2">
                      <span>Type: <strong>A</strong></span>
                      <span>Name: <strong>@</strong></span>
                      <span className="flex items-center gap-2">
                        Value: <strong>{FIREBASE_HOSTING_IP}</strong>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => handleCopy(FIREBASE_HOSTING_IP, 'Firebase IP')}
                        >
                          {copied === 'Firebase IP' ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm">
                    <strong>Common mistake:</strong> Setting up a CNAME to point to another domain will NOT work for root domains.
                    Make sure your DNS provider shows an <strong>A record</strong> (not CNAME) pointing to <strong>{FIREBASE_HOSTING_IP}</strong>.
                  </p>
                  <p className="mt-2 text-sm italic">
                    Alternatively, use <strong>www.{currentDomain}</strong> which can use a CNAME record.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Troubleshooting Section */}
            <details className="text-sm border rounded-lg border-rose-200 bg-rose-50">
              <summary className="font-medium cursor-pointer hover:bg-rose-100 p-3 flex items-center gap-2 text-rose-900">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <span>Troubleshooting: Domain Still Pending?</span>
              </summary>

              <div className="p-4 pt-2 space-y-4 text-rose-900">
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border border-rose-200">
                    <p className="font-semibold flex items-center gap-2 mb-2">
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">Common Issue</span>
                      CNAME Instead of A Record
                    </p>
                    <p className="text-sm text-rose-800">
                      If you set up a CNAME record for a root domain (like <code className="bg-rose-100 px-1 rounded">{currentDomain}</code>),
                      it may appear to work in some DNS lookups but <strong>Firebase cannot verify ownership</strong>.
                    </p>
                    <p className="text-sm text-rose-800 mt-2">
                      <strong>Fix:</strong> Delete any CNAME record and create an A record pointing to <code className="bg-rose-100 px-1 rounded">{FIREBASE_HOSTING_IP}</code>
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded border border-rose-200">
                    <p className="font-semibold flex items-center gap-2 mb-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">Check</span>
                      CDN or Proxy Enabled
                    </p>
                    <p className="text-sm text-rose-800">
                      If you're using Cloudflare or another CDN with proxying enabled (orange cloud),
                      Firebase cannot verify the domain because requests go through the CDN.
                    </p>
                    <p className="text-sm text-rose-800 mt-2">
                      <strong>Fix:</strong> Disable proxying (set to "DNS only" / gray cloud) until verification completes.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded border border-rose-200">
                    <p className="font-semibold flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Verify</span>
                      Check Your DNS Records
                    </p>
                    <p className="text-sm text-rose-800">
                      Use a free DNS lookup tool to verify your records are correct:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        href={`https://dnschecker.org/#A/${currentDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 inline-flex items-center gap-1"
                      >
                        DNS Checker <ExternalLink className="h-3 w-3" />
                      </a>
                      <a
                        href={`https://www.whatsmydns.net/#A/${currentDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 inline-flex items-center gap-1"
                      >
                        WhatsMyDNS <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-xs text-rose-700 mt-2">
                      The A record should show: <strong>{FIREBASE_HOSTING_IP}</strong> (not a CNAME, not Cloudflare IPs)
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded border border-rose-200">
                    <p className="font-semibold flex items-center gap-2 mb-2">
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Required</span>
                      All DNS Records for {currentDomain}
                    </p>
                    <div className="mt-2 space-y-2 text-xs font-mono">
                      <div className="bg-gray-100 p-2 rounded">
                        <strong>A Record:</strong> @ → {FIREBASE_HOSTING_IP}
                      </div>
                      {acmeChallengeToken && (
                        <div className="bg-gray-100 p-2 rounded">
                          <strong>TXT Record:</strong> _acme-challenge → {acmeChallengeToken.substring(0, 20)}...
                        </div>
                      )}
                      {verificationToken && (
                        <div className="bg-gray-100 p-2 rounded">
                          <strong>TXT Record:</strong> @ → {verificationToken.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* Common DNS Provider Instructions */}
            <details className="text-sm text-muted-foreground">
              <summary className="font-medium cursor-pointer hover:text-foreground">
                Step-by-step instructions by DNS provider
              </summary>

              <div className="mt-3 space-y-3 text-xs">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-semibold mb-1">GoDaddy</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Log in to your GoDaddy account</li>
                    <li>Go to My Products → Domains → DNS</li>
                    <li>Click "Add" under DNS Records</li>
                    <li>Select Type: <strong>{aRecords?.length ? 'A' : 'CNAME'}</strong></li>
                    <li>Name: <strong>{currentDomain.startsWith('www.') ? 'www' : '@'}</strong></li>
                    <li>Value: <strong>{aRecords?.length ? aRecords[0] : CNAME_TARGET}</strong></li>
                    <li>TTL: 1 hour (or default)</li>
                    <li>Click Save{aRecords && aRecords.length > 1 ? ', then repeat for other IP addresses' : ''}</li>
                  </ol>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-semibold mb-1">Namecheap</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Log in to Namecheap Dashboard</li>
                    <li>Go to Domain List → Manage → Advanced DNS</li>
                    <li>Click "Add New Record"</li>
                    <li>Type: <strong>{aRecords?.length ? 'A' : 'CNAME'}</strong></li>
                    <li>Host: <strong>{currentDomain.startsWith('www.') ? 'www' : '@'}</strong></li>
                    <li>Target: <strong>{aRecords?.length ? aRecords[0] : CNAME_TARGET}</strong></li>
                    <li>TTL: Automatic</li>
                    <li>Click the checkmark to save</li>
                  </ol>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-semibold mb-1">Cloudflare</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Log in to Cloudflare Dashboard</li>
                    <li>Select your domain → DNS → Records</li>
                    <li>Click "Add record"</li>
                    <li>Type: <strong>{aRecords?.length ? 'A' : 'CNAME'}</strong></li>
                    <li>Name: <strong>{currentDomain.startsWith('www.') ? 'www' : '@'}</strong></li>
                    <li>Target: <strong>{aRecords?.length ? aRecords[0] : CNAME_TARGET}</strong></li>
                    <li>Proxy status: <strong>DNS only (gray cloud)</strong> - Required for Firebase SSL</li>
                    <li>Click Save</li>
                  </ol>
                  <p className="mt-2 text-muted-foreground italic">
                    Note: Keep proxy disabled (gray cloud) so Firebase can issue SSL certificates.
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-semibold mb-1">Google Domains / Squarespace Domains</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Log in to your Google/Squarespace account</li>
                    <li>Go to DNS settings for your domain</li>
                    <li>Under Custom Records, click "Manage custom records"</li>
                    <li>Click "Create new record"</li>
                    <li>Type: <strong>{aRecords?.length ? 'A' : 'CNAME'}</strong></li>
                    <li>Host name: <strong>{currentDomain.startsWith('www.') ? 'www' : '@'}</strong></li>
                    <li>Data: <strong>{aRecords?.length ? aRecords[0] : CNAME_TARGET}</strong></li>
                    <li>Click Save</li>
                  </ol>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      {/* SSL Status */}
      {currentStatus === 'verified' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>SSL Certificate Provisioning</AlertTitle>
          <AlertDescription>
            Your domain ownership is verified. We're now provisioning an SSL certificate.
            This usually takes 10-15 minutes but can take up to 24 hours.
          </AlertDescription>
        </Alert>
      )}

      {currentStatus === 'active' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Domain Active</AlertTitle>
          <AlertDescription className="text-green-700">
            Your custom domain is fully configured with SSL. Visitors can now access your website at{' '}
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
