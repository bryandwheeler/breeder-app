// Inquiry/Lead management page
import { useState } from 'react';
import { useBreederStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Inquiry } from '@breeder/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Mail, Phone, Eye, Send } from 'lucide-react';
import { InquiryDetailsDialog } from '@/components/InquiryDetailsDialog';
import { SendWaitlistDialog } from '@/components/SendWaitlistDialog';

export function Inquiries() {
  const { inquiries, deleteInquiry, updateInquiry } = useBreederStore();
  const { currentUser } = useAuth();
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sendWaitlistOpen, setSendWaitlistOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusColor = (status: Inquiry['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500';
      case 'contacted':
        return 'bg-yellow-500';
      case 'qualified':
        return 'bg-purple-500';
      case 'waitlist':
        return 'bg-green-500';
      case 'reserved':
        return 'bg-cyan-500';
      case 'completed':
        return 'bg-gray-500';
      case 'not_interested':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-gray-300 bg-gray-50';
      default:
        return '';
    }
  };

  const handleSendWaitlistClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setSendWaitlistOpen(true);
  };

  const columns: ColumnDef<Inquiry>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return <div className="text-sm">{date ? new Date(date).toLocaleDateString() : '-'}</div>;
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'preferredSex',
      header: 'Preferences',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.preferredSex && (
            <div>
              Sex: {row.original.preferredSex === 'either' ? 'No pref' : row.original.preferredSex}
            </div>
          )}
          {row.original.preferredColor && <div>Color: {row.original.preferredColor}</div>}
          {row.original.timeline && <div>Timeline: {row.original.timeline}</div>}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const inquiry = row.original;
        return (
          <Select
            value={inquiry.status}
            onValueChange={(value: Inquiry['status']) => {
              updateInquiry(inquiry.id, { status: value });
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Badge className={getStatusColor(inquiry.status)}>
                {inquiry.status.replace('_', ' ')}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="waitlist">Waitlist</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const inquiry = row.original;
        return (
          <Select
            value={inquiry.priority || 'medium'}
            onValueChange={(value: 'low' | 'medium' | 'high') => {
              updateInquiry(inquiry.id, { priority: value });
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedInquiry(row.original);
              setDetailsOpen(true);
            }}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSendWaitlistClick(row.original)}
            title="Send Waitlist Link"
          >
            <Send className="h-4 w-4" />
          </Button>
          {row.original.email && (
            <a href={`mailto:${row.original.email}`}>
              <Button size="sm" variant="outline" title="Email">
                <Mail className="h-4 w-4" />
              </Button>
            </a>
          )}
          {row.original.phone && (
            <a href={`tel:${row.original.phone}`}>
              <Button size="sm" variant="outline" title="Call">
                <Phone className="h-4 w-4" />
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              if (confirm('Are you sure you want to delete this inquiry?')) {
                await deleteInquiry(row.original.id);
              }
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Filter inquiries
  const filteredInquiries = inquiries.filter((inquiry) => {
    if (statusFilter === 'all') return true;
    return inquiry.status === statusFilter;
  });

  // Sort by date (newest first)
  const sortedInquiries = [...filteredInquiries].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  // Get stats
  const newCount = inquiries.filter((i) => i.status === 'new').length;
  const qualifiedCount = inquiries.filter((i) => i.status === 'qualified').length;
  const waitlistCount = inquiries.filter((i) => i.status === 'waitlist').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inquiries & Leads</h1>
        <p className="text-muted-foreground">Manage customer inquiries and track your sales pipeline</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Inquiries</div>
          <div className="text-2xl font-bold">{inquiries.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">New</div>
          <div className="text-2xl font-bold text-blue-600">{newCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Qualified</div>
          <div className="text-2xl font-bold text-purple-600">{qualifiedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Waitlist</div>
          <div className="text-2xl font-bold text-green-600">{waitlistCount}</div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter by Status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Inquiries</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="waitlist">Waitlist</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={sortedInquiries} searchPlaceholder="Search inquiries..." />

      {/* Details Dialog */}
      {selectedInquiry && (
        <InquiryDetailsDialog
          open={detailsOpen}
          setOpen={setDetailsOpen}
          inquiry={selectedInquiry}
          onUpdate={(updates) => updateInquiry(selectedInquiry.id, updates)}
        />
      )}

      {/* Send Waitlist Dialog */}
      <SendWaitlistDialog
        open={sendWaitlistOpen}
        setOpen={setSendWaitlistOpen}
        inquiry={selectedInquiry}
        userId={currentUser?.uid || ''}
      />
    </div>
  );
}
