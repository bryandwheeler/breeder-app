/**
 * Admin Newsletter Signup Forms
 *
 * Create, edit, and manage embeddable signup forms.
 * Supports form builder, styling, and embed code generation.
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore, useNewsletterStore } from '@breeder/firebase';
import type {
  SignupForm,
  FormField,
  FormFieldType,
  FormStyling,
  NewsletterList,
  LeadMagnet,
  AutoresponderSequence,
} from '@breeder/types';
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
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Copy,
  Eye,
  Code,
  ExternalLink,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Type,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  List,
  AlignLeft,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const fieldTypeConfig: Record<FormFieldType, { label: string; icon: React.ReactNode }> = {
  email: { label: 'Email', icon: <Mail className="h-4 w-4" /> },
  text: { label: 'Text', icon: <Type className="h-4 w-4" /> },
  textarea: { label: 'Long Text', icon: <AlignLeft className="h-4 w-4" /> },
  select: { label: 'Dropdown', icon: <List className="h-4 w-4" /> },
  checkbox: { label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" /> },
  radio: { label: 'Radio', icon: <CheckSquare className="h-4 w-4" /> },
  phone: { label: 'Phone', icon: <Phone className="h-4 w-4" /> },
  date: { label: 'Date', icon: <Calendar className="h-4 w-4" /> },
};

const defaultStyling: FormStyling = {
  theme: 'light',
  primaryColor: '#2563eb',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  buttonColor: '#2563eb',
  buttonTextColor: '#ffffff',
  borderRadius: 8,
  fontFamily: 'system-ui',
  fontSize: 16,
  padding: 24,
  showLabels: true,
  buttonText: 'Subscribe',
  width: 'full',
};

export function NewsletterForms() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { checkIsAdmin } = useAdminStore();
  const {
    lists,
    sequences,
    leadMagnets,
    signupForms,
    loading,
    subscribeLists,
    subscribeSequences,
    subscribeLeadMagnets,
    subscribeSignupForms,
    createSignupForm,
    updateSignupForm,
    deleteSignupForm,
  } = useNewsletterStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<SignupForm | null>(null);
  const [activeTab, setActiveTab] = useState('fields');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    listIds: [] as string[],
    addTags: [] as string[],
    leadMagnetId: '',
    sequenceId: '',
    fields: [
      {
        id: 'email',
        type: 'email' as FormFieldType,
        name: 'email',
        label: 'Email Address',
        placeholder: 'you@example.com',
        required: true,
        mapToField: 'email',
      },
    ] as FormField[],
    styling: { ...defaultStyling },
    successMessage: 'Thank you for subscribing!',
    successRedirectUrl: '',
    alreadySubscribedMessage: 'You are already subscribed.',
    errorMessage: 'Something went wrong. Please try again.',
    requireConfirmation: false,
    confirmationEmailSubject: 'Please confirm your subscription',
    confirmationEmailContent: '',
    isActive: true,
  });

  const [tagInput, setTagInput] = useState('');
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldOptionsInput, setFieldOptionsInput] = useState('');

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

  // Subscribe to data
  useEffect(() => {
    if (!isAdmin || !currentUser) return;

    const unsubLists = subscribeLists(currentUser.uid, 'admin');
    const unsubSequences = subscribeSequences(currentUser.uid, 'admin');
    const unsubLeadMagnets = subscribeLeadMagnets(currentUser.uid, 'admin');
    const unsubSignupForms = subscribeSignupForms(currentUser.uid, 'admin');

    return () => {
      unsubLists();
      unsubSequences();
      unsubLeadMagnets();
      unsubSignupForms();
    };
  }, [isAdmin, currentUser, subscribeLists, subscribeSequences, subscribeLeadMagnets, subscribeSignupForms]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      listIds: [],
      addTags: [],
      leadMagnetId: '',
      sequenceId: '',
      fields: [
        {
          id: 'email',
          type: 'email',
          name: 'email',
          label: 'Email Address',
          placeholder: 'you@example.com',
          required: true,
          mapToField: 'email',
        },
      ],
      styling: { ...defaultStyling },
      successMessage: 'Thank you for subscribing!',
      successRedirectUrl: '',
      alreadySubscribedMessage: 'You are already subscribed.',
      errorMessage: 'Something went wrong. Please try again.',
      requireConfirmation: false,
      confirmationEmailSubject: 'Please confirm your subscription',
      confirmationEmailContent: '',
      isActive: true,
    });
    setTagInput('');
    setActiveTab('fields');
  };

  const handleOpenDialog = (form?: SignupForm) => {
    if (form) {
      setSelectedForm(form);
      setFormData({
        name: form.name,
        description: form.description || '',
        listIds: form.listIds,
        addTags: form.addTags,
        leadMagnetId: form.leadMagnetId || '',
        sequenceId: form.sequenceId || '',
        fields: form.fields,
        styling: form.styling,
        successMessage: form.successMessage,
        successRedirectUrl: form.successRedirectUrl || '',
        alreadySubscribedMessage: form.alreadySubscribedMessage,
        errorMessage: form.errorMessage,
        requireConfirmation: form.requireConfirmation,
        confirmationEmailSubject: form.confirmationEmailSubject || '',
        confirmationEmailContent: form.confirmationEmailContent || '',
        isActive: form.isActive,
      });
    } else {
      setSelectedForm(null);
      resetForm();
    }
    setShowDialog(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.addTags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        addTags: [...formData.addTags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      addTags: formData.addTags.filter((t) => t !== tag),
    });
  };

  const handleAddField = (type: FormFieldType) => {
    const id = `field_${Date.now()}`;
    const newField: FormField = {
      id,
      type,
      name: id,
      label: fieldTypeConfig[type].label,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFormData({
      ...formData,
      fields: [...formData.fields, newField],
    });
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormData({
      ...formData,
      fields: formData.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  const handleRemoveField = (fieldId: string) => {
    // Don't allow removing email field
    if (fieldId === 'email') {
      toast({ title: 'Email field is required', variant: 'destructive' });
      return;
    }
    setFormData({
      ...formData,
      fields: formData.fields.filter((f) => f.id !== fieldId),
    });
  };

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const index = formData.fields.findIndex((f) => f.id === fieldId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.fields.length) return;

    const newFields = [...formData.fields];
    const [removed] = newFields.splice(index, 1);
    newFields.splice(newIndex, 0, removed);
    setFormData({ ...formData, fields: newFields });
  };

  const handleSave = async () => {
    if (!currentUser) return;

    if (!formData.name.trim()) {
      toast({ title: 'Please enter a form name', variant: 'destructive' });
      return;
    }

    if (formData.listIds.length === 0) {
      toast({ title: 'Please select at least one list', variant: 'destructive' });
      return;
    }

    try {
      if (selectedForm) {
        await updateSignupForm(selectedForm.id, {
          name: formData.name,
          description: formData.description || undefined,
          listIds: formData.listIds,
          addTags: formData.addTags,
          leadMagnetId: formData.leadMagnetId || undefined,
          sequenceId: formData.sequenceId || undefined,
          fields: formData.fields,
          styling: formData.styling,
          successMessage: formData.successMessage,
          successRedirectUrl: formData.successRedirectUrl || undefined,
          alreadySubscribedMessage: formData.alreadySubscribedMessage,
          errorMessage: formData.errorMessage,
          requireConfirmation: formData.requireConfirmation,
          confirmationEmailSubject: formData.confirmationEmailSubject || undefined,
          confirmationEmailContent: formData.confirmationEmailContent || undefined,
          isActive: formData.isActive,
        });
        toast({ title: 'Form updated successfully' });
      } else {
        await createSignupForm({
          name: formData.name,
          description: formData.description || undefined,
          listIds: formData.listIds,
          addTags: formData.addTags,
          leadMagnetId: formData.leadMagnetId || undefined,
          sequenceId: formData.sequenceId || undefined,
          fields: formData.fields,
          styling: formData.styling,
          successMessage: formData.successMessage,
          successRedirectUrl: formData.successRedirectUrl || undefined,
          alreadySubscribedMessage: formData.alreadySubscribedMessage,
          errorMessage: formData.errorMessage,
          requireConfirmation: formData.requireConfirmation,
          confirmationEmailSubject: formData.confirmationEmailSubject || undefined,
          confirmationEmailContent: formData.confirmationEmailContent || undefined,
          isActive: formData.isActive,
          ownerId: currentUser.uid,
          ownerType: 'admin',
        });
        toast({ title: 'Form created successfully' });
      }

      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to save form', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedForm) return;

    try {
      await deleteSignupForm(selectedForm.id);
      toast({ title: 'Form deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedForm(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete form', variant: 'destructive' });
    }
  };

  const handleCopyEmbed = (form: SignupForm) => {
    if (form.embedCode) {
      navigator.clipboard.writeText(form.embedCode);
      toast({ title: 'Embed code copied to clipboard' });
    }
  };

  // Form preview component
  const FormPreview = () => (
    <div
      style={{
        backgroundColor: formData.styling.backgroundColor,
        padding: formData.styling.padding,
        borderRadius: formData.styling.borderRadius,
        fontFamily: formData.styling.fontFamily,
        fontSize: formData.styling.fontSize,
        color: formData.styling.textColor,
        maxWidth: formData.styling.width === 'full' ? '100%' : typeof formData.styling.width === 'number' ? formData.styling.width : 'auto',
      }}
      className="border"
    >
      {formData.fields.map((field) => (
        <div key={field.id} className="mb-4">
          {formData.styling.showLabels && (
            <label className="block mb-1 font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {field.type === 'email' || field.type === 'text' || field.type === 'phone' ? (
            <input
              type={field.type}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border rounded"
              style={{ borderRadius: formData.styling.borderRadius / 2 }}
              disabled
            />
          ) : field.type === 'textarea' ? (
            <textarea
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border rounded"
              style={{ borderRadius: formData.styling.borderRadius / 2 }}
              rows={3}
              disabled
            />
          ) : field.type === 'select' ? (
            <select
              className="w-full px-3 py-2 border rounded"
              style={{ borderRadius: formData.styling.borderRadius / 2 }}
              disabled
            >
              <option>{field.placeholder || 'Select...'}</option>
              {field.options?.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <div className="flex items-center gap-2">
              <input type="checkbox" disabled />
              <span>{field.placeholder || field.label}</span>
            </div>
          ) : field.type === 'radio' ? (
            <div className="space-y-1">
              {field.options?.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <input type="radio" name={field.name} disabled />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          ) : field.type === 'date' ? (
            <input
              type="date"
              className="w-full px-3 py-2 border rounded"
              style={{ borderRadius: formData.styling.borderRadius / 2 }}
              disabled
            />
          ) : null}
        </div>
      ))}
      <button
        style={{
          backgroundColor: formData.styling.buttonColor,
          color: formData.styling.buttonTextColor,
          borderRadius: formData.styling.borderRadius / 2,
        }}
        className="w-full py-2 px-4 font-medium"
        disabled
      >
        {formData.styling.buttonText}
      </button>
    </div>
  );

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Signup Forms</h1>
            <p className="text-muted-foreground">
              Create embeddable forms to capture email subscribers
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signupForms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signupForms.filter((f) => f.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signupForms.reduce((sum, f) => sum + f.submissions, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signupForms.length > 0
                ? (signupForms.reduce((sum, f) => sum + f.conversionRate, 0) / signupForms.length).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      <Card>
        <CardContent className="pt-6">
          {signupForms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No signup forms yet</p>
              <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create your first form
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Lists</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Conversion</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signupForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{form.name}</p>
                        {form.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {form.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{form.fields.length}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {form.listIds.length} list{form.listIds.length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>{form.views.toLocaleString()}</TableCell>
                    <TableCell>{form.submissions.toLocaleString()}</TableCell>
                    <TableCell>{form.conversionRate.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge className={form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(form)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedForm(form);
                              setShowEmbedDialog(true);
                            }}
                          >
                            <Code className="h-4 w-4 mr-2" />
                            Get Embed Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyEmbed(form)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Embed Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedForm(form);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedForm ? 'Edit Form' : 'Create Form'}
            </DialogTitle>
            <DialogDescription>
              Build a signup form to capture email subscribers
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="styling">Styling</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Field List */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Form Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Newsletter Signup"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Form Fields</Label>
                    <div className="space-y-2">
                      {formData.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50"
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMoveField(field.id, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMoveField(field.id, 'down')}
                              disabled={index === formData.fields.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {fieldTypeConfig[field.type].icon}
                              <Input
                                value={field.label}
                                onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <label className="flex items-center gap-1">
                                <Checkbox
                                  checked={field.required}
                                  onCheckedChange={(checked) => handleUpdateField(field.id, { required: !!checked })}
                                />
                                Required
                              </label>
                              <Input
                                value={field.placeholder || ''}
                                onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                                placeholder="Placeholder text"
                                className="h-6 text-xs flex-1"
                              />
                            </div>
                            {(field.type === 'select' || field.type === 'radio') && (
                              <div className="mt-2">
                                <Input
                                  value={field.options?.join(', ') || ''}
                                  onChange={(e) => handleUpdateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                                  placeholder="Option 1, Option 2, Option 3"
                                  className="h-6 text-xs"
                                />
                              </div>
                            )}
                          </div>
                          {field.id !== 'email' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleRemoveField(field.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Add Field</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(fieldTypeConfig).map(([type, config]) => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddField(type as FormFieldType)}
                        >
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add to Lists</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                      {lists.map((list) => (
                        <div key={list.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`list-${list.id}`}
                            checked={formData.listIds.includes(list.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  listIds: [...formData.listIds, list.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  listIds: formData.listIds.filter((id) => id !== list.id),
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`list-${list.id}`} className="text-sm font-normal">
                            {list.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Add Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Enter a tag"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                    {formData.addTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.addTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                            {tag} &times;
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Lead Magnet (optional)</Label>
                    <Select
                      value={formData.leadMagnetId || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, leadMagnetId: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {leadMagnets.map((magnet) => (
                          <SelectItem key={magnet.id} value={magnet.id}>
                            {magnet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Autoresponder (optional)</Label>
                    <Select
                      value={formData.sequenceId || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, sequenceId: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {sequences.filter(s => s.status === 'active').map((seq) => (
                          <SelectItem key={seq.id} value={seq.id}>
                            {seq.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="styling" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={formData.styling.theme}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        styling: {
                          ...formData.styling,
                          theme: value as 'light' | 'dark' | 'custom',
                          ...(value === 'dark' ? {
                            backgroundColor: '#1f2937',
                            textColor: '#f9fafb',
                          } : value === 'light' ? {
                            backgroundColor: '#ffffff',
                            textColor: '#1f2937',
                          } : {}),
                        },
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.styling.primaryColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            styling: { ...formData.styling, primaryColor: e.target.value },
                          })}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input
                          value={formData.styling.primaryColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            styling: { ...formData.styling, primaryColor: e.target.value },
                          })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Button Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.styling.buttonColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            styling: { ...formData.styling, buttonColor: e.target.value },
                          })}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input
                          value={formData.styling.buttonColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            styling: { ...formData.styling, buttonColor: e.target.value },
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Border Radius: {formData.styling.borderRadius}px</Label>
                    <Slider
                      value={[formData.styling.borderRadius]}
                      onValueChange={([value]) => setFormData({
                        ...formData,
                        styling: { ...formData.styling, borderRadius: value },
                      })}
                      min={0}
                      max={24}
                      step={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Padding: {formData.styling.padding}px</Label>
                    <Slider
                      value={[formData.styling.padding]}
                      onValueChange={([value]) => setFormData({
                        ...formData,
                        styling: { ...formData.styling, padding: value },
                      })}
                      min={8}
                      max={48}
                      step={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={formData.styling.buttonText}
                      onChange={(e) => setFormData({
                        ...formData,
                        styling: { ...formData.styling, buttonText: e.target.value },
                      })}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.styling.showLabels}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        styling: { ...formData.styling, showLabels: checked },
                      })}
                    />
                    <Label>Show field labels</Label>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Preview</Label>
                  <div className="border rounded-lg p-4 bg-gray-100">
                    <FormPreview />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Success Message</Label>
                    <Textarea
                      value={formData.successMessage}
                      onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Redirect URL (optional)</Label>
                    <Input
                      value={formData.successRedirectUrl}
                      onChange={(e) => setFormData({ ...formData, successRedirectUrl: e.target.value })}
                      placeholder="https://example.com/thank-you"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Already Subscribed Message</Label>
                    <Textarea
                      value={formData.alreadySubscribedMessage}
                      onChange={(e) => setFormData({ ...formData, alreadySubscribedMessage: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Error Message</Label>
                    <Textarea
                      value={formData.errorMessage}
                      onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.requireConfirmation}
                      onCheckedChange={(checked) => setFormData({ ...formData, requireConfirmation: checked })}
                    />
                    <Label>Require email confirmation (double opt-in)</Label>
                  </div>

                  {formData.requireConfirmation && (
                    <>
                      <div className="space-y-2">
                        <Label>Confirmation Email Subject</Label>
                        <Input
                          value={formData.confirmationEmailSubject}
                          onChange={(e) => setFormData({ ...formData, confirmationEmailSubject: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Confirmation Email Content</Label>
                        <Textarea
                          value={formData.confirmationEmailContent}
                          onChange={(e) => setFormData({ ...formData, confirmationEmailContent: e.target.value })}
                          rows={4}
                          placeholder="HTML content..."
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2 pt-4">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label>Form is active</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="flex justify-center p-8 bg-gray-100 rounded-lg min-h-[400px]">
                <div className="max-w-md w-full">
                  <FormPreview />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {selectedForm ? 'Save Changes' : 'Create Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embed Dialog */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Code</DialogTitle>
            <DialogDescription>
              Copy and paste this code into your website to display the form
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
              {selectedForm?.embedCode || 'No embed code available'}
            </div>
            <Button
              onClick={() => {
                if (selectedForm?.embedCode) {
                  navigator.clipboard.writeText(selectedForm.embedCode);
                  toast({ title: 'Embed code copied to clipboard' });
                }
              }}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedForm?.name}". This action cannot be undone.
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

export default NewsletterForms;
