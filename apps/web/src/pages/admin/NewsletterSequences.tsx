/**
 * Admin Newsletter Autoresponder Sequences
 *
 * Create, edit, and manage email autoresponder sequences.
 * Supports visual email sequence building with drag-and-drop.
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore, useNewsletterStore } from '@breeder/firebase';
import type {
  AutoresponderSequence,
  AutoresponderEmail,
  AutoresponderTrigger,
  AutoresponderStatus,
  NewsletterList,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Play,
  Pause,
  Mail,
  Clock,
  Users,
  CheckCircle2,
  GripVertical,
  ArrowDown,
  Calendar,
  Tag,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const triggerLabels: Record<AutoresponderTrigger, string> = {
  list_subscribe: 'Subscribes to List',
  tag_added: 'Tag Added',
  tag_removed: 'Tag Removed',
  lead_magnet: 'Lead Magnet Downloaded',
  form_submit: 'Form Submitted',
  date_field: 'Date Field Trigger',
  manual: 'Manual Start',
};

const triggerIcons: Record<AutoresponderTrigger, React.ReactNode> = {
  list_subscribe: <Users className="h-4 w-4" />,
  tag_added: <Tag className="h-4 w-4" />,
  tag_removed: <Tag className="h-4 w-4" />,
  lead_magnet: <Download className="h-4 w-4" />,
  form_submit: <FileText className="h-4 w-4" />,
  date_field: <Calendar className="h-4 w-4" />,
  manual: <Play className="h-4 w-4" />,
};

const statusConfig: Record<AutoresponderStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-800' },
  paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-800' },
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
};

export function NewsletterSequences() {
  const navigate = useNavigate();
  const { id: sequenceId } = useParams();
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
    createSequence,
    updateSequence,
    deleteSequence,
    getSequenceEmails,
    createSequenceEmail,
    updateSequenceEmail,
    deleteSequenceEmail,
    reorderSequenceEmails,
  } = useNewsletterStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteEmailDialog, setShowDeleteEmailDialog] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<AutoresponderSequence | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<AutoresponderEmail | null>(null);
  const [sequenceEmails, setSequenceEmails] = useState<AutoresponderEmail[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'list_subscribe' as AutoresponderTrigger,
    triggerListId: '',
    triggerTagName: '',
    triggerLeadMagnetId: '',
    triggerFormId: '',
    status: 'draft' as AutoresponderStatus,
  });
  const [emailFormData, setEmailFormData] = useState({
    name: '',
    subject: '',
    preheaderText: '',
    htmlContent: '',
    textContent: '',
    delayDays: 0,
    delayHours: 0,
    delayMinutes: 0,
    sendAtTime: '',
    isActive: true,
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

  // Load sequence emails when editing
  useEffect(() => {
    const loadEmails = async () => {
      if (sequenceId && sequenceId !== 'new') {
        setLoadingEmails(true);
        const emails = await getSequenceEmails(sequenceId);
        setSequenceEmails(emails);
        setLoadingEmails(false);

        // Load sequence data
        const sequence = sequences.find(s => s.id === sequenceId);
        if (sequence) {
          setFormData({
            name: sequence.name,
            description: sequence.description,
            trigger: sequence.trigger,
            triggerListId: sequence.triggerConfig.listId || '',
            triggerTagName: sequence.triggerConfig.tagName || '',
            triggerLeadMagnetId: sequence.triggerConfig.leadMagnetId || '',
            triggerFormId: sequence.triggerConfig.formId || '',
            status: sequence.status,
          });
          setIsEditing(true);
        }
      } else if (sequenceId === 'new') {
        setIsEditing(true);
        setFormData({
          name: '',
          description: '',
          trigger: 'list_subscribe',
          triggerListId: '',
          triggerTagName: '',
          triggerLeadMagnetId: '',
          triggerFormId: '',
          status: 'draft',
        });
        setSequenceEmails([]);
      }
    };

    if (sequences.length > 0 || sequenceId === 'new') {
      loadEmails();
    }
  }, [sequenceId, sequences, getSequenceEmails]);

  const handleCreateSequence = async () => {
    if (!currentUser || !formData.name.trim()) {
      toast({ title: 'Please enter a sequence name', variant: 'destructive' });
      return;
    }

    try {
      const triggerConfig: Record<string, string | undefined> = {};
      switch (formData.trigger) {
        case 'list_subscribe':
          triggerConfig.listId = formData.triggerListId;
          break;
        case 'tag_added':
        case 'tag_removed':
          triggerConfig.tagName = formData.triggerTagName;
          break;
        case 'lead_magnet':
          triggerConfig.leadMagnetId = formData.triggerLeadMagnetId;
          break;
        case 'form_submit':
          triggerConfig.formId = formData.triggerFormId;
          break;
      }

      const newId = await createSequence({
        name: formData.name,
        description: formData.description,
        trigger: formData.trigger,
        triggerConfig,
        status: formData.status,
        ownerId: currentUser.uid,
        ownerType: 'admin',
      });

      toast({ title: 'Sequence created successfully' });
      navigate(`/admin/newsletter/sequences/${newId}`);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to create sequence', variant: 'destructive' });
    }
  };

  const handleUpdateSequence = async () => {
    if (!sequenceId || sequenceId === 'new') return;

    try {
      const triggerConfig: Record<string, string | undefined> = {};
      switch (formData.trigger) {
        case 'list_subscribe':
          triggerConfig.listId = formData.triggerListId;
          break;
        case 'tag_added':
        case 'tag_removed':
          triggerConfig.tagName = formData.triggerTagName;
          break;
        case 'lead_magnet':
          triggerConfig.leadMagnetId = formData.triggerLeadMagnetId;
          break;
        case 'form_submit':
          triggerConfig.formId = formData.triggerFormId;
          break;
      }

      await updateSequence(sequenceId, {
        name: formData.name,
        description: formData.description,
        trigger: formData.trigger,
        triggerConfig,
        status: formData.status,
      });

      toast({ title: 'Sequence updated successfully' });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update sequence', variant: 'destructive' });
    }
  };

  const handleDeleteSequence = async () => {
    if (!selectedSequence) return;

    try {
      await deleteSequence(selectedSequence.id);
      toast({ title: 'Sequence deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedSequence(null);
      navigate('/admin/newsletter/sequences');
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete sequence', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (sequence: AutoresponderSequence) => {
    const newStatus = sequence.status === 'active' ? 'paused' : 'active';
    try {
      await updateSequence(sequence.id, { status: newStatus });
      toast({ title: `Sequence ${newStatus === 'active' ? 'activated' : 'paused'}` });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleAddEmail = () => {
    setEditingEmail(true);
    setSelectedEmail(null);
    setEmailFormData({
      name: `Email ${sequenceEmails.length + 1}`,
      subject: '',
      preheaderText: '',
      htmlContent: '',
      textContent: '',
      delayDays: sequenceEmails.length === 0 ? 0 : 1,
      delayHours: 0,
      delayMinutes: 0,
      sendAtTime: '',
      isActive: true,
    });
  };

  const handleEditEmail = (email: AutoresponderEmail) => {
    setEditingEmail(true);
    setSelectedEmail(email);
    setEmailFormData({
      name: email.name,
      subject: email.subject,
      preheaderText: email.preheaderText,
      htmlContent: email.htmlContent,
      textContent: email.textContent,
      delayDays: email.delayDays,
      delayHours: email.delayHours,
      delayMinutes: email.delayMinutes,
      sendAtTime: email.sendAtTime || '',
      isActive: email.isActive,
    });
  };

  const handleSaveEmail = async () => {
    if (!sequenceId || sequenceId === 'new') {
      toast({ title: 'Save the sequence first', variant: 'destructive' });
      return;
    }

    if (!emailFormData.subject.trim()) {
      toast({ title: 'Please enter an email subject', variant: 'destructive' });
      return;
    }

    try {
      if (selectedEmail) {
        await updateSequenceEmail(selectedEmail.id, {
          name: emailFormData.name,
          subject: emailFormData.subject,
          preheaderText: emailFormData.preheaderText,
          htmlContent: emailFormData.htmlContent,
          textContent: emailFormData.textContent,
          delayDays: emailFormData.delayDays,
          delayHours: emailFormData.delayHours,
          delayMinutes: emailFormData.delayMinutes,
          sendAtTime: emailFormData.sendAtTime || undefined,
          isActive: emailFormData.isActive,
        });
        toast({ title: 'Email updated successfully' });
      } else {
        await createSequenceEmail({
          sequenceId,
          order: sequenceEmails.length + 1,
          name: emailFormData.name,
          subject: emailFormData.subject,
          preheaderText: emailFormData.preheaderText,
          htmlContent: emailFormData.htmlContent,
          textContent: emailFormData.textContent,
          delayDays: emailFormData.delayDays,
          delayHours: emailFormData.delayHours,
          delayMinutes: emailFormData.delayMinutes,
          sendAtTime: emailFormData.sendAtTime || undefined,
          isActive: emailFormData.isActive,
        });
        toast({ title: 'Email added successfully' });
      }

      // Reload emails
      const emails = await getSequenceEmails(sequenceId);
      setSequenceEmails(emails);
      setEditingEmail(false);
      setSelectedEmail(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to save email', variant: 'destructive' });
    }
  };

  const handleDeleteEmail = async () => {
    if (!selectedEmail) return;

    try {
      await deleteSequenceEmail(selectedEmail.id);
      toast({ title: 'Email deleted successfully' });

      // Reload emails
      if (sequenceId && sequenceId !== 'new') {
        const emails = await getSequenceEmails(sequenceId);
        setSequenceEmails(emails);
      }

      setShowDeleteEmailDialog(false);
      setSelectedEmail(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete email', variant: 'destructive' });
    }
  };

  const handleMoveEmail = async (emailId: string, direction: 'up' | 'down') => {
    const currentIndex = sequenceEmails.findIndex(e => e.id === emailId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sequenceEmails.length) return;

    const newOrder = [...sequenceEmails];
    const [removed] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, removed);

    try {
      await reorderSequenceEmails(sequenceId!, newOrder.map(e => e.id));
      setSequenceEmails(newOrder.map((e, i) => ({ ...e, order: i + 1 })));
    } catch (error: any) {
      toast({ title: error.message || 'Failed to reorder emails', variant: 'destructive' });
    }
  };

  const formatDelay = (days: number, hours: number, minutes: number) => {
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.length > 0 ? parts.join(' ') : 'Immediately';
  };

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

  // Show sequence editor
  if (isEditing && sequenceId) {
    const currentSequence = sequences.find(s => s.id === sequenceId);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/newsletter/sequences')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {sequenceId === 'new' ? 'Create Sequence' : 'Edit Sequence'}
            </h1>
            <p className="text-muted-foreground">
              Build your automated email sequence
            </p>
          </div>
          {sequenceId !== 'new' && currentSequence && (
            <Badge className={statusConfig[currentSequence.status].className}>
              {statusConfig[currentSequence.status].label}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sequence Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Sequence Settings</CardTitle>
              <CardDescription>Configure your autoresponder</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Series"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this sequence does..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(value) => setFormData({ ...formData, trigger: value as AutoresponderTrigger })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {triggerIcons[key as AutoresponderTrigger]}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trigger-specific config */}
              {formData.trigger === 'list_subscribe' && (
                <div className="space-y-2">
                  <Label>Trigger List</Label>
                  <Select
                    value={formData.triggerListId}
                    onValueChange={(value) => setFormData({ ...formData, triggerListId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a list" />
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

              {(formData.trigger === 'tag_added' || formData.trigger === 'tag_removed') && (
                <div className="space-y-2">
                  <Label>Tag Name</Label>
                  <Input
                    value={formData.triggerTagName}
                    onChange={(e) => setFormData({ ...formData, triggerTagName: e.target.value })}
                    placeholder="e.g., purchased"
                  />
                </div>
              )}

              {formData.trigger === 'lead_magnet' && (
                <div className="space-y-2">
                  <Label>Lead Magnet</Label>
                  <Select
                    value={formData.triggerLeadMagnetId}
                    onValueChange={(value) => setFormData({ ...formData, triggerLeadMagnetId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead magnet" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadMagnets.map((magnet) => (
                        <SelectItem key={magnet.id} value={magnet.id}>
                          {magnet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.trigger === 'form_submit' && (
                <div className="space-y-2">
                  <Label>Signup Form</Label>
                  <Select
                    value={formData.triggerFormId}
                    onValueChange={(value) => setFormData({ ...formData, triggerFormId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a form" />
                    </SelectTrigger>
                    <SelectContent>
                      {signupForms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as AutoresponderStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 flex gap-2">
                <Button
                  onClick={sequenceId === 'new' ? handleCreateSequence : handleUpdateSequence}
                  disabled={loading}
                  className="flex-1"
                >
                  {sequenceId === 'new' ? 'Create Sequence' : 'Save Changes'}
                </Button>
                {sequenceId !== 'new' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const seq = sequences.find(s => s.id === sequenceId);
                      if (seq) {
                        setSelectedSequence(seq);
                        setShowDeleteDialog(true);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Sequence */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Email Sequence</CardTitle>
                    <CardDescription>
                      {sequenceEmails.length} email{sequenceEmails.length !== 1 ? 's' : ''} in this sequence
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleAddEmail}
                    disabled={sequenceId === 'new'}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Email
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sequenceId === 'new' ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Save the sequence first to add emails</p>
                  </div>
                ) : loadingEmails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : sequenceEmails.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No emails in this sequence yet</p>
                    <Button variant="link" onClick={handleAddEmail} className="mt-2">
                      Add your first email
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Trigger indicator */}
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {triggerIcons[formData.trigger]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Trigger</p>
                        <p className="text-xs text-muted-foreground">
                          {triggerLabels[formData.trigger]}
                        </p>
                      </div>
                    </div>

                    {/* Email list */}
                    {sequenceEmails.map((email, index) => (
                      <div key={email.id}>
                        {/* Delay indicator */}
                        <div className="flex items-center justify-center py-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ArrowDown className="h-4 w-4" />
                            <Clock className="h-3 w-3" />
                            <span>Wait {formatDelay(email.delayDays, email.delayHours, email.delayMinutes)}</span>
                          </div>
                        </div>

                        {/* Email card */}
                        <div className={`border rounded-lg p-4 ${email.isActive ? '' : 'opacity-50'}`}>
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveEmail(email.id, 'up')}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <div className="p-2 bg-muted rounded-full">
                                <Mail className="h-4 w-4" />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveEmail(email.id, 'down')}
                                disabled={index === sequenceEmails.length - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">{email.name}</p>
                                <div className="flex items-center gap-2">
                                  {!email.isActive && (
                                    <Badge variant="outline">Inactive</Badge>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditEmail(email)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        // Duplicate email
                                        setEditingEmail(true);
                                        setSelectedEmail(null);
                                        setEmailFormData({
                                          name: `${email.name} (Copy)`,
                                          subject: email.subject,
                                          preheaderText: email.preheaderText,
                                          htmlContent: email.htmlContent,
                                          textContent: email.textContent,
                                          delayDays: email.delayDays,
                                          delayHours: email.delayHours,
                                          delayMinutes: email.delayMinutes,
                                          sendAtTime: email.sendAtTime || '',
                                          isActive: true,
                                        });
                                      }}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => {
                                          setSelectedEmail(email);
                                          setShowDeleteEmailDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{email.subject}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Sent: {email.stats.sent}</span>
                                <span>Opened: {email.stats.opened}</span>
                                <span>Clicked: {email.stats.clicked}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email Editor Dialog */}
        <Dialog open={editingEmail} onOpenChange={setEditingEmail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEmail ? 'Edit Email' : 'Add Email'}
              </DialogTitle>
              <DialogDescription>
                Configure the email content and timing
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-name">Internal Name</Label>
                  <Input
                    id="email-name"
                    value={emailFormData.name}
                    onChange={(e) => setEmailFormData({ ...emailFormData, name: e.target.value })}
                    placeholder="e.g., Welcome Email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject Line</Label>
                  <Input
                    id="email-subject"
                    value={emailFormData.subject}
                    onChange={(e) => setEmailFormData({ ...emailFormData, subject: e.target.value })}
                    placeholder="e.g., Welcome to our community!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-preheader">Preheader Text</Label>
                  <Input
                    id="email-preheader"
                    value={emailFormData.preheaderText}
                    onChange={(e) => setEmailFormData({ ...emailFormData, preheaderText: e.target.value })}
                    placeholder="Preview text shown in inbox..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delay After Previous Email</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Days</Label>
                      <Input
                        type="number"
                        min="0"
                        value={emailFormData.delayDays}
                        onChange={(e) => setEmailFormData({ ...emailFormData, delayDays: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={emailFormData.delayHours}
                        onChange={(e) => setEmailFormData({ ...emailFormData, delayHours: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Minutes</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={emailFormData.delayMinutes}
                        onChange={(e) => setEmailFormData({ ...emailFormData, delayMinutes: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-time">Send at Specific Time (optional)</Label>
                  <Input
                    id="email-time"
                    type="time"
                    value={emailFormData.sendAtTime}
                    onChange={(e) => setEmailFormData({ ...emailFormData, sendAtTime: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    If set, email will be sent at this time after the delay
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={emailFormData.isActive}
                    onCheckedChange={(checked) => setEmailFormData({ ...emailFormData, isActive: checked })}
                  />
                  <Label>Email is active</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-content">Email Content (HTML)</Label>
                  <Textarea
                    id="email-content"
                    value={emailFormData.htmlContent}
                    onChange={(e) => setEmailFormData({ ...emailFormData, htmlContent: e.target.value })}
                    placeholder="Enter your email HTML content..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Available Variables:</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <code className="px-1 bg-background rounded">{'{{email}}'}</code>
                    <code className="px-1 bg-background rounded">{'{{first_name}}'}</code>
                    <code className="px-1 bg-background rounded">{'{{last_name}}'}</code>
                    <code className="px-1 bg-background rounded">{'{{full_name}}'}</code>
                    <code className="px-1 bg-background rounded">{'{{unsubscribe_url}}'}</code>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingEmail(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEmail} disabled={loading}>
                {selectedEmail ? 'Update Email' : 'Add Email'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Show sequence list
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
            <h1 className="text-3xl font-bold">Autoresponder Sequences</h1>
            <p className="text-muted-foreground">
              Create automated email sequences that trigger based on subscriber actions
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/admin/newsletter/sequences/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Sequence
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sequences</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sequences.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sequences.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers in Sequences</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sequences.reduce((sum, s) => sum + s.subscribersActive, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequence List */}
      <Card>
        <CardContent className="pt-6">
          {sequences.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No sequences yet</p>
              <Button asChild>
                <Link to="/admin/newsletter/sequences/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create your first sequence
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Emails</TableHead>
                  <TableHead>Active Subscribers</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequences.map((sequence) => (
                  <TableRow key={sequence.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sequence.name}</p>
                        {sequence.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {sequence.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {triggerIcons[sequence.trigger]}
                        <span className="text-sm">{triggerLabels[sequence.trigger]}</span>
                      </div>
                    </TableCell>
                    <TableCell>{sequence.emailCount}</TableCell>
                    <TableCell>{sequence.subscribersActive}</TableCell>
                    <TableCell>{sequence.subscribersCompleted}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[sequence.status].className}>
                        {statusConfig[sequence.status].label}
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
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/newsletter/sequences/${sequence.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(sequence)}>
                            {sequence.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedSequence(sequence);
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

      {/* Delete Sequence Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sequence?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the sequence "{selectedSequence?.name}" and all its emails.
              {selectedSequence && selectedSequence.subscribersActive > 0 && (
                <span className="block mt-2 text-yellow-600">
                  Warning: {selectedSequence.subscribersActive} subscriber(s) are currently in this sequence.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSequence}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Email Dialog */}
      <AlertDialog open={showDeleteEmailDialog} onOpenChange={setShowDeleteEmailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the email "{selectedEmail?.name}" from the sequence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmail}
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

export default NewsletterSequences;
