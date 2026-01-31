import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTaskStore, useCrmStore } from '@breeder/firebase';
import { LitterTask } from '@breeder/types';
import { toast } from '@/hooks/use-toast';
import { ContactSearchSelector } from './ContactSearchSelector';
import { Calendar, Clock, Phone, Building, Hash } from 'lucide-react';

interface AppointmentSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: LitterTask | null;
}

export function AppointmentSchedulingDialog({
  open,
  onOpenChange,
  task,
}: AppointmentSchedulingDialogProps) {
  const { updateTaskAppointment } = useTaskStore();
  const { customers } = useCrmStore();

  const [saving, setSaving] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    vetContactId: '',
    vetName: '',
    vetClinic: '',
    vetPhone: '',
    confirmationNumber: '',
  });

  // Reset form when dialog opens with a task
  useEffect(() => {
    if (open && task) {
      setAppointmentData({
        date: task.appointment?.date || '',
        time: task.appointment?.time || '',
        vetContactId: task.appointment?.vetContactId || '',
        vetName: task.appointment?.vetName || '',
        vetClinic: task.appointment?.vetClinic || '',
        vetPhone: task.appointment?.vetPhone || '',
        confirmationNumber: task.appointment?.confirmationNumber || '',
      });
    }
  }, [open, task]);

  // When vet contact is selected, populate name and phone
  useEffect(() => {
    if (appointmentData.vetContactId) {
      const contact = customers.find(c => c.id === appointmentData.vetContactId);
      if (contact) {
        setAppointmentData(prev => ({
          ...prev,
          vetName: contact.name || prev.vetName,
          vetPhone: contact.phone || prev.vetPhone,
          vetClinic: contact.tags?.find(t => t.toLowerCase().includes('clinic') || t.toLowerCase().includes('vet')) || prev.vetClinic,
        }));
      }
    }
  }, [appointmentData.vetContactId, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (!appointmentData.date) {
      toast({
        title: 'Date required',
        description: 'Please enter an appointment date.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await updateTaskAppointment(task.id, {
        date: appointmentData.date,
        time: appointmentData.time || undefined,
        vetContactId: appointmentData.vetContactId || undefined,
        vetName: appointmentData.vetName || undefined,
        vetClinic: appointmentData.vetClinic || undefined,
        vetPhone: appointmentData.vetPhone || undefined,
        confirmationNumber: appointmentData.confirmationNumber || undefined,
      });

      toast({
        title: 'Appointment scheduled',
        description: `Vet visit scheduled for ${new Date(appointmentData.date).toLocaleDateString()}${appointmentData.time ? ` at ${appointmentData.time}` : ''}.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Appointment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={appointmentData.date}
                onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={appointmentData.time}
                onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <ContactSearchSelector
              value={appointmentData.vetContactId}
              onChange={(id) => setAppointmentData({ ...appointmentData, vetContactId: id })}
              roles={['vet', 'veterinarian']}
              label="Veterinarian (from contacts)"
              placeholder="Search for vet by name..."
              allowCreate={true}
              required={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vetName">Vet Name</Label>
              <Input
                id="vetName"
                value={appointmentData.vetName}
                onChange={(e) => setAppointmentData({ ...appointmentData, vetName: e.target.value })}
                placeholder="Dr. Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vetClinic" className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" />
                Clinic
              </Label>
              <Input
                id="vetClinic"
                value={appointmentData.vetClinic}
                onChange={(e) => setAppointmentData({ ...appointmentData, vetClinic: e.target.value })}
                placeholder="Pet Care Clinic"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vetPhone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone
              </Label>
              <Input
                id="vetPhone"
                type="tel"
                value={appointmentData.vetPhone}
                onChange={(e) => setAppointmentData({ ...appointmentData, vetPhone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmationNumber" className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                Confirmation #
              </Label>
              <Input
                id="confirmationNumber"
                value={appointmentData.confirmationNumber}
                onChange={(e) => setAppointmentData({ ...appointmentData, confirmationNumber: e.target.value })}
                placeholder="APT-12345"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Schedule Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
