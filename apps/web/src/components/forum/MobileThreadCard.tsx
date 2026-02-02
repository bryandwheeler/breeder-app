import { Link } from 'react-router-dom';
import { ForumThread } from '@breeder/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pin, Lock, Eye, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MobileThreadCardProps {
  thread: ForumThread;
}

export function MobileThreadCard({ thread }: MobileThreadCardProps) {
  const initials = thread.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link to={`/forum/thread/${thread.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header: Status Icons + Title */}
          <div className="flex items-start gap-2 mb-2">
            {thread.isPinned && (
              <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            )}
            {thread.isLocked && (
              <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <h3 className="font-semibold line-clamp-2 flex-1">{thread.title}</h3>
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={thread.authorProfilePhoto} alt={thread.authorName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{thread.authorName}</span>
              <span className="mx-1">·</span>
              <span>
                {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Tags */}
          {(thread.tags?.length || thread.breedTags?.length) && (
            <div className="flex flex-wrap gap-1 mb-3">
              {thread.breedTags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {thread.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {(thread.tags?.length || 0) + (thread.breedTags?.length || 0) > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{(thread.tags?.length || 0) + (thread.breedTags?.length || 0) - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{thread.replyCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{thread.viewCount}</span>
              </div>
            </div>
            {thread.lastReplyAt && thread.lastReplyAt !== thread.createdAt && (
              <span className="text-xs">
                Last reply{' '}
                {formatDistanceToNow(new Date(thread.lastReplyAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
