import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteThingsStore, useAdminStore } from '@breeder/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Heart,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
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

export function FavoriteThings() {
  const { currentUser } = useAuth();
  const impersonatedUserId = useAdminStore((s) => s.impersonatedUserId);
  const { items, loading, subscribeItems, deleteItem } =
    useFavoriteThingsStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const targetUid = impersonatedUserId || currentUser.uid;
    const unsubscribe = subscribeItems(targetUid);
    return unsubscribe;
  }, [currentUser, subscribeItems, impersonatedUserId]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await deleteItem(id);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeleting(null);
    }
  };

  // Group items by category
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading && items.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-muted-foreground'>Loading favorite things...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Favorite Things</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Share your recommended products and supplies with your puppy families.
          </p>
        </div>
        <Link to='/favorite-things/new'>
          <Button>
            <PlusCircle className='h-4 w-4 mr-2' />
            Add Item
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-16'>
            <Heart className='h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-lg font-medium mb-2'>No favorite things yet</h3>
            <p className='text-sm text-muted-foreground mb-6 text-center max-w-md'>
              Add your recommended products, supplies, and resources to share
              with your puppy families on your website.
            </p>
            <Link to='/favorite-things/new'>
              <Button>
                <PlusCircle className='h-4 w-4 mr-2' />
                Add Your First Item
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                <Heart className='h-4 w-4 text-primary' />
                {category}
                <span className='text-sm font-normal text-muted-foreground'>
                  ({categoryItems.length})
                </span>
              </h2>
              <div className='space-y-2'>
                {categoryItems.map((item) => (
                  <Card
                    key={item.id}
                    className='hover:shadow-md transition-shadow'
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-start gap-4'>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className='w-16 h-16 rounded-lg object-cover flex-shrink-0'
                          />
                        ) : (
                          <div className='w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0'>
                            <Heart className='h-5 w-5 text-muted-foreground' />
                          </div>
                        )}
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-medium truncate'>{item.name}</h3>
                          {item.description && (
                            <p className='text-sm text-muted-foreground line-clamp-2 mt-0.5'>
                              {item.description}
                            </p>
                          )}
                          {item.link && (
                            <a
                              href={item.link}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1'
                            >
                              <ExternalLink className='h-3 w-3' />
                              View Product
                            </a>
                          )}
                        </div>
                        <div className='flex items-center gap-2 flex-shrink-0'>
                          <Link to={`/favorite-things/${item.id}/edit`}>
                            <Button variant='outline' size='sm'>
                              <Edit className='h-4 w-4' />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                disabled={deleting === item.id}
                              >
                                {deleting === item.id ? (
                                  <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                  <Trash2 className='h-4 w-4' />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Item
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.name}"?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.id)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
