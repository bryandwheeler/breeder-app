import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Scale, Edit as EditIcon } from 'lucide-react';
import { WeightEntry } from '@/types/dog';
import { useDogStore } from '@/store/dogStoreFirebase';

interface WeightTrackerProps {
  dogId: string;
  currentUnit?: 'lbs' | 'kg';
  editEntry?: WeightEntry;
  onClose?: () => void;
}

export function WeightTracker({ dogId, currentUnit, editEntry, onClose }: WeightTrackerProps) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState(editEntry?.weight.toString() || '');
  const [unit, setUnit] = useState<'lbs' | 'kg'>(editEntry?.unit || currentUnit || 'lbs');
  const [date, setDate] = useState(editEntry?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editEntry?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const { updateDog, dogs } = useDogStore();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      if (!editEntry) {
        setWeight('');
        setNotes('');
      }
      onClose?.();
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!weight || weight.trim() === '') {
      alert('Please enter a weight');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('Please enter a valid weight greater than 0');
      return;
    }

    if (!date) {
      alert('Please select a date');
      return;
    }

    setIsSaving(true);

    try {
      const dog = dogs.find((d) => d.id === dogId);

      if (!dog) {
        alert('Dog not found');
        setIsSaving(false);
        return;
      }

      let updatedWeightHistory;

      if (editEntry) {
        // Update existing entry
        updatedWeightHistory = dog.weightHistory.map((entry) => {
          if (entry.id === editEntry.id) {
            const updated: WeightEntry = {
              id: entry.id,
              weight: weightNum,
              unit,
              date,
            };
            // Only add notes if they exist (avoid undefined)
            if (notes.trim()) {
              updated.notes = notes.trim();
            }
            return updated;
          }
          return entry;
        });
      } else {
        // Add new entry
        const newWeightEntry: WeightEntry = {
          id: crypto.randomUUID(),
          date,
          weight: weightNum,
          unit,
        };
        // Only add notes if they exist (avoid undefined)
        if (notes.trim()) {
          newWeightEntry.notes = notes.trim();
        }
        updatedWeightHistory = [...(dog.weightHistory || []), newWeightEntry];
      }

      await updateDog(dogId, {
        weightHistory: updatedWeightHistory,
      });

      // Reset and close
      setWeight('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setOpen(false);
      onClose?.();
    } catch (error) {
      console.error('Error saving weight:', error);
      alert(`Failed to save weight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const TriggerButton = editEntry ? (
    <Button size='sm' variant='ghost'>
      <EditIcon className='h-4 w-4' />
    </Button>
  ) : (
    <Button>
      <Plus className='mr-2 h-4 w-4' /> Add Weight
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Scale className='h-5 w-5' />
            {editEntry ? 'Edit Weight' : 'Record Weight'}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label>Weight *</Label>
              <Input
                type='text'
                inputMode='decimal'
                placeholder='0.0'
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label>Unit *</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as 'lbs' | 'kg')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='lbs'>lbs</SelectItem>
                  <SelectItem value='kg'>kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Date *</Label>
            <Input type='date' value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Input
              type='text'
              placeholder='e.g., After meal, morning weigh-in...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={isSaving ? 'opacity-50' : ''}
            >
              {isSaving ? 'Saving...' : 'Save Weight'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
