import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, AlertCircle } from 'lucide-react';
import { Customer } from '@breeder/types';
import { useToast } from '@/hooks/use-toast';

interface SendSmsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onSent?: () => void;
}

export function SendSmsDialog({
  open,
  onOpenChange,
  customer,
  onSent,
}: SendSmsDialogProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const phoneNumber = customer.smsPhoneNumber || customer.phone;
  const canSend = !!phoneNumber && customer.smsOptIn !== false;

  const handleSend = async () => {
    if (!message.trim() || !canSend) return;

    setSending(true);
    try {
      // TODO: Integrate with SMS provider (Twilio, etc.)
      // For now, we'll log the interaction and open the native SMS app

      // Create SMS link for native app
      const smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      window.open(smsLink, '_blank');

      toast({
        title: 'Opening SMS app',
        description: `Ready to send message to ${customer.name}`,
      });

      setMessage('');
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const characterCount = message.length;
  const segmentCount = Math.ceil(characterCount / 160) || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageCircle className='h-5 w-5' />
            Send Text Message
          </DialogTitle>
          <DialogDescription>
            Send a text message to {customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {!canSend && (
            <div className='flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'>
              <AlertCircle className='h-5 w-5 mt-0.5 flex-shrink-0' />
              <div className='text-sm'>
                {!phoneNumber
                  ? 'No phone number available for this contact.'
                  : 'This contact has opted out of SMS communications.'}
              </div>
            </div>
          )}

          <div>
            <Label className='text-sm text-muted-foreground'>To</Label>
            <div className='flex items-center gap-2 mt-1'>
              <span className='font-medium'>{customer.name}</span>
              {phoneNumber && (
                <Badge variant='outline' className='font-mono'>
                  {phoneNumber}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor='sms-message'>Message</Label>
            <Textarea
              id='sms-message'
              placeholder='Type your message...'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className='mt-1.5 resize-none'
              disabled={!canSend}
            />
            <div className='flex justify-between mt-1.5 text-xs text-muted-foreground'>
              <span>
                {characterCount} characters
                {segmentCount > 1 && ` (${segmentCount} segments)`}
              </span>
              <span>160 chars per segment</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim() || !canSend}
          >
            <Send className='mr-2 h-4 w-4' />
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
