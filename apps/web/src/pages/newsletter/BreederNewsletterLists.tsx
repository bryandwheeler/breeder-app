/**
 * Breeder Newsletter Lists Management
 *
 * Manage subscriber lists - create, edit, delete lists and view list details.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNewsletterStore } from '@breeder/firebase';
import type { NewsletterList } from '@breeder/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  List,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function BreederNewsletterLists() {
  const { currentUser } = useAuth();
  const {
    lists,
    loading,
    subscribeLists,
    createList,
    updateList,
    deleteList,
  } = useNewsletterStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedList, setSelectedList] = useState<NewsletterList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    doubleOptIn: true,
  });

  // Subscribe to lists with breeder ownerType
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeLists(currentUser.uid, 'breeder');
    return () => unsub();
  }, [currentUser, subscribeLists]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isDefault: false,
      doubleOptIn: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !currentUser) {
      toast({ title: 'List name is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await createList({
        name: formData.name.trim(),
        description: formData.description.trim(),
        isDefault: formData.isDefault,
        doubleOptIn: formData.doubleOptIn,
        ownerId: currentUser.uid,
        ownerType: 'breeder',
      });
      toast({ title: 'List created successfully' });
      setShowCreateDialog(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to create list', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedList || !formData.name.trim()) {
      toast({ title: 'List name is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await updateList(selectedList.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isDefault: formData.isDefault,
        doubleOptIn: formData.doubleOptIn,
      });
      toast({ title: 'List updated successfully' });
      setShowEditDialog(false);
      setSelectedList(null);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update list', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedList) return;

    setSubmitting(true);
    try {
      await deleteList(selectedList.id);
      toast({ title: 'List deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedList(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete list', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (list: NewsletterList) => {
    setSelectedList(list);
    setFormData({
      name: list.name,
      description: list.description || '',
      isDefault: list.isDefault,
      doubleOptIn: list.doubleOptIn,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (list: NewsletterList) => {
    setSelectedList(list);
    setShowDeleteDialog(true);
  };

  const copyListId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: 'List ID copied to clipboard' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Subscriber Lists</h1>
            <p className="text-muted-foreground">
              Organize your subscribers into targeted lists
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lists</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lists.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lists.reduce((sum, list) => sum + list.subscriberCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lists.reduce((sum, list) => sum + list.activeCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Lists</CardTitle>
          <CardDescription>
            Click on a list to view and manage its subscribers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lists.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No lists yet</p>
              <p className="mb-4">Create your first subscriber list to get started</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create List
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Settings</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell>
                      <div>
                        <Link
                          to={`/newsletter/subscribers?list=${list.id}`}
                          className="font-medium hover:underline"
                        >
                          {list.name}
                        </Link>
                        {list.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {list.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {list.subscriberCount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600">
                        {list.activeCount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {list.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                        {list.doubleOptIn && (
                          <Badge variant="outline">Double Opt-in</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(list.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/newsletter/subscribers?list=${list.id}`}>
                              <Users className="h-4 w-4 mr-2" />
                              View Subscribers
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(list)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit List
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyListId(list.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => openDeleteDialog(list)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete List
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Create a new subscriber list to organize your contacts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">List Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Newsletter, VIP Customers"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this list..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="default">Default List</Label>
                <p className="text-sm text-muted-foreground">
                  New subscribers will be added to this list by default
                </p>
              </div>
              <Switch
                id="default"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="doubleOptIn">Double Opt-in</Label>
                <p className="text-sm text-muted-foreground">
                  Require email confirmation before activating subscribers
                </p>
              </div>
              <Switch
                id="doubleOptIn"
                checked={formData.doubleOptIn}
                onCheckedChange={(checked) => setFormData({ ...formData, doubleOptIn: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit List Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>
              Update the list settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">List Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-default">Default List</Label>
                <p className="text-sm text-muted-foreground">
                  New subscribers will be added to this list by default
                </p>
              </div>
              <Switch
                id="edit-default"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-doubleOptIn">Double Opt-in</Label>
                <p className="text-sm text-muted-foreground">
                  Require email confirmation before activating subscribers
                </p>
              </div>
              <Switch
                id="edit-doubleOptIn"
                checked={formData.doubleOptIn}
                onCheckedChange={(checked) => setFormData({ ...formData, doubleOptIn: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedList?.name}"? This action cannot be undone.
              {selectedList && selectedList.subscriberCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This list has {selectedList.subscriberCount} subscribers.
                  Subscribers will not be deleted, but they will be removed from this list.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BreederNewsletterLists;
