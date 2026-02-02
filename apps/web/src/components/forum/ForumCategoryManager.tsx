import { useEffect, useState } from 'react';
import { useForumStore } from '@breeder/firebase';
import { ForumCategory, ForumCategoryType, DEFAULT_FORUM_CATEGORIES } from '@breeder/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  MessagesSquare,
  RefreshCw,
} from 'lucide-react';

const CATEGORY_TYPE_OPTIONS: { value: ForumCategoryType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'breed-specific', label: 'Breed Specific' },
  { value: 'health', label: 'Health' },
  { value: 'training', label: 'Training' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'business', label: 'Business' },
  { value: 'whelping', label: 'Whelping' },
  { value: 'puppy-care', label: 'Puppy Care' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'announcements', label: 'Announcements' },
];

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  type: ForumCategoryType;
  icon: string;
  isActive: boolean;
}

const initialFormData: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  type: 'general',
  icon: '',
  isActive: true,
};

export function ForumCategoryManager() {
  const { categories, categoriesLoading, subscribeToCategories, createCategory, updateCategory, deleteCategory } =
    useForumStore();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ForumCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCategories();
    return unsub;
  }, [subscribeToCategories]);

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
    }));
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      ...initialFormData,
      icon: 'MessagesSquare',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: ForumCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      type: category.type,
      icon: category.icon || '',
      isActive: category.isActive,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (category: ForumCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a category name',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.slug.trim()) {
      toast({
        title: 'Slug required',
        description: 'Please enter a URL slug',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim(),
          type: formData.type,
          icon: formData.icon || undefined,
          isActive: formData.isActive,
        });
        toast({
          title: 'Category updated',
          description: 'The category has been updated successfully',
        });
      } else {
        const maxSortOrder = Math.max(0, ...categories.map((c) => c.sortOrder));
        await createCategory({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim(),
          type: formData.type,
          icon: formData.icon || undefined,
          sortOrder: maxSortOrder + 1,
          isActive: formData.isActive,
        });
        toast({
          title: 'Category created',
          description: 'The category has been created successfully',
        });
      }
      setDialogOpen(false);
      setFormData(initialFormData);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id);
      toast({
        title: 'Category deleted',
        description: 'The category has been deleted',
      });
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleMoveUp = async (category: ForumCategory) => {
    const index = sortedCategories.findIndex((c) => c.id === category.id);
    if (index <= 0) return;

    const prevCategory = sortedCategories[index - 1];
    try {
      await updateCategory(category.id, { sortOrder: prevCategory.sortOrder });
      await updateCategory(prevCategory.id, { sortOrder: category.sortOrder });
    } catch (error) {
      console.error('Failed to reorder:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder categories',
        variant: 'destructive',
      });
    }
  };

  const handleMoveDown = async (category: ForumCategory) => {
    const index = sortedCategories.findIndex((c) => c.id === category.id);
    if (index >= sortedCategories.length - 1) return;

    const nextCategory = sortedCategories[index + 1];
    try {
      await updateCategory(category.id, { sortOrder: nextCategory.sortOrder });
      await updateCategory(nextCategory.id, { sortOrder: category.sortOrder });
    } catch (error) {
      console.error('Failed to reorder:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder categories',
        variant: 'destructive',
      });
    }
  };

  const handleSeedDefaults = async () => {
    if (categories.length > 0) {
      toast({
        title: 'Categories exist',
        description: 'Default categories can only be seeded when none exist',
        variant: 'destructive',
      });
      return;
    }

    setSeeding(true);
    try {
      for (const cat of DEFAULT_FORUM_CATEGORIES) {
        await createCategory(cat);
      }
      toast({
        title: 'Categories seeded',
        description: `${DEFAULT_FORUM_CATEGORIES.length} default categories have been created`,
      });
    } catch (error) {
      console.error('Failed to seed categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to seed default categories',
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  if (categoriesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessagesSquare className="h-5 w-5" />
          Forum Categories
        </CardTitle>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <Button variant="outline" onClick={handleSeedDefaults} disabled={seeding}>
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Seed Defaults
                </>
              )}
            </Button>
          )}
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessagesSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No forum categories yet.</p>
            <p className="text-sm">
              Click "Seed Defaults" to create the standard categories, or add your own.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Threads</TableHead>
                <TableHead className="text-center">Posts</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCategories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveUp(category)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveDown(category)}
                        disabled={index === sortedCategories.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs text-muted-foreground">/{category.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {category.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{category.threadCount}</TableCell>
                  <TableCell className="text-center">{category.postCount}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={category.isActive ? 'default' : 'outline'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDelete(category)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Category name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="url-friendly-slug"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs: /forum/category/{formData.slug || 'slug'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, type: v as ForumCategoryType }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive categories are hidden from users
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingCategory ? (
                'Save Changes'
              ) : (
                'Create Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This will also
              delete all threads and posts within this category. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
