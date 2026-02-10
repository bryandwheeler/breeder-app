import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBlogStore } from '@breeder/firebase';
import { useAdminStore } from '@breeder/firebase';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  Image,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function BlogPosts() {
  const { currentUser } = useAuth();
  const impersonatedUserId = useAdminStore((s) => s.impersonatedUserId);
  const { posts, loading, subscribePosts, deletePost } = useBlogStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const targetUid = impersonatedUserId || currentUser.uid;
    const unsubscribe = subscribePosts(targetUid);
    return unsubscribe;
  }, [currentUser, subscribePosts, impersonatedUserId]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await deletePost(id);
    } catch (error) {
      console.error('Error deleting blog post:', error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-muted-foreground'>Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Blog Posts</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Create and manage blog posts for your website.
          </p>
        </div>
        <Link to='/blog/new'>
          <Button>
            <PlusCircle className='h-4 w-4 mr-2' />
            New Post
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-16'>
            <FileText className='h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-lg font-medium mb-2'>No blog posts yet</h3>
            <p className='text-sm text-muted-foreground mb-6 text-center max-w-md'>
              Blog posts are a great way to share news, tips, and updates with
              your puppy families and potential buyers.
            </p>
            <Link to='/blog/new'>
              <Button>
                <PlusCircle className='h-4 w-4 mr-2' />
                Create Your First Post
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {posts.map((post) => (
            <Card key={post.id} className='hover:shadow-md transition-shadow'>
              <CardContent className='p-4'>
                <div className='flex items-start gap-4'>
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className='w-20 h-20 rounded-lg object-cover flex-shrink-0'
                    />
                  ) : (
                    <div className='w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0'>
                      <Image className='h-6 w-6 text-muted-foreground' />
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <h3 className='font-medium truncate'>{post.title}</h3>
                      <Badge
                        variant={post.published ? 'default' : 'secondary'}
                        className='flex-shrink-0'
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    {post.excerpt && (
                      <p className='text-sm text-muted-foreground line-clamp-1 mb-2'>
                        {post.excerpt}
                      </p>
                    )}
                    <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                      {post.publishedAt && (
                        <span>
                          Published{' '}
                          {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                        </span>
                      )}
                      {!post.publishedAt && post.createdAt && (
                        <span>
                          Created{' '}
                          {format(new Date(post.createdAt), 'MMM d, yyyy')}
                        </span>
                      )}
                      {post.tags.length > 0 && (
                        <span>{post.tags.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    <Link to={`/blog/${post.id}/edit`}>
                      <Button variant='outline' size='sm'>
                        <Edit className='h-4 w-4' />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='outline'
                          size='sm'
                          disabled={deleting === post.id}
                        >
                          {deleting === post.id ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <Trash2 className='h-4 w-4' />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{post.title}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(post.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
