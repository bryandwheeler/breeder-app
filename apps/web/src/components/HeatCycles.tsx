import { useState, useMemo } from 'react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { useHeatCycleStore } from '@breeder/firebase';
import { HeatCycle, BreedingRecord } from '@breeder/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AddHeatCycleDialog } from './AddHeatCycleDialog';
import { BreedingRecordDialog } from './BreedingRecordDialog';

interface HeatCyclesProps {
  dogId: string;
  dogName: string;
}

export function HeatCycles({ dogId, dogName }: HeatCyclesProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [breedingDialogOpen, setBreedingDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<HeatCycle | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [editingBreedingRecord, setEditingBreedingRecord] = useState<BreedingRecord | null>(null);

  const {
    getHeatCyclesForDog,
    getBreedingRecordsForDog,
    deleteHeatCycle,
    deleteBreedingRecord
  } = useHeatCycleStore();

  const heatCycles = getHeatCyclesForDog(dogId);
  const breedingRecords = getBreedingRecordsForDog(dogId);

  // Calculate statistics
  const stats = useMemo(() => {
    if (heatCycles.length === 0) {
      return {
        lastCycle: null,
        nextEstimated: null,
        averageCycleLength: null,
        daysUntilNext: null,
        progressPercent: 0,
      };
    }

    const sortedCycles = [...heatCycles].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    const lastCycle = sortedCycles[0];

    // Calculate average cycle length from historical data
    let averageCycleLength = 197; // Default dog heat cycle is ~197 days (6.5 months)

    if (sortedCycles.length >= 2) {
      const intervals: number[] = [];
      for (let i = 0; i < sortedCycles.length - 1; i++) {
        const current = parseISO(sortedCycles[i].startDate);
        const previous = parseISO(sortedCycles[i + 1].startDate);
        intervals.push(differenceInDays(current, previous));
      }
      averageCycleLength = Math.round(
        intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      );
    }

    const lastCycleDate = parseISO(lastCycle.startDate);
    const today = new Date();
    const daysSinceLastCycle = differenceInDays(today, lastCycleDate);
    const nextEstimated = addDays(lastCycleDate, averageCycleLength);
    const daysUntilNext = differenceInDays(nextEstimated, today);
    const progressPercent = Math.min(100, Math.max(0, (daysSinceLastCycle / averageCycleLength) * 100));

    return {
      lastCycle,
      nextEstimated,
      averageCycleLength,
      daysUntilNext,
      progressPercent,
    };
  }, [heatCycles]);

  const handleEdit = (cycle: HeatCycle) => {
    setEditingCycle(cycle);
    setAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this heat cycle? All associated breeding records will also be deleted.')) {
      await deleteHeatCycle(id);
    }
  };

  const handleAddBreeding = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    setEditingBreedingRecord(null);
    setBreedingDialogOpen(true);
  };

  const handleEditBreeding = (record: BreedingRecord) => {
    setSelectedCycleId(record.heatCycleId);
    setEditingBreedingRecord(record);
    setBreedingDialogOpen(true);
  };

  const handleDeleteBreeding = async (recordId: string) => {
    if (confirm('Are you sure you want to delete this breeding record?')) {
      await deleteBreedingRecord(recordId);
    }
  };

  const getBreedingsForCycle = (cycleId: string) => {
    return breedingRecords.filter((record) => record.heatCycleId === cycleId);
  };

  const formatFertileWindow = (startDate: string) => {
    const start = parseISO(startDate);
    const fertileStart = addDays(start, 9);
    const fertileEnd = addDays(start, 14);
    return {
      start: format(fertileStart, 'MMM d, yyyy'),
      end: format(fertileEnd, 'MMM d, yyyy'),
    };
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Last Recorded Heat Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lastCycle ? (
              <p className="text-2xl font-bold">
                {format(parseISO(stats.lastCycle.startDate), 'MMMM d, yyyy')}
              </p>
            ) : (
              <p className="text-muted-foreground">No heat cycles recorded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estimated Next Heat Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.nextEstimated ? (
              <>
                <p className="text-2xl font-bold">
                  {format(stats.nextEstimated, 'MMMM d, yyyy')}
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {stats.daysUntilNext > 0
                        ? `${stats.daysUntilNext} days remaining`
                        : `Overdue by ${Math.abs(stats.daysUntilNext)} days`}
                    </span>
                    <span className="text-muted-foreground">
                      Avg cycle: {stats.averageCycleLength} days
                    </span>
                  </div>
                  <Progress value={stats.progressPercent} />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Not enough data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Heat Cycles Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Heat Cycle History</CardTitle>
          <Button onClick={() => { setEditingCycle(null); setAddDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Heat Cycle
          </Button>
        </CardHeader>
        <CardContent>
          {heatCycles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No heat cycles recorded yet. Click "Add Heat Cycle" to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Est. Fertile Window Start</TableHead>
                  <TableHead>Est. Fertile Window End</TableHead>
                  <TableHead>Breedings</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heatCycles.map((cycle) => {
                  const fertile = formatFertileWindow(cycle.startDate);
                  const breedings = getBreedingsForCycle(cycle.id);

                  return (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        {format(parseISO(cycle.startDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{fertile.start}</TableCell>
                      <TableCell>{fertile.end}</TableCell>
                      <TableCell>
                        {breedings.length > 0 ? (
                          <div className="space-y-2">
                            {breedings.map((breeding) => (
                              <div key={breeding.id} className="flex items-center gap-2">
                                <Badge variant="secondary" className="flex-1">
                                  {breeding.studName} - {format(parseISO(breeding.breedingDate), 'MMM d')}
                                </Badge>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditBreeding(breeding)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteBreeding(breeding.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddBreeding(cycle.id)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Another
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddBreeding(cycle.id)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Breeding
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {cycle.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cycle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cycle.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddHeatCycleDialog
        open={addDialogOpen}
        setOpen={setAddDialogOpen}
        dogId={dogId}
        dogName={dogName}
        editingCycle={editingCycle}
      />

      <BreedingRecordDialog
        open={breedingDialogOpen}
        setOpen={setBreedingDialogOpen}
        dogId={dogId}
        heatCycleId={selectedCycleId}
        editingRecord={editingBreedingRecord}
      />
    </div>
  );
}
