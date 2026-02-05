// New Ticket Page - Submit a new support ticket
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTicketStore } from '@breeder/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  TicketCategory,
  TicketPriority,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
} from '@breeder/types';
import { ArrowLeft, Send, Loader2, Bug, Lightbulb, HelpCircle, CreditCard, Wrench, MessageSquare } from 'lucide-react';

const CATEGORY_ICONS: Record<TicketCategory, React.ReactNode> = {
  bug_report: <Bug className="h-5 w-5" />,
  feature_request: <Lightbulb className="h-5 w-5" />,
  account_issue: <HelpCircle className="h-5 w-5" />,
  billing: <CreditCard className="h-5 w-5" />,
  technical_support: <Wrench className="h-5 w-5" />,
  general_inquiry: <MessageSquare className="h-5 w-5" />,
  other: <HelpCircle className="h-5 w-5" />,
};

export function NewTicket() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { createTicket, loading } = useTicketStore();
  const { toast } = useToast();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general_inquiry');
  const [priority, setPriority] = useState<TicketPriority>('medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast({
        title: 'Subject Required',
        description: 'Please enter a subject for your ticket.',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please describe your issue or request.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const ticketId = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      });

      toast({
        title: 'Ticket Submitted',
        description: 'Your support ticket has been created successfully.',
      });

      navigate(`/support/tickets/${ticketId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create ticket. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Support Ticket</h1>
          <p className="text-muted-foreground">
            Describe your issue and we'll help you resolve it
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Ticket</CardTitle>
          <CardDescription>
            Fill out the form below to create a new support request. Our team will respond as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(TICKET_CATEGORY_LABELS) as TicketCategory[]).map(
                  (cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={category === cat ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center gap-2"
                      onClick={() => setCategory(cat)}
                    >
                      {CATEGORY_ICONS[cat]}
                      <span className="text-xs text-center">
                        {TICKET_CATEGORY_LABELS[cat]}
                      </span>
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TicketPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    Low - General question, no urgency
                  </SelectItem>
                  <SelectItem value="medium">
                    Medium - Issue affecting workflow
                  </SelectItem>
                  <SelectItem value="high">
                    High - Significant impact on operations
                  </SelectItem>
                  <SelectItem value="urgent">
                    Urgent - Critical issue, needs immediate attention
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {subject.length}/200 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide as much detail as possible. Include steps to reproduce the issue if applicable."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                The more detail you provide, the faster we can help you.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/support')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
