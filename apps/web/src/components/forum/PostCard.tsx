import { useState } from 'react';
import { ForumPost } from '@breeder/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, Reply, MoreVertical, Edit2, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useForumStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: ForumPost;
  onReply?: (postId: string) => void;
  canPost?: boolean;
}

export function PostCard({ post, onReply, canPost = true }: PostCardProps) {
  const { currentUser } = useAuth();
  const { togglePostLike, updatePost, deletePost } = useForumStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const isAuthor = currentUser?.uid === post.authorId;
  const hasLiked = post.likedBy?.includes(currentUser?.uid || '');

  const initials = post.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLike = async () => {
    if (!currentUser || !canPost) return;
    await togglePostLike(post.id);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await updatePost(post.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Indentation for nested replies
  const indentClass = post.replyDepth > 0 ? `ml-${Math.min(post.replyDepth * 8, 16)}` : '';

  if (post.status === 'deleted') {
    return (
      <div className={cn('py-4 text-muted-foreground italic', indentClass)}>
        This post has been deleted.
      </div>
    );
  }

  return (
    <div className={cn('py-4 border-b last:border-b-0', indentClass)}>
      <div className="flex gap-3">
        {/* Author Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={post.authorProfilePhoto} alt={post.authorName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{post.authorName}</span>
              {post.authorKennel && (
                <span className="text-xs text-muted-foreground">({post.authorKennel})</span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              {post.status === 'edited' && (
                <Badge variant="outline" className="text-xs">
                  edited
                </Badge>
              )}
            </div>

            {/* Actions Menu */}
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(post.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          )}

          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.attachments.map((attachment) => (
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
                    className="rounded-lg max-h-48 object-cover"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2',
                hasLiked && 'text-red-500 hover:text-red-600'
              )}
              onClick={handleLike}
              disabled={!canPost}
            >
              <Heart
                className={cn('h-4 w-4 mr-1', hasLiked && 'fill-current')}
              />
              {post.likeCount > 0 && post.likeCount}
            </Button>
            {canPost && onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onReply(post.id)}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
