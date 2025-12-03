import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Inquiry, ActivityLog } from '@/types/dog';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/lib/emailjs';
import { useBreederStore } from '@/store/breederStore';
import { arrayUnion } from 'firebase/firestore';

interface SendWaitlistDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  inquiry: Inquiry | null;
  userId: string;
}

export function SendWaitlistDialog({ open, setOpen, inquiry, userId }: SendWaitlistDialogProps) {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const updateInquiry = useBreederStore((state) => state.updateInquiry);
  const profile = useBreederStore((state) => state.profile);

  const handleSend = async () => {
    if (!inquiry) return;

    // Check if EmailJS is configured
    const publicKey = profile?.emailjsPublicKey || EMAILJS_CONFIG.PUBLIC_KEY;
    const serviceId = profile?.emailjsServiceId || EMAILJS_CONFIG.SERVICE_ID;
    const templateId = profile?.emailjsWaitlistTemplateId || EMAILJS_CONFIG.WAITLIST_TEMPLATE_ID;

    if (!publicKey || !serviceId || !templateId) {
      setStatus('error');
      setErrorMessage('EmailJS is not configured. Please configure it in Settings > Email Configuration.');
      return;
    }

    setSending(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const waitlistUrl = `${window.location.origin}/waitlist-apply/${userId}?inquiryId=${inquiry.id}`;

      // Send email via EmailJS
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: inquiry.email,
          to_name: inquiry.name,
          waitlist_url: waitlistUrl,
          from_name: profile?.kennelName || profile?.breederName || 'Our Breeding Program',
        },
        publicKey
      );

      // Create activity log entry
      const activityEntry: ActivityLog = {
        timestamp: new Date().toISOString(),
        action: 'Waitlist email sent',
        details: `Waitlist application link sent to ${inquiry.email}`,
        performedBy: userId,
      };

      // Update inquiry with timestamp and activity log
      await updateInquiry(inquiry.id, {
        waitlistEmailSent: new Date().toISOString(),
        activityLog: [...(inquiry.activityLog || []), activityEntry],
      });

      setStatus('success');

      // Close dialog after 2 seconds on success
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
      }, 2000);
    } catch (error: any) {
      console.error('Error sending email:', error);
      setStatus('error');
      setErrorMessage(error?.text || 'Failed to send email. Please check your EmailJS configuration.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setOpen(false);
      setStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Waitlist Application Link</DialogTitle>
          <DialogDescription>
            {status === 'idle' && (
              <>
                Send an automated email to <strong>{inquiry?.name}</strong> ({inquiry?.email}) with a link to complete the waitlist application?
              </>
            )}
            {status === 'success' && 'Email sent successfully!'}
            {status === 'error' && 'Failed to send email'}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' && (
          <div className="flex items-center justify-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
            <div className="bg-muted p-4 rounded text-xs">
              <p className="font-semibold mb-2">EmailJS Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Sign up at emailjs.com</li>
                <li>Create an email service (Gmail, Outlook, etc.)</li>
                <li>Create a new email template</li>
                <li>
                  <strong>IMPORTANT:</strong> In the "To Email" field of your template settings, use:
                  <code className="bg-background px-1 ml-1">{`{{to_email}}`}</code>
                </li>
                <li>In the template content, use variables: {`{{to_name}}`}, {`{{waitlist_url}}`}, {`{{from_name}}`}</li>
                <li>Add your credentials in Settings → Email Configuration</li>
              </ol>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className="bg-muted p-4 rounded text-sm">
            <p className="font-semibold mb-2">The email will include:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Personalized greeting</li>
              <li>Link to waitlist application</li>
              <li>Pre-filled contact information</li>
            </ul>
          </div>
        )}

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sending ? 'Sending...' : 'Send Email'}
              </Button>
            </>
          )}
          {status === 'error' && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
