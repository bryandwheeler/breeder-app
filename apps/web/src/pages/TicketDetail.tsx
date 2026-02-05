// Ticket Detail Page - View and respond to a support ticket
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTicketStore } from '@breeder/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  TicketMessage,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_CATEGORY_LABELS,
} from '@breeder/types';
import {
  ArrowLeft,
  Send,
  Clock,
  User,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    currentTicket,
    currentTicketMessages,
    loading,
    subscribeToTicket,
    subscribeToTicketMessages,
    addMessage,
    closeTicket,
    reopenTicket,
  } = useTicketStore();

  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to ticket and messages
  useEffect(() => {
    if (!ticketId) return;

    const unsubTicket = subscribeToTicket(ticketId);
    const unsubMessages = subscribeToTicketMessages(ticketId);

    return () => {
      unsubTicket();
      unsubMessages();
    };
  }, [ticketId, subscribeToTicket, subscribeToTicketMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTicketMessages]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !ticketId) return;

    setSubmitting(true);
    try {
      await addMessage(ticketId, {
        content: replyContent.trim(),
        isInternal: false,
      });
      setReplyContent('');
      toast({
        title: 'Reply Sent',
        description: 'Your message has been added to the ticket.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reply. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticketId) return;

    try {
      await closeTicket(ticketId);
      toast({
        title: 'Ticket Closed',
        description: 'The ticket has been closed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to close ticket.',
        variant: 'destructive',
      });
    }
  };

  const handleReopenTicket = async () => {
    if (!ticketId) return;

    try {
      await reopenTicket(ticketId);
      toast({
        title: 'Ticket Reopened',
        description: 'The ticket has been reopened.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reopen ticket.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!currentTicket) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isOwnTicket = currentTicket.submitterId === currentUser?.uid;
  const isClosed = currentTicket.status === 'closed';
  const isResolved = currentTicket.status === 'resolved';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground font-mono">
              {currentTicket.ticketNumber}
            </span>
            <Badge variant={getStatusBadgeVariant(currentTicket.status)}>
              {TICKET_STATUS_LABELS[currentTicket.status]}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{currentTicket.subject}</h1>
        </div>
        <div className="flex gap-2">
          {isOwnTicket && !isClosed && (
            <Button variant="outline" onClick={handleCloseTicket}>
              Close Ticket
            </Button>
          )}
          {isOwnTicket && isClosed && (
            <Button variant="outline" onClick={handleReopenTicket}>
              Reopen Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] p-4">
                <div className="space-y-4">
                  {currentTicketMessages
                    .filter((m) => !m.isInternal)
                    .map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.senderId === currentUser?.uid}
                      />
                    ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Reply Form */}
              {!isClosed && (
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyContent.trim() || submitting}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}

              {isClosed && (
                <div className="border-t p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground text-center">
                    This ticket is closed. Reopen it to continue the conversation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ticket Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Category</label>
                <p className="font-medium">
                  {TICKET_CATEGORY_LABELS[currentTicket.category]}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Priority</label>
                <p className="font-medium">
                  {TICKET_PRIORITY_LABELS[currentTicket.priority]}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Created</label>
                <p className="font-medium">
                  {format(new Date(currentTicket.createdAt), 'PPp')}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Last Updated</label>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(currentTicket.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {currentTicket.assignedToName && (
                <div>
                  <label className="text-sm text-muted-foreground">
                    Assigned To
                  </label>
                  <p className="font-medium">{currentTicket.assignedToName}</p>
                </div>
              )}
              {currentTicket.resolvedAt && (
                <div>
                  <label className="text-sm text-muted-foreground">Resolved</label>
                  <p className="font-medium">
                    {format(new Date(currentTicket.resolvedAt), 'PPp')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card>
            <CardContent className="pt-6">
              {currentTicket.status === 'waiting_on_customer' && (
                <div className="flex items-start gap-3 text-amber-600">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Action Required</p>
                    <p className="text-sm">
                      We're waiting for your response to continue.
                    </p>
                  </div>
                </div>
              )}
              {currentTicket.status === 'waiting_on_support' && (
                <div className="flex items-start gap-3 text-blue-600">
                  <Clock className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Waiting for Support</p>
                    <p className="text-sm">
                      Our team will respond as soon as possible.
                    </p>
                  </div>
                </div>
              )}
              {currentTicket.status === 'resolved' && (
                <div className="flex items-start gap-3 text-green-600">
                  <CheckCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Resolved</p>
                    <p className="text-sm">
                      This issue has been resolved. Close the ticket if you're
                      satisfied.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isOwn,
}: {
  message: TicketMessage;
  isOwn: boolean;
}) {
  const isSupport = ['admin', 'support'].includes(message.senderRole);

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={isSupport ? 'bg-primary text-primary-foreground' : ''}>
          {isSupport ? 'S' : message.senderName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={`flex-1 max-w-[80%] ${isOwn ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          {!isOwn && (
            <span className="font-medium text-sm">
              {isSupport ? 'Support Team' : message.senderName}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), 'MMM d, h:mm a')}
          </span>
        </div>
        <div
          className={`rounded-lg p-3 ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
