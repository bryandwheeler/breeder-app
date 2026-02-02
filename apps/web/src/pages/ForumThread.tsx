import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForumStore } from '@breeder/firebase';
import { useBreederStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  ArrowLeft,
  Pin,
  Lock,
  Eye,
  MessageSquare,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PostCard } from '@/components/forum/PostCard';
import { PostComposer } from '@/components/forum/PostComposer';

export function ForumThread() {
  const { threadId } = useParams();
  const { currentUser } = useAuth();
  const { profile } = useBreederStore();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const {
    currentThread,
    posts,
    postsLoading,
    subscribeToThread,
    subscribeToPosts,
    incrementViewCount,
    togglePostLike,
  } = useForumStore();

  // Check if user can post (has subscription - simplified check for now)
  // In production, you'd check the actual subscription tier
  const canPost = !!currentUser;

  useEffect(() => {
    if (!threadId) return;

    const unsubThread = subscribeToThread(threadId);
    const unsubPosts = subscribeToPosts(threadId);

    // Increment view count once
    incrementViewCount(threadId);

    return () => {
      unsubThread();
      unsubPosts();
    };
  }, [threadId, subscribeToThread, subscribeToPosts, incrementViewCount]);

  if (!currentThread) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const authorInitials = currentThread.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        to={currentThread.categorySlug ? `/forum/category/${currentThread.categorySlug}` : '/forum'}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {currentThread.categoryName || 'Forum'}
      </Link>

      {/* Thread Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Status Icons */}
            <div className="flex items-center gap-1 shrink-0 mt-1">
              {currentThread.isPinned && <Pin className="h-5 w-5 text-primary" />}
              {currentThread.isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
            </div>

            {/* Title & Meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-2">{currentThread.title}</h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {currentThread.categoryName && (
                  <Badge variant="secondary">{currentThread.categoryName}</Badge>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {currentThread.viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {currentThread.replyCount} replies
                </span>
              </div>

              {/* Tags */}
              {(currentThread.tags?.length || currentThread.breedTags?.length) && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentThread.breedTags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {currentThread.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Original Post */}
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage
                src={currentThread.authorProfilePhoto}
                alt={currentThread.authorName}
              />
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{currentThread.authorName}</span>
                {currentThread.authorKennel && (
                  <span className="text-xs text-muted-foreground">
                    ({currentThread.authorKennel})
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(currentThread.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{currentThread.content}</p>
              </div>

              {/* Thread Attachments */}
              {currentThread.attachments && currentThread.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentThread.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.fileName}
                        className="rounded-lg max-h-64 object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locked Notice */}
      {currentThread.isLocked && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              This thread is locked. New replies cannot be posted.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Subscribe Notice for Free Users */}
      {!canPost && !currentThread.isLocked && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Subscribe to participate</p>
              <p className="text-xs text-muted-foreground">
                Upgrade your subscription to post replies and create threads.
              </p>
            </div>
            <Button size="sm" className="ml-auto">
              Subscribe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Replies Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Replies ({currentThread.replyCount})
        </h2>

        {postsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              No replies yet. Be the first to respond!
            </p>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              {posts.map((post) => (
                <div key={post.id}>
                  <PostCard
                    post={post}
                    onReply={(postId) => setReplyingTo(postId)}
                    canPost={canPost && !currentThread.isLocked}
                  />
                  {replyingTo === post.id && (
                    <div className="ml-12 mt-2 mb-4">
                      <PostComposer
                        threadId={currentThread.id}
                        parentPostId={post.id}
                        placeholder={`Reply to ${post.authorName}...`}
                        autoFocus
                        onCancel={() => setReplyingTo(null)}
                        onSuccess={() => setReplyingTo(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reply Composer */}
      {canPost && !currentThread.isLocked && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Post a Reply</h3>
          <PostComposer threadId={currentThread.id} />
        </div>
      )}
    </div>
  );
}
