import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Buyer } from '@/types/dog';
import { Switch } from '@/components/ui/switch';
import { Copy } from 'lucide-react';

interface BuyerFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  buyer: Buyer | null;
  onSave: (buyer: Buyer) => Promise<void>;
}

export function BuyerFormDialog({ open, setOpen, buyer, onSave }: BuyerFormDialogProps) {
  const [formData, setFormData] = useState<Buyer>({
    id: crypto.randomUUID(),
    name: '',
    email: '',
    status: 'waitlist',
    dateAdded: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (buyer) {
      setFormData(buyer);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        name: '',
        email: '',
        status: 'waitlist',
        dateAdded: new Date().toISOString().split('T')[0],
      });
    }
  }, [buyer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>{buyer ? 'Edit Buyer' : 'Add Buyer to Waitlist'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='name'>Name *</Label>
            <Input
              id='name'
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder='Buyer name'
            />
          </div>

          <div>
            <Label htmlFor='email'>Email *</Label>
            <Input
              id='email'
              type='email'
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder='buyer@example.com'
            />
          </div>

          <div>
            <Label htmlFor='phone'>Phone</Label>
            <Input
              id='phone'
              type='tel'
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder='(555) 123-4567'
            />
          </div>

          <div>
            <Label htmlFor='address'>Address</Label>
            <Textarea
              id='address'
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder='Street address, city, state, zip'
              rows={2}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='preferredSex'>Preferred Sex</Label>
              <Select
                value={formData.preferredSex || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    preferredSex: value ? (value as 'male' | 'female' | 'either') : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='No preference' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='either'>No preference</SelectItem>
                  <SelectItem value='male'>Male</SelectItem>
                  <SelectItem value='female'>Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='preferredColor'>Preferred Color</Label>
              <Input
                id='preferredColor'
                value={formData.preferredColor || ''}
                onChange={(e) => setFormData({ ...formData, preferredColor: e.target.value })}
                placeholder='e.g., Apricot, Chocolate'
              />
            </div>
          </div>

          <div>
            <Label htmlFor='status'>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as 'waitlist' | 'approved' | 'reserved' | 'completed',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='waitlist'>Waitlist</SelectItem>
                <SelectItem value='approved'>Approved</SelectItem>
                <SelectItem value='reserved'>Reserved</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='dateAdded'>Date Added</Label>
            <Input
              id='dateAdded'
              type='date'
              value={formData.dateAdded}
              onChange={(e) => setFormData({ ...formData, dateAdded: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea
              id='notes'
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder='Any additional notes about this buyer'
              rows={3}
            />
          </div>

          {/* Buyer Portal Access */}
          <div className='border-t pt-4 mt-4'>
            <div className='flex items-center justify-between mb-3'>
              <div>
                <Label>Buyer Portal Access</Label>
                <p className='text-sm text-muted-foreground'>Allow buyer to view their puppy online</p>
              </div>
              <Switch
                checked={formData.portalEnabled || false}
                onCheckedChange={(checked) => {
                  const accessCode = checked && !formData.portalAccessCode
                    ? Math.random().toString(36).substring(2, 10).toUpperCase()
                    : formData.portalAccessCode;
                  setFormData({ ...formData, portalEnabled: checked, portalAccessCode: accessCode });
                }}
              />
            </div>
            {formData.portalEnabled && formData.portalAccessCode && (
              <div className='bg-muted p-3 rounded-lg'>
                <p className='text-sm text-muted-foreground mb-1'>Access Code:</p>
                <div className='flex items-center gap-2'>
                  <code className='text-lg font-mono font-bold'>{formData.portalAccessCode}</code>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      const url = `${window.location.origin}/buyer-portal?code=${formData.portalAccessCode}`;
                      navigator.clipboard.writeText(url);
                      alert('Portal link copied to clipboard!');
                    }}
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground mt-2'>
                  Share this code or link with the buyer so they can access the portal
                </p>
              </div>
            )}
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>Save Buyer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
