import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Pill, Bug, Stethoscope, Trash2 } from 'lucide-react';
import { Medication, Deworming, VetVisit } from '@/types/dog';
import { useDogStore } from '@/store/dogStoreFirebase';
import { format } from 'date-fns';

interface HealthTrackingProps {
  dogId: string;
  medications: Medication[];
  dewormings: Deworming[];
  vetVisits: VetVisit[];
}

export function HealthTracking({
  dogId,
  medications,
  dewormings,
  vetVisits,
}: HealthTrackingProps) {
  return (
    <div className='space-y-6'>
      <MedicationTracker dogId={dogId} medications={medications} />
      <DewormingTracker dogId={dogId} dewormings={dewormings} />
      <VetVisitTracker dogId={dogId} vetVisits={vetVisits} />
    </div>
  );
}

// Medication Tracker
function MedicationTracker({ dogId, medications }: { dogId: string; medications: Medication[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const { updateDog, dogs } = useDogStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dog = dogs.find((d) => d.id === dogId);
    if (!dog) return;

    const newMedication: Medication = {
      id: crypto.randomUUID(),
      name,
      dosage,
      frequency,
      startDate,
      endDate: endDate || undefined,
      notes: notes.trim() || undefined,
    };

    await updateDog(dogId, {
      medications: [...(dog.medications || []), newMedication],
    });

    // Reset form
    setName('');
    setDosage('');
    setFrequency('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setNotes('');
    setOpen(false);
  };

  const handleDelete = async (medId: string) => {
    const dog = dogs.find((d) => d.id === dogId);
    if (!dog) return;

    await updateDog(dogId, {
      medications: dog.medications.filter((m) => m.id !== medId),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <CardTitle className='flex items-center gap-2'>
            <Pill className='h-5 w-5' /> Medications
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size='sm'>
                <Plus className='mr-2 h-4 w-4' /> Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Medication</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <Label htmlFor='med-name'>Medication Name</Label>
                  <Input
                    id='med-name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='dosage'>Dosage</Label>
                    <Input
                      id='dosage'
                      placeholder='e.g., 10mg'
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor='frequency'>Frequency</Label>
                    <Input
                      id='frequency'
                      placeholder='e.g., 2x daily'
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='start-date'>Start Date</Label>
                    <Input
                      id='start-date'
                      type='date'
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor='end-date'>End Date (optional)</Label>
                    <Input
                      id='end-date'
                      type='date'
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor='med-notes'>Notes (optional)</Label>
                  <Textarea
                    id='med-notes'
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className='flex justify-end gap-3'>
                  <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type='submit'>Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {medications.length === 0 ? (
          <p className='text-muted-foreground text-center py-4'>No medications recorded</p>
        ) : (
          <div className='space-y-3'>
            {medications.map((med) => (
              <div key={med.id} className='border rounded-lg p-3 flex justify-between items-start'>
                <div>
                  <h4 className='font-semibold'>{med.name}</h4>
                  <p className='text-sm text-muted-foreground'>
                    {med.dosage} • {med.frequency}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {format(new Date(med.startDate), 'PPP')}
                    {med.endDate && ` - ${format(new Date(med.endDate), 'PPP')}`}
                  </p>
                  {med.notes && <p className='text-sm mt-1'>{med.notes}</p>}
                </div>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => handleDelete(med.id)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Deworming Tracker
function DewormingTracker({ dogId, dewormings }: { dogId: string; dewormings: Deworming[] }) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const { updateDog, dogs } = useDogStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dog = dogs.find((d) => d.id === dogId);
    if (!dog) return;

    const newDeworming: Deworming = {
      id: crypto.randomUUID(),
      product,
      date,
      weight: parseFloat(weight),
      nextDueDate: nextDueDate || undefined,
      notes: notes.trim() || undefined,
    };

    await updateDog(dogId, {
      dewormings: [...(dog.dewormings || []), newDeworming],
    });

    // Reset form
    setProduct('');
    setDate(new Date().toISOString().split('T')[0]);
    setWeight('');
    setNextDueDate('');
    setNotes('');
    setOpen(false);
  };

  const handleDelete = async (dewormingId: string) => {
    const dog = dogs.find((d) => d.id === dogId);
    if (!dog) return;

    await updateDog(dogId, {
      dewormings: dog.dewormings.filter((d) => d.id !== dewormingId),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <CardTitle className='flex items-center gap-2'>
            <Bug className='h-5 w-5' /> Deworming Records
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size='sm'>
                <Plus className='mr-2 h-4 w-4' /> Add Deworming
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Deworming</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <Label htmlFor='product'>Product</Label>
                  <Input
                    id='product'
                    placeholder='e.g., Panacur'
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    required
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='deworm-date'>Date Given</Label>
                    <Input
                      id='deworm-date'
                      type='date'
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor='weight'>Weight (lbs)</Label>
                    <Input
                      id='weight'
                      type='number'
                      step='0.1'
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor='next-due'>Next Due Date (optional)</Label>
                  <Input
                    id='next-due'
                    type='date'
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor='deworm-notes'>Notes (optional)</Label>
                  <Textarea
                    id='deworm-notes'
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className='flex justify-end gap-3'>
                  <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type='submit'>Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {dewormings.length === 0 ? (
          <p className='text-muted-foreground text-center py-4'>No deworming records</p>
        ) : (
          <div className='space-y-3'>
            {[...dewormings]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((dew) => (
                <div key={dew.id} className='border rounded-lg p-3 flex justify-between items-start'>
                  <div>
                    <h4 className='font-semibold'>{dew.product}</h4>
                    <p className='text-sm text-muted-foreground'>
                      {format(new Date(dew.date), 'PPP')} • {dew.weight} lbs
                    </p>
                    {dew.nextDueDate && (
                      <p className='text-sm text-muted-foreground'>
                        Next due: {format(new Date(dew.nextDueDate), 'PPP')}
                      </p>
                    )}
                    {dew.notes && <p className='text-sm mt-1'>{dew.notes}</p>}
                  </div>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => handleDelete(dew.id)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Vet Visit Tracker
function VetVisitTracker({ dogId, vetVisits }: { dogId: string; vetVisits: VetVisit[] }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [veterinarian, setVeterinarian] = useState('');
  const [clinic, setClinic] = useState('');
  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const { updateDog, dogs } = useDogStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dog = dogs.find((d) => d.id === dogId);
    if (!dog) return;

    const newVetVisit: VetVisit = {
      id: crypto.randomUUID(),
      date,
      veterinarian,
      clinic: clinic || undefined,
      reason,
      diagnosis: diagnosis || undefined,
      treatment: treatment || undefined,
      followUpDate: followUpDate || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      notes: notes.trim() || undefined,
    };

    await updateDog(dogId, {
      vetVisits: [...(dog.vetVisits || []), newVetVisit],
    });

    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setVeterinarian('');
    setClinic('');
    setReason('');
    setDiagnosis('');
    setTreatment('');
    setFollowUpDate('');
    setCost('');
    setNotes('');
    setOpen(false);
  };

  const handleDelete = async (visitId: string) => {
    const dog = dogs.find((d) => d.id === dogId);
    if (!dog) return;

    await updateDog(dogId, {
      vetVisits: dog.vetVisits.filter((v) => v.id !== visitId),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <CardTitle className='flex items-center gap-2'>
            <Stethoscope className='h-5 w-5' /> Vet Visits
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size='sm'>
                <Plus className='mr-2 h-4 w-4' /> Add Visit
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Record Vet Visit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='vet-date'>Visit Date</Label>
                    <Input
                      id='vet-date'
                      type='date'
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor='veterinarian'>Veterinarian</Label>
                    <Input
                      id='veterinarian'
                      placeholder='Dr. Smith'
                      value={veterinarian}
                      onChange={(e) => setVeterinarian(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor='clinic'>Clinic (optional)</Label>
                  <Input
                    id='clinic'
                    placeholder='Animal Hospital'
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor='reason'>Reason for Visit</Label>
                  <Input
                    id='reason'
                    placeholder='Annual checkup, vaccination, etc.'
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='diagnosis'>Diagnosis (optional)</Label>
                  <Textarea
                    id='diagnosis'
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor='treatment'>Treatment (optional)</Label>
                  <Textarea
                    id='treatment'
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='follow-up'>Follow-up Date (optional)</Label>
                    <Input
                      id='follow-up'
                      type='date'
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor='cost'>Cost (optional)</Label>
                    <Input
                      id='cost'
                      type='number'
                      step='0.01'
                      placeholder='0.00'
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor='vet-notes'>Notes (optional)</Label>
                  <Textarea
                    id='vet-notes'
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className='flex justify-end gap-3'>
                  <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type='submit'>Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {vetVisits.length === 0 ? (
          <p className='text-muted-foreground text-center py-4'>No vet visits recorded</p>
        ) : (
          <div className='space-y-3'>
            {[...vetVisits]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((visit) => (
                <div key={visit.id} className='border rounded-lg p-3 flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex justify-between items-start'>
                      <div>
                        <h4 className='font-semibold'>{visit.reason}</h4>
                        <p className='text-sm text-muted-foreground'>
                          {format(new Date(visit.date), 'PPP')} • {visit.veterinarian}
                          {visit.clinic && ` at ${visit.clinic}`}
                        </p>
                      </div>
                      {visit.cost && (
                        <span className='text-sm font-semibold'>${visit.cost.toFixed(2)}</span>
                      )}
                    </div>
                    {visit.diagnosis && (
                      <p className='text-sm mt-2'>
                        <strong>Diagnosis:</strong> {visit.diagnosis}
                      </p>
                    )}
                    {visit.treatment && (
                      <p className='text-sm mt-1'>
                        <strong>Treatment:</strong> {visit.treatment}
                      </p>
                    )}
                    {visit.followUpDate && (
                      <p className='text-sm mt-1 text-muted-foreground'>
                        Follow-up: {format(new Date(visit.followUpDate), 'PPP')}
                      </p>
                    )}
                    {visit.notes && <p className='text-sm mt-1'>{visit.notes}</p>}
                  </div>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => handleDelete(visit.id)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
