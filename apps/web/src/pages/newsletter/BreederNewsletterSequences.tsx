/**
 * Breeder Newsletter Sequences (Autoresponders) Management
 *
 * Create and manage automated email sequences.
 */

import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNewsletterStore } from '@breeder/firebase';
import type { AutoresponderSequence } from '@breeder/types';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Zap,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Play,
  Pause,
  Copy,
  Loader2,
  Mail,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function BreederNewsletterSequences() {
  const navigate = useNavigate();
  const { id: sequenceId } = useParams();
  const { currentUser } = useAuth();
  const {
    lists,
    sequences,
    loading,
    subscribeLists,
    subscribeSequences,
    createSequence,
    updateSequence,
    deleteSequence,
  } = useNewsletterStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<AutoresponderSequence | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'list_subscribe' as AutoresponderSequence['trigger'],
    triggerListId: '',
    status: 'draft' as AutoresponderSequence['status'],
  });

  // Subscribe to data with breeder ownerType
  useEffect(() => {
    if (!currentUser) return;

    const unsubLists = subscribeLists(currentUser.uid, 'breeder');
    const unsubSequences = subscribeSequences(currentUser.uid, 'breeder');

    return () => {
      unsubLists();
      unsubSequences();
    };
  }, [currentUser, subscribeLists, subscribeSequences]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: 'list_subscribe',
      triggerListId: '',
      status: 'draft',
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Sequence name is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await createSequence({
        name: formData.name.trim(),
        description: formData.description.trim(),
        trigger: formData.trigger,
        triggerConfig: formData.triggerListId ? { listId: formData.triggerListId } : {},
        status: 'draft',
        emailCount: 0,
        subscribersActive: 0,
        subscribersCompleted: 0,
        ownerId: currentUser!.uid,
        ownerType: 'breeder',
      });
      toast({ title: 'Sequence created' });
      setShowCreateDialog(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to create sequence', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedSequence || !formData.name.trim()) return;

    setSubmitting(true);
    try {
      await updateSequence(selectedSequence.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        trigger: formData.trigger,
        triggerConfig: formData.triggerListId ? { listId: formData.triggerListId } : {},
      });
      toast({ title: 'Sequence updated' });
      setShowEditDialog(false);
      setSelectedSequence(null);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update sequence', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSequence) return;

    setSubmitting(true);
    try {
      await deleteSequence(selectedSequence.id);
      toast({ title: 'Sequence deleted' });
      setShowDeleteDialog(false);
      setSelectedSequence(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete sequence', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (sequence: AutoresponderSequence) => {
    try {
      const newStatus = sequence.status === 'active' ? 'paused' : 'active';
      await updateSequence(sequence.id, { status: newStatus });
      toast({ title: `Sequence ${newStatus === 'active' ? 'activated' : 'paused'}` });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update status', variant: 'destructive' });
    }
  };

  const openEditDialog = (sequence: AutoresponderSequence) => {
    setSelectedSequence(sequence);
    setFormData({
      name: sequence.name,
      description: sequence.description || '',
      trigger: sequence.trigger,
      triggerListId: sequence.triggerConfig?.listId || '',
      status: sequence.status,
    });
    setShowEditDialog(true);
  };

  if (loading && sequences.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading sequences...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold">Autoresponders</h1>
            <p className="text-muted-foreground">
              Create automated email sequences
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Sequence
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sequences.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sequences.filter(s => s.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sequences.reduce((sum, s) => sum + s.subscribersActive, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequences List */}
      <div className="space-y-4">
        {sequences.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No autoresponders yet</p>
              <p className="mb-4">Create automated email sequences to nurture your subscribers</p>
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Sequence
              </Button>
            </CardContent>
          </Card>
        ) : (
          sequences.map((sequence) => (
            <Card key={sequence.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{sequence.name}</h3>
                      <Badge
                        className={
                          sequence.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : sequence.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {sequence.status === 'active' ? 'Active' : sequence.status === 'paused' ? 'Paused' : 'Draft'}
                      </Badge>
                    </div>
                    {sequence.description && (
                      <p className="text-muted-foreground mb-3">{sequence.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {sequence.emailCount} emails
                      </div>
                      <div>{sequence.subscribersActive} active subscribers</div>
                      <div>{sequence.subscribersCompleted} completed</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sequence.status === 'active'}
                      onCheckedChange={() => handleToggleStatus(sequence)}
                      disabled={sequence.status === 'draft'}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(sequence)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => { setSelectedSequence(sequence); setShowDeleteDialog(true); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Autoresponder</DialogTitle>
            <DialogDescription>
              Set up a new automated email sequence
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sequence Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Welcome Series"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this sequence..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={formData.trigger}
                onValueChange={(value: any) => setFormData({ ...formData, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list_subscribe">When someone joins a list</SelectItem>
                  <SelectItem value="tag_added">When a tag is added</SelectItem>
                  <SelectItem value="form_submit">When a form is submitted</SelectItem>
                  <SelectItem value="lead_magnet">When a lead magnet is downloaded</SelectItem>
                  <SelectItem value="manual">Manual trigger</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.trigger === 'list_subscribe' && (
              <div className="space-y-2">
                <Label>Select List</Label>
                <Select
                  value={formData.triggerListId}
                  onValueChange={(value) => setFormData({ ...formData, triggerListId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Sequence'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Autoresponder</DialogTitle>
            <DialogDescription>
              Update sequence settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Sequence Name *</Label>
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
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={formData.trigger}
                onValueChange={(value: any) => setFormData({ ...formData, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list_subscribe">When someone joins a list</SelectItem>
                  <SelectItem value="tag_added">When a tag is added</SelectItem>
                  <SelectItem value="form_submit">When a form is submitted</SelectItem>
                  <SelectItem value="lead_magnet">When a lead magnet is downloaded</SelectItem>
                  <SelectItem value="manual">Manual trigger</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sequence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSequence?.name}"? This will also delete all emails in this sequence. This action cannot be undone.
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

export default BreederNewsletterSequences;
