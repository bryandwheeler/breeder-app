/**
 * Admin Newsletter Campaigns Management
 *
 * Create, edit, and manage email campaigns.
 * Supports draft, scheduled, and sent campaigns.
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore, useNewsletterStore } from '@breeder/firebase';
import type { EmailCampaign, NewsletterList, CampaignStatus } from '@breeder/types';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  Mail,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Send,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Pause,
  BarChart3,
  Eye,
  Copy,
  Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@breeder/firebase';

const statusConfig: Record<CampaignStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800',
    icon: <FileText className="h-3 w-3" />,
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-800',
    icon: <Clock className="h-3 w-3" />,
  },
  sending: {
    label: 'Sending',
    className: 'bg-yellow-100 text-yellow-800',
    icon: <Send className="h-3 w-3" />,
  },
  sent: {
    label: 'Sent',
    className: 'bg-green-100 text-green-800',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  paused: {
    label: 'Paused',
    className: 'bg-rose-100 text-rose-800',
    icon: <Pause className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800',
    icon: <XCircle className="h-3 w-3" />,
  },
};

export function NewsletterCampaigns() {
  const navigate = useNavigate();
  const { id: campaignId } = useParams();
  const { currentUser } = useAuth();
  const { checkIsAdmin } = useAdminStore();
  const {
    lists,
    campaigns,
    loading,
    subscribeLists,
    subscribeCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    scheduleCampaign,
    cancelCampaign,
  } = useNewsletterStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    previewText: '',
    content: '',
    htmlContent: '',
    targetListIds: [] as string[],
    fromName: '',
    replyTo: '',
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
    const unsubCampaigns = subscribeCampaigns(currentUser.uid, 'admin');

    return () => {
      unsubLists();
      unsubCampaigns();
    };
  }, [isAdmin, currentUser, subscribeLists, subscribeCampaigns]);

  // Check if we're in editor mode (new or edit)
  useEffect(() => {
    if (campaignId === 'new') {
      setIsEditing(true);
      resetForm();
    } else if (campaignId) {
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (campaign) {
        setIsEditing(true);
        setFormData({
          name: campaign.name,
          subject: campaign.subject,
          previewText: campaign.previewText || '',
          content: campaign.content,
          htmlContent: campaign.htmlContent || '',
          targetListIds: campaign.targetListIds,
          fromName: campaign.fromName || '',
          replyTo: campaign.replyTo || '',
        });
      }
    } else {
      setIsEditing(false);
    }
  }, [campaignId, campaigns]);

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      previewText: '',
      content: '',
      htmlContent: '',
      targetListIds: [],
      fromName: '',
      replyTo: '',
    });
  };

  const handleSave = async (asDraft = true) => {
    if (!formData.name.trim()) {
      toast({ title: 'Campaign name is required', variant: 'destructive' });
      return;
    }
    if (!formData.subject.trim()) {
      toast({ title: 'Subject line is required', variant: 'destructive' });
      return;
    }
    if (formData.targetListIds.length === 0) {
      toast({ title: 'Please select at least one list', variant: 'destructive' });
      return;
    }
    if (!formData.content.trim() && !formData.htmlContent.trim()) {
      toast({ title: 'Email content is required', variant: 'destructive' });
      return;
    }

    try {
      if (campaignId && campaignId !== 'new') {
        await updateCampaign(campaignId, {
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          previewText: formData.previewText.trim(),
          content: formData.content.trim(),
          htmlContent: formData.htmlContent.trim() || formData.content.trim().replace(/\n/g, '<br>'),
          targetListIds: formData.targetListIds,
          fromName: formData.fromName.trim(),
          replyTo: formData.replyTo.trim(),
        });
        toast({ title: 'Campaign updated' });
      } else {
        await createCampaign({
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          previewText: formData.previewText.trim(),
          content: formData.content.trim(),
          htmlContent: formData.htmlContent.trim() || formData.content.trim().replace(/\n/g, '<br>'),
          targetListIds: formData.targetListIds,
          fromName: formData.fromName.trim(),
          replyTo: formData.replyTo.trim(),
          status: 'draft',
          ownerId: currentUser!.uid,
          ownerType: 'admin',
        });
        toast({ title: 'Campaign created' });
      }
      navigate('/admin/newsletter/campaigns');
    } catch (error: any) {
      toast({ title: error.message || 'Failed to save campaign', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;

    try {
      await deleteCampaign(selectedCampaign.id);
      toast({ title: 'Campaign deleted' });
      setShowDeleteDialog(false);
      setSelectedCampaign(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete campaign', variant: 'destructive' });
    }
  };

  const handleSchedule = async () => {
    if (!selectedCampaign || !scheduleDate || !scheduleTime) {
      toast({ title: 'Please select date and time', variant: 'destructive' });
      return;
    }

    try {
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      await scheduleCampaign(selectedCampaign.id, scheduledFor);
      toast({ title: 'Campaign scheduled' });
      setShowScheduleDialog(false);
      setSelectedCampaign(null);
      setScheduleDate('');
      setScheduleTime('');
    } catch (error: any) {
      toast({ title: error.message || 'Failed to schedule campaign', variant: 'destructive' });
    }
  };

  const handleSendNow = async () => {
    if (!selectedCampaign) return;

    try {
      setSending(true);
      const sendCampaign = httpsCallable(functions, 'sendNewsletterCampaign');
      await sendCampaign({ campaignId: selectedCampaign.id });
      toast({ title: 'Campaign is being sent' });
      setShowSendDialog(false);
      setSelectedCampaign(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to send campaign', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (campaign: EmailCampaign) => {
    try {
      await cancelCampaign(campaign.id);
      toast({ title: 'Campaign cancelled' });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to cancel campaign', variant: 'destructive' });
    }
  };

  const duplicateCampaign = async (campaign: EmailCampaign) => {
    try {
      await createCampaign({
        name: `${campaign.name} (Copy)`,
        subject: campaign.subject,
        previewText: campaign.previewText,
        content: campaign.content,
        htmlContent: campaign.htmlContent,
        targetListIds: campaign.targetListIds,
        fromName: campaign.fromName,
        replyTo: campaign.replyTo,
        status: 'draft',
        ownerId: currentUser!.uid,
        ownerType: 'admin',
      });
      toast({ title: 'Campaign duplicated' });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to duplicate campaign', variant: 'destructive' });
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'draft') return c.status === 'draft';
    if (activeTab === 'scheduled') return c.status === 'scheduled';
    if (activeTab === 'sent') return c.status === 'sent';
    return true;
  });

  const getEstimatedRecipients = () => {
    return formData.targetListIds.reduce((sum, listId) => {
      const list = lists.find((l) => l.id === listId);
      return sum + (list?.activeCount || 0);
    }, 0);
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

  // Campaign Editor View
  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/newsletter/campaigns')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {campaignId === 'new' ? 'Create Campaign' : 'Edit Campaign'}
              </h1>
              <p className="text-muted-foreground">
                Design and configure your email campaign
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/newsletter/campaigns')}>
              Cancel
            </Button>
            <Button onClick={() => handleSave(true)} disabled={loading}>
              {loading ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., January Newsletter"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Internal name, not visible to subscribers
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Exciting news from our kennel!"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previewText">Preview Text</Label>
                  <Input
                    id="previewText"
                    placeholder="Brief text shown in email preview..."
                    value={formData.previewText}
                    onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown in inbox preview after the subject line
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>
                  Write your email content. Use {"{{first_name}}"} for personalization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="visual">
                  <TabsList>
                    <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                  </TabsList>
                  <TabsContent value="visual" className="mt-4">
                    <Textarea
                      placeholder="Write your email content here...

Dear {{first_name}},

We're excited to share some news with you!

Best regards,
The Team"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="min-h-[300px] font-mono"
                    />
                  </TabsContent>
                  <TabsContent value="html" className="mt-4">
                    <Textarea
                      placeholder="<html>
<body>
  <h1>Hello {{first_name}}!</h1>
  <p>Your email content here...</p>
</body>
</html>"
                      value={formData.htmlContent}
                      onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </TabsContent>
                </Tabs>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Available Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {['{{first_name}}', '{{last_name}}', '{{email}}', '{{full_name}}', '{{unsubscribe_url}}'].map((v) => (
                      <Badge key={v} variant="outline" className="font-mono text-xs">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Lists *</Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                    {lists.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No lists available. <Link to="/admin/newsletter/lists" className="text-primary hover:underline">Create one</Link>
                      </p>
                    ) : (
                      lists.map((list) => (
                        <div key={list.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`list-${list.id}`}
                              checked={formData.targetListIds.includes(list.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({ ...formData, targetListIds: [...formData.targetListIds, list.id] });
                                } else {
                                  setFormData({
                                    ...formData,
                                    targetListIds: formData.targetListIds.filter((id) => id !== list.id),
                                  });
                                }
                              }}
                            />
                            <label htmlFor={`list-${list.id}`} className="text-sm">
                              {list.name}
                            </label>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {list.activeCount.toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {formData.targetListIds.length > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">Estimated Recipients</p>
                    <p className="text-2xl font-bold">{getEstimatedRecipients().toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sender Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    placeholder="e.g., Expert Breeder"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Email</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    placeholder="e.g., support@example.com"
                    value={formData.replyTo}
                    onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Campaign List View
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
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground">
              Create and manage your email campaigns
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/admin/newsletter/campaigns/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
              <TabsTrigger value="draft">Drafts ({campaigns.filter((c) => c.status === 'draft').length})</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled ({campaigns.filter((c) => c.status === 'scheduled').length})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({campaigns.filter((c) => c.status === 'sent').length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No campaigns found</p>
              <p className="mb-4">Create your first email campaign to get started</p>
              <Button asChild>
                <Link to="/admin/newsletter/campaigns/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Campaign
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {campaign.subject}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[campaign.status].className}>
                        <span className="flex items-center gap-1">
                          {statusConfig[campaign.status].icon}
                          {statusConfig[campaign.status].label}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.status === 'sent' ? (
                        <span>{campaign.stats.sent.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {campaign.targetListIds.length} list(s)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.status === 'sent' ? (
                        <div className="text-sm">
                          <div>{campaign.stats.openRate.toFixed(1)}% opens</div>
                          <div className="text-muted-foreground">
                            {campaign.stats.clickRate.toFixed(1)}% clicks
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {campaign.status === 'sent' && campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleDateString()
                        : campaign.status === 'scheduled' && campaign.scheduledFor
                        ? new Date(campaign.scheduledFor).toLocaleDateString()
                        : new Date(campaign.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === 'draft' && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/newsletter/campaigns/${campaign.id}`}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setShowSendDialog(true);
                                }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Now
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setShowScheduleDialog(true);
                                }}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule
                              </DropdownMenuItem>
                            </>
                          )}
                          {campaign.status === 'scheduled' && (
                            <DropdownMenuItem onClick={() => handleCancel(campaign)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'sent' && (
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/newsletter/campaigns/${campaign.id}/stats`}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Stats
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => duplicateCampaign(campaign)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedCampaign(campaign);
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

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Campaign Now?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send "{selectedCampaign?.name}" immediately?
              This will send the email to all subscribers in the selected lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendNow} disabled={sending}>
              {sending ? 'Sending...' : 'Send Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Choose when to send "{selectedCampaign?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleDate">Date</Label>
                <Input
                  id="scheduleDate"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduleTime">Time</Label>
                <Input
                  id="scheduleTime"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={loading || !scheduleDate || !scheduleTime}>
              {loading ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be undone.
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
    </div>
  );
}

export default NewsletterCampaigns;
