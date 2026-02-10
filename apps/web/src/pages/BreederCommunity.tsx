import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBreederSocialStore, useBreederStore } from '@breeder/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  MessageCircle,
  UserPlus,
  UserMinus,
  Check,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  BreederFriendship,
  BreederConversation,
  BreederSearchResult,
} from '@breeder/types';

export function BreederCommunity() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const profile = useBreederStore((state) => state.profile);
  const {
    friendships,
    pendingRequests,
    sentRequests,
    conversations,
    currentConversation,
    currentConversationId,
    totalUnreadMessages,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    sendMessage,
    markConversationRead,
    setCurrentConversation,
    subscribeToFriendships,
    subscribeToConversations,
    subscribeToMessages,
    searchBreeders,
    getFriendsList,
    isFriend,
    clearError,
  } = useBreederSocialStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BreederSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [friendRequestDialogOpen, setFriendRequestDialogOpen] = useState(false);
  const [friendRequestMessage, setFriendRequestMessage] = useState('');
  const [selectedBreeder, setSelectedBreeder] =
    useState<BreederSearchResult | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [selectedFriendship, setSelectedFriendship] =
    useState<BreederFriendship | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to data on mount
  useEffect(() => {
    if (!currentUser) return;

    const unsubFriendships = subscribeToFriendships(currentUser.uid);
    const unsubConversations = subscribeToConversations(currentUser.uid);

    return () => {
      unsubFriendships();
      unsubConversations();
    };
  }, [currentUser, subscribeToFriendships, subscribeToConversations]);

  // Subscribe to messages when conversation changes
  useEffect(() => {
    if (!currentConversationId) return;

    const unsub = subscribeToMessages(currentConversationId);
    markConversationRead(currentConversationId);

    return () => unsub();
  }, [currentConversationId, subscribeToMessages, markConversationRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchBreeders(searchQuery);
      setSearchResults(results);
    } catch (err) {
      toast({
        title: 'Search Error',
        description: 'Failed to search for breeders',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle send friend request
  const handleSendFriendRequest = async () => {
    if (!selectedBreeder) return;

    try {
      await sendFriendRequest(
        selectedBreeder.id,
        selectedBreeder.kennelName,
        selectedBreeder.displayName,
        friendRequestMessage || undefined
      );
      toast({
        title: 'Friend Request Sent',
        description: `Request sent to ${selectedBreeder.displayName}`,
      });
      setFriendRequestDialogOpen(false);
      setSelectedBreeder(null);
      setFriendRequestMessage('');
      // Refresh search results
      handleSearch();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send friend request',
        variant: 'destructive',
      });
    }
  };

  // Handle accept friend request
  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await acceptFriendRequest(friendshipId);
      toast({
        title: 'Friend Request Accepted',
        description: 'You are now connected!',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
    }
  };

  // Handle decline friend request
  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      await declineFriendRequest(friendshipId);
      toast({
        title: 'Friend Request Declined',
        description: 'The request has been declined',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to decline friend request',
        variant: 'destructive',
      });
    }
  };

  // Handle remove friend
  const handleRemoveFriend = async () => {
    if (!selectedFriendship) return;

    try {
      await removeFriend(selectedFriendship.id);
      toast({
        title: 'Friend Removed',
        description: 'You are no longer connected',
      });
      setConfirmRemoveOpen(false);
      setSelectedFriendship(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to remove friend',
        variant: 'destructive',
      });
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentConversationId) return;

    // Get the recipient from the conversation
    const conversation = conversations.find(
      (c) => c.id === currentConversationId
    );
    if (!conversation || !currentUser) return;

    const recipientId = conversation.participants.find(
      (p) => p !== currentUser.uid
    );
    if (!recipientId) return;

    try {
      await sendMessage(recipientId, messageInput.trim());
      setMessageInput('');
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  // Start a new conversation
  const startConversation = (userId: string) => {
    if (!currentUser) return;
    const conversationId = [currentUser.uid, userId].sort().join('_');
    setCurrentConversation(conversationId);
  };

  // Get friends list
  const friends = getFriendsList();

  // Get friend info from friendship
  const getFriendInfo = (friendship: BreederFriendship) => {
    if (!currentUser) return { name: '', kennel: '', id: '' };
    const isRequester = friendship.requesterId === currentUser.uid;
    return {
      id: isRequester ? friendship.recipientId : friendship.requesterId,
      name: isRequester
        ? friendship.recipientDisplayName
        : friendship.requesterDisplayName,
      kennel: isRequester
        ? friendship.recipientKennelName
        : friendship.requesterKennelName,
    };
  };

  // Get other participant info from conversation
  const getOtherParticipant = (conversation: BreederConversation) => {
    if (!currentUser) return { id: '', name: '', kennel: '' };
    const otherId = conversation.participants.find(
      (p) => p !== currentUser.uid
    );
    if (!otherId) return { id: '', name: '', kennel: '' };
    return {
      id: otherId,
      name: conversation.participantNames[otherId] || 'Unknown',
      kennel: conversation.participantKennelNames?.[otherId] || '',
    };
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Breeder Community</h1>
          <p className='text-muted-foreground'>
            Connect with other breeders and communicate directly
          </p>
        </div>
      </div>

      <Tabs defaultValue='friends' className='w-full'>
        <TabsList>
          <TabsTrigger value='friends'>
            <Users className='h-4 w-4 mr-2' />
            Friends
            {pendingRequests.length > 0 && (
              <Badge className='ml-2 bg-red-500'>{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='find'>
            <Search className='h-4 w-4 mr-2' />
            Find Breeders
          </TabsTrigger>
          <TabsTrigger value='messages'>
            <MessageCircle className='h-4 w-4 mr-2' />
            Messages
            {totalUnreadMessages > 0 && (
              <Badge className='ml-2 bg-red-500'>{totalUnreadMessages}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Friends Tab */}
        <TabsContent value='friends' className='space-y-4'>
          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <AlertCircle className='h-5 w-5 text-rose-500' />
                  Friend Requests ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className='flex items-center justify-between p-3 bg-muted rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <Avatar>
                        <AvatarFallback>
                          {request.requesterDisplayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium'>
                          {request.requesterDisplayName}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {request.requesterKennelName}
                        </div>
                        {request.message && (
                          <div className='text-sm text-muted-foreground mt-1 italic'>
                            "{request.message}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleDeclineRequest(request.id)}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        <Check className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sent Requests Section */}
          {sentRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>
                  Sent Requests ({sentRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className='flex items-center justify-between p-3 bg-muted rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <Avatar>
                        <AvatarFallback>
                          {request.recipientDisplayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium'>
                          {request.recipientDisplayName}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {request.recipientKennelName}
                        </div>
                      </div>
                    </div>
                    <Badge variant='secondary'>Pending</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Friends List */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                Your Friends ({friends.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className='text-center py-8'>
                  <Users className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                  <p className='text-muted-foreground mb-4'>
                    You haven't connected with any breeders yet
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Search for breeders to send friend requests and start
                    connecting!
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {friends.map((friendship) => {
                    const friendInfo = getFriendInfo(friendship);
                    return (
                      <div
                        key={friendship.id}
                        className='flex items-center justify-between p-3 bg-muted rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          <Avatar>
                            <AvatarFallback>
                              {friendInfo.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-medium'>{friendInfo.name}</div>
                            <div className='text-sm text-muted-foreground'>
                              {friendInfo.kennel}
                            </div>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => startConversation(friendInfo.id)}
                          >
                            <MessageCircle className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => {
                              setSelectedFriendship(friendship);
                              setConfirmRemoveOpen(true);
                            }}
                          >
                            <UserMinus className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Find Breeders Tab */}
        <TabsContent value='find' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Search for Breeders</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex gap-2'>
                <Input
                  placeholder='Search by name or kennel...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searchLoading}>
                  <Search className='h-4 w-4 mr-2' />
                  Search
                </Button>
              </div>

              {searchLoading ? (
                <div className='text-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
                  <p className='text-muted-foreground mt-2'>Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className='space-y-3'>
                  {searchResults.map((breeder) => (
                    <div
                      key={breeder.id}
                      className='flex items-center justify-between p-3 bg-muted rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage src={breeder.photoURL} />
                          <AvatarFallback>
                            {breeder.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>
                            {breeder.displayName}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {breeder.kennelName}
                          </div>
                          {breeder.location && (
                            <div className='text-xs text-muted-foreground'>
                              {breeder.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        {breeder.friendshipStatus === 'accepted' ? (
                          <Badge variant='secondary'>Friends</Badge>
                        ) : breeder.friendshipStatus === 'pending' ? (
                          <Badge variant='outline'>Pending</Badge>
                        ) : breeder.friendshipStatus === 'blocked' ? (
                          <Badge variant='destructive'>Blocked</Badge>
                        ) : (
                          <Button
                            size='sm'
                            onClick={() => {
                              setSelectedBreeder(breeder);
                              setFriendRequestDialogOpen(true);
                            }}
                          >
                            <UserPlus className='h-4 w-4 mr-2' />
                            Add Friend
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className='text-center py-8'>
                  <Search className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                  <p className='text-muted-foreground'>No breeders found</p>
                  <p className='text-sm text-muted-foreground'>
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Search className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                  <p className='text-muted-foreground'>
                    Search for breeders by name or kennel name
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value='messages' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]'>
            {/* Conversations List */}
            <Card className='md:col-span-1'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-lg'>Conversations</CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <ScrollArea className='h-[520px]'>
                  {conversations.length === 0 ? (
                    <div className='text-center py-8 px-4'>
                      <MessageCircle className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                      <p className='text-sm text-muted-foreground'>
                        No conversations yet. Start chatting with your friends!
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-1 p-2'>
                      {conversations.map((conversation) => {
                        const other = getOtherParticipant(conversation);
                        const unread =
                          currentUser &&
                          conversation.unreadCount[currentUser.uid] > 0;
                        const isActive =
                          currentConversationId === conversation.id;

                        return (
                          <button
                            key={conversation.id}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() =>
                              setCurrentConversation(conversation.id)
                            }
                          >
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-10 w-10'>
                                <AvatarFallback>
                                  {other.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between'>
                                  <span
                                    className={`font-medium truncate ${
                                      unread && !isActive ? 'font-bold' : ''
                                    }`}
                                  >
                                    {other.name}
                                  </span>
                                  {unread && !isActive && (
                                    <Badge
                                      variant='destructive'
                                      className='ml-2'
                                    >
                                      {
                                        conversation.unreadCount[
                                          currentUser!.uid
                                        ]
                                      }
                                    </Badge>
                                  )}
                                </div>
                                <p
                                  className={`text-xs truncate ${
                                    isActive
                                      ? 'text-primary-foreground/70'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {conversation.lastMessagePreview}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className='md:col-span-2'>
              {currentConversationId ? (
                <>
                  <CardHeader className='pb-2 border-b'>
                    {(() => {
                      const conversation = conversations.find(
                        (c) => c.id === currentConversationId
                      );
                      if (!conversation) return null;
                      const other = getOtherParticipant(conversation);
                      return (
                        <div className='flex items-center gap-3'>
                          <Avatar>
                            <AvatarFallback>
                              {other.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className='text-lg'>
                              {other.name}
                            </CardTitle>
                            {other.kennel && (
                              <p className='text-sm text-muted-foreground'>
                                {other.kennel}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardHeader>
                  <CardContent className='p-0 flex flex-col h-[500px]'>
                    <ScrollArea className='flex-1 p-4'>
                      <div className='space-y-4'>
                        {currentConversation.map((message) => {
                          const isOwn = message.senderId === currentUser?.uid;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                isOwn ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className='text-sm'>{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn
                                      ? 'text-primary-foreground/70'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {format(
                                    new Date(message.createdAt),
                                    'MMM d, h:mm a'
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                    <div className='p-4 border-t'>
                      <div className='flex gap-2'>
                        <Input
                          placeholder='Type a message...'
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleSendMessage()
                          }
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                        >
                          <Send className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className='flex items-center justify-center h-full'>
                  <div className='text-center'>
                    <MessageCircle className='h-16 w-16 mx-auto text-muted-foreground mb-4' />
                    <p className='text-muted-foreground'>
                      Select a conversation to start messaging
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Friend Request Dialog */}
      <Dialog
        open={friendRequestDialogOpen}
        onOpenChange={setFriendRequestDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Friend Request</DialogTitle>
            <DialogDescription>
              Send a friend request to {selectedBreeder?.displayName} from{' '}
              {selectedBreeder?.kennelName}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>
                Add a message (optional)
              </label>
              <Textarea
                placeholder="Hi! I'd like to connect with you..."
                value={friendRequestMessage}
                onChange={(e) => setFriendRequestMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setFriendRequestDialogOpen(false);
                setSelectedBreeder(null);
                setFriendRequestMessage('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSendFriendRequest} disabled={loading}>
              <UserPlus className='h-4 w-4 mr-2' />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Friend Dialog */}
      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Friend</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              {selectedFriendship && getFriendInfo(selectedFriendship).name} as
              a friend? You will no longer be able to message each other.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setConfirmRemoveOpen(false);
                setSelectedFriendship(null);
              }}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleRemoveFriend}>
              Remove Friend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
