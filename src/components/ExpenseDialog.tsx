import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense } from '@/types/dog';

interface ExpenseDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  expense: Expense | null;
  onSave: (expense: Expense) => Promise<void>;
}

export function ExpenseDialog({ open, setOpen, expense, onSave }: ExpenseDialogProps) {
  const [formData, setFormData] = useState<Expense>({
    id: crypto.randomUUID(),
    category: 'vet',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (expense) {
      setFormData(expense);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        category: 'vet',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [expense, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='category'>Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as Expense['category'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='vet'>Veterinary</SelectItem>
                <SelectItem value='food'>Food & Supplements</SelectItem>
                <SelectItem value='supplies'>Supplies</SelectItem>
                <SelectItem value='testing'>Health Testing</SelectItem>
                <SelectItem value='advertising'>Advertising</SelectItem>
                <SelectItem value='other'>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='description'>Description *</Label>
            <Input
              id='description'
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder='e.g., Puppy wellness exams'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='amount'>Amount ($) *</Label>
              <Input
                id='amount'
                type='number'
                step='0.01'
                min='0'
                required
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor='date'>Date *</Label>
              <Input
                id='date'
                type='date'
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea
              id='notes'
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder='Optional notes'
              rows={2}
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
