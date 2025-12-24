import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailTemplateStore } from '@breeder/firebase';
import { useBreederStore } from '@breeder/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Copy,
  FileText,
  Info,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { EmailTemplate, TemplateCategory, COMMON_VARIABLES } from '@breeder/types';

export function EmailTemplatesManager() {
  const { currentUser } = useAuth();
  const {
    templates,
    loading,
    subscribeToTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    initializeDefaultTemplates,
  } = useEmailTemplateStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [showVariables, setShowVariables] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'general' as TemplateCategory,
    subject: '',
    body: '',
  });

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToTemplates(currentUser.uid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToTemplates]);

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'general',
      subject: '',
      body: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      body: template.body,
    });
    setDialogOpen(true);
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

      toast({
        title: 'Template Duplicated',
        description: 'Template has been duplicated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate template.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await deleteTemplate(template.id);
      toast({
        title: 'Template Deleted',
        description: 'Template has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: formData.name.trim(),
          category: formData.category,
          subject: formData.subject.trim(),
          body: formData.body.trim(),
        });
        toast({
          title: 'Template Updated',
          description: 'Template has been updated successfully.',
        });
      } else {
        await createTemplate({
          userId: currentUser.uid,
          name: formData.name.trim(),
          category: formData.category,
          subject: formData.subject.trim(),
          body: formData.body.trim(),
          isDefault: false,
          variables: COMMON_VARIABLES,
        });
        toast({
          title: 'Template Created',
          description: 'Template has been created successfully.',
        });
      }

      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template.',
        variant: 'destructive',
      });
    }
  };

  const handleInitializeDefaults = async () => {
    if (!currentUser) return;

    try {
      await initializeDefaultTemplates(currentUser.uid);
      toast({
        title: 'Templates Initialized',
        description: '8 default templates have been added to your account.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize default templates.',
        variant: 'destructive',
      });
    }
  };

  const insertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    setFormData((prev) => ({
      ...prev,
      body: prev.body + variable,
    }));
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const getCategoryLabel = (category: TemplateCategory | 'all') => {
    const labels: Record<TemplateCategory | 'all', string> = {
      all: 'All Templates',
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
    return labels[category];
  };

  const getCategoryColor = (category: TemplateCategory) => {
    const colors: Record<TemplateCategory, string> = {
      inquiry_response: 'bg-blue-500',
      waitlist: 'bg-purple-500',
      deposit: 'bg-green-500',
      payment: 'bg-yellow-500',
      pickup: 'bg-orange-500',
      followup: 'bg-pink-500',
      birthday: 'bg-red-500',
      health_update: 'bg-cyan-500',
      general: 'bg-gray-500',
      custom: 'bg-indigo-500',
    };
    return colors[category];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Create and manage reusable email templates with variables
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {templates.length === 0 && (
                <Button variant="outline" onClick={handleInitializeDefaults}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Add Default Templates
                </Button>
              )}
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'inquiry_response', 'waitlist', 'deposit', 'payment', 'pickup', 'followup', 'birthday', 'health_update', 'general'] as const).map(
              (category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {getCategoryLabel(category)}
                  {category !== 'all' && (
                    <Badge className="ml-2" variant="secondary">
                      {templates.filter((t) => t.category === category).length}
                    </Badge>
                  )}
                </Button>
              )
            )}
          </div>

          {/* Templates List */}
          {filteredTemplates.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No templates yet. Click "New Template" to create one, or "Add Default
                Templates" to get started with pre-built templates.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge className={getCategoryColor(template.category)}>
                            {getCategoryLabel(template.category)}
                          </Badge>
                          {template.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Subject:</strong> {template.subject}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.body}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Use variables like {'{'}customer_name{'}'} to personalize your emails
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Initial Inquiry Response"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as TemplateCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquiry_response">Inquiry Response</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="health_update">Health Update</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="e.g., Thank you for your interest in {{kennel_name}}"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="body">Email Body *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVariables(!showVariables)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {showVariables ? 'Hide' : 'Show'} Variables
                </Button>
              </div>

              {showVariables && (
                <div className="mb-3 p-3 border rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-2">Available Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_VARIABLES.map((variable) => (
                      <Button
                        key={variable.name}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => insertVariable(variable.name)}
                        title={variable.description}
                      >
                        {variable.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click a variable to insert it into the email body
                  </p>
                </div>
              )}

              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                placeholder="Write your email template here. Use {{variable_name}} for dynamic content."
                rows={12}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: Hi {'{'}customer_first_name{'}'}, thank you for contacting{' '}
                {'{'}kennel_name{'}'}!
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
