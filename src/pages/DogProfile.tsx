// src/pages/DogProfile.tsx – THE ULTIMATE PROFILE PAGE
import { useDogStore } from '@/store/dogStoreFirebase';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Syringe,
  Bell,
  Dog as DogIcon,
  Heart,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { PedigreeTree } from '@/components/PedigreeTree';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isFuture, addDays } from 'date-fns';
import { WeightChart } from '@/components/WeightChart';
import { WeightTracker } from '@/components/WeightTracker';
import { HealthTracking } from '@/components/HealthTracking';
import { HeatCycleDialog } from '@/components/HeatCycleDialog';
import { DnaProfileDialog, DnaProfileDisplay } from '@/components/DnaProfileDialog';
import { HeatCycle, DnaProfile } from '@/types/dog';
import { useState } from 'react';

export function DogProfile() {
  const { id } = useParams<{ id: string }>();
  const { dogs, updateDog } = useDogStore();
  const [heatDialogOpen, setHeatDialogOpen] = useState(false);
  const [editingHeatCycle, setEditingHeatCycle] = useState<HeatCycle | null>(null);
  const [dnaDialogOpen, setDnaDialogOpen] = useState(false);
  const dog = dogs.find((d) => d.id === id);

  if (!dog) {
    return (
      <div className='container mx-auto py-20 text-center'>
        <h1 className='text-3xl font-bold mb-4'>Dog not found</h1>
        <Link to='/'>
          <Button>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Dogs
          </Button>
        </Link>
      </div>
    );
  }

  const sire = dogs.find((d) => d.id === dog.sireId);
  const dam = dogs.find((d) => d.id === dog.damId);

  const upcomingReminders =
    dog.reminders?.filter((r) => isFuture(new Date(r.date))) || [];
  const overdueShots =
    dog.shotRecords?.filter((s) => s.dueDate && isPast(new Date(s.dueDate))) ||
    [];
  const males = dogs.filter((d) => d.sex === 'male');

  const handleAddHeatCycle = () => {
    setEditingHeatCycle(null);
    setHeatDialogOpen(true);
  };

  const handleEditHeatCycle = (hc: HeatCycle) => {
    setEditingHeatCycle(hc);
    setHeatDialogOpen(true);
  };

  const handleSaveHeatCycle = async (hc: HeatCycle) => {
    const cycles = dog.heatCycles || [];
    let updated: HeatCycle[];
    if (editingHeatCycle) {
      updated = cycles.map((c) => (c.id === hc.id ? hc : c));
    } else {
      updated = [...cycles, hc];
    }
    await updateDog(dog.id, { heatCycles: updated });
    setHeatDialogOpen(false);
  };

  const handleDeleteHeatCycle = async (hcId: string) => {
    if (!confirm('Delete this heat cycle record?')) return;
    const updated = (dog.heatCycles || []).filter((c) => c.id !== hcId);
    await updateDog(dog.id, { heatCycles: updated });
  };

  const handleSaveDnaProfile = async (profile: DnaProfile) => {
    await updateDog(dog.id, { dnaProfile: profile });
    setDnaDialogOpen(false);
  };

  // Calculate next expected heat (avg ~6 months from last)
  const lastHeat = dog.heatCycles?.sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )[0];
  const nextExpectedHeat = lastHeat ? addDays(new Date(lastHeat.startDate), 180) : null;

  return (
    <div className='space-y-8 pb-20'>
      <div className='flex items-center gap-4'>
        <Link to='/'>
          <Button variant='outline'>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
        </Link>
        <h1 className='text-4xl font-bold'>{dog.name}</h1>
        {overdueShots.length > 0 && (
          <Badge variant='destructive' className='text-lg px-4'>
            Shots Overdue!
          </Badge>
        )}
      </div>

      {/* Photo Gallery */}
      {dog.photos && dog.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {dog.photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`${dog.name} ${i + 1}`}
                  className='w-full h-64 object-cover rounded-lg shadow-md hover:scale-105 transition'
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parents */}
      {(sire || dam) && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <DogIcon className='h-6 w-6' /> Parents
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {sire && (
              <div className='text-center'>
                <p className='text-sm text-muted-foreground mb-2'>
                  Sire (Father)
                </p>
                <Link
                  to={`/dogs/${sire.id}`}
                  className='font-bold text-xl hover:text-primary transition'
                >
                  {sire.name} {sire.callName && `("${sire.callName}")`}
                </Link>
              </div>
            )}
            {dam && (
              <div className='text-center'>
                <p className='text-sm text-muted-foreground mb-2'>
                  Dam (Mother)
                </p>
                <Link
                  to={`/dogs/${dam.id}`}
                  className='font-bold text-xl hover:text-primary transition'
                >
                  {dam.name} {dam.callName && `("${dam.callName}")`}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <strong>Call Name:</strong> {dog.callName || '-'}
              </div>
              <div>
                <strong>Sex:</strong>{' '}
                {dog.sex === 'female' ? '♀ Female' : '♂ Male'}
              </div>
              <div>
                <strong>Breed:</strong> {dog.breed}
              </div>
              <div>
                <strong>DOB:</strong> {dog.dateOfBirth}
              </div>
              <div>
                <strong>Color:</strong> {dog.color || '-'}
              </div>
              <div>
                <strong>Microchip:</strong> {dog.microchip || '-'}
              </div>
              <div className='col-span-2'>
                <strong>Program Status:</strong>{' '}
                {dog.programStatus === 'owned' && 'Owned by Program'}
                {dog.programStatus === 'guardian' && 'Guardian Home'}
                {dog.programStatus === 'external_stud' && 'External Stud'}
                {dog.programStatus === 'co-owned' && 'Co-Owned'}
                {!dog.programStatus && 'Owned by Program'}
              </div>
            </div>
            {dog.programStatus === 'guardian' && dog.guardianHome && (
              <div className='pt-4 border-t space-y-2'>
                <h4 className='font-semibold'>Guardian Home Information</h4>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <strong>Guardian:</strong> {dog.guardianHome.guardianName}
                  </div>
                  {dog.guardianHome.email && (
                    <div>
                      <strong>Email:</strong> {dog.guardianHome.email}
                    </div>
                  )}
                  {dog.guardianHome.phone && (
                    <div>
                      <strong>Phone:</strong> {dog.guardianHome.phone}
                    </div>
                  )}
                  <div>
                    <strong>Contract Date:</strong> {dog.guardianHome.contractDate}
                  </div>
                  <div className='col-span-2'>
                    <strong>Contract Progress:</strong>{' '}
                    {dog.guardianHome.littersCompleted} of {dog.guardianHome.littersAllowed} litters completed
                    {dog.guardianHome.littersCompleted >= dog.guardianHome.littersAllowed && (
                      <Badge variant='default' className='ml-2'>Contract Complete</Badge>
                    )}
                  </div>
                  {dog.guardianHome.address && (
                    <div className='col-span-2'>
                      <strong>Address:</strong> {dog.guardianHome.address}
                    </div>
                  )}
                  {dog.guardianHome.notes && (
                    <div className='col-span-2'>
                      <strong>Notes:</strong> {dog.guardianHome.notes}
                    </div>
                  )}
                </div>
              </div>
            )}
            {dog.notes && (
              <div className='pt-4 border-t'>
                <strong>Notes:</strong> {dog.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5' /> Upcoming Reminders
              {upcomingReminders.length > 0 && (
                <Badge variant='default'>{upcomingReminders.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length === 0 ? (
              <p className='text-muted-foreground'>No upcoming reminders</p>
            ) : (
              <div className='space-y-2'>
                {upcomingReminders.map((r) => (
                  <div
                    key={r.id}
                    className='flex items-center justify-between p-2 bg-muted/50 rounded'
                  >
                    <div>
                      <div className='font-medium'>{r.title}</div>
                      {r.notes && (
                        <div className='text-sm text-muted-foreground'>
                          {r.notes}
                        </div>
                      )}
                    </div>
                    <div className='text-sm'>
                      {format(new Date(r.date), 'PPP')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weight Tracking */}
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-2xl font-bold'>Weight History</h2>
        <WeightTracker
          dogId={dog.id}
          currentUnit={dog.weightHistory?.[dog.weightHistory.length - 1]?.unit}
        />
      </div>
      <WeightChart weightHistory={dog.weightHistory || []} dogName={dog.name} dogId={dog.id} />

      {/* Enhanced Health Tracking */}
      <div className='mt-8'>
        <h2 className='text-2xl font-bold mb-4'>Health Records</h2>
        <HealthTracking
          dogId={dog.id}
          medications={dog.medications || []}
          dewormings={dog.dewormings || []}
          vetVisits={dog.vetVisits || []}
        />
      </div>

      {/* Shot Records */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Syringe className='h-5 w-5' /> Vaccination & Shot Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dog.shotRecords?.length === 0 ? (
            <p className='text-muted-foreground'>No shot records entered</p>
          ) : (
            <div className='grid gap-3'>
              {dog.shotRecords?.map((shot) => (
                <div
                  key={shot.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div>
                    <div className='font-medium'>{shot.vaccine}</div>
                    <div className='text-sm text-muted-foreground'>
                      Given: {format(new Date(shot.dateGiven), 'PPP')}
                    </div>
                    {shot.notes && (
                      <div className='text-sm italic'>{shot.notes}</div>
                    )}
                  </div>
                  {shot.dueDate && (
                    <Badge
                      variant={
                        isPast(new Date(shot.dueDate))
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      Due: {format(new Date(shot.dueDate), 'PPP')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNA Profile */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' /> DNA Profile & Genetic Testing
            </CardTitle>
            <Button size='sm' onClick={() => setDnaDialogOpen(true)}>
              <Edit className='h-4 w-4 mr-1' /> {dog.dnaProfile ? 'Edit' : 'Add'} DNA Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dog.dnaProfile ? (
            <DnaProfileDisplay profile={dog.dnaProfile} />
          ) : (
            <p className='text-muted-foreground'>
              No DNA test results recorded. Add results from services like Embark Vet, Wisdom Panel, or UC Davis VGL.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Heat Cycle Tracking - Females Only */}
      {dog.sex === 'female' && (
        <Card>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <CardTitle className='flex items-center gap-2'>
                <Heart className='h-5 w-5' /> Heat Cycle History
              </CardTitle>
              <Button size='sm' onClick={handleAddHeatCycle}>
                <Plus className='h-4 w-4 mr-1' /> Record Heat
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {nextExpectedHeat && (
              <div className='mb-4 p-3 bg-muted rounded-lg'>
                <strong>Next Expected Heat:</strong> ~{format(nextExpectedHeat, 'PPP')}
                <span className='text-sm text-muted-foreground ml-2'>(based on 6-month avg)</span>
              </div>
            )}
            {(dog.heatCycles || []).length === 0 ? (
              <p className='text-muted-foreground'>No heat cycles recorded</p>
            ) : (
              <div className='space-y-3'>
                {(dog.heatCycles || [])
                  .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                  .map((hc) => {
                    const sireName = hc.sireId ? dogs.find((d) => d.id === hc.sireId)?.name : null;
                    return (
                      <div key={hc.id} className='flex justify-between items-start p-3 border rounded-lg'>
                        <div>
                          <div className='font-medium'>
                            {format(new Date(hc.startDate), 'PPP')}
                            {hc.endDate && ` - ${format(new Date(hc.endDate), 'PPP')}`}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Intensity: {hc.intensity || 'normal'}
                          </div>
                          {hc.bred && (
                            <Badge variant='secondary' className='mt-1'>
                              Bred {sireName && `with ${sireName}`}
                            </Badge>
                          )}
                          {hc.notes && <div className='text-sm mt-1'>{hc.notes}</div>}
                        </div>
                        <div className='flex gap-2'>
                          <Button size='sm' variant='outline' onClick={() => handleEditHeatCycle(hc)}>
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button size='sm' variant='destructive' onClick={() => handleDeleteHeatCycle(hc.id)}>
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pedigree Tree */}
      <Card>
        <CardHeader>
          <CardTitle>5-Generation Pedigree</CardTitle>
        </CardHeader>
        <CardContent>
          <PedigreeTree dogId={dog.id} />
        </CardContent>
      </Card>

      {/* Heat Cycle Dialog */}
      {dog.sex === 'female' && (
        <HeatCycleDialog
          open={heatDialogOpen}
          setOpen={setHeatDialogOpen}
          heatCycle={editingHeatCycle}
          males={males}
          onSave={handleSaveHeatCycle}
        />
      )}

      {/* DNA Profile Dialog */}
      <DnaProfileDialog
        open={dnaDialogOpen}
        setOpen={setDnaDialogOpen}
        dnaProfile={dog.dnaProfile}
        onSave={handleSaveDnaProfile}
      />
    </div>
  );
}
