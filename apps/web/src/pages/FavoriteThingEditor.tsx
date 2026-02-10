import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteThingsStore, useAdminStore } from '@breeder/firebase';
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
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  'Food & Nutrition',
  'Grooming',
  'Toys & Enrichment',
  'Training',
  'Health & Wellness',
  'Beds & Crates',
  'Collars & Leashes',
  'Travel',
  'Cleaning',
  'Books & Resources',
  'Other',
];

export function FavoriteThingEditor() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const impersonatedUserId = useAdminStore((s) => s.impersonatedUserId);
  const { items, subscribeItems, createItem, updateItem, loading } =
    useFavoriteThingsStore();
  const { toast } = useToast();

  const isEditing = Boolean(itemId);
  const existingItem = isEditing
    ? items.find((i) => i.id === itemId)
    : undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('Other');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const targetUid = impersonatedUserId || currentUser.uid;
    const unsubscribe = subscribeItems(targetUid);
    return unsubscribe;
  }, [currentUser, subscribeItems, impersonatedUserId]);

  useEffect(() => {
    if (isEditing && existingItem && !initialized) {
      setName(existingItem.name);
      setDescription(existingItem.description);
      setLink(existingItem.link);
      setImage(existingItem.image || '');
      setCategory(existingItem.category);
      setInitialized(true);
    }
  }, [isEditing, existingItem, initialized]);

  const handleSave = async () => {
    if (!currentUser) return;
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a product name.',
        variant: 'destructive',
      });
      return;
    }

    const targetUid = impersonatedUserId || currentUser.uid;

    // Calculate order: put new items at the end of their category
    const categoryItems = items.filter((i) => i.category === category);
    const maxOrder = categoryItems.reduce(
      (max, i) => Math.max(max, i.order),
      -1,
    );

    try {
      setSaving(true);

      if (isEditing && itemId) {
        await updateItem(itemId, {
          name,
          description,
          link,
          ...(image ? { image } : { image: '' }),
          category,
        });
        toast({ title: 'Item updated' });
      } else {
        await createItem({
          userId: targetUid,
          name,
          description,
          link,
          ...(image ? { image } : {}),
          category,
          order: maxOrder + 1,
        });
        toast({ title: 'Item added' });
      }

      navigate('/favorite-things');
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loading && !existingItem) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-2xl'>
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate('/favorite-things')}
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back
        </Button>
        <h1 className='text-2xl font-bold tracking-tight'>
          {isEditing ? 'Edit Item' : 'Add Favorite Thing'}
        </h1>
      </div>

      <Card>
        <CardContent className='p-6 space-y-4'>
          <div>
            <label className='text-sm font-medium mb-1.5 block'>
              Product Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. FURminator Undercoat Tool'
            />
          </div>

          <div>
            <label className='text-sm font-medium mb-1.5 block'>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Why do you recommend this product?'
              rows={4}
              className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            />
          </div>

          <div>
            <label className='text-sm font-medium mb-1.5 block'>
              Product Link
            </label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder='https://www.amazon.com/...'
            />
            <p className='text-xs text-muted-foreground mt-1'>
              Paste the full URL to the product page.
            </p>
          </div>

          <div>
            <label className='text-sm font-medium mb-1.5 block'>
              Image URL (optional)
            </label>
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder='https://... (paste a product image URL)'
            />
            {image && (
              <img
                src={image}
                alt='Preview'
                className='w-20 h-20 object-cover rounded-lg mt-2 border'
              />
            )}
          </div>

          <div>
            <label className='text-sm font-medium mb-1.5 block'>
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='pt-2'>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className='w-full'
            >
              {saving ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <Save className='h-4 w-4 mr-2' />
              )}
              {isEditing ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
