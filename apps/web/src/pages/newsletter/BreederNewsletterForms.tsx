/**
 * Breeder Newsletter Signup Forms Management
 *
 * Create embeddable signup forms to collect subscribers.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNewsletterStore } from '@breeder/firebase';
import type { SignupForm } from '@breeder/types';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  FileText,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Copy,
  ExternalLink,
  Eye,
  Loader2,
  Code,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function BreederNewsletterForms() {
  const { currentUser } = useAuth();
  const {
    lists,
    signupForms,
    loading,
    subscribeLists,
    subscribeSignupForms,
    createSignupForm,
    updateSignupForm,
    deleteSignupForm,
  } = useNewsletterStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<SignupForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    listIds: [] as string[],
    buttonText: 'Subscribe',
    successMessage: 'Thank you for subscribing!',
    requireConfirmation: true,
    isActive: true,
  });

  // Subscribe to data with breeder ownerType
  useEffect(() => {
    if (!currentUser) return;

    const unsubLists = subscribeLists(currentUser.uid, 'breeder');
    const unsubForms = subscribeSignupForms(currentUser.uid, 'breeder');

    return () => {
      unsubLists();
      unsubForms();
    };
  }, [currentUser, subscribeLists, subscribeSignupForms]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      listIds: [],
      buttonText: 'Subscribe',
      successMessage: 'Thank you for subscribing!',
      requireConfirmation: true,
      isActive: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Form name is required', variant: 'destructive' });
      return;
    }
    if (formData.listIds.length === 0) {
      toast({ title: 'Please select at least one list', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await createSignupForm({
        name: formData.name.trim(),
        description: formData.description.trim(),
        listIds: formData.listIds,
        addTags: [],
        fields: [
          { id: 'email', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true, order: 0 },
          { id: 'firstName', type: 'text', label: 'First Name', placeholder: 'John', required: false, order: 1 },
        ],
        styling: {
          theme: 'light',
          primaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          buttonColor: '#3b82f6',
          buttonTextColor: '#ffffff',
          borderRadius: 8,
          fontFamily: 'Inter',
          fontSize: 14,
          padding: 16,
          showLabels: true,
          buttonText: formData.buttonText,
          width: 'full',
        },
        successMessage: formData.successMessage,
        alreadySubscribedMessage: 'You are already subscribed!',
        errorMessage: 'Something went wrong. Please try again.',
        requireConfirmation: formData.requireConfirmation,
        views: 0,
        submissions: 0,
        conversions: 0,
        conversionRate: 0,
        ownerId: currentUser!.uid,
        ownerType: 'breeder',
        isActive: formData.isActive,
      });
      toast({ title: 'Signup form created' });
      setShowCreateDialog(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to create form', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedForm || !formData.name.trim()) return;

    setSubmitting(true);
    try {
      await updateSignupForm(selectedForm.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        listIds: formData.listIds,
        successMessage: formData.successMessage,
        requireConfirmation: formData.requireConfirmation,
        isActive: formData.isActive,
      });
      toast({ title: 'Form updated' });
      setShowEditDialog(false);
      setSelectedForm(null);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update form', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedForm) return;

    setSubmitting(true);
    try {
      await deleteSignupForm(selectedForm.id);
      toast({ title: 'Form deleted' });
      setShowDeleteDialog(false);
      setSelectedForm(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete form', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (form: SignupForm) => {
    setSelectedForm(form);
    setFormData({
      name: form.name,
      description: form.description || '',
      listIds: form.listIds,
      buttonText: form.styling?.buttonText || 'Subscribe',
      successMessage: form.successMessage,
      requireConfirmation: form.requireConfirmation,
      isActive: form.isActive,
    });
    setShowEditDialog(true);
  };

  const copyEmbedCode = (form: SignupForm) => {
    const embedCode = form.embedCode || `<!-- Add form embed code here for form: ${form.id} -->`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: 'Embed code copied to clipboard' });
  };

  const toggleActive = async (form: SignupForm) => {
    try {
      await updateSignupForm(form.id, { isActive: !form.isActive });
      toast({ title: `Form ${form.isActive ? 'deactivated' : 'activated'}` });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update form', variant: 'destructive' });
    }
  };

  if (loading && signupForms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading forms...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold">Signup Forms</h1>
            <p className="text-muted-foreground">
              Create embeddable forms to collect subscribers
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signupForms.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signupForms.reduce((sum, f) => sum + f.views, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signupForms.reduce((sum, f) => sum + f.submissions, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      {signupForms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No signup forms yet</p>
            <p className="mb-4">Create a form to embed on your website and collect subscribers</p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {signupForms.map((form) => (
            <Card key={form.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{form.name}</h3>
                      <Badge variant={form.isActive ? 'default' : 'secondary'}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {form.description && (
                      <p className="text-muted-foreground mb-3">{form.description}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div>{form.views.toLocaleString()} views</div>
                      <div>{form.submissions.toLocaleString()} submissions</div>
                      <div>{form.conversionRate.toFixed(1)}% conversion</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={() => toggleActive(form)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(form)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyEmbedCode(form)}>
                          <Code className="h-4 w-4 mr-2" />
                          Copy Embed Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedForm(form); setShowEmbedDialog(true); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Embed Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => { setSelectedForm(form); setShowDeleteDialog(true); }}
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
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Signup Form</DialogTitle>
            <DialogDescription>
              Create a new form to embed on your website
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Form Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Newsletter Signup"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this form..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Add to Lists *</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto">
                {lists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No lists available. <Link to="/newsletter/lists" className="text-primary hover:underline">Create a list first</Link>.
                  </p>
                ) : (
                  lists.map((list) => (
                    <div key={list.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`list-${list.id}`}
                        checked={formData.listIds.includes(list.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, listIds: [...formData.listIds, list.id] });
                          } else {
                            setFormData({ ...formData, listIds: formData.listIds.filter((id) => id !== list.id) });
                          }
                        }}
                      />
                      <label htmlFor={`list-${list.id}`} className="text-sm">
                        {list.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="successMessage">Success Message</Label>
              <Input
                id="successMessage"
                placeholder="Thank you for subscribing!"
                value={formData.successMessage}
                onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Double Opt-in</Label>
                <p className="text-xs text-muted-foreground">
                  Require email confirmation
                </p>
              </div>
              <Switch
                checked={formData.requireConfirmation}
                onCheckedChange={(checked) => setFormData({ ...formData, requireConfirmation: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Signup Form</DialogTitle>
            <DialogDescription>
              Update form settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Form Name *</Label>
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
              <Label>Add to Lists</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto">
                {lists.map((list) => (
                  <div key={list.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-list-${list.id}`}
                      checked={formData.listIds.includes(list.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, listIds: [...formData.listIds, list.id] });
                        } else {
                          setFormData({ ...formData, listIds: formData.listIds.filter((id) => id !== list.id) });
                        }
                      }}
                    />
                    <label htmlFor={`edit-list-${list.id}`} className="text-sm">
                      {list.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-successMessage">Success Message</Label>
              <Input
                id="edit-successMessage"
                value={formData.successMessage}
                onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Double Opt-in</Label>
                <p className="text-xs text-muted-foreground">
                  Require email confirmation
                </p>
              </div>
              <Switch
                checked={formData.requireConfirmation}
                onCheckedChange={(checked) => setFormData({ ...formData, requireConfirmation: checked })}
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

      {/* Embed Code Dialog */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Code</DialogTitle>
            <DialogDescription>
              Copy this code to embed the form on your website
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              readOnly
              value={selectedForm?.embedCode || `<!-- Form embed code for: ${selectedForm?.name} -->\n<script src="https://yoursite.com/form/${selectedForm?.id}"></script>`}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmbedDialog(false)}>
              Close
            </Button>
            <Button onClick={() => selectedForm && copyEmbedCode(selectedForm)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedForm?.name}"? This action cannot be undone.
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

export default BreederNewsletterForms;
