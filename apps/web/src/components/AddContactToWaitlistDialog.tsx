import { useState, useEffect } from 'react';
import { useCrmStore, useWaitlistStore } from '@breeder/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, User, Mail, Phone, Check } from 'lucide-react';
import { Customer } from '@breeder/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litterId?: string;
  litterName?: string;
  onSuccess?: () => void;
}

export function AddContactToWaitlistDialog({
  open,
  onOpenChange,
  litterId,
  litterName,
  onSuccess,
}: Props) {
  const { customers } = useCrmStore();
  const { addContactToWaitlist, waitlist } = useWaitlistStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Customer | null>(null);
  const [preferences, setPreferences] = useState({
    preferredSex: 'either' as 'male' | 'female' | 'either',
    preferredColors: [] as string[],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedContacts, setAddedContacts] = useState<string[]>([]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedContact(null);
      setPreferences({
        preferredSex: 'either',
        preferredColors: [],
        notes: '',
      });
      setAddedContacts([]);
    }
  }, [open]);

  // Filter customers based on search and exclude those already on waitlist for this litter
  const filteredCustomers = customers.filter((customer) => {
    // Search filter
    const matchesSearch =
      searchTerm === '' ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));

    // Check if already on waitlist for this specific litter
    const alreadyOnWaitlist = waitlist.some(
      (entry) =>
        entry.contactId === customer.id &&
        (litterId ? entry.assignedLitterId === litterId : !entry.assignedLitterId)
    );

    return matchesSearch && !alreadyOnWaitlist;
  });

  const handleSelectContact = (customer: Customer) => {
    setSelectedContact(customer);
  };

  const handleAddToWaitlist = async () => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    try {
      await addContactToWaitlist(selectedContact.id, litterId, preferences);
      setAddedContacts((prev) => [...prev, selectedContact.id]);
      setSelectedContact(null);
      setPreferences({
        preferredSex: 'either',
        preferredColors: [],
        notes: '',
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to add contact to waitlist:', error);
      alert('Failed to add contact to waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadyAdded = (customerId: string) =>
    addedContacts.includes(customerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Contact to Waitlist
            {litterName && (
              <Badge variant="secondary" className="ml-2">
                {litterName}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
            {/* Contact List */}
            <div className="overflow-y-auto border rounded-lg p-2 space-y-1">
              <p className="text-xs text-muted-foreground px-2 py-1">
                {filteredCustomers.length} contacts available
              </p>
              {filteredCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No contacts found
                </p>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectContact(customer)}
                    disabled={isAlreadyAdded(customer.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedContact?.id === customer.id
                        ? 'bg-primary/10 border-primary border'
                        : isAlreadyAdded(customer.id)
                        ? 'bg-green-50 dark:bg-green-900/20 cursor-not-allowed'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          {customer.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                      {isAlreadyAdded(customer.id) && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    {customer.contactRoles && customer.contactRoles.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {customer.contactRoles.slice(0, 3).map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Preferences Form */}
            <div className="border rounded-lg p-4 space-y-4">
              {selectedContact ? (
                <>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{selectedContact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedContact.email}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="preferredSex">Preferred Sex</Label>
                      <Select
                        value={preferences.preferredSex}
                        onValueChange={(value) =>
                          setPreferences({
                            ...preferences,
                            preferredSex: value as 'male' | 'female' | 'either',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="either">Either</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={preferences.notes}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Any additional notes about this prospect..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToWaitlist}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Adding...' : 'Add to Waitlist'}
                  </Button>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Select a contact to add to the waitlist
                </div>
              )}
            </div>
          </div>

          {addedContacts.length > 0 && (
            <div className="text-sm text-green-600 flex items-center gap-2">
              <Check className="h-4 w-4" />
              {addedContacts.length} contact(s) added to waitlist
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
