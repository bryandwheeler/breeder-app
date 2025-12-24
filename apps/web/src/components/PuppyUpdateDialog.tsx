import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PuppyUpdate } from '@breeder/types';
import { isEmailConfigured } from '@/lib/emailService';
import { Mail } from 'lucide-react';

interface PuppyUpdateDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  update: PuppyUpdate | null;
  onSave: (update: PuppyUpdate, sendEmail: boolean) => Promise<void>;
}

export function PuppyUpdateDialog({ open, setOpen, update, onSave }: PuppyUpdateDialogProps) {
  const [formData, setFormData] = useState<PuppyUpdate>({
    id: crypto.randomUUID(),
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
  });
  const [sendEmail, setSendEmail] = useState(false);
  const emailConfigured = isEmailConfigured();

  useEffect(() => {
    if (update) {
      setFormData(update);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        title: '',
        content: '',
      });
    }
    setSendEmail(false);
  }, [update, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData, sendEmail);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{update ? 'Edit Update' : 'Add Update for Buyer'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='title'>Title *</Label>
            <Input
              id='title'
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder='e.g., Week 4 Update'
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

          <div>
            <Label htmlFor='content'>Content *</Label>
            <Textarea
              id='content'
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder='Share updates about the puppy...'
              rows={5}
            />
          </div>

          {/* Email notification option */}
          {!update && (
            <div className='flex items-center justify-between p-3 bg-muted rounded-lg'>
              <div className='flex items-center gap-2'>
                <Mail className={`h-4 w-4 ${emailConfigured ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <Label>Email buyers</Label>
                  <p className='text-xs text-muted-foreground'>
                    {emailConfigured ? 'Send notification to buyers with portal access' : 'Configure email in settings first'}
                  </p>
                </div>
              </div>
              <Switch
                checked={sendEmail}
                onCheckedChange={setSendEmail}
                disabled={!emailConfigured}
              />
            </div>
          )}

          <div className='flex justify-end gap-2 pt-4'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>
              {sendEmail ? 'Save & Send Email' : 'Save Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
