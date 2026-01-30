import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useStudJobStore } from '@/store/studJobStore';
import { useDogStore, useCrmStore } from '@breeder/firebase';
import { getStudJobBreederInfo } from '@breeder/firebase';
import { StudJob } from '@breeder/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, DollarSign, Check, X, RotateCcw } from 'lucide-react';
import { StudJobDialog } from './StudJobDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

export function StudJobs() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<StudJob | null>(null);

  const { getPendingStudJobs, getConfirmedStudJobs, getInProgressStudJobs, getCompletedStudJobs, deleteStudJob } =
    useStudJobStore();
  const { dogs } = useDogStore();
  const { customers } = useCrmStore();

  const pendingJobs = getPendingStudJobs();
  const confirmedJobs = getConfirmedStudJobs();
  const inProgressJobs = getInProgressStudJobs();
  const completedJobs = getCompletedStudJobs();

  const getStudName = (studId: string) => {
    const dog = dogs.find((d) => d.id === studId);
    return dog ? dog.registeredName || dog.name : 'Unknown Stud';
  };

  const handleEdit = (job: StudJob) => {
    setEditingJob(job);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this stud job?')) {
      await deleteStudJob(id);
    }
  };

  const handleAddNew = () => {
    setEditingJob(null);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: StudJob['status']) => {
    const variants: Record<StudJob['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
      pending: 'outline',
      confirmed: 'default',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };

    const labels: Record<StudJob['status'], string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <Badge variant={variants[status]} className={status === 'in_progress' ? 'bg-amber-500' : undefined}>
        {labels[status]}
      </Badge>
    );
  };

  const calculateTotalFees = (job: StudJob) => {
    let total = job.studFee || 0;

    // Add additional breeding fees
    if (job.additionalBreedingFee && job.breedings.length > 1) {
      total += job.additionalBreedingFee * (job.breedings.length - 1);
    }

    // Add add-on fees
    if (job.addOns) {
      total += job.addOns.reduce((sum, addon) => sum + addon.cost, 0);
    }

    return total;
  };

  const renderJobRow = (job: StudJob) => {
    const totalFees = calculateTotalFees(job);
    const allBreedings = job.breedings || [];

    // Count breeding statuses
    const completedBreedings = allBreedings.filter(b => b.status === 'completed').length;
    const scheduledBreedings = allBreedings.filter(b => b.status === 'scheduled').length;

    const breedingDates = allBreedings.length > 0
      ? allBreedings.map(b => format(parseISO(b.date), 'MMM d')).join(', ')
      : job.scheduledDate
      ? `Scheduled: ${format(parseISO(job.scheduledDate), 'MMM d, yyyy')}`
      : '-';

    // Get breeder contact info from centralized system
    const breederInfo = getStudJobBreederInfo(job, customers);

    return (
      <TableRow key={job.id}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {getStudName(job.studId)}
            {job.isRebreed && (
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300">
                <RotateCcw className="h-3 w-3 mr-1" />
                Rebreed
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>{job.femaleDogName}</TableCell>
        <TableCell>
          {breederInfo ? (
            breederInfo.id ? (
              <Link
                to={`/customers`}
                className="text-primary hover:underline"
                onClick={(e) => {
                  // Store the contact ID to open the details dialog
                  e.preventDefault();
                  window.location.href = `/customers?view=${breederInfo.id}`;
                }}
              >
                {breederInfo.name}
              </Link>
            ) : (
              <span>{breederInfo.name}</span>
            )
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="text-sm">{breedingDates}</span>
            {allBreedings.length > 0 && (
              <div className="flex gap-1 mt-1">
                {completedBreedings > 0 && (
                  <Badge variant="secondary" className="w-fit text-xs bg-green-100 text-green-800">
                    {completedBreedings} done
                  </Badge>
                )}
                {scheduledBreedings > 0 && (
                  <Badge variant="outline" className="w-fit text-xs">
                    {scheduledBreedings} scheduled
                  </Badge>
                )}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>{getStatusBadge(job.status)}</TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            {job.studFee && (
              <span className="flex items-center gap-1 text-sm">
                <DollarSign className="h-3 w-3" />
                {totalFees.toFixed(2)}
                {job.studFeePaid && job.additionalBreedingsPaid && (!job.addOns || job.addOns.every(a => a.paid)) ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-red-600" />
                )}
              </span>
            )}
            {job.pickOfLitter && <Badge variant="outline" className="w-fit text-xs">POL</Badge>}
          </div>
        </TableCell>
        <TableCell>{job.puppyCount || '-'}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(job)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(job.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stud Jobs</CardTitle>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Stud Job
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pending ({pendingJobs.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmed ({confirmedJobs.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress ({inProgressJobs.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedJobs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending stud jobs. Click "Add Stud Job" to create a reservation.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stud</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Breeder</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Puppies</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{pendingJobs.map(renderJobRow)}</TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="confirmed" className="mt-4">
              {confirmedJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No confirmed stud jobs yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stud</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Breeder</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Puppies</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{confirmedJobs.map(renderJobRow)}</TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="in_progress" className="mt-4">
              {inProgressJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No stud jobs in progress. Jobs move here when some breedings are complete but more are scheduled.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stud</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Breeder</TableHead>
                        <TableHead>Breedings</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Puppies</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{inProgressJobs.map(renderJobRow)}</TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {completedJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No completed stud jobs yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stud</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Breeder</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Puppies</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{completedJobs.map(renderJobRow)}</TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <StudJobDialog open={dialogOpen} setOpen={setDialogOpen} editingJob={editingJob} />
    </div>
  );
}
