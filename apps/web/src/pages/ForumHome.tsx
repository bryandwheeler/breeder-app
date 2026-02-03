import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForumStore, useAdminStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_FORUM_CATEGORIES } from '@breeder/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, MessageCircle, Users, MessagesSquare, RefreshCw } from 'lucide-react';
import { CategoryCard } from '@/components/forum/CategoryCard';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function ForumHome() {
  const { currentUser } = useAuth();
  const { checkIsAdmin } = useAdminStore();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const {
    categories,
    threads,
    loading,
    threadsLoading,
    subscribeToCategories,
    subscribeToThreads,
    createCategory,
  } = useForumStore();

  useEffect(() => {
    const unsubCategories = subscribeToCategories();
    const unsubThreads = subscribeToThreads(); // Load recent threads across all categories

    return () => {
      unsubCategories();
      unsubThreads();
    };
  }, [subscribeToCategories, subscribeToThreads]);

  // Check if user is admin
  useEffect(() => {
    let mounted = true;
    const checkAdmin = async () => {
      if (!currentUser) {
        if (mounted) setIsAdmin(false);
        return;
      }
      try {
        const result = await checkIsAdmin(currentUser.uid);
        if (mounted) setIsAdmin(!!result);
      } catch {
        if (mounted) setIsAdmin(false);
      }
    };
    checkAdmin();
    return () => { mounted = false; };
  }, [currentUser, checkIsAdmin]);

  const handleSeedCategories = async () => {
    setSeeding(true);
    try {
      for (const cat of DEFAULT_FORUM_CATEGORIES) {
        await createCategory(cat);
      }
      toast({
        title: 'Categories created',
        description: `${DEFAULT_FORUM_CATEGORIES.length} default forum categories have been added`,
      });
    } catch (error) {
      console.error('Failed to seed categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to create default categories',
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  // Calculate total stats
  const totalThreads = categories.reduce((sum, cat) => sum + cat.threadCount, 0);
  const totalPosts = categories.reduce((sum, cat) => sum + cat.postCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Breeder Forum</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Connect with other breeders, share knowledge, and learn together
          </p>
        </div>
        <Link to="/forum/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <MessagesSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalThreads}</div>
              <div className="text-xs text-muted-foreground">Threads</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalPosts}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Categories Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Categories</h2>
          {categories.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Categories Yet</h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin
                  ? 'Get started by creating the default forum categories.'
                  : 'Forum categories haven\'t been set up yet. Check back soon!'}
              </p>
              {isAdmin && (
                <Button onClick={handleSeedCategories} disabled={seeding}>
                  {seeding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Categories...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Create Default Categories
                    </>
                  )}
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Card>
            <CardContent className="p-4">
              {threadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessagesSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No threads yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {threads.slice(0, 5).map((thread) => (
                    <Link
                      key={thread.id}
                      to={`/forum/thread/${thread.id}`}
                      className="block group"
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {thread.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{thread.authorName}</span>
                          <span>·</span>
                          <span>
                            {formatDistanceToNow(new Date(thread.lastReplyAt || thread.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {thread.categoryName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
