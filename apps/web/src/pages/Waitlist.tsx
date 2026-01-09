// Waitlist management dashboard
import { useState, useEffect } from 'react';
import { useWaitlistStore } from '@breeder/firebase';
import { WaitlistEntry } from '@breeder/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auth } from '@breeder/firebase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Eye,
  Trash2,
  Mail,
  Phone,
  DollarSign,
  CheckCircle,
  XCircle,
  Code,
} from 'lucide-react';
import { WaitlistDetailsDialog } from '@/components/WaitlistDetailsDialog';
import { WaitlistEmbedDialog } from '@/components/WaitlistEmbedDialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

function SortableWaitlistItem({
  entry,
  onView,
  onDelete,
}: {
  entry: WaitlistEntry;
  onView: (entry: WaitlistEntry) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-blue-500';
      case 'active':
        return 'bg-green-500';
      case 'matched':
        return 'bg-purple-500';
      case 'reserved':
        return 'bg-cyan-500';
      case 'completed':
        return 'bg-gray-500';
      case 'withdrawn':
        return 'bg-orange-500';
      case 'declined':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority?: 'standard' | 'priority' | 'vip') => {
    switch (priority) {
      case 'vip':
        return 'text-purple-600 font-bold';
      case 'priority':
        return 'text-blue-600 font-semibold';
      default:
        return '';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className='touch-none'>
      <Card className='p-4 mb-2'>
        <div className='flex items-center gap-4'>
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className='cursor-grab active:cursor-grabbing'
          >
            <GripVertical className='h-5 w-5 text-muted-foreground' />
          </div>

          {/* Position */}
          <div
            className={`text-lg font-bold min-w-[40px] ${getPriorityColor(
              entry.priority
            )}`}
          >
            #{entry.position}
          </div>

          {/* Customer Info */}
          <div className='flex-1'>
            <div className='font-semibold'>{entry.name}</div>
            <div className='text-sm text-muted-foreground flex items-center gap-4'>
              <span>{entry.email}</span>
              {entry.phone && <span>{entry.phone}</span>}
            </div>
          </div>

          {/* Preferences */}
          <div className='text-sm text-muted-foreground'>
            {entry.preferredSex && (
              <div>
                Sex:{' '}
                {entry.preferredSex === 'either' ? 'Any' : entry.preferredSex}
              </div>
            )}
            {entry.timeline && <div>Timeline: {entry.timeline}</div>}
          </div>

          {/* Deposit Status */}
          <div className='flex items-center gap-2'>
            {entry.depositRequired &&
              (entry.depositPaid ? (
                <div className='flex items-center gap-1 text-green-600'>
                  <CheckCircle className='h-4 w-4' />
                  <span className='text-xs'>Deposit Paid</span>
                </div>
              ) : (
                <div className='flex items-center gap-1 text-yellow-600'>
                  <DollarSign className='h-4 w-4' />
                  <span className='text-xs'>Deposit Pending</span>
                </div>
              ))}
          </div>

          {/* Status Badge */}
          <Badge className={getStatusColor(entry.status)}>{entry.status}</Badge>

          {/* Actions */}
          <div className='flex gap-2'>
            <Button size='sm' variant='outline' onClick={() => onView(entry)}>
              <Eye className='h-4 w-4' />
            </Button>
            {entry.email && (
              <a href={`mailto:${entry.email}`}>
                <Button size='sm' variant='outline'>
                  <Mail className='h-4 w-4' />
                </Button>
              </a>
            )}
            {entry.phone && (
              <a href={`tel:${entry.phone}`}>
                <Button size='sm' variant='outline'>
                  <Phone className='h-4 w-4' />
                </Button>
              </a>
            )}
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                if (confirm('Remove this entry from the waitlist?')) {
                  onDelete(entry.id);
                }
              }}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function Waitlist() {
  const {
    waitlist,
    deleteWaitlistEntry,
    reorderWaitlist,
    subscribeToWaitlist,
  } = useWaitlistStore();
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Subscribe to waitlist changes
  useEffect(() => {
    const unsubscribe = subscribeToWaitlist();
    return () => unsubscribe();
  }, [subscribeToWaitlist]);

  // Filter waitlist
  const filteredWaitlist = waitlist.filter((entry) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active_approved') {
      return entry.status === 'active' || entry.status === 'approved';
    }
    return entry.status === statusFilter;
  });

  // Sort by position
  const sortedWaitlist = [...filteredWaitlist].sort(
    (a, b) => (a.position || 999) - (b.position || 999)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedWaitlist.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = sortedWaitlist.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(sortedWaitlist, oldIndex, newIndex);
      reorderWaitlist(newOrder);
    }
  };

  // Stats
  const pendingCount = waitlist.filter((e) => e.status === 'pending').length;
  const activeCount = waitlist.filter(
    (e) => e.status === 'active' || e.status === 'approved'
  ).length;
  const depositPaidCount = waitlist.filter((e) => e.depositPaid).length;
  const matchedCount = waitlist.filter(
    (e) => e.status === 'matched' || e.status === 'reserved'
  ).length;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Master Waitlist</h1>
          <p className='text-muted-foreground'>
            Manage your puppy waitlist across all litters
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setEmbedOpen(true)}>
            <Code className='h-4 w-4 mr-2' />
            Get Embed Code
          </Button>
          <Button
            onClick={() =>
              window.open(
                `/waitlist-apply/${auth.currentUser?.uid || ''}`,
                '_blank'
              )
            }
          >
            View Application Form
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='p-4'>
          <div className='text-sm text-muted-foreground'>
            Total Applications
          </div>
          <div className='text-2xl font-bold'>{waitlist.length}</div>
        </Card>
        <Card className='p-4'>
          <div className='text-sm text-muted-foreground'>Pending Review</div>
          <div className='text-2xl font-bold text-yellow-600'>
            {pendingCount}
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-sm text-muted-foreground'>Active Waitlist</div>
          <div className='text-2xl font-bold text-green-600'>{activeCount}</div>
        </Card>
        <Card className='p-4'>
          <div className='text-sm text-muted-foreground'>Deposits Paid</div>
          <div className='text-2xl font-bold text-blue-600'>
            {depositPaidCount}
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <label className='text-sm font-medium'>Filter by Status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='active_approved'>Active Waitlist</SelectItem>
              <SelectItem value='all'>All Entries</SelectItem>
              <SelectItem value='pending'>Pending Review</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='matched'>Matched</SelectItem>
              <SelectItem value='reserved'>Reserved</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
              <SelectItem value='withdrawn'>Withdrawn</SelectItem>
              <SelectItem value='declined'>Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Waitlist */}
      {sortedWaitlist.length === 0 ? (
        <Card className='p-12 text-center'>
          <p className='text-muted-foreground'>
            No entries found. Share your waitlist application link with
            potential customers!
          </p>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedWaitlist.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
              {sortedWaitlist.map((entry) => (
                <SortableWaitlistItem
                  key={entry.id}
                  entry={entry}
                  onView={(entry) => {
                    setSelectedEntry(entry);
                    setDetailsOpen(true);
                  }}
                  onDelete={deleteWaitlistEntry}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Details Dialog */}
      {selectedEntry && (
        <WaitlistDetailsDialog
          open={detailsOpen}
          setOpen={setDetailsOpen}
          entry={selectedEntry}
        />
      )}

      {/* Embed Code Dialog */}
      <WaitlistEmbedDialog open={embedOpen} setOpen={setEmbedOpen} />
    </div>
  );
}
