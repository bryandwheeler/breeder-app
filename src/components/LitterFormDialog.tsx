import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDogStore } from '@/store/dogStoreFirebase';
import { Litter } from '@/types/dog';

interface LitterFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  litter: Litter | null;
}

export function LitterFormDialog({ open, setOpen, litter }: LitterFormDialogProps) {
  const { dogs, addLitter, updateLitter } = useDogStore();
  const females = dogs.filter((d) => d.sex === 'female');
  const males = dogs.filter((d) => d.sex === 'male');

  const [formData, setFormData] = useState<Omit<Litter, 'id'>>({
    litterName: '',
    damId: '',
    sireId: '',
    dateOfBirth: '',
    status: 'planned',
    puppies: [],
    buyers: [],
  });

  useEffect(() => {
    if (litter) {
      setFormData({
        litterName: litter.litterName,
        damId: litter.damId,
        sireId: litter.sireId,
        dateOfBirth: litter.dateOfBirth,
        expectedDateOfBirth: litter.expectedDateOfBirth,
        status: litter.status,
        puppies: litter.puppies,
        buyers: litter.buyers,
        announceDate: litter.announceDate,
        pickupReadyDate: litter.pickupReadyDate,
        litterNotes: litter.litterNotes,
        pricing: litter.pricing,
      });
    } else {
      setFormData({
        litterName: '',
        damId: '',
        sireId: '',
        dateOfBirth: '',
        status: 'planned',
        puppies: [],
        buyers: [],
      });
    }
  }, [litter, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (litter) {
      await updateLitter(litter.id, formData);
    } else {
      await addLitter(formData);
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{litter ? 'Edit Litter' : 'Plan New Litter'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='litterName'>Litter Name (Optional)</Label>
            <Input
              id='litterName'
              value={formData.litterName || ''}
              onChange={(e) => setFormData({ ...formData, litterName: e.target.value })}
              placeholder='e.g., Spring 2025 Litter'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='damId'>Dam *</Label>
              <Select
                value={formData.damId}
                onValueChange={(value) => setFormData({ ...formData, damId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select dam' />
                </SelectTrigger>
                <SelectContent>
                  {females.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='sireId'>Sire *</Label>
              <Select
                value={formData.sireId}
                onValueChange={(value) => setFormData({ ...formData, sireId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select sire' />
                </SelectTrigger>
                <SelectContent>
                  {males.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='expectedDateOfBirth'>Expected Date of Birth</Label>
              <Input
                id='expectedDateOfBirth'
                type='date'
                value={formData.expectedDateOfBirth || ''}
                onChange={(e) => setFormData({ ...formData, expectedDateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor='dateOfBirth'>Actual Date of Birth *</Label>
              <Input
                id='dateOfBirth'
                type='date'
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as 'planned' | 'pregnant' | 'born' | 'weaning' | 'ready' | 'completed',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='planned'>Planned</SelectItem>
                  <SelectItem value='pregnant'>Pregnant</SelectItem>
                  <SelectItem value='born'>Born</SelectItem>
                  <SelectItem value='weaning'>Weaning</SelectItem>
                  <SelectItem value='ready'>Ready for Pickup</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='pickupReadyDate'>Pickup Ready Date</Label>
              <Input
                id='pickupReadyDate'
                type='date'
                value={formData.pickupReadyDate || ''}
                onChange={(e) => setFormData({ ...formData, pickupReadyDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='announceDate'>Announcement Date</Label>
            <Input
              id='announceDate'
              type='date'
              value={formData.announceDate || ''}
              onChange={(e) => setFormData({ ...formData, announceDate: e.target.value })}
            />
          </div>

          <div>
            <Label className='mb-2 block'>Pricing (Optional)</Label>
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='petPrice' className='text-sm'>
                  Pet Price
                </Label>
                <Input
                  id='petPrice'
                  type='number'
                  value={formData.pricing?.petPrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        petPrice: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder='0.00'
                />
              </div>

              <div>
                <Label htmlFor='breedingPrice' className='text-sm'>
                  Breeding Rights
                </Label>
                <Input
                  id='breedingPrice'
                  type='number'
                  value={formData.pricing?.breedingPrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        breedingPrice: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder='0.00'
                />
              </div>

              <div>
                <Label htmlFor='showPrice' className='text-sm'>
                  Show Quality
                </Label>
                <Input
                  id='showPrice'
                  type='number'
                  value={formData.pricing?.showPrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        showPrice: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder='0.00'
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor='litterNotes'>Litter Notes</Label>
            <Textarea
              id='litterNotes'
              value={formData.litterNotes || ''}
              onChange={(e) => setFormData({ ...formData, litterNotes: e.target.value })}
              placeholder='Any notes about this litter'
              rows={3}
            />
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>{litter ? 'Update Litter' : 'Create Litter'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
