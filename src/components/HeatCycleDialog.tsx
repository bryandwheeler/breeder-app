import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HeatCycle } from '@/types/dog';

interface HeatCycleDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  heatCycle: HeatCycle | null;
  onSave: (heatCycle: HeatCycle) => Promise<void>;
}

export function HeatCycleDialog({ open, setOpen, heatCycle, onSave }: HeatCycleDialogProps) {
  const [formData, setFormData] = useState<HeatCycle>({
    id: crypto.randomUUID(),
    startDate: new Date().toISOString().split('T')[0],
    intensity: 'normal',
  });

  useEffect(() => {
    if (heatCycle) {
      setFormData(heatCycle);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        startDate: new Date().toISOString().split('T')[0],
        intensity: 'normal',
      });
    }
  }, [heatCycle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{heatCycle ? 'Edit Heat Cycle' : 'Record Heat Cycle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='startDate'>Start Date *</Label>
              <Input
                id='startDate'
                type='date'
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor='endDate'>End Date</Label>
              <Input
                id='endDate'
                type='date'
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='intensity'>Intensity</Label>
            <Select
              value={formData.intensity || 'normal'}
              onValueChange={(value) =>
                setFormData({ ...formData, intensity: value as 'light' | 'normal' | 'heavy' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='light'>Light</SelectItem>
                <SelectItem value='normal'>Normal</SelectItem>
                <SelectItem value='heavy'>Heavy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea
              id='notes'
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder='Any observations or notes'
              rows={3}
            />
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
