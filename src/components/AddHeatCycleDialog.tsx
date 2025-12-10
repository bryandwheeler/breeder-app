import { useState, useEffect } from 'react';
import { useHeatCycleStore } from '@/store/heatCycleStore';
import { HeatCycle } from '@/types/dog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddHeatCycleDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dogId: string;
  dogName: string;
  editingCycle?: HeatCycle | null;
}

export function AddHeatCycleDialog({ open, setOpen, dogId, dogName, editingCycle }: AddHeatCycleDialogProps) {
  const { addHeatCycle, updateHeatCycle } = useHeatCycleStore();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [intensity, setIntensity] = useState<'light' | 'normal' | 'heavy'>('normal');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingCycle) {
      setStartDate(editingCycle.startDate);
      setEndDate(editingCycle.endDate || '');
      setIntensity(editingCycle.intensity || 'normal');
      setNotes(editingCycle.notes || '');
    } else {
      // Reset form for new entry
      setStartDate('');
      setEndDate('');
      setIntensity('normal');
      setNotes('');
    }
  }, [editingCycle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCycle) {
        // Update existing cycle
        await updateHeatCycle(editingCycle.id, {
          startDate,
          endDate: endDate || undefined,
          intensity,
          notes,
        });
      } else {
        // Create new cycle
        await addHeatCycle({
          dogId,
          startDate,
          endDate: endDate || undefined,
          intensity,
          notes,
        });
      }

      setOpen(false);
      // Reset form
      setStartDate('');
      setEndDate('');
      setIntensity('normal');
      setNotes('');
    } catch (error) {
      console.error('Error saving heat cycle:', error);
      alert('Failed to save heat cycle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCycle ? 'Edit Heat Cycle' : 'Add Heat Cycle'} - {dogName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
            <p className="text-xs text-muted-foreground">
              Heat cycles typically last 2-4 weeks
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intensity">Intensity</Label>
            <Select value={intensity} onValueChange={(value: 'light' | 'normal' | 'heavy') => setIntensity(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, behavior changes, etc."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingCycle ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
