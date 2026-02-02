import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForumStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, ArrowLeft, Search, MessagesSquare } from 'lucide-react';
import { ThreadCard, MobileThreadCard, CreateThreadDialog } from '@/components/forum';
import { useIsMobile } from '@/hooks/use-media-query';

export function ForumCategory() {
  const { categorySlug } = useParams();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'replies'>('recent');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Check if user can post (simplified - in production check subscription tier)
  const canPost = !!currentUser;

  const {
    categories,
    threads,
    threadsLoading,
    hasMoreThreads,
    subscribeToCategories,
    subscribeToThreads,
    loadMoreThreads,
    getCategoryBySlug,
    clearThreads,
  } = useForumStore();

  const category = getCategoryBySlug(categorySlug || '');

  useEffect(() => {
    const unsubCategories = subscribeToCategories();
    return () => {
      unsubCategories();
      clearThreads();
    };
  }, [subscribeToCategories, clearThreads]);

  useEffect(() => {
    if (category?.id) {
      const unsubThreads = subscribeToThreads(category.id);
      return () => unsubThreads();
    }
  }, [category?.id, subscribeToThreads]);

  // Filter threads by search query
  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.title.toLowerCase().includes(query) ||
      thread.authorName.toLowerCase().includes(query) ||
      thread.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
      thread.breedTags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Sort threads
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    // Pinned threads always first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    switch (sortBy) {
      case 'popular':
        return b.viewCount - a.viewCount;
      case 'replies':
        return b.replyCount - a.replyCount;
      case 'recent':
      default:
        return (
          new Date(b.lastReplyAt || b.createdAt).getTime() -
          new Date(a.lastReplyAt || a.createdAt).getTime()
        );
    }
  });

  if (!category) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        {categories.length === 0 ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Category Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The category you're looking for doesn't exist.
            </p>
            <Link to="/forum">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Forum
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          to="/forum"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forum
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{category.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {category.description}
            </p>
          </div>
          {canPost && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Thread
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Viewed</SelectItem>
            <SelectItem value="replies">Most Replies</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Threads List */}
      {threadsLoading && threads.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sortedThreads.length === 0 ? (
        <Card className="p-8 text-center">
          <MessagesSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No Threads Found' : 'No Threads Yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Be the first to start a discussion in this category!'}
          </p>
          {!searchQuery && canPost && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Thread
            </Button>
          )}
        </Card>
      ) : (
        <>
          {isMobile ? (
            <div className="space-y-3">
              {sortedThreads.map((thread) => (
                <MobileThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                {sortedThreads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Load More */}
          {hasMoreThreads && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => loadMoreThreads(category.id)}
                disabled={threadsLoading}
              >
                {threadsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Thread Dialog */}
      <CreateThreadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        categoryId={category.id}
        categoryName={category.name}
        categorySlug={category.slug}
      />
    </div>
  );
}
