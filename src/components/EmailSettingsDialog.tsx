import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getEmailConfig, setEmailConfig, isEmailConfigured } from '@/lib/emailService';
import { Mail, ExternalLink } from 'lucide-react';

interface EmailSettingsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function EmailSettingsDialog({ open, setOpen }: EmailSettingsDialogProps) {
  const [serviceId, setServiceId] = useState('');
  const [publicKey, setPublicKey] = useState('');

  useEffect(() => {
    const config = getEmailConfig();
    if (config) {
      setServiceId(config.serviceId);
      setPublicKey(config.publicKey);
    }
  }, [open]);

  const handleSave = () => {
    setEmailConfig({ serviceId, publicKey });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Mail className='h-5 w-5' /> Email Settings
          </DialogTitle>
          <DialogDescription>
            Configure EmailJS to send notifications to buyers
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='bg-muted p-3 rounded-lg text-sm'>
            <p className='font-medium mb-2'>Setup Instructions:</p>
            <ol className='list-decimal list-inside space-y-1 text-muted-foreground'>
              <li>Create free account at <a href='https://www.emailjs.com' target='_blank' rel='noopener' className='text-primary hover:underline inline-flex items-center gap-1'>emailjs.com <ExternalLink className='h-3 w-3' /></a></li>
              <li>Create an email service (Gmail, Outlook, etc.)</li>
              <li>Create email templates for notifications</li>
              <li>Copy your Service ID and Public Key below</li>
            </ol>
          </div>

          <div>
            <Label htmlFor='serviceId'>Service ID</Label>
            <Input
              id='serviceId'
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder='service_xxxxxxx'
            />
          </div>

          <div>
            <Label htmlFor='publicKey'>Public Key</Label>
            <Input
              id='publicKey'
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder='Your EmailJS public key'
            />
          </div>

          <div className='text-xs text-muted-foreground'>
            Free tier: 200 emails/month. Templates needed:
            <ul className='list-disc list-inside mt-1'>
              <li>puppy_update - For sending puppy updates</li>
              <li>reservation_confirm - Reservation confirmations</li>
              <li>pickup_reminder - Pickup date reminders</li>
            </ul>
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EmailSettingsButton() {
  const [open, setOpen] = useState(false);
  const configured = isEmailConfigured();

  return (
    <>
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <Mail className={`mr-2 h-4 w-4 ${configured ? 'text-green-500' : ''}`} />
        Email {configured ? '(Configured)' : '(Not Set)'}
      </Button>
      <EmailSettingsDialog open={open} setOpen={setOpen} />
    </>
  );
}
