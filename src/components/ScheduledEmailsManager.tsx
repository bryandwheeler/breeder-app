import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduledEmailStore } from '@/store/scheduledEmailStore';
import { ScheduledEmail } from '@/types/workflow';
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
  Clock,
  Calendar,
  Mail,
  User,
  X,
  Filter,
  Search,
  Trash2,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export function ScheduledEmailsManager() {
  const { currentUser } = useAuth();
  const {
    scheduledEmails,
    loading,
    loadScheduledEmails,
    subscribeToScheduledEmails,
    cancelScheduledEmail,
  } = useScheduledEmailStore();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'sent' | 'failed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<ScheduledEmail | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    loadScheduledEmails(currentUser.uid);
    const unsubscribe = subscribeToScheduledEmails(currentUser.uid);

    return () => {
      unsubscribe();
    };
  }, [currentUser, loadScheduledEmails, subscribeToScheduledEmails]);

  const handleCancelEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;

    try {
      await cancelScheduledEmail(emailId);
      toast({
        title: 'Email Cancelled',
        description: 'The scheduled email has been cancelled.',
      });
    } catch (error) {
      console.error('Error cancelling email:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel the scheduled email.',
        variant: 'destructive',
      });
    }
  };

  const handleViewEmail = (email: ScheduledEmail) => {
    setSelectedEmail(email);
    setViewDialogOpen(true);
  };

  const filteredEmails = scheduledEmails.filter((email) => {
    // Filter by status
    if (filterStatus !== 'all' && email.status !== filterStatus) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSubject = email.subject.toLowerCase().includes(query);
      const matchesTo = email.to.some((addr) => addr.toLowerCase().includes(query));
      const matchesBody = email.body.toLowerCase().includes(query);

      if (!matchesSubject && !matchesTo && !matchesBody) {
        return false;
      }
    }

    return true;
  });

  const pendingCount = scheduledEmails.filter((e) => e.status === 'pending').length;
  const sentCount = scheduledEmails.filter((e) => e.status === 'sent').length;
  const failedCount = scheduledEmails.filter((e) => e.status === 'failed').length;

  const getStatusBadge = (status: ScheduledEmail['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant='secondary'>Pending</Badge>;
      case 'sent':
        return <Badge variant='default'>Sent</Badge>;
      case 'failed':
        return <Badge variant='destructive'>Failed</Badge>;
      case 'cancelled':
        return <Badge variant='outline'>Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSourceBadge = (source: ScheduledEmail['source']) => {
    return source === 'manual' ? (
      <Badge variant='outline' className='text-xs'>
        Manual
      </Badge>
    ) : (
      <Badge variant='outline' className='text-xs'>
        Workflow
      </Badge>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold'>Scheduled Emails</h2>
        <p className='text-sm text-muted-foreground'>
          Manage emails scheduled to send automatically
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{scheduledEmails.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{sentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{failedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search by subject, recipient, or content...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8'
            />
          </div>
        </div>
        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}
        >
          <SelectTrigger className='w-48'>
            <Filter className='mr-2 h-4 w-4' />
            <SelectValue placeholder='Filter by status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            <SelectItem value='pending'>Pending</SelectItem>
            <SelectItem value='sent'>Sent</SelectItem>
            <SelectItem value='failed'>Failed</SelectItem>
            <SelectItem value='cancelled'>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Emails List */}
      {loading && scheduledEmails.length === 0 ? (
        <Card>
          <CardContent className='pt-6'>
            <p className='text-center text-muted-foreground'>Loading scheduled emails...</p>
          </CardContent>
        </Card>
      ) : filteredEmails.length === 0 ? (
        <Card className='border-dashed'>
          <CardHeader>
            <CardTitle>No Scheduled Emails</CardTitle>
            <CardDescription>
              {searchQuery || filterStatus !== 'all'
                ? 'No emails match your filters.'
                : 'You haven\'t scheduled any emails yet. Schedule an email from the Compose dialog.'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {filteredEmails.map((email) => (
            <Card key={email.id}>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      {getStatusBadge(email.status)}
                      {getSourceBadge(email.source)}
                    </div>
                    <CardTitle className='text-lg'>{email.subject}</CardTitle>
                    <CardDescription className='mt-1'>
                      <div className='flex items-center gap-4 text-sm'>
                        <span className='flex items-center gap-1'>
                          <Mail className='h-3 w-3' />
                          To: {email.to.join(', ')}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleViewEmail(email)}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    {email.status === 'pending' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleCancelEmail(email.id)}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-6 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-3 w-3' />
                    <span>
                      Scheduled: {format(new Date(email.scheduledFor), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  {email.sentAt && (
                    <div className='flex items-center gap-1'>
                      <Clock className='h-3 w-3' />
                      <span>Sent: {format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                  {email.timezone && (
                    <div className='text-xs'>
                      Timezone: {email.timezone}
                    </div>
                  )}
                </div>
                {email.error && (
                  <div className='mt-2 text-sm text-destructive'>
                    Error: {email.error}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Email Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          {selectedEmail && (
            <>
              <DialogHeader>
                <DialogTitle>Scheduled Email Details</DialogTitle>
                <DialogDescription>
                  {getStatusBadge(selectedEmail.status)} {getSourceBadge(selectedEmail.source)}
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                <div>
                  <Label>To</Label>
                  <div className='text-sm mt-1'>{selectedEmail.to.join(', ')}</div>
                </div>

                {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                  <div>
                    <Label>CC</Label>
                    <div className='text-sm mt-1'>{selectedEmail.cc.join(', ')}</div>
                  </div>
                )}

                <div>
                  <Label>Subject</Label>
                  <div className='text-sm mt-1'>{selectedEmail.subject}</div>
                </div>

                <div>
                  <Label>Message</Label>
                  <div className='text-sm mt-1 whitespace-pre-wrap p-3 bg-muted rounded-md'>
                    {selectedEmail.body}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label>Scheduled For</Label>
                    <div className='text-sm mt-1'>
                      {format(new Date(selectedEmail.scheduledFor), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  {selectedEmail.timezone && (
                    <div>
                      <Label>Timezone</Label>
                      <div className='text-sm mt-1'>{selectedEmail.timezone}</div>
                    </div>
                  )}
                </div>

                {selectedEmail.sentAt && (
                  <div>
                    <Label>Sent At</Label>
                    <div className='text-sm mt-1'>
                      {format(new Date(selectedEmail.sentAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                )}

                {selectedEmail.error && (
                  <div>
                    <Label className='text-destructive'>Error</Label>
                    <div className='text-sm mt-1 text-destructive'>{selectedEmail.error}</div>
                  </div>
                )}

                {selectedEmail.workflowId && (
                  <div>
                    <Label>Workflow ID</Label>
                    <div className='text-sm mt-1 font-mono'>{selectedEmail.workflowId}</div>
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedEmail.status === 'pending' && (
                  <Button
                    variant='destructive'
                    onClick={() => {
                      handleCancelEmail(selectedEmail.id);
                      setViewDialogOpen(false);
                    }}
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Cancel Email
                  </Button>
                )}
                <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
