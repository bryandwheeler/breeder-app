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
import { AlertTriangle } from 'lucide-react';
import { Dog } from '@breeder/types';

interface DeleteDogDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dog: Dog | null;
  onDelete: (dogId: string) => void;
  onMarkRetired: (dog: Dog) => void;
  onMarkDeceased: (dog: Dog) => void;
}

export function DeleteDogDialog({
  open,
  setOpen,
  dog,
  onDelete,
  onMarkRetired,
  onMarkDeceased,
}: DeleteDogDialogProps) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    if (dog) {
      onDelete(dog.id);
      setOpen(false);
      setConfirming(false);
    }
  };

  const handleMarkRetired = () => {
    if (dog) {
      onMarkRetired(dog);
      setOpen(false);
      setConfirming(false);
    }
  };

  const handleMarkDeceased = () => {
    if (dog) {
      onMarkDeceased(dog);
      setOpen(false);
      setConfirming(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setConfirming(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Dog?</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{dog?.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-sm mb-2">Consider marking as retired instead</h4>
            <p className="text-sm text-muted-foreground">
              Deleting will permanently remove all records. We recommend marking the dog as retired to preserve:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>Health records and test results</li>
              <li>Pedigree information</li>
              <li>Breeding history and offspring connections</li>
              <li>Complete medical and show history</li>
            </ul>
          </div>

          {!confirming && (
            <div className="bg-destructive/10 p-3 rounded-lg">
              <p className="text-sm font-medium text-destructive">
                ⚠️ Deletion cannot be undone!
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleMarkRetired}
              className="flex-1"
            >
              Mark as Retired
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={handleMarkDeceased}
            className="w-full"
          >
            Mark as Deceased
          </Button>

          {!confirming ? (
            <Button
              variant="destructive"
              onClick={() => setConfirming(true)}
              className="w-full"
            >
              I Still Want to Delete
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full"
            >
              Yes, Permanently Delete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
