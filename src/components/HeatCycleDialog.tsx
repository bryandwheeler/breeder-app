import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HeatCycle, Dog } from '@/types/dog';
import { Plus, Trash2 } from 'lucide-react';

interface HeatCycleDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  heatCycle: HeatCycle | null;
  males: Dog[];
  onSave: (heatCycle: HeatCycle) => Promise<void>;
}

export function HeatCycleDialog({ open, setOpen, heatCycle, males, onSave }: HeatCycleDialogProps) {
  const [formData, setFormData] = useState<HeatCycle>({
    id: crypto.randomUUID(),
    startDate: new Date().toISOString().split('T')[0],
    intensity: 'normal',
    bred: false,
    breedingDates: [],
  });

  useEffect(() => {
    if (heatCycle) {
      setFormData(heatCycle);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        startDate: new Date().toISOString().split('T')[0],
        intensity: 'normal',
        bred: false,
        breedingDates: [],
      });
    }
  }, [heatCycle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    setOpen(false);
  };

  const addBreedingDate = () => {
    const dates = formData.breedingDates || [];
    setFormData({
      ...formData,
      breedingDates: [...dates, new Date().toISOString().split('T')[0]],
    });
  };

  const removeBreedingDate = (index: number) => {
    const dates = formData.breedingDates || [];
    setFormData({
      ...formData,
      breedingDates: dates.filter((_, i) => i !== index),
    });
  };

  const updateBreedingDate = (index: number, date: string) => {
    const dates = [...(formData.breedingDates || [])];
    dates[index] = date;
    setFormData({ ...formData, breedingDates: dates });
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

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='bred'
              checked={formData.bred || false}
              onCheckedChange={(checked) => setFormData({ ...formData, bred: checked as boolean })}
            />
            <Label htmlFor='bred' className='cursor-pointer'>
              Bred during this cycle
            </Label>
          </div>

          {formData.bred && (
            <>
              <div>
                <Label htmlFor='sireId'>Sire (Stud)</Label>
                <Select
                  value={formData.sireId || ''}
                  onValueChange={(value) => setFormData({ ...formData, sireId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select sire' />
                  </SelectTrigger>
                  <SelectContent>
                    {males.map((male) => (
                      <SelectItem key={male.id} value={male.id}>
                        {male.name} {male.callName && `("${male.callName}")`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Label>Breeding Dates</Label>
                  <Button type='button' size='sm' variant='outline' onClick={addBreedingDate}>
                    <Plus className='h-4 w-4 mr-1' /> Add Date
                  </Button>
                </div>
                {(formData.breedingDates || []).length === 0 ? (
                  <p className='text-sm text-muted-foreground'>No breeding dates recorded</p>
                ) : (
                  <div className='space-y-2'>
                    {(formData.breedingDates || []).map((date, i) => (
                      <div key={i} className='flex gap-2 items-center'>
                        <Input
                          type='date'
                          value={date}
                          onChange={(e) => updateBreedingDate(i, e.target.value)}
                          className='flex-1'
                        />
                        <Button
                          type='button'
                          variant='destructive'
                          size='icon'
                          onClick={() => removeBreedingDate(i)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

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
