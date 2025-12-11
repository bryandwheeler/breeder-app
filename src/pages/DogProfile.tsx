// src/pages/DogProfile.tsx – THE ULTIMATE PROFILE PAGE
import { useDogStore } from '@/store/dogStoreFirebase';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Syringe,
  Bell,
  Dog as DogIcon,
  Edit,
  Briefcase,
  Plus,
  Trash2,
  DollarSign,
  Check,
  X,
  TrendingUp,
} from 'lucide-react';
import { PedigreeTree } from '@/components/PedigreeTree';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isFuture, parseISO, addMonths, addDays, differenceInDays } from 'date-fns';
import { WeightChart } from '@/components/WeightChart';
import { WeightTracker } from '@/components/WeightTracker';
import { HealthTracking } from '@/components/HealthTracking';
import { HeatCycles } from '@/components/HeatCycles';
import {
  DnaProfileDialog,
  DnaProfileDisplay,
} from '@/components/DnaProfileDialog';
import { DnaProfile, Dog as DogType } from '@/types/dog';
import { useState, useEffect, useMemo } from 'react';
import { useHeatCycleStore } from '@/store/heatCycleStore';
import { useStudJobStore } from '@/store/studJobStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DogFormDialog } from '@/components/DogFormDialog';
import { StudJobDialog } from '@/components/StudJobDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { calculateAge, formatCurrency, cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export function DogProfile() {
  const { id } = useParams<{ id: string }>();
  const { dogs, updateDog, litters } = useDogStore();
  const { heatCycles, subscribeToHeatCycles } = useHeatCycleStore();
  const { getStudJobsForStud, deleteStudJob, subscribeToStudJobs } = useStudJobStore();
  const [dnaDialogOpen, setDnaDialogOpen] = useState(false);
  const [dogFormOpen, setDogFormOpen] = useState(false);
  const [studJobDialogOpen, setStudJobDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<DogType | null>(null);
  const [editingStudJob, setEditingStudJob] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const dog = dogs.find((d) => d.id === id);

  // Get litters for this dog (if female)
  const pendingLitters = dog?.sex === 'female'
    ? litters.filter(l => l.damId === dog.id && (l.status === 'planned' || l.status === 'pregnant'))
    : [];

  const activeLitters = dog?.sex === 'female'
    ? litters.filter(l => l.damId === dog.id && (l.status === 'born' || l.status === 'weaning' || l.status === 'ready'))
    : [];

  // Subscribe to heat cycles and stud jobs when component mounts
  useEffect(() => {
    const unsubscribeHeatCycles = subscribeToHeatCycles();
    const unsubscribeStudJobs = subscribeToStudJobs();
    return () => {
      unsubscribeHeatCycles();
      unsubscribeStudJobs();
    };
  }, [subscribeToHeatCycles, subscribeToStudJobs]);

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

  const handleEditStudJob = (job: any) => {
    setEditingStudJob(job);
    setStudJobDialogOpen(true);
  };

  const handleAddNewStudJob = () => {
    setEditingStudJob(null);
    setStudJobDialogOpen(true);
  };

  const handleDeleteStudJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this stud job?')) {
      await deleteStudJob(jobId);
    }
  };

  const studJobs = dog ? getStudJobsForStud(dog.id) : [];

  const getStatusBadge = (status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    const variants: Record<typeof status, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      pending: 'outline',
      confirmed: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateTotalFees = (job: any) => {
    let total = job.studFee || 0;

    // Add additional breeding fees
    if (job.additionalBreedingFee && job.breedings?.length > 1) {
      total += job.additionalBreedingFee * (job.breedings.length - 1);
    }

    // Add add-on fees
    if (job.addOns) {
      total += job.addOns.reduce((sum: number, addon: any) => sum + addon.cost, 0);
    }

    return total;
  };

  // Breeding Forecast Logic for Females
  const breedingForecasts = useMemo(() => {
    if (dog.sex !== 'female') return [];

    const forecasts: any[] = [];
    const timeframeMonths = 12; // Show next 12 months
    const endDate = addMonths(new Date(), timeframeMonths);

    // Get heat cycles for this dog
    const dogHeatCycles = heatCycles
      .filter((hc) => hc.dogId === dog.id && hc.startDate)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // Calculate average heat interval
    let avgInterval = 180; // Default 6 months
    if (dogHeatCycles.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < dogHeatCycles.length; i++) {
        const prev = parseISO(dogHeatCycles[i - 1].startDate);
        const curr = parseISO(dogHeatCycles[i].startDate);
        intervals.push(differenceInDays(curr, prev));
      }
      avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    }

    // Get average litter size
    const dogLitters = litters.filter(
      (litter) => litter.damId === dog.id && litter.puppies && litter.puppies.length > 0
    );
    const avgLitterSize = dogLitters.length === 0
      ? 8
      : Math.round(dogLitters.reduce((sum, litter) => sum + (litter.puppies?.length || 0), 0) / dogLitters.length);

    // Get most recent puppy price
    const sortedLitters = dogLitters.sort((a, b) => {
      const dateA = a.dateOfBirth || a.expectedDateOfBirth || '';
      const dateB = b.dateOfBirth || b.expectedDateOfBirth || '';
      return dateB.localeCompare(dateA);
    });
    let avgPrice = 3000;
    if (sortedLitters.length > 0) {
      const puppiesWithPrices = sortedLitters[0].puppies?.filter((p) => p.price && p.price > 0);
      if (puppiesWithPrices && puppiesWithPrices.length > 0) {
        avgPrice = Math.round(puppiesWithPrices.reduce((sum, p) => sum + (p.price || 0), 0) / puppiesWithPrices.length);
      }
    }

    // Determine next heat date
    let nextHeatDate: Date;
    if (dogHeatCycles.length > 0) {
      const lastHeat = parseISO(dogHeatCycles[dogHeatCycles.length - 1].startDate);
      nextHeatDate = addDays(lastHeat, avgInterval);
    } else {
      nextHeatDate = addDays(new Date(), 30); // Estimate in 30 days if no history
    }

    // Generate forecasts
    let currentHeatDate = nextHeatDate;
    let forecastIndex = 0;
    const skippedDates = dog.skippedHeatDates || [];

    while (currentHeatDate < endDate) {
      const heatDateStr = format(currentHeatDate, 'yyyy-MM-dd');
      const isSkipped = skippedDates.includes(heatDateStr);

      forecasts.push({
        id: `forecast-${forecastIndex}`,
        heatDate: currentHeatDate,
        heatDateStr,
        matingDate: addDays(currentHeatDate, 7),
        ultrasoundDate: addDays(currentHeatDate, 35),
        dueDate: addDays(currentHeatDate, 70),
        goHomeDate: addDays(currentHeatDate, 126),
        estimatedPuppies: avgLitterSize,
        pricePerPuppy: avgPrice,
        totalIncome: avgLitterSize * avgPrice,
        isEstimated: dogHeatCycles.length === 0,
        isSkipped,
      });

      currentHeatDate = addDays(currentHeatDate, avgInterval);
      forecastIndex++;
    }

    return forecasts;
  }, [dog, heatCycles, litters]);

  const handleToggleSkipHeat = async (heatDateStr: string) => {
    const skippedDates = dog.skippedHeatDates || [];
    const newSkippedDates = skippedDates.includes(heatDateStr)
      ? skippedDates.filter((d) => d !== heatDateStr)
      : [...skippedDates, heatDateStr];

    await updateDog(dog.id, { skippedHeatDates: newSkippedDates });
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
          {dog.sex === 'female' && (
            <TabsTrigger value='breeding-forecast'>Breeding Forecast</TabsTrigger>
          )}
          {dog.sex === 'male' && (
            <TabsTrigger value='stud-jobs'>Stud Jobs ({studJobs.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value='overview' className='space-y-8 mt-6'>
          {/* Active Litters - Show for females with active litters */}
          {dog.sex === 'female' && activeLitters.length > 0 && (
            <Card className='border-blue-200 bg-blue-50/50'>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle className='flex items-center gap-2'>
                    <DogIcon className='h-5 w-5 text-blue-600' />
                    Current Litters
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {activeLitters.map((litter) => {
                    const sire = dogs.find((d) => d.id === litter.sireId);
                    const puppyCount = litter.puppies?.length || 0;
                    const availableCount = litter.puppies?.filter(p => p.status === 'available').length || 0;

                    return (
                      <Link
                        key={litter.id}
                        to={`/litters/${litter.id}`}
                        className='block p-4 bg-white rounded-lg border hover:border-blue-400 hover:shadow-md transition-all'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <div className='font-semibold text-lg'>
                              {litter.litterName || `${dog.name}'s Litter`}
                            </div>
                            <div className='text-sm text-muted-foreground mt-1'>
                              Sire: {litter.externalSire?.name || sire?.name || 'Unknown'}
                            </div>
                            {litter.dateOfBirth && (
                              <div className='text-sm text-muted-foreground mt-1'>
                                Born: {format(new Date(litter.dateOfBirth), 'PPP')}
                              </div>
                            )}
                            {puppyCount > 0 && (
                              <div className='text-sm text-muted-foreground mt-1'>
                                {puppyCount} puppies ({availableCount} available)
                              </div>
                            )}
                          </div>
                          <Badge variant="default" className='bg-blue-600'>
                            {litter.status.charAt(0).toUpperCase() + litter.status.slice(1)}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Litters - Show for females with pending/pregnant litters */}
          {dog.sex === 'female' && pendingLitters.length > 0 && (
            <Card className='border-pink-200 bg-pink-50/50'>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle className='flex items-center gap-2'>
                    <Calendar className='h-5 w-5 text-pink-600' />
                    Pending Litters
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {pendingLitters.map((litter) => {
                    const sire = dogs.find((d) => d.id === litter.sireId);
                    return (
                      <Link
                        key={litter.id}
                        to={`/litters/${litter.id}`}
                        className='block p-4 bg-white rounded-lg border hover:border-pink-400 hover:shadow-md transition-all'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <div className='font-semibold text-lg'>
                              {litter.litterName || `${dog.name}'s Litter`}
                            </div>
                            <div className='text-sm text-muted-foreground mt-1'>
                              Sire: {litter.externalSire?.name || sire?.name || 'Unknown'}
                            </div>
                            {litter.expectedDateOfBirth && (
                              <div className='text-sm text-muted-foreground mt-1'>
                                Expected Due: {format(new Date(litter.expectedDateOfBirth), 'PPP')}
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={litter.status === 'pregnant' ? 'default' : 'secondary'}
                            className={litter.status === 'pregnant' ? 'bg-pink-600' : ''}
                          >
                            {litter.status === 'pregnant' ? 'Pregnant' : 'Bred'}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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
                    {dog.breedGeneration && (
                      <span className='text-sm text-muted-foreground ml-2'>
                        ({dog.breedGeneration})
                      </span>
                    )}
                  </div>
                  <div>
                    <strong>DOB:</strong> {dog.dateOfBirth}
                    <div className='text-sm text-muted-foreground'>
                      Age: {calculateAge(dog.dateOfBirth)}
                    </div>
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

                {/* Owner Information (for connected dogs from other kennels) */}
                {dog.isConnectedDog && dog.originalOwnerKennel && (
                  <div className='pt-4 border-t space-y-2'>
                    <h4 className='font-semibold'>Owner Information</h4>
                    <div className='text-sm bg-blue-50 border-l-2 border-blue-500 pl-3 py-2'>
                      <div>
                        <strong>Owner Kennel:</strong> {dog.originalOwnerKennel}
                      </div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        This dog is owned by another kennel and shared through the connection system
                      </div>
                    </div>
                  </div>
                )}

                {/* Breeding Status Section */}
                {dog.breedingStatus && (
                  <div className='pt-4 border-t space-y-2'>
                    <h4 className='font-semibold'>Breeding Status</h4>
                    <div className='space-y-2 text-sm'>
                      <div>
                        <strong>Status:</strong>{' '}
                        {dog.breedingStatus === 'future-stud' && (
                          <Badge variant='secondary'>Future Stud</Badge>
                        )}
                        {dog.breedingStatus === 'future-dam' && (
                          <Badge variant='secondary'>Future Dam</Badge>
                        )}
                        {dog.breedingStatus === 'active-stud' && (
                          <Badge variant='default' className='bg-blue-500'>Active Stud</Badge>
                        )}
                        {dog.breedingStatus === 'active-dam' && (
                          <Badge variant='default' className='bg-blue-500'>Active Dam</Badge>
                        )}
                        {dog.breedingStatus === 'retired' && (
                          <Badge variant='outline'>Retired</Badge>
                        )}
                        {dog.breedingStatus === 'pet' && (
                          <Badge variant='secondary'>Pet Quality</Badge>
                        )}
                        {dog.breedingStatus === 'guardian' && (
                          <Badge variant='secondary'>Guardian Program</Badge>
                        )}
                      </div>

                      {/* Pending Requirements for Future Studs/Dams */}
                      {(dog.breedingStatus === 'future-stud' || dog.breedingStatus === 'future-dam') &&
                       (dog.agePending || dog.healthTestsPending) && (
                        <div className='pl-4 space-y-1'>
                          <p className='font-medium text-muted-foreground'>Pending Requirements:</p>
                          {dog.agePending && (
                            <div className='flex items-center gap-2'>
                              <Badge variant='outline' className='text-xs'>Age Pending</Badge>
                              <span className='text-xs text-muted-foreground'>
                                Not yet old enough for breeding
                              </span>
                            </div>
                          )}
                          {dog.healthTestsPending && (
                            <div className='flex items-center gap-2'>
                              <Badge variant='outline' className='text-xs'>Health Tests Pending</Badge>
                              <span className='text-xs text-muted-foreground'>
                                Required health tests not complete
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Spayed/Neutered Information */}
                {dog.spayedNeutered && (
                  <div className='pt-4 border-t space-y-2'>
                    <h4 className='font-semibold'>Spayed/Neutered</h4>
                    <div className='space-y-2 text-sm'>
                      {dog.spayNeuterDate && (
                        <div>
                          <strong>Date:</strong>{' '}
                          {new Date(dog.spayNeuterDate).toLocaleDateString()}
                        </div>
                      )}
                      {dog.spayNeuterNotes && (
                        <div>
                          <strong>Notes:</strong> {dog.spayNeuterNotes}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Parents Section */}
                <div className='pt-4 border-t space-y-2'>
                  <h4 className='font-semibold'>Parents</h4>
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <strong>Sire:</strong>{' '}
                      {sire ? (
                        <Link
                          to={`/dogs/${sire.id}`}
                          className='text-primary hover:underline'
                        >
                          {sire.name}
                        </Link>
                      ) : dog.externalSire ? (
                        <span>
                          {dog.externalSire.name}
                          {dog.externalSire.kennelName && (
                            <span className='text-muted-foreground'>
                              {' '}({dog.externalSire.kennelName})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>Unknown</span>
                      )}
                    </div>
                    <div>
                      <strong>Dam:</strong>{' '}
                      {dam ? (
                        <Link
                          to={`/dogs/${dam.id}`}
                          className='text-primary hover:underline'
                        >
                          {dam.name}
                        </Link>
                      ) : dog.externalDam ? (
                        <span>
                          {dog.externalDam.name}
                          {dog.externalDam.kennelName && (
                            <span className='text-muted-foreground'>
                              {' '}({dog.externalDam.kennelName})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>Unknown</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Registration Section */}
                <div className='pt-4 border-t space-y-2'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-semibold'>Registry Information</h4>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={handleEditDog}
                      className='h-7 text-xs'
                    >
                      <Edit className='h-3 w-3 mr-1' /> Edit
                    </Button>
                  </div>
                  {dog.registrations && dog.registrations.length > 0 ? (
                    <div className='space-y-2'>
                      {dog.registrations.map((reg) => (
                        <div key={reg.id} className='text-sm border-l-2 border-primary pl-3 py-1'>
                          <div>
                            <strong>{reg.registry}:</strong> {reg.registrationNumber}
                          </div>
                          {reg.registeredName && reg.registeredName !== dog.name && (
                            <div className='text-muted-foreground'>
                              Registered as: {reg.registeredName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-sm text-muted-foreground'>
                      No registration information on file
                    </div>
                  )}
                </div>

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

        {/* Breeding Forecast Tab - Females Only */}
        {dog.sex === 'female' && (
          <TabsContent value='breeding-forecast' className='mt-6'>
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='flex items-center gap-2'>
                      <TrendingUp className='h-5 w-5' />
                      Breeding Forecast - Next 12 Months
                    </CardTitle>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Projected heat cycles and litter dates for {dog.name}. Check boxes to skip heat cycles.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {breedingForecasts.length === 0 ? (
                  <p className='text-muted-foreground text-center py-8'>
                    No heat cycles forecasted in the next 12 months
                  </p>
                ) : (
                  <div className='rounded-md border overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-12'>Breed</TableHead>
                          <TableHead>Day 1 Heat</TableHead>
                          <TableHead>Mating Date</TableHead>
                          <TableHead>Ultrasound</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Go Home</TableHead>
                          <TableHead className='text-center'># Puppies</TableHead>
                          <TableHead className='text-right'>Price/Puppy</TableHead>
                          <TableHead className='text-right'>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {breedingForecasts.map((forecast) => (
                          <TableRow
                            key={forecast.id}
                            className={cn(
                              forecast.isEstimated && 'bg-muted/30',
                              forecast.isSkipped && 'opacity-50 bg-red-50'
                            )}
                          >
                            <TableCell>
                              <Checkbox
                                checked={!forecast.isSkipped}
                                onCheckedChange={() => handleToggleSkipHeat(forecast.heatDateStr)}
                                title={forecast.isSkipped ? 'Click to breed this heat' : 'Click to skip this heat'}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                {format(forecast.heatDate, 'M/d/yy')}
                                {forecast.isEstimated && (
                                  <Badge variant='secondary' className='ml-2 text-xs'>
                                    Est.
                                  </Badge>
                                )}
                                {forecast.isSkipped && (
                                  <Badge variant='destructive' className='ml-2 text-xs'>
                                    Skipped
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{format(forecast.matingDate, 'M/d/yy')}</TableCell>
                            <TableCell>{format(forecast.ultrasoundDate, 'M/d/yy')}</TableCell>
                            <TableCell>{format(forecast.dueDate, 'M/d/yy')}</TableCell>
                            <TableCell>{format(forecast.goHomeDate, 'M/d/yy')}</TableCell>
                            <TableCell className='text-center'>
                              {forecast.estimatedPuppies}
                            </TableCell>
                            <TableCell className='text-right'>
                              {formatCurrency(forecast.pricePerPuppy)}
                            </TableCell>
                            <TableCell className='text-right font-semibold'>
                              {formatCurrency(forecast.totalIncome)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {breedingForecasts.length > 0 && (
                  <div className='mt-4 p-4 bg-muted/50 rounded-lg'>
                    <div className='text-sm text-muted-foreground space-y-1'>
                      <p>
                        <strong>Note:</strong> Forecasts are based on historical heat cycle intervals and litter sizes.
                      </p>
                      <p>
                        • Rows marked "Est." indicate estimated heat cycles (no history available)
                      </p>
                      <p>
                        • Uncheck the box to mark a heat cycle as skipped (it will be excluded from the main forecast)
                      </p>
                      <p>
                        • Dates: Mating (Day 8), Ultrasound (+35 days), Due (+70 days), Go Home (+126 days)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Stud Jobs Tab - Males Only */}
        {dog.sex === 'male' && (
          <TabsContent value='stud-jobs' className='mt-6'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <Briefcase className='h-5 w-5' /> Stud Job History
                </CardTitle>
                <Button onClick={handleAddNewStudJob}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Stud Job
                </Button>
              </CardHeader>
              <CardContent>
                {studJobs.length === 0 ? (
                  <p className='text-center text-muted-foreground py-8'>
                    No stud jobs recorded yet. Click "Add Stud Job" to track a breeding.
                  </p>
                ) : (
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Female</TableHead>
                          <TableHead>Breeder</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead>Puppies</TableHead>
                          <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studJobs.map((job) => {
                          const totalFees = calculateTotalFees(job);
                          const allBreedings = job.breedings || [];
                          const breedingDates = allBreedings.length > 0
                            ? allBreedings.map((b: any) => format(parseISO(b.date), 'MMM d')).join(', ')
                            : job.scheduledDate
                            ? `Scheduled: ${format(parseISO(job.scheduledDate), 'MMM d, yyyy')}`
                            : '-';

                          return (
                            <TableRow key={job.id}>
                              <TableCell className='font-medium'>
                                {job.femaleDogName}
                              </TableCell>
                              <TableCell>{job.breederName}</TableCell>
                              <TableCell>
                                <div className='flex flex-col'>
                                  <span className='text-sm'>{breedingDates}</span>
                                  {allBreedings.length > 1 && (
                                    <Badge variant='secondary' className='mt-1 w-fit text-xs'>
                                      {allBreedings.length} breedings
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(job.status)}</TableCell>
                              <TableCell>
                                <div className='flex flex-col gap-1'>
                                  {job.studFee ? (
                                    <span className='flex items-center gap-1 text-sm'>
                                      <DollarSign className='h-3 w-3' />
                                      {totalFees.toFixed(2)}
                                      {job.studFeePaid && job.additionalBreedingsPaid && (!job.addOns || job.addOns.every((a: any) => a.paid)) ? (
                                        <Check className='h-3 w-3 text-green-600' />
                                      ) : (
                                        <X className='h-3 w-3 text-red-600' />
                                      )}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                  {job.pickOfLitter && <Badge variant='outline' className='w-fit text-xs'>POL</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>{job.puppyCount || '-'}</TableCell>
                              <TableCell className='text-right'>
                                <div className='flex justify-end gap-2'>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleEditStudJob(job)}
                                  >
                                    <Edit className='h-4 w-4' />
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDeleteStudJob(job.id)}
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
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

      {/* Stud Job Dialog */}
      <StudJobDialog
        open={studJobDialogOpen}
        setOpen={setStudJobDialogOpen}
        preselectedStudId={dog.id}
        editingJob={editingStudJob}
      />
    </div>
  );
}
