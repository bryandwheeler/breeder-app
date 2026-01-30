/**
 * Admin Newsletter Subscribers Management
 *
 * View, add, edit, and manage newsletter subscribers.
 * Supports filtering by list, status, tags, and search.
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore, useNewsletterStore } from '@breeder/firebase';
import type { NewsletterSubscriber, NewsletterList, SubscriberStatus } from '@breeder/types';
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
import {
  Users,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
  Filter,
  Upload,
  Download,
  Mail,
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Clock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const statusConfig: Record<SubscriberStatus, { label: string; className: string; icon: React.ReactNode }> = {
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="h-3 w-3" />,
  },
  unsubscribed: {
    label: 'Unsubscribed',
    className: 'bg-gray-100 text-gray-800',
    icon: <XCircle className="h-3 w-3" />,
  },
  bounced: {
    label: 'Bounced',
    className: 'bg-red-100 text-red-800',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  complained: {
    label: 'Complained',
    className: 'bg-orange-100 text-orange-800',
    icon: <Ban className="h-3 w-3" />,
  },
};

export function NewsletterSubscribers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { checkIsAdmin } = useAdminStore();
  const {
    lists,
    subscribers,
    loading,
    hasMoreSubscribers,
    subscribeLists,
    subscribeSubscribers,
    loadMoreSubscribers,
    createSubscriber,
    updateSubscriber,
    deleteSubscriber,
    bulkDeleteSubscribers,
    addTagToSubscriber,
    removeTagFromSubscriber,
    unsubscribe,
  } = useNewsletterStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<NewsletterSubscriber | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newTag, setNewTag] = useState('');

  const listId = searchParams.get('list') || undefined;

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    listIds: [] as string[],
    tags: [] as string[],
    status: 'active' as SubscriberStatus,
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
    const unsubSubscribers = subscribeSubscribers(listId);

    return () => {
      unsubLists();
      unsubSubscribers();
    };
  }, [isAdmin, currentUser, subscribeLists, subscribeSubscribers, listId]);

  // Filter subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          sub.email.toLowerCase().includes(query) ||
          sub.firstName?.toLowerCase().includes(query) ||
          sub.lastName?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && sub.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [subscribers, searchQuery, statusFilter]);

  const selectedList = lists.find((l) => l.id === listId);

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      listIds: listId ? [listId] : [],
      tags: [],
      status: 'active',
    });
  };

  const handleAdd = async () => {
    if (!formData.email.trim()) {
      toast({ title: 'Email is required', variant: 'destructive' });
      return;
    }

    if (formData.listIds.length === 0) {
      toast({ title: 'Please select at least one list', variant: 'destructive' });
      return;
    }

    try {
      await createSubscriber({
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        listIds: formData.listIds,
        tags: formData.tags,
        status: formData.status,
        source: 'manual',
        customFields: {},
      });
      toast({ title: 'Subscriber added successfully' });
      setShowAddDialog(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to add subscriber', variant: 'destructive' });
    }
  };

  const handleEdit = async () => {
    if (!selectedSubscriber) return;

    try {
      await updateSubscriber(selectedSubscriber.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        listIds: formData.listIds,
        status: formData.status,
      });
      toast({ title: 'Subscriber updated successfully' });
      setShowEditDialog(false);
      setSelectedSubscriber(null);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update subscriber', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedSubscriber) return;

    try {
      await deleteSubscriber(selectedSubscriber.id);
      toast({ title: 'Subscriber deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedSubscriber(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete subscriber', variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      await bulkDeleteSubscribers(Array.from(selectedIds));
      toast({ title: `${selectedIds.size} subscribers deleted` });
      setShowBulkDeleteDialog(false);
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete subscribers', variant: 'destructive' });
    }
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      await unsubscribe(id);
      toast({ title: 'Subscriber unsubscribed' });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to unsubscribe', variant: 'destructive' });
    }
  };

  const handleAddTag = async () => {
    if (!selectedSubscriber || !newTag.trim()) return;

    try {
      await addTagToSubscriber(selectedSubscriber.id, newTag.trim());
      toast({ title: 'Tag added' });
      setNewTag('');
    } catch (error: any) {
      toast({ title: error.message || 'Failed to add tag', variant: 'destructive' });
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selectedSubscriber) return;

    try {
      await removeTagFromSubscriber(selectedSubscriber.id, tag);
      toast({ title: 'Tag removed' });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to remove tag', variant: 'destructive' });
    }
  };

  const openEditDialog = (subscriber: NewsletterSubscriber) => {
    setSelectedSubscriber(subscriber);
    setFormData({
      email: subscriber.email,
      firstName: subscriber.firstName,
      lastName: subscriber.lastName,
      listIds: subscriber.listIds,
      tags: subscriber.tags,
      status: subscriber.status,
    });
    setShowEditDialog(true);
  };

  const openTagDialog = (subscriber: NewsletterSubscriber) => {
    setSelectedSubscriber(subscriber);
    setShowTagDialog(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSubscribers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubscribers.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const exportSubscribers = () => {
    const csv = [
      ['Email', 'First Name', 'Last Name', 'Status', 'Tags', 'Created'].join(','),
      ...filteredSubscribers.map((s) =>
        [
          s.email,
          s.firstName,
          s.lastName,
          s.status,
          s.tags.join(';'),
          new Date(s.createdAt).toISOString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Subscribers exported' });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={listId ? '/admin/newsletter/lists' : '/admin/newsletter'}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {selectedList ? selectedList.name : 'All Subscribers'}
            </h1>
            <p className="text-muted-foreground">
              {selectedList
                ? `${selectedList.subscriberCount.toLocaleString()} subscribers in this list`
                : 'Manage your newsletter subscribers'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSubscribers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/newsletter/import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Link>
          </Button>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Subscriber
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="complained">Complained</SelectItem>
              </SelectContent>
            </Select>
            {!listId && (
              <Select
                value={listId || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSearchParams({});
                  } else {
                    setSearchParams({ list: value });
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lists</SelectItem>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} subscriber{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscribers Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No subscribers found</p>
              <p className="mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first subscriber to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Subscriber
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.size === filteredSubscribers.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(subscriber.id)}
                          onCheckedChange={() => toggleSelect(subscriber.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${subscriber.email}`}
                          className="hover:underline"
                        >
                          {subscriber.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        {subscriber.firstName || subscriber.lastName
                          ? `${subscriber.firstName} ${subscriber.lastName}`.trim()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[subscriber.status].className}>
                          <span className="flex items-center gap-1">
                            {statusConfig[subscriber.status].icon}
                            {statusConfig[subscriber.status].label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {subscriber.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {subscriber.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{subscriber.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-muted-foreground">
                            {subscriber.emailsOpened}/{subscriber.emailsSent} opened
                          </div>
                          {subscriber.engagementScore > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Score: {subscriber.engagementScore}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(subscriber.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(subscriber)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openTagDialog(subscriber)}>
                              <Tag className="h-4 w-4 mr-2" />
                              Manage Tags
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${subscriber.email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </a>
                            </DropdownMenuItem>
                            {subscriber.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleUnsubscribe(subscriber.id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Unsubscribe
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedSubscriber(subscriber);
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

              {/* Load More */}
              {hasMoreSubscribers && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => loadMoreSubscribers(listId)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Subscriber Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subscriber</DialogTitle>
            <DialogDescription>
              Add a new subscriber to your newsletter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="subscriber@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lists *</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto">
                {lists.map((list) => (
                  <div key={list.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`list-${list.id}`}
                      checked={formData.listIds.includes(list.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, listIds: [...formData.listIds, list.id] });
                        } else {
                          setFormData({
                            ...formData,
                            listIds: formData.listIds.filter((id) => id !== list.id),
                          });
                        }
                      }}
                    />
                    <label htmlFor={`list-${list.id}`} className="text-sm">
                      {list.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as SubscriberStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending (needs confirmation)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={loading}>
              {loading ? 'Adding...' : 'Add Subscriber'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subscriber Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscriber</DialogTitle>
            <DialogDescription>
              Update subscriber information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lists</Label>
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
                          setFormData({
                            ...formData,
                            listIds: formData.listIds.filter((id) => id !== list.id),
                          });
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
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as SubscriberStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="complained">Complained</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Management Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Add or remove tags for {selectedSubscriber?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                Add
              </Button>
            </div>
            <div className="border rounded-md p-3">
              {selectedSubscriber?.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tags yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSubscriber?.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pr-1">
                      {tag}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedSubscriber?.email}? This action cannot be undone.
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscribers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} subscribers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedIds.size} Subscribers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default NewsletterSubscribers;
