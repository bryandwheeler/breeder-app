import { Link } from 'react-router-dom';
import { ForumThread } from '@breeder/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pin, Lock, Eye, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ThreadCardProps {
  thread: ForumThread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const initials = thread.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      to={`/forum/thread/${thread.id}`}
      className="block border-b last:border-b-0 hover:bg-muted/50 transition-colors"
    >
      <div className="p-4 flex gap-4">
        {/* Author Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={thread.authorProfilePhoto} alt={thread.authorName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {/* Thread Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {/* Status Icons */}
            {thread.isPinned && (
              <Pin className="h-4 w-4 text-primary shrink-0 mt-1" />
            )}
            {thread.isLocked && (
              <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            )}

            {/* Title */}
            <h3 className="font-semibold line-clamp-1 flex-1">{thread.title}</h3>
          </div>

          {/* Author & Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{thread.authorName}</span>
            {thread.authorKennel && (
              <>
                <span>·</span>
                <span className="text-xs">{thread.authorKennel}</span>
              </>
            )}
            <span>·</span>
            <span>
              {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Tags */}
          {(thread.tags?.length || thread.breedTags?.length) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {thread.breedTags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {thread.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground shrink-0">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{thread.replyCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{thread.viewCount}</span>
          </div>
          {thread.lastReplyAt && thread.lastReplyAt !== thread.createdAt && (
            <div className="text-xs">
              Last reply{' '}
              {formatDistanceToNow(new Date(thread.lastReplyAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
