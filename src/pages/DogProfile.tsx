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
  Edit,
} from 'lucide-react';
import { PedigreeTree } from '@/components/PedigreeTree';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isFuture } from 'date-fns';
import { WeightChart } from '@/components/WeightChart';
import { WeightTracker } from '@/components/WeightTracker';
import { HealthTracking } from '@/components/HealthTracking';
import { HeatCycles } from '@/components/HeatCycles';
import {
  DnaProfileDialog,
  DnaProfileDisplay,
} from '@/components/DnaProfileDialog';
import { DnaProfile, Dog as DogType } from '@/types/dog';
import { useState, useEffect } from 'react';
import { useHeatCycleStore } from '@/store/heatCycleStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DogFormDialog } from '@/components/DogFormDialog';

export function DogProfile() {
  const { id } = useParams<{ id: string }>();
  const { dogs, updateDog } = useDogStore();
  const { subscribeToHeatCycles } = useHeatCycleStore();
  const [dnaDialogOpen, setDnaDialogOpen] = useState(false);
  const [dogFormOpen, setDogFormOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<DogType | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const dog = dogs.find((d) => d.id === id);

  // Subscribe to heat cycles when component mounts
  useEffect(() => {
    const unsubscribe = subscribeToHeatCycles();
    return () => unsubscribe();
  }, [subscribeToHeatCycles]);

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

  const handleSaveDnaProfile = async (profile: DnaProfile) => {
    await updateDog(dog.id, { dnaProfile: profile });
    setDnaDialogOpen(false);
  };

  const handleEditDog = () => {
    setEditingDog(dog);
    setDogFormOpen(true);
  };

  return (
    <div className='space-y-8 pb-20'>
      <div className='flex items-center justify-between'>
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
        <Button onClick={handleEditDog}>
          <Edit className='mr-2 h-4 w-4' /> Edit Dog
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          {dog.sex === 'female' && (
            <TabsTrigger value='heat-cycles'>Heat Cycles</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value='overview' className='space-y-8 mt-6'>
          {/* Photo Gallery */}
          {dog.photos && dog.photos.length > 0 && (
            <Card>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle>Photos</CardTitle>
                  <Button size='sm' variant='outline' onClick={handleEditDog}>
                    <Edit className='h-4 w-4 mr-1' /> Edit
                  </Button>
                </div>
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

          {/* Parents - Always show this section */}
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle className='flex items-center gap-2'>
                  <DogIcon className='h-6 w-6' /> Parents
                </CardTitle>
                <Button size='sm' variant='outline' onClick={handleEditDog}>
                  <Edit className='h-4 w-4 mr-1' /> Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Sire */}
              <div className='text-center'>
                <p className='text-sm text-muted-foreground mb-2'>
                  Sire (Father)
                </p>
                {sire ? (
                  <Link
                    to={`/dogs/${sire.id}`}
                    className='font-bold text-xl hover:text-primary transition'
                  >
                    {sire.name} {sire.callName && `("${sire.callName}")`}
                  </Link>
                ) : dog.externalSire ? (
                  <div>
                    <div className='font-bold text-xl'>
                      {dog.externalSire.name}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {dog.externalSire.registrationNumber && (
                        <div>{dog.externalSire.registrationNumber}</div>
                      )}
                      {dog.externalSire.kennelName && (
                        <div>Kennel: {dog.externalSire.kennelName}</div>
                      )}
                      {dog.externalSire.connectionStatus && (
                        <Badge
                          variant={
                            dog.externalSire.connectionStatus === 'approved'
                              ? 'default'
                              : 'secondary'
                          }
                          className='mt-2'
                        >
                          {dog.externalSire.connectionStatus === 'pending' &&
                            'Request Pending'}
                          {dog.externalSire.connectionStatus === 'approved' &&
                            'Connected'}
                          {dog.externalSire.connectionStatus === 'declined' &&
                            'Request Declined'}
                          {dog.externalSire.connectionStatus === 'cancelled' &&
                            'Request Cancelled'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className='text-muted-foreground italic'>Unknown</p>
                )}
              </div>

              {/* Dam */}
              <div className='text-center'>
                <p className='text-sm text-muted-foreground mb-2'>
                  Dam (Mother)
                </p>
                {dam ? (
                  <Link
                    to={`/dogs/${dam.id}`}
                    className='font-bold text-xl hover:text-primary transition'
                  >
                    {dam.name} {dam.callName && `("${dam.callName}")`}
                  </Link>
                ) : dog.externalDam ? (
                  <div>
                    <div className='font-bold text-xl'>
                      {dog.externalDam.name}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {dog.externalDam.registrationNumber && (
                        <div>{dog.externalDam.registrationNumber}</div>
                      )}
                      {dog.externalDam.kennelName && (
                        <div>Kennel: {dog.externalDam.kennelName}</div>
                      )}
                      {dog.externalDam.connectionStatus && (
                        <Badge
                          variant={
                            dog.externalDam.connectionStatus === 'approved'
                              ? 'default'
                              : 'secondary'
                          }
                          className='mt-2'
                        >
                          {dog.externalDam.connectionStatus === 'pending' &&
                            'Request Pending'}
                          {dog.externalDam.connectionStatus === 'approved' &&
                            'Connected'}
                          {dog.externalDam.connectionStatus === 'declined' &&
                            'Request Declined'}
                          {dog.externalDam.connectionStatus === 'cancelled' &&
                            'Request Cancelled'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className='text-muted-foreground italic'>Unknown</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle>Basic Information</CardTitle>
                  <Button size='sm' variant='outline' onClick={handleEditDog}>
                    <Edit className='h-4 w-4 mr-1' /> Edit
                  </Button>
                </div>
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
                    {dog.programStatus === 'retired' && (
                      <Badge variant='secondary'>Retired</Badge>
                    )}
                    {!dog.programStatus && 'Owned by Program'}
                  </div>
                </div>
                {dog.programStatus === 'guardian' && dog.guardianHome && (
                  <div className='pt-4 border-t space-y-2'>
                    <h4 className='font-semibold'>Guardian Home Information</h4>
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <strong>Guardian:</strong>{' '}
                        {dog.guardianHome.guardianName}
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
                        <strong>Contract Date:</strong>{' '}
                        {dog.guardianHome.contractDate}
                      </div>
                      <div className='col-span-2'>
                        <strong>Contract Progress:</strong>{' '}
                        {dog.guardianHome.littersCompleted} of{' '}
                        {dog.guardianHome.littersAllowed} litters completed
                        {dog.guardianHome.littersCompleted >=
                          dog.guardianHome.littersAllowed && (
                          <Badge variant='default' className='ml-2'>
                            Contract Complete
                          </Badge>
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
              currentUnit={
                dog.weightHistory?.[dog.weightHistory.length - 1]?.unit
              }
            />
          </div>
          <WeightChart
            weightHistory={dog.weightHistory || []}
            dogName={dog.name}
            dogId={dog.id}
          />

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
              <div className='flex justify-between items-center'>
                <CardTitle className='flex items-center gap-2'>
                  <Syringe className='h-5 w-5' /> Vaccination & Shot Records
                </CardTitle>
                <Button size='sm' variant='outline' onClick={handleEditDog}>
                  <Edit className='h-4 w-4 mr-1' /> Edit
                </Button>
              </div>
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
                  <Edit className='h-4 w-4 mr-1' />{' '}
                  {dog.dnaProfile ? 'Edit' : 'Add'} DNA Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dog.dnaProfile ? (
                <DnaProfileDisplay profile={dog.dnaProfile} />
              ) : (
                <p className='text-muted-foreground'>
                  No DNA test results recorded. Add results from services like
                  Embark Vet, Wisdom Panel, or UC Davis VGL.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pedigree Tree */}
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>5-Generation Pedigree</CardTitle>
                <Button size='sm' variant='outline' onClick={handleEditDog}>
                  <Edit className='h-4 w-4 mr-1' /> Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PedigreeTree dogId={dog.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heat Cycles Tab - Females Only */}
        {dog.sex === 'female' && (
          <TabsContent value='heat-cycles' className='mt-6'>
            <HeatCycles dogId={dog.id} dogName={dog.name} />
          </TabsContent>
        )}
      </Tabs>

      {/* DNA Profile Dialog */}
      <DnaProfileDialog
        open={dnaDialogOpen}
        setOpen={setDnaDialogOpen}
        dnaProfile={dog.dnaProfile}
        onSave={handleSaveDnaProfile}
      />

      {/* Dog Form Dialog */}
      <DogFormDialog
        open={dogFormOpen}
        setOpen={setDogFormOpen}
        dog={editingDog}
      />
    </div>
  );
}
