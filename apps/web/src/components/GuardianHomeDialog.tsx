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
  /** Dog's sex - determines which contract fields to show */
  dogSex: 'male' | 'female';
  /** Dog's date of birth - used to calculate expiry age */
  dogDateOfBirth?: string;
}

export function GuardianHomeDialog({
  open,
  setOpen,
  guardianHome,
  onSave,
  dogSex,
  dogDateOfBirth,
}: GuardianHomeDialogProps) {
  const isFemale = dogSex === 'female';

  const [guardian, setGuardian] = useState<GuardianHome>(
    guardianHome || {
      contactId: '',
      contractDate: new Date().toISOString().split('T')[0],
      // Default values based on sex
      ...(isFemale
        ? { littersAllowed: 2, littersCompleted: 0 }
        : { contractExpiryAge: 7 }),
      notes: '',
    }
  );

  // Calculate expiry date from age if dog DOB is available
  const calculateExpiryDateFromAge = (age: number) => {
    if (!dogDateOfBirth) return undefined;
    const dob = new Date(dogDateOfBirth);
    const expiryDate = new Date(dob);
    expiryDate.setFullYear(expiryDate.getFullYear() + age);
    return expiryDate.toISOString().split('T')[0];
  };

  // Calculate age from expiry date
  const calculateAgeFromExpiryDate = (expiryDateStr: string) => {
    if (!dogDateOfBirth) return undefined;
    const dob = new Date(dogDateOfBirth);
    const expiryDate = new Date(expiryDateStr);
    const ageInMs = expiryDate.getTime() - dob.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(ageInYears * 10) / 10; // Round to 1 decimal
  };

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

            {/* Dam: Litter-based contract */}
            {isFemale && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="littersAllowed">Litters Allowed</Label>
                    <Input
                      id="littersAllowed"
                      type="number"
                      min="0"
                      value={guardian.littersAllowed || 0}
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
                      value={guardian.littersCompleted || 0}
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

                {(guardian.littersAllowed || 0) > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <strong>Contract Progress:</strong> {guardian.littersCompleted || 0} of{' '}
                      {guardian.littersAllowed} litters completed
                      {(guardian.littersCompleted || 0) >= (guardian.littersAllowed || 0) && (
                        <span className="text-green-600 ml-2">✓ Contract Complete</span>
                      )}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Stud: Age/Date-based contract */}
            {!isFemale && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contractExpiryAge">Contract Expires at Age (years)</Label>
                    <Input
                      id="contractExpiryAge"
                      type="number"
                      min="1"
                      max="15"
                      step="0.5"
                      value={guardian.contractExpiryAge || ''}
                      onChange={(e) => {
                        const age = parseFloat(e.target.value) || 0;
                        setGuardian({
                          ...guardian,
                          contractExpiryAge: age,
                          contractExpiryDate: calculateExpiryDateFromAge(age),
                        });
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Age when contract expires
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="contractExpiryDate">Contract Expiry Date</Label>
                    <Input
                      id="contractExpiryDate"
                      type="date"
                      value={guardian.contractExpiryDate || ''}
                      onChange={(e) => {
                        const expiryDate = e.target.value;
                        setGuardian({
                          ...guardian,
                          contractExpiryDate: expiryDate,
                          contractExpiryAge: calculateAgeFromExpiryDate(expiryDate),
                        });
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {dogDateOfBirth ? 'Auto-calculated from age' : 'Enter expiry date'}
                    </p>
                  </div>
                </div>

                {guardian.contractExpiryDate && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <strong>Contract Status:</strong>{' '}
                      {new Date(guardian.contractExpiryDate) <= new Date() ? (
                        <span className="text-green-600">✓ Contract Complete (Expired)</span>
                      ) : (
                        <>
                          Expires on {new Date(guardian.contractExpiryDate).toLocaleDateString()}
                          {guardian.contractExpiryAge && (
                            <span className="text-muted-foreground ml-1">
                              (at age {guardian.contractExpiryAge} years)
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                )}
              </>
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
