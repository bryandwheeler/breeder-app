import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DeclineRequestDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dogName: string;
  requesterName: string;
  onDecline: (responseMessage?: string) => void;
}

export function DeclineRequestDialog({
  open,
  setOpen,
  dogName,
  requesterName,
  onDecline,
}: DeclineRequestDialogProps) {
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = () => {
    onDecline(responseMessage || undefined);
    setOpen(false);
    setResponseMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>Decline Connection Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to decline the request from {requesterName} to connect with {dogName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="responseMessage">Optional Message (Optional)</Label>
          <Textarea
            id="responseMessage"
            placeholder="Add a message explaining why you're declining (optional)..."
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit}>
            Decline Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
