import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Copy, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { OAuthCredentials } from '@breeder/types';

interface OAuthSetupDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  provider: 'gmail' | 'outlook';
  onComplete: (credentials: OAuthCredentials) => void;
}

export function OAuthSetupDialog({ open, setOpen, provider, onComplete }: OAuthSetupDialogProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const redirectUri = `${window.location.origin}/auth/${provider}/callback`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const handleComplete = () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both Client ID and Client Secret',
        variant: 'destructive',
      });
      return;
    }

    onComplete({
      provider,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      redirectUri,
    });

    // Reset form
    setClientId('');
    setClientSecret('');
    setCurrentStep(1);
  };

  const gmailSteps = [
    {
      title: 'Create Google Cloud Project',
      content: (
        <div className="space-y-3">
          <p className="text-sm">First, you'll need to create a Google Cloud project to get OAuth credentials.</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              Google Cloud Console <ExternalLink className="h-3 w-3" />
            </a></li>
            <li>Click "Create Project" or select an existing project</li>
            <li>Name your project (e.g., "My Breeder App Email")</li>
            <li>Click "Create"</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Enable Gmail API',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Next, enable the Gmail API for your project.</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>In the Google Cloud Console, go to "APIs & Services" → "Library"</li>
            <li>Search for "Gmail API"</li>
            <li>Click on "Gmail API" and then click "Enable"</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Configure OAuth Consent Screen',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Configure how users will see your OAuth consent screen.</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to "APIs & Services" → "OAuth consent screen"</li>
            <li>Select "External" user type</li>
            <li>Fill in:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>App name: Your Breeder App Name</li>
                <li>User support email: Your email</li>
                <li>Developer contact: Your email</li>
              </ul>
            </li>
            <li>Click "Save and Continue"</li>
            <li>On "Scopes" page, add these scopes:
              <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                <li>gmail.readonly</li>
                <li>gmail.send</li>
                <li>gmail.modify</li>
                <li>userinfo.email</li>
              </ul>
            </li>
            <li>Add your email as a test user</li>
            <li>Click "Save and Continue"</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Create OAuth Credentials',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Now create the OAuth 2.0 credentials you'll need.</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to "APIs & Services" → "Credentials"</li>
            <li>Click "Create Credentials" → "OAuth client ID"</li>
            <li>Select "Web application"</li>
            <li>Name it (e.g., "Breeder App Web Client")</li>
            <li>Under "Authorized redirect URIs", click "Add URI" and enter:
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded font-mono text-xs">
                <code className="flex-1">{redirectUri}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(redirectUri, 'Redirect URI')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </li>
            <li>Click "Create"</li>
            <li className="font-semibold text-primary">Copy your Client ID and Client Secret - you'll enter them below!</li>
          </ol>
        </div>
      ),
    },
  ];

  const outlookSteps = [
    {
      title: 'Register Application in Azure',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Create an app registration in Azure Active Directory.</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              Azure Portal <ExternalLink className="h-3 w-3" />
            </a></li>
            <li>Navigate to "Azure Active Directory" → "App registrations"</li>
            <li>Click "New registration"</li>
            <li>Fill in:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Name: Your Breeder App</li>
                <li>Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"</li>
                <li>Redirect URI: Select "Web" and enter the URI below</li>
              </ul>
            </li>
            <li>Click "Register"</li>
          </ol>
          <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded font-mono text-xs">
            <code className="flex-1">{redirectUri}</code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopy(redirectUri, 'Redirect URI')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Configure API Permissions',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Add the necessary permissions for email access.</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>In your app registration, go to "API permissions"</li>
            <li>Click "Add a permission"</li>
            <li>Select "Microsoft Graph"</li>
            <li>Select "Delegated permissions"</li>
            <li>Add these permissions:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Mail.Read</li>
                <li>Mail.Send</li>
                <li>User.Read</li>
              </ul>
            </li>
            <li>Click "Add permissions"</li>
            <li>If you have admin rights, click "Grant admin consent"</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Create Client Secret',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Generate a client secret for authentication.</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to "Certificates & secrets"</li>
            <li>Click "New client secret"</li>
            <li>Add a description (e.g., "Breeder App Secret")</li>
            <li>Select expiry (24 months recommended)</li>
            <li>Click "Add"</li>
            <li className="font-semibold text-destructive">⚠️ Copy the secret value immediately - it won't be shown again!</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Get Your Credentials',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Finally, gather the credentials you'll need to enter below.</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to "Overview" in your app registration</li>
            <li>Copy the "Application (client) ID" - this is your <strong>Client ID</strong></li>
            <li>Use the client secret you copied earlier - this is your <strong>Client Secret</strong></li>
            <li>Enter both values in the form below</li>
          </ol>
        </div>
      ),
    },
  ];

  const steps = provider === 'gmail' ? gmailSteps : outlookSteps;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Set Up {provider === 'gmail' ? 'Gmail' : 'Outlook'} Integration
          </DialogTitle>
          <DialogDescription>
            Follow these steps to create your own OAuth credentials for email integration
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Each user needs their own OAuth credentials. This ensures your email integration is secure and independent.
            The setup takes about 5-10 minutes.
          </AlertDescription>
        </Alert>

        <Tabs value={`step${currentStep}`} onValueChange={(value) => setCurrentStep(parseInt(value.replace('step', '')))} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {steps.map((_, index) => (
              <TabsTrigger
                key={index}
                value={`step${index + 1}`}
                className="text-xs"
              >
                Step {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {steps.map((step, index) => (
            <TabsContent key={index} value={`step${index + 1}`} className="space-y-4 mt-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    {index + 1}
                  </span>
                  {step.title}
                </h3>
                {step.content}
              </Card>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                {currentStep < steps.length ? (
                  <Button onClick={() => setCurrentStep(currentStep + 1)}>
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentStep(currentStep + 1)}>
                    Enter Credentials
                  </Button>
                )}
              </div>
            </TabsContent>
          ))}

          <TabsContent value={`step${steps.length + 1}`} className="space-y-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Enter Your OAuth Credentials
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">
                    Client ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder={provider === 'gmail' ? '123456789-abc123.apps.googleusercontent.com' : '12345678-1234-1234-1234-123456789abc'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {provider === 'gmail' ? 'From Google Cloud Console → Credentials' : 'From Azure Portal → App Overview'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientSecret">
                    Client Secret <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Enter your client secret"
                  />
                  <p className="text-xs text-muted-foreground">
                    {provider === 'gmail' ? 'From Google Cloud Console → Credentials' : 'From Azure Portal → Certificates & secrets'}
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Note:</strong> These credentials will be stored securely and used only to authenticate
                    your email access. Never share them with anyone.
                  </AlertDescription>
                </Alert>
              </div>
            </Card>

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(steps.length)}
              >
                Back to Instructions
              </Button>
              <Button onClick={handleComplete}>
                Complete Setup
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => {
            setOpen(false);
            setClientId('');
            setClientSecret('');
            setCurrentStep(1);
          }}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
