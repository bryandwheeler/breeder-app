import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Instagram,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Filter,
  Settings,
  RefreshCcw,
  Archive,
  Pin,
  Tag,
  User,
} from 'lucide-react';
import { Conversation, ConversationChannel, ConversationStatus } from '@breeder/types';
import { InstagramConnectionDialog } from '@/components/InstagramConnectionDialog';
import { ConversationThread } from '@/components/ConversationThread';
import { formatDistanceToNow } from 'date-fns';

const channelIcons: Record<ConversationChannel, any> = {
  instagram: Instagram,
  sms: MessageSquare,
  email: Mail,
  whatsapp: Phone,
  facebook: MessageSquare,
};

const channelColors: Record<ConversationChannel, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  sms: 'bg-green-500',
  email: 'bg-blue-500',
  whatsapp: 'bg-emerald-500',
  facebook: 'bg-blue-600',
};

export function MessagingInbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ConversationChannel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);

  // Load conversations
  useEffect(() => {
    if (!user?.uid) return;

    const conversationsRef = collection(db, 'conversations');
    let q = query(
      conversationsRef,
      where('userId', '==', user.uid),
      orderBy('lastMessageAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const convos: Conversation[] = [];
        snapshot.forEach((doc) => {
          convos.push({ id: doc.id, ...doc.data() } as Conversation);
        });
        setConversations(convos);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading conversations:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter conversations
  const filteredConversations = conversations.filter((convo) => {
    // Channel filter
    if (channelFilter !== 'all' && convo.channel !== channelFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && convo.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        convo.contactName?.toLowerCase().includes(query) ||
        convo.contactUsername?.toLowerCase().includes(query) ||
        convo.lastMessagePreview?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Group conversations by status
  const openConversations = filteredConversations.filter((c) => c.status === 'open');
  const pendingConversations = filteredConversations.filter((c) => c.status === 'pending');
  const archivedConversations = filteredConversations.filter((c) => c.status === 'archived');

  // Count unread messages
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Messaging Inbox</h1>
            <p className="text-sm text-muted-foreground">
              Manage all customer conversations in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowConnectionDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">All</div>
            <div className="text-2xl font-bold">{conversations.length}</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Unread</div>
            <div className="text-2xl font-bold text-primary">{totalUnread}</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Open</div>
            <div className="text-2xl font-bold">{openConversations.length}</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold">{pendingConversations.length}</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Archived</div>
            <div className="text-2xl font-bold">{archivedConversations.length}</div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-96 border-r flex flex-col bg-white">
          {/* Filters */}
          <div className="p-3 space-y-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversation List */}
          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-none">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {totalUnread > 0 && `(${totalUnread})`}
              </TabsTrigger>
              <TabsTrigger value="assigned">Assigned</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="flex-1 overflow-y-auto m-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No conversations found</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setShowConnectionDialog(true)}
                  >
                    Connect Instagram to get started
                  </Button>
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  selectedId={selectedConversation?.id}
                  onSelect={setSelectedConversation}
                />
              )}
            </TabsContent>

            <TabsContent value="unread" className="flex-1 overflow-y-auto m-0">
              <ConversationList
                conversations={filteredConversations.filter((c) => c.hasUnreadMessages)}
                selectedId={selectedConversation?.id}
                onSelect={setSelectedConversation}
              />
            </TabsContent>

            <TabsContent value="assigned" className="flex-1 overflow-y-auto m-0">
              <ConversationList
                conversations={filteredConversations.filter((c) => c.assignedTo)}
                selectedId={selectedConversation?.id}
                onSelect={setSelectedConversation}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Conversation View */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <ConversationThread conversation={selectedConversation} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <InstagramConnectionDialog
        open={showConnectionDialog}
        setOpen={setShowConnectionDialog}
      />
    </div>
  );
}

// Conversation List Component
function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
}) {
  return (
    <div className="divide-y">
      {conversations.map((conversation) => {
        const ChannelIcon = channelIcons[conversation.channel];
        const isSelected = conversation.id === selectedId;

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-l-4 border-primary' : ''
            } ${conversation.hasUnreadMessages ? 'bg-blue-50/30' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Profile Picture / Avatar */}
              <div className="relative flex-shrink-0">
                {conversation.contactProfilePicture ? (
                  <img
                    src={conversation.contactProfilePicture}
                    alt={conversation.contactName || 'Contact'}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                {/* Channel indicator */}
                <div
                  className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ${
                    channelColors[conversation.channel]
                  }`}
                >
                  <ChannelIcon className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold truncate">
                    {conversation.contactName || conversation.contactUsername || 'Unknown'}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground truncate mb-1">
                  {conversation.lastMessagePreview || 'No messages yet'}
                </div>
                <div className="flex items-center gap-2">
                  {conversation.hasUnreadMessages && conversation.unreadCount && (
                    <Badge variant="default" className="h-5 px-2 text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                  {conversation.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                  {conversation.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="h-5 px-2 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

