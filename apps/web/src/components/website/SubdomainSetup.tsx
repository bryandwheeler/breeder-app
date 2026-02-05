import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteStore } from '@breeder/firebase';
import { RESERVED_SUBDOMAINS } from '@breeder/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  Check,
  X,
  Loader2,
  ExternalLink,
  Copy,
  AlertCircle,
} from 'lucide-react';

export function SubdomainSetup() {
  const { currentUser } = useAuth();
  const { websiteSettings, checkSubdomainAvailability, claimSubdomain } = useWebsiteStore();
  const { toast } = useToast();

  const [subdomain, setSubdomain] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if subdomain is already claimed
  const hasSubdomain = websiteSettings?.domain?.subdomain;
  const currentSubdomain = websiteSettings?.domain?.subdomain || '';
  const websiteUrl = hasSubdomain
    ? `https://${currentSubdomain}.expertbreeder.com`
    : '';

  // Validate subdomain format
  const validateSubdomain = (value: string): string | null => {
    const normalized = value.toLowerCase().trim();

    if (normalized.length < 3) {
      return 'Subdomain must be at least 3 characters';
    }

    if (normalized.length > 30) {
      return 'Subdomain must be 30 characters or less';
    }

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized) && normalized.length >= 3) {
      if (/^[^a-z0-9]/.test(normalized)) {
        return 'Subdomain must start with a letter or number';
      }
      if (/[^a-z0-9]$/.test(normalized)) {
        return 'Subdomain must end with a letter or number';
      }
      if (/[^a-z0-9-]/.test(normalized)) {
        return 'Subdomain can only contain letters, numbers, and hyphens';
      }
    }

    if (RESERVED_SUBDOMAINS.includes(normalized)) {
      return 'This subdomain is reserved';
    }

    return null;
  };

  // Check availability when subdomain changes
  useEffect(() => {
    const checkAvailability = async () => {
      const normalized = subdomain.toLowerCase().trim();

      if (normalized.length < 3) {
        setIsAvailable(null);
        return;
      }

      const error = validateSubdomain(normalized);
      if (error) {
        setValidationError(error);
        setIsAvailable(null);
        return;
      }

      setValidationError(null);
      setIsChecking(true);

      try {
        const available = await checkSubdomainAvailability(normalized);
        setIsAvailable(available);
      } catch (error) {
        console.error('Error checking subdomain:', error);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    const debounce = setTimeout(checkAvailability, 500);
    return () => clearTimeout(debounce);
  }, [subdomain, checkSubdomainAvailability]);

  const handleClaimSubdomain = async () => {
    if (!currentUser || !isAvailable) return;

    setIsClaiming(true);
    try {
      await claimSubdomain(currentUser.uid, subdomain.toLowerCase().trim());
      toast({
        title: 'Subdomain Claimed',
        description: `Your website is now available at ${subdomain.toLowerCase()}.expertbreeder.com`,
      });
      setSubdomain('');
      setIsAvailable(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim subdomain',
        variant: 'destructive',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard',
    });
  };

  // Already has subdomain - show current setup
  if (hasSubdomain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Your Website URL
          </CardTitle>
          <CardDescription>
            Your website is live at this address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Globe className="h-5 w-5 text-primary" />
            <code className="flex-1 text-sm font-mono">{websiteUrl}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(websiteUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Active
            </Badge>
            {websiteSettings?.websiteEnabled ? (
              <Badge className="bg-green-100 text-green-800">Published</Badge>
            ) : (
              <Badge variant="outline">Unpublished</Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Share this URL with potential customers to showcase your kennel.
          </p>
        </CardContent>
      </Card>
    );
  }

  // No subdomain yet - show setup form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Claim Your Subdomain
        </CardTitle>
        <CardDescription>
          Choose a subdomain for your breeder website. This will be your website's address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subdomain">Subdomain</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                id="subdomain"
                placeholder="yourkennel"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                className="pr-10"
              />
              {isChecking && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!isChecking && isAvailable === true && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {!isChecking && isAvailable === false && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
              )}
            </div>
            <span className="text-muted-foreground">.expertbreeder.com</span>
          </div>

          {validationError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationError}
            </p>
          )}

          {!validationError && isAvailable === true && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              This subdomain is available!
            </p>
          )}

          {!validationError && isAvailable === false && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <X className="h-3 w-3" />
              This subdomain is already taken
            </p>
          )}
        </div>

        {subdomain && isAvailable && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Your website URL will be:
            </p>
            <code className="text-sm font-mono font-medium">
              https://{subdomain.toLowerCase()}.expertbreeder.com
            </code>
          </div>
        )}

        <Button
          onClick={handleClaimSubdomain}
          disabled={!isAvailable || isClaiming}
          className="w-full"
        >
          {isClaiming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 mr-2" />
              Claim Subdomain
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Subdomain requirements:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>3-30 characters</li>
            <li>Letters, numbers, and hyphens only</li>
            <li>Must start and end with a letter or number</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
