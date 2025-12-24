import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Send, X, AlertCircle, FileText, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { sendGmailMessage } from '@/lib/emailIntegration';
import { useEmailStore } from '@breeder/firebase';
import { useEmailTemplateStore } from '@breeder/firebase';
import { useScheduledEmailStore } from '@breeder/firebase';
import { useBreederStore } from '@breeder/firebase';
import { useCrmStore } from '@breeder/firebase';
import { EmailDraft } from '@breeder/types';
import { replaceEmailVariables, VariableContext } from '@/lib/emailVariables';
import { useAuth } from '@/contexts/AuthContext';

interface EmailComposeProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  defaultTo?: string;
  customerId?: string;
  onSent?: () => void;
}

export function EmailCompose({ open, setOpen, defaultTo, customerId, onSent }: EmailComposeProps) {
  const { currentUser } = useAuth();
  const { integration } = useEmailStore();
  const { templates, loadTemplates } = useEmailTemplateStore();
  const { scheduleEmail } = useScheduledEmailStore();
  const { profile } = useBreederStore();
  const { customers } = useCrmStore();

  const [to, setTo] = useState(defaultTo || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Scheduling state
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Load templates on mount
  useEffect(() => {
    if (currentUser && open) {
      loadTemplates(currentUser.uid);
    }
  }, [currentUser, open, loadTemplates]);

  // Reset defaultTo when it changes
  useEffect(() => {
    setTo(defaultTo || '');
  }, [defaultTo]);

  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateId('');
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);

    // Find customer if customerId is provided
    const customer = customerId
      ? customers.find((c) => c.id === customerId)
      : undefined;

    // Build variable context
    const context: VariableContext = {
      customer,
      breederProfile: profile || undefined,
    };

    // Replace variables in template
    const processedSubject = replaceEmailVariables(template.subject, context);
    const processedBody = replaceEmailVariables(template.body, context);

    setSubject(processedSubject);
    setBody(processedBody);
  };

  const handleSend = async () => {
    if (!currentUser) return;

    if (!integration || !integration.accessToken) {
      toast({
        title: 'Email Not Connected',
        description: 'Please connect your email account in settings first.',
        variant: 'destructive',
      });
      return;
    }

    if (!to.trim()) {
      toast({
        title: 'Missing Recipient',
        description: 'Please enter at least one recipient email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: 'Missing Subject',
        description: 'Please enter an email subject.',
        variant: 'destructive',
      });
      return;
    }

    // Validate scheduling fields if enabled
    if (scheduleForLater) {
      if (!scheduledDate || !scheduledTime) {
        toast({
          title: 'Missing Schedule',
          description: 'Please select both date and time for scheduled email.',
          variant: 'destructive',
        });
        return;
      }

      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        toast({
          title: 'Invalid Schedule',
          description: 'Scheduled time must be in the future.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSending(true);

    try {
      const toEmails = to.split(',').map(email => email.trim()).filter(Boolean);
      const ccEmails = cc ? cc.split(',').map(email => email.trim()).filter(Boolean) : undefined;

      // If scheduling for later
      if (scheduleForLater) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

        await scheduleEmail({
          userId: currentUser.uid,
          to: toEmails,
          cc: ccEmails,
          subject: subject.trim(),
          body: body.trim(),
          htmlBody: body.trim().replace(/\n/g, '<br>'),
          scheduledFor: scheduledDateTime.toISOString(),
          timezone,
          source: 'manual',
          customerId,
        });

        toast({
          title: 'Email Scheduled',
          description: `Your email will be sent on ${scheduledDateTime.toLocaleString()}.`,
        });
      } else {
        // Send immediately
        const draft: EmailDraft = {
          to: toEmails,
          cc: ccEmails,
          subject: subject.trim(),
          body: body.trim(),
          htmlBody: body.trim().replace(/\n/g, '<br>'),
          customerId,
        };

        if (integration.provider === 'gmail') {
          await sendGmailMessage(integration.accessToken, draft);
        } else {
          // Outlook implementation would go here
          throw new Error('Outlook not yet implemented');
        }

        toast({
          title: 'Email Sent',
          description: 'Your email has been sent successfully.',
        });
      }

      // Reset form
      setTo(defaultTo || '');
      setCc('');
      setSubject('');
      setBody('');
      setSelectedTemplateId('');
      setScheduleForLater(false);
      setScheduledDate('');
      setScheduledTime('');
      setOpen(false);

      if (onSent) {
        onSent();
      }
    } catch (error) {
      console.error('Error sending/scheduling email:', error);
      toast({
        title: scheduleForLater ? 'Failed to Schedule' : 'Failed to Send',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </DialogTitle>
        </DialogHeader>

        {!integration ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Email integration is not configured. Please go to Settings to connect your email account.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Template Selector */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="template">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Use Template (Optional)
                </Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template or write from scratch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Templates will auto-fill with customer information
                </p>
              </div>
            )}

            {/* From */}
            <div className="space-y-2">
              <Label>From</Label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm">{integration.email}</span>
                <Badge variant="secondary" className="text-xs capitalize">
                  {integration.provider}
                </Badge>
              </div>
            </div>

            {/* To */}
            <div className="space-y-2">
              <Label htmlFor="to">
                To <span className="text-destructive">*</span>
              </Label>
              <Input
                id="to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                disabled={sending}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple recipients with commas
              </p>
            </div>

            {/* CC */}
            {showCc ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cc">CC</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCc(false);
                      setCc('');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  id="cc"
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  disabled={sending}
                />
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowCc(true)}>
                + Add CC
              </Button>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
                disabled={sending}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here..."
                rows={12}
                disabled={sending}
              />
            </div>

            {/* Schedule for Later */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Label htmlFor="schedule">Schedule for Later</Label>
                </div>
                <Switch
                  id="schedule"
                  checked={scheduleForLater}
                  onCheckedChange={setScheduleForLater}
                />
              </div>

              {scheduleForLater && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">
                      <CalendarIcon className="h-3 w-3 inline mr-1" />
                      Date
                    </Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={sending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Time
                    </Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      disabled={sending}
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Timezone: {timezone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !integration}>
            {sending ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
