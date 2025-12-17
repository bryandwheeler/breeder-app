import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  User,
  Send,
  Paperclip,
  Image as ImageIcon,
  Tag,
  Archive,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Conversation, Message, MessageDirection, MessageStatus } from '@/types/messaging';
import { Customer } from '@/types/dog';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface ConversationThreadProps {
  conversation: Conversation;
  onArchive?: () => void;
}

export function ConversationThread({ conversation, onArchive }: ConversationThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    if (!conversation.id) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversation.id),
      orderBy('sentAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);

      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [conversation.id]);

  // Load customer if linked
  useEffect(() => {
    if (!conversation.contactId) {
      setCustomer(null);
      return;
    }

    const loadCustomer = async () => {
      try {
        const customerDoc = await getDoc(doc(db, 'customers', conversation.contactId!));
        if (customerDoc.exists()) {
          setCustomer({ id: customerDoc.id, ...customerDoc.data() } as Customer);
        }
      } catch (error) {
        console.error('Error loading customer:', error);
      }
    };

    loadCustomer();
  }, [conversation.contactId]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || isSending || !user?.uid) return;

    // Check 24-hour window for Instagram
    if (conversation.channel === 'instagram') {
      if (!conversation.isWithin24HourWindow) {
        toast({
          title: 'Cannot Send Message',
          description: 'The 24-hour messaging window has expired for this Instagram conversation.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSending(true);

    try {
      // Create message in Firestore
      const newMessage: Partial<Message> = {
        conversationId: conversation.id,
        userId: user.uid,
        content: messageContent.trim(),
        contentType: 'text',
        direction: 'outbound',
        status: 'pending',
        senderId: user.uid,
        recipientId: conversation.instagramSenderId || conversation.contactUsername || '',
        platform: conversation.channel,
        platformAccountId: conversation.channelAccountId,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const messageRef = await addDoc(collection(db, 'messages'), newMessage);

      // Update conversation
      await updateDoc(doc(db, 'conversations', conversation.id), {
        lastMessageAt: serverTimestamp(),
        lastMessagePreview: messageContent.trim().substring(0, 100),
        lastMessageDirection: 'outbound',
        messageCount: (conversation.messageCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      // Send via API (this will be handled by backend)
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          messageId: messageRef.id,
          conversationId: conversation.id,
          content: messageContent.trim(),
          channel: conversation.channel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setMessageContent('');
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully',
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Failed to Send',
        description: error.message || 'Could not send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full">
      {/* Main conversation area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.contactProfilePicture} />
                <AvatarFallback>
                  {conversation.contactName?.[0] || conversation.contactUsername?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {conversation.contactName || conversation.contactUsername || 'Unknown'}
                  {customer && (
                    <Badge variant="outline" className="text-xs">
                      Linked to Customer
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {conversation.contactUsername && `@${conversation.contactUsername}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 24-hour window indicator for Instagram */}
              {conversation.channel === 'instagram' && (
                <div>
                  {conversation.isWithin24HourWindow ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Can Reply
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Window Expired
                    </Badge>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </Button>
              <Button variant="outline" size="sm" onClick={onArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Contact Info
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] overflow-y-auto">
                  <ContactPanel conversation={conversation} customer={customer} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation below</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isFirstInGroup={
                  index === 0 ||
                  messages[index - 1].direction !== message.direction ||
                  new Date(message.sentAt).getTime() -
                    new Date(messages[index - 1].sentAt).getTime() >
                    300000 // 5 minutes
                }
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4">
          {conversation.channel === 'instagram' && !conversation.isWithin24HourWindow ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The 24-hour messaging window has expired. You can only reply within 24 hours of the
                customer's last message.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  placeholder="Type a message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button size="icon" variant="outline">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isSending || !messageContent.trim()}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isFirstInGroup,
}: {
  message: Message;
  isFirstInGroup: boolean;
}) {
  const isOutbound = message.direction === 'outbound';

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'read':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isFirstInGroup ? 'mt-2' : ''}`}>
        <div
          className={`rounded-lg p-3 ${
            isOutbound
              ? 'bg-primary text-primary-foreground'
              : 'bg-white border border-gray-200'
          }`}
        >
          {message.contentType === 'text' && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id}>
                  {attachment.type === 'image' && (
                    <img
                      src={attachment.url}
                      alt="Attachment"
                      className="rounded max-w-full h-auto"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
            isOutbound ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{format(new Date(message.sentAt), 'h:mm a')}</span>
          {isOutbound && getStatusIcon(message.status)}
        </div>
      </div>
    </div>
  );
}

// Contact Panel Component
function ContactPanel({
  conversation,
  customer,
}: {
  conversation: Conversation;
  customer: Customer | null;
}) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Contact Information</SheetTitle>
        <SheetDescription>
          Details about this contact and their conversation history
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Contact Details */}
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={conversation.contactProfilePicture} />
            <AvatarFallback className="text-lg">
              {conversation.contactName?.[0] || conversation.contactUsername?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-lg">
              {conversation.contactName || conversation.contactUsername || 'Unknown'}
            </div>
            <div className="text-sm text-muted-foreground">
              @{conversation.contactUsername || 'unknown'}
            </div>
          </div>
        </div>

        <Separator />

        {/* Customer Link */}
        {customer ? (
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-blue-900">Linked Customer</div>
              <Button variant="ghost" size="sm" asChild>
                <a href={`/customers/${customer.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
            <div className="space-y-1 text-sm">
              <div className="font-medium">{customer.name}</div>
              {customer.email && (
                <div className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-3 border-dashed">
            <div className="text-sm text-muted-foreground text-center">
              Not linked to a customer
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Link to Customer
            </Button>
          </Card>
        )}

        {/* Conversation Stats */}
        <div>
          <div className="text-sm font-medium mb-3">Conversation Stats</div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Messages</div>
              <div className="text-2xl font-bold">{conversation.messageCount || 0}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Unread</div>
              <div className="text-2xl font-bold text-primary">
                {conversation.unreadCount || 0}
              </div>
            </Card>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="text-sm font-medium mb-3">Timeline</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-muted-foreground">First Message</div>
                <div className="font-medium">
                  {format(new Date(conversation.firstMessageAt), 'MMM d, yyyy h:mm a')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.firstMessageAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-muted-foreground">Last Message</div>
                <div className="font-medium">
                  {format(new Date(conversation.lastMessageAt), 'MMM d, yyyy h:mm a')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            {conversation.lastBreederReplyAt && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-muted-foreground">Last Reply</div>
                  <div className="font-medium">
                    {format(new Date(conversation.lastBreederReplyAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {conversation.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Alert({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        variant === 'destructive'
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>;
}
