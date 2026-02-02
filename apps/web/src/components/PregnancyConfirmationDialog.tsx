import { useState } from 'react';
import { useDogStore, useHeatCycleStore } from '@breeder/firebase';
import { BreedingRecord, BreedingStatus } from '@breeder/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Baby } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface PregnancyConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breedingRecord: BreedingRecord;
  damName?: string;
  onSuccess?: () => void;
}

export function PregnancyConfirmationDialog({
  open,
  onOpenChange,
  breedingRecord,
  damName,
  onSuccess,
}: PregnancyConfirmationDialogProps) {
  const { updateLitter, litters } = useDogStore();
  const { updateBreedingRecord } = useHeatCycleStore();

  const [result, setResult] = useState<'confirmed' | 'unsuccessful'>('confirmed');
  const [confirmationDate, setConfirmationDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [confirmationMethod, setConfirmationMethod] = useState<
    'ultrasound' | 'palpation' | 'blood_test' | 'xray'
  >('ultrasound');
  const [estimatedPuppyCount, setEstimatedPuppyCount] = useState<number | ''>('');
  const [ultrasoundNotes, setUltrasoundNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Find linked litter
  const linkedLitter = litters.find((l) => l.id === breedingRecord.litterId);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Update breeding record
      const updates: Partial<BreedingRecord> = {
        status: result as BreedingStatus,
        confirmationDate,
        confirmationMethod,
      };

      if (result === 'confirmed') {
        if (estimatedPuppyCount) {
          updates.estimatedPuppyCount = Number(estimatedPuppyCount);
        }
        if (ultrasoundNotes) {
          updates.ultrasoundNotes = ultrasoundNotes;
        }
        if (confirmationMethod === 'ultrasound') {
          updates.ultrasoundDate = confirmationDate;
        }
      }

      await updateBreedingRecord(breedingRecord.id, updates);

      // Update linked litter status if confirmed
      if (result === 'confirmed' && breedingRecord.litterId) {
        await updateLitter(breedingRecord.litterId, {
          status: 'pregnant',
        });
      }

      toast({
        title: result === 'confirmed' ? 'Pregnancy confirmed!' : 'Breeding marked unsuccessful',
        description:
          result === 'confirmed'
            ? `${damName || 'Dam'} is confirmed pregnant. Litter status updated.`
            : 'The breeding record has been updated.',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating breeding record:', error);
      toast({
        title: 'Error',
        description: 'Failed to update breeding record. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate expected due date
  const expectedDueDate = breedingRecord.expectedDueDate
    ? new Date(breedingRecord.expectedDueDate)
    : addDays(new Date(breedingRecord.breedingDate), 63);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5" />
            Pregnancy Check Results
          </DialogTitle>
          <DialogDescription>
            Record the results of the pregnancy check for {damName || 'this breeding'}.
            Breeding date: {format(new Date(breedingRecord.breedingDate), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Result */}
          <div className="space-y-3">
            <Label>Result</Label>
            <RadioGroup
              value={result}
              onValueChange={(v) => setResult(v as 'confirmed' | 'unsuccessful')}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="confirmed"
                className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer transition-colors ${
                  result === 'confirmed'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-muted hover:border-muted-foreground'
                }`}
              >
                <RadioGroupItem value="confirmed" id="confirmed" className="sr-only" />
                <CheckCircle
                  className={`h-8 w-8 mb-2 ${
                    result === 'confirmed' ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                />
                <span className="font-medium">Pregnant</span>
              </Label>
              <Label
                htmlFor="unsuccessful"
                className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer transition-colors ${
                  result === 'unsuccessful'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950'
                    : 'border-muted hover:border-muted-foreground'
                }`}
              >
                <RadioGroupItem value="unsuccessful" id="unsuccessful" className="sr-only" />
                <XCircle
                  className={`h-8 w-8 mb-2 ${
                    result === 'unsuccessful' ? 'text-red-500' : 'text-muted-foreground'
                  }`}
                />
                <span className="font-medium">Not Pregnant</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Confirmation Date */}
          <div className="space-y-2">
            <Label htmlFor="confirmationDate">Confirmation Date</Label>
            <Input
              id="confirmationDate"
              type="date"
              value={confirmationDate}
              onChange={(e) => setConfirmationDate(e.target.value)}
            />
          </div>

          {/* Confirmation Method */}
          <div className="space-y-2">
            <Label htmlFor="confirmationMethod">Confirmation Method</Label>
            <Select
              value={confirmationMethod}
              onValueChange={(v) =>
                setConfirmationMethod(v as typeof confirmationMethod)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultrasound">Ultrasound</SelectItem>
                <SelectItem value="palpation">Palpation</SelectItem>
                <SelectItem value="blood_test">Blood Test (Relaxin)</SelectItem>
                <SelectItem value="xray">X-Ray</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional fields if pregnant */}
          {result === 'confirmed' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="estimatedPuppyCount">Estimated Puppy Count</Label>
                <Input
                  id="estimatedPuppyCount"
                  type="number"
                  min="1"
                  max="20"
                  value={estimatedPuppyCount}
                  onChange={(e) =>
                    setEstimatedPuppyCount(e.target.value ? parseInt(e.target.value) : '')
                  }
                  placeholder="e.g., 6"
                />
                <p className="text-xs text-muted-foreground">
                  Optional - can be estimated from ultrasound or confirmed later with x-ray
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ultrasoundNotes">Notes</Label>
                <Textarea
                  id="ultrasoundNotes"
                  value={ultrasoundNotes}
                  onChange={(e) => setUltrasoundNotes(e.target.value)}
                  placeholder="Any observations or notes from the examination..."
                  rows={3}
                />
              </div>

              {/* Expected Due Date Display */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Expected Due Date</p>
                <p className="text-lg font-bold text-primary">
                  {format(expectedDueDate, 'PPP')}
                </p>
                <p className="text-xs text-muted-foreground">
                  63 days from breeding date
                </p>
              </div>
            </>
          )}

          {/* Warning if linked litter exists and confirming */}
          {result === 'confirmed' && linkedLitter && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                The linked litter "{linkedLitter.litterName}" will be updated to "Pregnant"
                status.
              </p>
            </div>
          )}

          {/* Warning if unsuccessful and litter exists */}
          {result === 'unsuccessful' && linkedLitter && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                The linked litter will remain in "Planned" status. You may want to delete
                it if this breeding attempt is over.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Results'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
