/**
 * Admin Newsletter Email Templates
 *
 * Manage reusable email templates for newsletter campaigns.
 * Admin version of the email templates manager.
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore, useEmailTemplateStore } from '@breeder/firebase';
import type { EmailTemplate, TemplateCategory } from '@breeder/types';
import { COMMON_VARIABLES } from '@breeder/types';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  FileText,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ChevronDown,
  Info,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const categoryLabels: Record<TemplateCategory, string> = {
  inquiry_response: 'Inquiry Response',
  waitlist: 'Waitlist',
  deposit: 'Deposit',
  payment: 'Payment',
  pickup: 'Pickup',
  followup: 'Follow-up',
  birthday: 'Birthday',
  health_update: 'Health Update',
  general: 'General',
  custom: 'Custom',
};

export function NewsletterTemplates() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { checkIsAdmin } = useAdminStore();
  const {
    templates,
    loading,
    subscribeToTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useEmailTemplateStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showVariables, setShowVariables] = useState(false);
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | 'all'>('all');

  const [formData, setFormData] = useState({
    name: '',
    category: 'general' as TemplateCategory,
    subject: '',
    body: '',
  });

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const adminStatus = await checkIsAdmin(currentUser.uid);
      if (!adminStatus) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [currentUser, navigate, checkIsAdmin]);

  // Subscribe to templates
  useEffect(() => {
    if (!isAdmin || !currentUser) return;

    const unsubscribe = subscribeToTemplates(currentUser.uid);
    return unsubscribe;
  }, [isAdmin, currentUser, subscribeToTemplates]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'general',
      subject: '',
      body: '',
    });
  };

  const handleOpenDialog = (template?: EmailTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        category: template.category,
        subject: template.subject,
        body: template.body,
      });
    } else {
      setSelectedTemplate(null);
      resetForm();
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    if (!formData.name.trim()) {
      toast({ title: 'Please enter a template name', variant: 'destructive' });
      return;
    }

    if (!formData.subject.trim()) {
      toast({ title: 'Please enter a subject line', variant: 'destructive' });
      return;
    }

    if (!formData.body.trim()) {
      toast({ title: 'Please enter the email body', variant: 'destructive' });
      return;
    }

    try {
      if (selectedTemplate) {
        await updateTemplate(selectedTemplate.id, {
          name: formData.name,
          category: formData.category,
          subject: formData.subject,
          body: formData.body,
        });
        toast({ title: 'Template updated successfully' });
      } else {
        await createTemplate({
          userId: currentUser.uid,
          name: formData.name,
          category: formData.category,
          subject: formData.subject,
          body: formData.body,
          isDefault: false,
          variables: COMMON_VARIABLES,
        });
        toast({ title: 'Template created successfully' });
      }

      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to save template', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    if (!currentUser) return;

    try {
      await createTemplate({
        userId: currentUser.uid,
        name: `${template.name} (Copy)`,
        category: template.category,
        subject: template.subject,
        body: template.body,
        isDefault: false,
        variables: template.variables,
      });
      toast({ title: 'Template duplicated successfully' });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to duplicate template', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await deleteTemplate(selectedTemplate.id);
      toast({ title: 'Template deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete template', variant: 'destructive' });
    }
  };

  const insertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    setFormData({ ...formData, body: formData.body + variable });
  };

  const filteredTemplates = filterCategory === 'all'
    ? templates
    : templates.filter((t) => t.category === filterCategory);

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">
              Create and manage reusable email templates for campaigns
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={filterCategory}
          onValueChange={(value) => setFilterCategory(value as TemplateCategory | 'all')}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Templates List */}
      <Card>
        <CardContent className="pt-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No templates found</p>
              <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create your first template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[template.category] || template.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      {template.isDefault ? (
                        <Badge variant="secondary">System</Badge>
                      ) : (
                        <Badge>Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(template)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {!template.isDefault && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Create a reusable email template for your campaigns
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as TemplateCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Welcome to {{kennel_name}}!"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Email Body</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVariables(!showVariables)}
                >
                  <Info className="h-4 w-4 mr-1" />
                  Variables
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showVariables ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              {showVariables && (
                <div className="p-4 bg-muted border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    Click a variable to insert it into the body:
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                    {COMMON_VARIABLES.map((v) => (
                      <Badge
                        key={v.name}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => insertVariable(v.name)}
                      >
                        {`{{${v.name}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Write your email content here. Use {{variable_name}} to insert dynamic content."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {selectedTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedTemplate?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default NewsletterTemplates;
