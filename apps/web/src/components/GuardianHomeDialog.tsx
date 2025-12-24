import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GuardianHome } from '@breeder/types';
import { ContactSearchSelector } from './ContactSearchSelector';

interface GuardianHomeDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  guardianHome?: GuardianHome;
  onSave: (guardian: GuardianHome) => void;
}

export function GuardianHomeDialog({
  open,
  setOpen,
  guardianHome,
  onSave,
}: GuardianHomeDialogProps) {
  const [guardian, setGuardian] = useState<GuardianHome>(
    guardianHome || {
      contactId: '',
      contractDate: new Date().toISOString().split('T')[0],
      littersAllowed: 2,
      littersCompleted: 0,
      notes: '',
    }
  );

  useEffect(() => {
    if (guardianHome) {
      setGuardian(guardianHome);
    }
  }, [guardianHome, open]);

  const handleSave = () => {
    onSave(guardian);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guardian Home Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Guardian Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Guardian Contact Information</h3>

            <ContactSearchSelector
              value={guardian.contactId}
              onChange={(contactId) =>
                setGuardian({ ...guardian, contactId })
              }
              roles={['guardian', 'customer']}
              label="Guardian Contact"
              placeholder="Search for guardian by name, email, or phone..."
              allowCreate={true}
              required={true}
            />
          </div>

          {/* Contract Details */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Contract Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractDate">Contract Date *</Label>
                <Input
                  id="contractDate"
                  type="date"
                  value={guardian.contractDate}
                  onChange={(e) =>
                    setGuardian({ ...guardian, contractDate: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="contractDocument">Contract Document URL</Label>
                <Input
                  id="contractDocument"
                  value={guardian.contractDocument || ''}
                  onChange={(e) =>
                    setGuardian({ ...guardian, contractDocument: e.target.value })
                  }
                  placeholder="https://... or file path"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="littersAllowed">Litters Allowed</Label>
                <Input
                  id="littersAllowed"
                  type="number"
                  min="0"
                  value={guardian.littersAllowed}
                  onChange={(e) =>
                    setGuardian({
                      ...guardian,
                      littersAllowed: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total litters allowed per contract
                </p>
              </div>

              <div>
                <Label htmlFor="littersCompleted">Litters Completed</Label>
                <Input
                  id="littersCompleted"
                  type="number"
                  min="0"
                  value={guardian.littersCompleted}
                  onChange={(e) =>
                    setGuardian({
                      ...guardian,
                      littersCompleted: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Litters completed so far
                </p>
              </div>
            </div>

            {guardian.littersAllowed > 0 && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Contract Progress:</strong> {guardian.littersCompleted} of{' '}
                  {guardian.littersAllowed} litters completed
                  {guardian.littersCompleted >= guardian.littersAllowed && (
                    <span className="text-green-600 ml-2">✓ Contract Complete</span>
                  )}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={guardian.notes || ''}
                onChange={(e) =>
                  setGuardian({ ...guardian, notes: e.target.value })
                }
                placeholder="Additional notes about guardian agreement..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!guardian.contactId}>
              Save Guardian Info
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
