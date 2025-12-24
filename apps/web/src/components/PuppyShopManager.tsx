import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Edit2, Upload } from 'lucide-react';
import { useWebsiteStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AvailablePuppyListing } from '@breeder/types';

export function PuppyShopManager() {
  const { currentUser } = useAuth();
  const {
    websiteSettings,
    addPuppyListing,
    updatePuppyListing,
    deletePuppyListing,
  } = useWebsiteStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AvailablePuppyListing>>({
    name: '',
    breed: '',
    gender: 'male',
    description: '',
    price: 0,
    photos: [],
    available: true,
    reserved: false,
    featured: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      breed: '',
      gender: 'male',
      description: '',
      price: 0,
      photos: [],
      available: true,
      reserved: false,
      featured: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (listing: AvailablePuppyListing) => {
    setFormData(listing);
    setEditingId(listing.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!currentUser || !formData.name || !formData.breed) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await updatePuppyListing(currentUser.uid, editingId, formData);
        alert('Puppy updated successfully!');
      } else {
        await addPuppyListing(
          currentUser.uid,
          formData as Omit<
            AvailablePuppyListing,
            'id' | 'createdAt' | 'updatedAt'
          >
        );
        alert('Puppy added successfully!');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving puppy:', error);
      alert('Failed to save puppy');
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      await deletePuppyListing(currentUser.uid, id);
      alert('Puppy deleted successfully!');
    } catch (error) {
      console.error('Error deleting puppy:', error);
      alert('Failed to delete puppy');
    }
  };

  const puppies = websiteSettings?.puppyListings || [];

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Available Puppies</CardTitle>
              <CardDescription>
                Manage puppies available for purchase on your website
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className='h-4 w-4 mr-2' />
              Add Puppy
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className='border-t pt-6 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Puppy Name *</Label>
                <Input
                  id='name'
                  value={formData.name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='e.g., Max'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='breed'>Breed *</Label>
                <Input
                  id='breed'
                  value={formData.breed || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, breed: e.target.value })
                  }
                  placeholder='e.g., Golden Retriever'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='gender'>Gender</Label>
                <Select
                  value={formData.gender || 'male'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      gender: value as 'male' | 'female',
                    })
                  }
                >
                  <SelectTrigger id='gender'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='male'>Male</SelectItem>
                    <SelectItem value='female'>Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='price'>Price ($)</Label>
                <Input
                  id='price'
                  type='number'
                  value={formData.price || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  placeholder='0.00'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='dob'>Date of Birth</Label>
                <Input
                  id='dob'
                  type='date'
                  value={formData.dateOfBirth || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label>Status</Label>
                <div className='space-y-2 pt-2'>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={formData.available || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, available: checked })
                      }
                      id='available'
                    />
                    <Label htmlFor='available' className='font-normal'>
                      Available
                    </Label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={formData.reserved || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, reserved: checked })
                      }
                      id='reserved'
                    />
                    <Label htmlFor='reserved' className='font-normal'>
                      Reserved
                    </Label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={formData.featured || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, featured: checked })
                      }
                      id='featured'
                    />
                    <Label htmlFor='featured' className='font-normal'>
                      Featured on Homepage
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Describe this puppy - personality, markings, health info, etc.'
                rows={4}
              />
            </div>

            <div className='space-y-2'>
              <Label>Photos</Label>
              <div className='border-2 border-dashed rounded-lg p-6 text-center'>
                <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                <p className='text-sm text-muted-foreground'>
                  Photo upload feature coming soon
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  {formData.photos?.length || 0} photos uploaded
                </p>
              </div>
            </div>

            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingId ? 'Update Puppy' : 'Add Puppy'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Puppies List */}
      {puppies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Puppy Listings ({puppies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {puppies.map((puppy) => (
                    <TableRow key={puppy.id}>
                      <TableCell className='font-medium'>
                        {puppy.name}
                      </TableCell>
                      <TableCell>{puppy.breed}</TableCell>
                      <TableCell className='capitalize'>
                        {puppy.gender}
                      </TableCell>
                      <TableCell>${puppy.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className='flex gap-1'>
                          {puppy.featured && (
                            <Badge variant='default'>Featured</Badge>
                          )}
                          {puppy.reserved && (
                            <Badge variant='secondary'>Reserved</Badge>
                          )}
                          {puppy.available && (
                            <Badge variant='outline'>Available</Badge>
                          )}
                          {!puppy.available && (
                            <Badge variant='destructive'>Unavailable</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEdit(puppy)}
                          >
                            <Edit2 className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDelete(puppy.id)}
                          >
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {puppies.length === 0 && !showForm && (
        <Card className='text-center py-12'>
          <p className='text-muted-foreground'>
            No puppies listed yet. Add your first puppy to get started!
          </p>
        </Card>
      )}
    </div>
  );
}
