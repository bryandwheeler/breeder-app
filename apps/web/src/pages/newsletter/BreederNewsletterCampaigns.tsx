/**
 * Breeder Newsletter Campaigns Management
 *
 * Create, edit, and manage email campaigns.
 * Supports draft, scheduled, and sent campaigns.
 */

import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNewsletterStore } from '@breeder/firebase';
import type { EmailCampaign, CampaignStatus } from '@breeder/types';
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
  Copy,
  Calendar,
  Loader2,
  Save,
  X,
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

export function BreederNewsletterCampaigns() {
  const navigate = useNavigate();
  const { id: campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
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

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    preheaderText: '',
    htmlContent: '',
    textContent: '',
    listIds: [] as string[],
    fromName: '',
    replyTo: '',
  });

  // Subscribe to data with breeder ownerType
  useEffect(() => {
    if (!currentUser) return;

    const unsubLists = subscribeLists(currentUser.uid, 'breeder');
    const unsubCampaigns = subscribeCampaigns(currentUser.uid, 'breeder');

    return () => {
      unsubLists();
      unsubCampaigns();
    };
  }, [currentUser, subscribeLists, subscribeCampaigns]);

  // Check for new campaign or edit mode
  useEffect(() => {
    const isNew = searchParams.get('new') === 'true';
    if (isNew) {
      setIsEditing(true);
      resetForm();
    } else if (campaignId && campaignId !== 'new') {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        setSelectedCampaign(campaign);
        setFormData({
          name: campaign.name,
          subject: campaign.subject,
          preheaderText: campaign.preheaderText || '',
          htmlContent: campaign.htmlContent || '',
          textContent: campaign.textContent || '',
          listIds: campaign.listIds,
          fromName: campaign.fromName || '',
          replyTo: campaign.replyTo || '',
        });
        setIsEditing(true);
      }
    }
  }, [campaignId, campaigns, searchParams]);

  // Filter campaigns by status
  const filteredCampaigns = useMemo(() => {
    if (activeTab === 'all') return campaigns;
    return campaigns.filter(c => c.status === activeTab);
  }, [campaigns, activeTab]);

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      preheaderText: '',
      htmlContent: '',
      textContent: '',
      listIds: [],
      fromName: '',
      replyTo: '',
    });
    setSelectedCampaign(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Campaign name is required', variant: 'destructive' });
      return;
    }
    if (!formData.subject.trim()) {
      toast({ title: 'Subject is required', variant: 'destructive' });
      return;
    }
    if (formData.listIds.length === 0) {
      toast({ title: 'Please select at least one list', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (selectedCampaign) {
        await updateCampaign(selectedCampaign.id, {
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          preheaderText: formData.preheaderText.trim(),
          htmlContent: formData.htmlContent,
          textContent: formData.textContent,
          listIds: formData.listIds,
          fromName: formData.fromName.trim(),
          replyTo: formData.replyTo.trim(),
        });
        toast({ title: 'Campaign updated' });
      } else {
        await createCampaign({
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          preheaderText: formData.preheaderText.trim(),
          htmlContent: formData.htmlContent,
          textContent: formData.textContent,
          listIds: formData.listIds,
          excludeListIds: [],
          segmentRules: [],
          segmentMatchType: 'all',
          type: 'regular',
          status: 'draft',
          ownerId: currentUser!.uid,
          ownerType: 'breeder',
          trackOpens: true,
          trackClicks: true,
          stats: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
            complained: 0,
            openRate: 0,
            clickRate: 0,
            bounceRate: 0,
          },
          fromName: formData.fromName.trim(),
          replyTo: formData.replyTo.trim(),
        });
        toast({ title: 'Campaign created' });
      }
      setIsEditing(false);
      resetForm();
      navigate('/newsletter/campaigns');
    } catch (error: any) {
      toast({ title: error.message || 'Failed to save campaign', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;

    setSubmitting(true);
    try {
      await deleteCampaign(selectedCampaign.id);
      toast({ title: 'Campaign deleted' });
      setShowDeleteDialog(false);
      setSelectedCampaign(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete campaign', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedCampaign || !scheduleDate || !scheduleTime) {
      toast({ title: 'Please select date and time', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNow = async () => {
    if (!selectedCampaign) return;

    setSending(true);
    try {
      const sendCampaign = httpsCallable(functions, 'sendNewsletterCampaign');
      await sendCampaign({ campaignId: selectedCampaign.id });
      toast({ title: 'Campaign sent!' });
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

  const duplicateCampaign = (campaign: EmailCampaign) => {
    setFormData({
      name: `${campaign.name} (Copy)`,
      subject: campaign.subject,
      preheaderText: campaign.preheaderText || '',
      htmlContent: campaign.htmlContent || '',
      textContent: campaign.textContent || '',
      listIds: campaign.listIds,
      fromName: campaign.fromName || '',
      replyTo: campaign.replyTo || '',
    });
    setSelectedCampaign(null);
    setIsEditing(true);
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Editor View
  if (isEditing) {
    const estimatedRecipients = lists
      .filter(l => formData.listIds.includes(l.id))
      .reduce((sum, l) => sum + l.activeCount, 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => { setIsEditing(false); resetForm(); navigate('/newsletter/campaigns'); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {selectedCampaign ? 'Edit Campaign' : 'New Campaign'}
              </h1>
              <p className="text-muted-foreground">
                {selectedCampaign ? 'Update your email campaign' : 'Create a new email campaign'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setIsEditing(false); resetForm(); navigate('/newsletter/campaigns'); }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {submitting ? 'Saving...' : 'Save Campaign'}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Details */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., December Newsletter"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Our Latest Puppies Are Here!"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preheader">Preview Text</Label>
                  <Input
                    id="preheader"
                    placeholder="Brief preview shown in inbox..."
                    value={formData.preheaderText}
                    onChange={(e) => setFormData({ ...formData, preheaderText: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Appears after the subject line in most email clients
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Email Content */}
            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>
                  Use personalization tags: {"{{first_name}}"}, {"{{email}}"}, {"{{kennel_name}}"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="html" className="w-full">
                  <TabsList>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="text">Plain Text</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html">
                    <Textarea
                      placeholder="Enter your HTML email content..."
                      value={formData.htmlContent}
                      onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </TabsContent>
                  <TabsContent value="text">
                    <Textarea
                      placeholder="Enter plain text version of your email..."
                      value={formData.textContent}
                      onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                      rows={15}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recipients */}
            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
                <CardDescription>Select which lists to send to</CardDescription>
              </CardHeader>
              <CardContent>
                {lists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No lists available. <Link to="/newsletter/lists" className="text-primary hover:underline">Create a list first</Link>.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lists.map((list) => (
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
                        <label htmlFor={`list-${list.id}`} className="text-sm flex-1">
                          {list.name}
                          <span className="text-muted-foreground ml-2">
                            ({list.activeCount} active)
                          </span>
                        </label>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium">
                        Estimated recipients: {estimatedRecipients.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sender Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Sender</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    placeholder="Your Kennel Name"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Email</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    placeholder="your@email.com"
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

  // List View
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
            <h1 className="text-2xl sm:text-3xl font-bold">Email Campaigns</h1>
            <p className="text-muted-foreground">
              Create and manage your email campaigns
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setIsEditing(true); }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'draft').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'scheduled').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'sent').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No campaigns found</p>
              <p className="mb-4">Create your first campaign to start reaching your subscribers</p>
              <Button onClick={() => { resetForm(); setIsEditing(true); }}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Campaign
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
                      {campaign.listIds.length} list{campaign.listIds.length !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell>
                      {campaign.status === 'sent' && campaign.stats ? (
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
                    <TableCell className="text-muted-foreground text-sm">
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleDateString()
                        : campaign.scheduledFor
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
                              <DropdownMenuItem onClick={() => navigate(`/newsletter/campaigns/${campaign.id}`)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedCampaign(campaign); setShowSendDialog(true); }}>
                                <Send className="h-4 w-4 mr-2" />
                                Send Now
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedCampaign(campaign); setShowScheduleDialog(true); }}>
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
                            <DropdownMenuItem onClick={() => navigate(`/newsletter/campaigns/${campaign.id}`)}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Stats
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => duplicateCampaign(campaign)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setSelectedCampaign(campaign); setShowDeleteDialog(true); }}
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
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
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
            <Button onClick={handleSchedule} disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Now Dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Campaign Now?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send "{selectedCampaign?.name}" immediately? This action cannot be undone.
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

      {/* Delete Dialog */}
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

export default BreederNewsletterCampaigns;
