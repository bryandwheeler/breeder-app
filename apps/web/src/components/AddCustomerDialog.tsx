import { useState } from 'react';
import { Customer, ContactRole } from '@breeder/types';
import { useCrmStore } from '@breeder/firebase';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function AddCustomerDialog({ open, setOpen }: Props) {
  const { addCustomer } = useCrmStore();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    type: 'prospect',
    status: 'active',
    source: 'website',
    preferredContact: 'email',
    emailOptIn: true,
    smsOptIn: false,
    tags: [],
    contactRoles: [],
    notes: '',
  });

  const CONTACT_ROLE_OPTIONS: { value: ContactRole; label: string }[] = [
    { value: 'prospect', label: 'Prospect' },
    { value: 'customer', label: 'Customer' },
    { value: 'stud_job_customer', label: 'Stud Job Customer' },
    { value: 'vet', label: 'Vet' },
    { value: 'breeder', label: 'Breeder' },
    { value: 'groomer', label: 'Groomer' },
    { value: 'boarding', label: 'Boarding' },
    { value: 'trainer', label: 'Trainer' },
    { value: 'transport', label: 'Transport' },
    { value: 'walker', label: 'Walker' },
    { value: 'owner', label: 'Owner' },
    { value: 'guardian', label: 'Guardian' },
  ];

  const toggleContactRole = (role: ContactRole) => {
    const current = new Set(formData.contactRoles || []);
    if (current.has(role)) {
      current.delete(role);
    } else {
      current.add(role);
    }
    setFormData({ ...formData, contactRoles: Array.from(current) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addCustomer(
        formData as Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
      );
      setOpen(false);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        type: 'prospect',
        status: 'active',
        source: 'website',
        preferredContact: 'email',
        emailOptIn: true,
        smsOptIn: false,
        tags: [],
        contactRoles: [],
        notes: '',
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogContent className='md:max-w-2xl'>
        <ResponsiveDialogHeader onClose={() => setOpen(false)}>
          <ResponsiveDialogTitle>Add New Contact</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <h3 className='font-semibold'>Basic Information</h3>

            <div className='grid grid-cols-2 gap-4'>
              <div className='col-span-2'>
                <Label htmlFor='name'>
                  Full Name <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='name'
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='John Doe'
                />
              </div>

              <div>
                <Label htmlFor='email'>
                  Email <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='email'
                  type='email'
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder='john@example.com'
                />
              </div>

              <div>
                <Label htmlFor='phone'>Phone</Label>
                <Input
                  id='phone'
                  type='tel'
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder='(555) 123-4567'
                />
              </div>

              <div className='col-span-2'>
                <Label htmlFor='address'>Street Address</Label>
                <Input
                  id='address'
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor='city'>City</Label>
                <Input
                  id='city'
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor='state'>State</Label>
                <Input
                  id='state'
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Customer Classification */}
          <div className='space-y-4'>
            <h3 className='font-semibold'>Classification</h3>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='type'>Customer Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Customer['type']) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='prospect'>Prospect</SelectItem>
                    <SelectItem value='waitlist'>Waitlist</SelectItem>
                    <SelectItem value='buyer'>Buyer</SelectItem>
                    <SelectItem value='past_buyer'>Past Buyer</SelectItem>
                    <SelectItem value='guardian'>Guardian</SelectItem>
                    <SelectItem value='stud_client'>Stud Client</SelectItem>
                    <SelectItem value='referral_source'>
                      Referral Source
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Customer['status']) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                    <SelectItem value='archived'>Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='source'>Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      source: value as Customer['source'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='website'>Website</SelectItem>
                    <SelectItem value='referral'>Referral</SelectItem>
                    <SelectItem value='social_media'>Social Media</SelectItem>
                    <SelectItem value='event'>Event</SelectItem>
                    <SelectItem value='advertising'>Advertising</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='preferredContact'>Preferred Contact</Label>
                <Select
                  value={formData.preferredContact}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      preferredContact: value as Customer['preferredContact'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='email'>Email</SelectItem>
                    <SelectItem value='phone'>Phone</SelectItem>
                    <SelectItem value='text'>Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Contact Types</Label>
              <p className='text-xs text-muted-foreground'>
                Select all roles this contact plays (for example customer,
                guardian, vet)
              </p>
              <div className='grid grid-cols-2 gap-2'>
                {CONTACT_ROLE_OPTIONS.map((role) => (
                  <label
                    key={role.value}
                    className='flex items-center gap-2 text-sm'
                  >
                    <Checkbox
                      checked={(formData.contactRoles || []).includes(
                        role.value
                      )}
                      onCheckedChange={() => toggleContactRole(role.value)}
                    />
                    <span>{role.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea
              id='notes'
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder='Add any notes about this customer...'
            />
          </div>

          {/* Desktop Actions */}
          <div className='hidden sm:flex gap-3 justify-end pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Adding...' : 'Add Customer'}
            </Button>
          </div>
        </form>
        </ResponsiveDialogBody>
        {/* Mobile footer with action buttons */}
        <ResponsiveDialogFooter className='sm:hidden'>
          <Button
            type='button'
            variant='outline'
            className='flex-1'
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type='button'
            className='flex-1'
            disabled={loading}
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
          >
            {loading ? 'Adding...' : 'Add Customer'}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
