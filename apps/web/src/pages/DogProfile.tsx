// src/pages/DogProfile.tsx – THE ULTIMATE PROFILE PAGE
import { useDogStore, useCrmStore, getGuardianContactInfo } from '@breeder/firebase';
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
import { DnaProfile, Dog as DogType } from '@breeder/types';
import { useState, useEffect, useMemo } from 'react';
import { useHeatCycleStore } from '@breeder/firebase';
import { useStudJobStore } from '@/store/studJobStore';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/scrollable-tabs';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ImageGalleryDialog } from '@/components/ImageGalleryDialog';

export function DogProfile() {
  const { id } = useParams<{ id: string }>();
  const { dogs, updateDog, litters } = useDogStore();
  const { heatCycles, subscribeToHeatCycles } = useHeatCycleStore();
  const { getStudJobsForStud, deleteStudJob, subscribeToStudJobs } = useStudJobStore();
  const { customers } = useCrmStore();
  const [dnaDialogOpen, setDnaDialogOpen] = useState(false);
  const [dogFormOpen, setDogFormOpen] = useState(false);
  const [studJobDialogOpen, setStudJobDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<DogType | null>(null);
  const [editingStudJob, setEditingStudJob] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
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

  // Breeding Forecast Logic for Females - Must be before early return!
  const breedingForecasts = useMemo(() => {
    if (!dog || dog.sex !== 'female') return [];

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

  // Early return if dog not found - must be after all hooks
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

  const studJobs = getStudJobsForStud(dog.id);

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
        <ScrollableTabsList>
          <ScrollableTabsTrigger value='overview'>Overview</ScrollableTabsTrigger>
          {dog.sex === 'female' && (
            <ScrollableTabsTrigger value='heat-cycles'>Heat Cycles</ScrollableTabsTrigger>
          )}
          {dog.sex === 'female' && (
            <ScrollableTabsTrigger value='breeding-forecast'>Breeding Forecast</ScrollableTabsTrigger>
          )}
          {dog.sex === 'male' && (
            <ScrollableTabsTrigger value='stud-jobs'>Stud Jobs ({studJobs.length})</ScrollableTabsTrigger>
          )}
        </ScrollableTabsList>

        <TabsContent value='overview' className='space-y-6 mt-6'>
          {/* Comprehensive Details Card */}
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Details</CardTitle>
                <Button size='sm' variant='outline' onClick={handleEditDog}>
                  <Edit className='h-4 w-4 mr-1' /> Edit Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Photo Gallery Thumbnails */}
              {dog.photos && dog.photos.length > 0 && (
                <div className='flex gap-2 overflow-x-auto pb-2'>
                  {dog.photos.slice(0, 5).map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`${dog.name} ${i + 1}`}
                      className='w-16 h-16 rounded-lg object-cover border-2 border-gray-200 hover:border-primary cursor-pointer transition'
                      onClick={() => {
                        setGalleryInitialIndex(i);
                        setGalleryOpen(true);
                      }}
                    />
                  ))}
                  {dog.photos.length > 5 && (
                    <button
                      onClick={() => {
                        setGalleryInitialIndex(5);
                        setGalleryOpen(true);
                      }}
                      className='w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold hover:bg-muted/80 transition cursor-pointer'
                    >
                      +{dog.photos.length - 5}
                    </button>
                  )}
                </div>
              )}

              {/* Status Badges */}
              <div className='flex flex-wrap gap-2'>
                {dog.breedingStatus && (
                  <Badge variant='default' className='text-sm px-3 py-1'>
                    {dog.breedingStatus === 'active-dam' && 'Active Breeding Dog'}
                    {dog.breedingStatus === 'active-stud' && 'Active Breeding Dog'}
                    {dog.breedingStatus === 'future-dam' && 'Future Dam'}
                    {dog.breedingStatus === 'future-stud' && 'Future Stud'}
                    {dog.breedingStatus === 'retired' && 'Retired'}
                    {dog.breedingStatus === 'pet' && 'Pet'}
                    {dog.breedingStatus === 'guardian' && 'Guardian'}
                  </Badge>
                )}
                {dog.programStatus === 'guardian' && (
                  <Badge variant='secondary' className='text-sm px-3 py-1'>Guardian</Badge>
                )}
                {dog.programStatus === 'external_stud' && (
                  <Badge variant='secondary' className='text-sm px-3 py-1'>External Stud</Badge>
                )}
                {dog.isConnectedDog && (
                  <Badge variant='outline' className='text-sm px-3 py-1'>Connected Dog</Badge>
                )}
              </div>

              {/* Primary Details Section */}
              <div>
                <h3 className='font-semibold text-lg mb-3 border-b pb-2'>Primary Details</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Name *</div>
                    <div className='font-medium'>{dog.name}</div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Call Name</div>
                    <div className='font-medium'>{dog.callName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Type *</div>
                    <div className='font-medium'>
                      {dog.breedingStatus === 'active-dam' && 'Active Breeding Dog'}
                      {dog.breedingStatus === 'active-stud' && 'Active Breeding Dog'}
                      {dog.breedingStatus === 'future-dam' && 'Future Dam'}
                      {dog.breedingStatus === 'future-stud' && 'Future Stud'}
                      {dog.breedingStatus === 'retired' && 'Retired'}
                      {dog.breedingStatus === 'pet' && 'Pet'}
                      {dog.breedingStatus === 'guardian' && 'Guardian'}
                      {!dog.breedingStatus && 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Sex *</div>
                    <div className='font-medium'>{dog.sex === 'female' ? 'Female' : 'Male'}</div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Date of Birth</div>
                    <div className='font-medium'>{dog.dateOfBirth}</div>
                  </div>
                </div>
              </div>

              {/* Additional Details Section */}
              <div>
                <div className='flex justify-between items-center mb-3 border-b pb-2'>
                  <h3 className='font-semibold text-lg'>Additional Details</h3>
                  <Button size='sm' variant='ghost' onClick={handleEditDog}>
                    <Edit className='h-3 w-3 mr-1' /> Edit All
                  </Button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Breed</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.breed || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Collar Color</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.color || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Market Status</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.marketStatus
                        ? dog.marketStatus === 'not_for_sale'
                          ? 'Not for Sale'
                          : dog.marketStatus.charAt(0).toUpperCase() + dog.marketStatus.slice(1)
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Sale Price</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.salePrice ? `$${dog.salePrice.toLocaleString()}` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Fertility</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.breedingStatus === 'retired' ? 'Retired' : dog.breedingStatus ? 'Active' : '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Size / Generation</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.breedGeneration || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Current Weight</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.weightHistory && dog.weightHistory.length > 0
                        ? `${dog.weightHistory[dog.weightHistory.length - 1].weight} ${dog.weightHistory[dog.weightHistory.length - 1].unit}`
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Color</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.color || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Color Genes</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.dnaProfile?.coatColor
                        ? Object.entries(dog.dnaProfile.coatColor)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Coat Type</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.dnaProfile?.coatType
                        ? Object.entries(dog.dnaProfile.coatType)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Microchip</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.microchip || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Registration #1</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.registrations && dog.registrations.length > 0
                        ? dog.registrations[0].registrationNumber
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Registration #2</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.registrations && dog.registrations.length > 1
                        ? dog.registrations[1].registrationNumber
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-1'>Notes</div>
                    <div className='font-medium text-muted-foreground'>
                      {dog.notes ? (dog.notes.length > 30 ? dog.notes.substring(0, 30) + '...' : dog.notes) : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Relationships Section */}
              <div>
                <h3 className='font-semibold text-lg mb-3 border-b pb-2'>Relationships</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1'>
                      <span className='text-blue-600'>♂</span> Sire - Father
                    </div>
                    {sire ? (
                      <Link
                        to={`/dogs/${sire.id}`}
                        className='flex items-center gap-2 p-2 border rounded-lg hover:bg-accent transition'
                      >
                        {sire.photos && sire.photos.length > 0 ? (
                          <img
                            src={sire.photos[0]}
                            alt={sire.name}
                            className='w-10 h-10 rounded-full object-cover'
                          />
                        ) : (
                          <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                            <DogIcon className='h-5 w-5 text-blue-600' />
                          </div>
                        )}
                        <div className='flex-1'>
                          <div className='font-medium'>{sire.name}</div>
                        </div>
                      </Link>
                    ) : dog.externalSire ? (
                      <div className='flex items-center gap-2 p-2 border rounded-lg'>
                        <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                          <DogIcon className='h-5 w-5 text-blue-600' />
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium'>{dog.externalSire.name}</div>
                          {dog.externalSire.kennelName && (
                            <div className='text-xs text-muted-foreground'>
                              {dog.externalSire.kennelName}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='text-sm text-muted-foreground p-2'>No sire information</div>
                    )}
                  </div>

                  <div>
                    <div className='text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1'>
                      <span className='text-pink-600'>♀</span> Dam - Mother
                    </div>
                    {dam ? (
                      <Link
                        to={`/dogs/${dam.id}`}
                        className='flex items-center gap-2 p-2 border rounded-lg hover:bg-accent transition'
                      >
                        {dam.photos && dam.photos.length > 0 ? (
                          <img
                            src={dam.photos[0]}
                            alt={dam.name}
                            className='w-10 h-10 rounded-full object-cover'
                          />
                        ) : (
                          <div className='w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center'>
                            <DogIcon className='h-5 w-5 text-pink-600' />
                          </div>
                        )}
                        <div className='flex-1'>
                          <div className='font-medium'>{dam.name}</div>
                        </div>
                      </Link>
                    ) : dog.externalDam ? (
                      <div className='flex items-center gap-2 p-2 border rounded-lg'>
                        <div className='w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center'>
                          <DogIcon className='h-5 w-5 text-pink-600' />
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium'>{dog.externalDam.name}</div>
                          {dog.externalDam.kennelName && (
                            <div className='text-xs text-muted-foreground'>
                              {dog.externalDam.kennelName}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='text-sm text-muted-foreground p-2'>No dam information</div>
                    )}
                  </div>
                </div>

                {/* Guardian Home - if applicable */}
                {dog.programStatus === 'guardian' && dog.guardianHome && (
                  <div className='mt-4'>
                    <div className='text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1'>
                      <span className='text-green-600'>👤</span> Owner - Primary Contact
                    </div>
                    {(() => {
                      const guardianInfo = getGuardianContactInfo(dog.guardianHome, customers);
                      return guardianInfo ? (
                        guardianInfo.id ? (
                          <Link
                            to={`/customers`}
                            className='flex items-center gap-2 p-2 border rounded-lg bg-green-50/50 hover:bg-green-100/50 transition'
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/customers?view=${guardianInfo.id}`;
                            }}
                          >
                            <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                              <span className='text-lg'>👤</span>
                            </div>
                            <div className='flex-1'>
                              <div className='font-medium text-primary'>{guardianInfo.name}</div>
                              {guardianInfo.email && (
                                <div className='text-xs text-muted-foreground'>{guardianInfo.email}</div>
                              )}
                            </div>
                          </Link>
                        ) : (
                          <div className='flex items-center gap-2 p-2 border rounded-lg bg-green-50/50'>
                            <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                              <span className='text-lg'>👤</span>
                            </div>
                            <div className='flex-1'>
                              <div className='font-medium'>{guardianInfo.name}</div>
                              {guardianInfo.email && (
                                <div className='text-xs text-muted-foreground'>{guardianInfo.email}</div>
                              )}
                            </div>
                          </div>
                        )
                      ) : (
                        <div className='flex items-center gap-2 p-2 border rounded-lg bg-green-50/50'>
                          <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                            <span className='text-lg'>👤</span>
                          </div>
                          <div className='flex-1'>
                            <div className='font-medium text-muted-foreground'>No guardian contact info</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
                    <CalendarIcon className='h-5 w-5 text-pink-600' />
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

          {/* Detailed Information Accordion */}
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Detailed Information</CardTitle>
                <Button size='sm' variant='outline' onClick={handleEditDog}>
                  <Edit className='h-4 w-4 mr-1' /> Edit Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {/* Photos Section */}
                {dog.photos && dog.photos.length > 0 && (
                  <AccordionItem value="photos">
                    <AccordionTrigger>
                      <span className='font-semibold'>Photos ({dog.photos.length})</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {dog.photos.map((photo, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setGalleryInitialIndex(i);
                              setGalleryOpen(true);
                            }}
                            className='relative group'
                          >
                            <img
                              src={photo}
                              alt={`${dog.name} ${i + 1}`}
                              className='w-full h-48 object-cover rounded-lg shadow-md hover:scale-105 transition cursor-pointer'
                            />
                            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition flex items-center justify-center'>
                              <span className='text-white opacity-0 group-hover:opacity-100 text-sm font-medium'>
                                View
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Additional Information */}
                <AccordionItem value="additional-info">
                  <AccordionTrigger>
                    <span className='font-semibold'>Additional Information</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                      <div>
                        <div className='text-muted-foreground'>Microchip</div>
                        <div className='font-medium'>{dog.microchip || '-'}</div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>Program Status</div>
                        <div className='font-medium'>
                          {dog.programStatus === 'owned' && 'Owned by Program'}
                          {dog.programStatus === 'guardian' && 'Guardian Home'}
                          {dog.programStatus === 'external_stud' && 'External Stud'}
                          {dog.programStatus === 'co-owned' && 'Co-Owned'}
                          {!dog.programStatus && 'Owned by Program'}
                        </div>
                      </div>
                      {dog.notes && (
                        <div className='col-span-2'>
                          <div className='text-muted-foreground'>Notes</div>
                          <div className='font-medium'>{dog.notes}</div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Guardian Home Information */}
                {dog.programStatus === 'guardian' && dog.guardianHome && (
                  <AccordionItem value="guardian-info">
                    <AccordionTrigger>
                      <span className='font-semibold'>Guardian Home Information</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {(() => {
                        const guardianInfo = getGuardianContactInfo(dog.guardianHome, customers);
                        return (
                          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                            <div>
                              <div className='text-muted-foreground'>Guardian Name</div>
                              {guardianInfo ? (
                                guardianInfo.id ? (
                                  <Link
                                    to={`/customers`}
                                    className='font-medium text-primary hover:underline'
                                    onClick={(e) => {
                                      e.preventDefault();
                                      window.location.href = `/customers?view=${guardianInfo.id}`;
                                    }}
                                  >
                                    {guardianInfo.name}
                                  </Link>
                                ) : (
                                  <div className='font-medium'>{guardianInfo.name}</div>
                                )
                              ) : (
                                <div className='font-medium text-muted-foreground'>-</div>
                              )}
                            </div>
                            {guardianInfo?.email && (
                              <div>
                                <div className='text-muted-foreground'>Email</div>
                                <div className='font-medium'>{guardianInfo.email}</div>
                              </div>
                            )}
                            {guardianInfo?.phone && (
                              <div>
                                <div className='text-muted-foreground'>Phone</div>
                                <div className='font-medium'>{guardianInfo.phone}</div>
                              </div>
                            )}
                            {guardianInfo?.address && (
                              <div className='col-span-2'>
                                <div className='text-muted-foreground'>Address</div>
                                <div className='font-medium'>{guardianInfo.address}</div>
                              </div>
                            )}
                            <div>
                              <div className='text-muted-foreground'>Contract Date</div>
                              <div className='font-medium'>{dog.guardianHome.contractDate}</div>
                            </div>
                            <div className='col-span-2'>
                              <div className='text-muted-foreground'>Contract Terms</div>
                              <div className='font-medium'>
                                {/* Dam: show litter-based contract */}
                                {dog.sex === 'female' && dog.guardianHome.littersAllowed != null && (
                                  <>
                                    {dog.guardianHome.littersCompleted || 0} of {dog.guardianHome.littersAllowed} litters completed
                                    {(dog.guardianHome.littersCompleted || 0) >= dog.guardianHome.littersAllowed && (
                                      <Badge variant='default' className='ml-2'>Contract Complete</Badge>
                                    )}
                                  </>
                                )}
                                {/* Stud: show age/date-based contract */}
                                {dog.sex === 'male' && (dog.guardianHome.contractExpiryDate || dog.guardianHome.contractExpiryAge) && (
                                  <>
                                    {dog.guardianHome.contractExpiryDate ? (
                                      <>
                                        Expires {new Date(dog.guardianHome.contractExpiryDate).toLocaleDateString()}
                                        {dog.guardianHome.contractExpiryAge && (
                                          <span className='text-muted-foreground ml-1'>
                                            (at age {dog.guardianHome.contractExpiryAge} years)
                                          </span>
                                        )}
                                        {new Date(dog.guardianHome.contractExpiryDate) <= new Date() && (
                                          <Badge variant='default' className='ml-2'>Contract Complete</Badge>
                                        )}
                                      </>
                                    ) : dog.guardianHome.contractExpiryAge ? (
                                      <>Expires at age {dog.guardianHome.contractExpiryAge} years</>
                                    ) : null}
                                  </>
                                )}
                                {/* Fallback for legacy data or missing contract terms */}
                                {dog.sex === 'female' && dog.guardianHome.littersAllowed == null &&
                                 !dog.guardianHome.contractExpiryDate && !dog.guardianHome.contractExpiryAge && (
                                  <span className='text-muted-foreground'>No contract terms set</span>
                                )}
                                {dog.sex === 'male' && !dog.guardianHome.contractExpiryDate &&
                                 !dog.guardianHome.contractExpiryAge && dog.guardianHome.littersAllowed == null && (
                                  <span className='text-muted-foreground'>No contract terms set</span>
                                )}
                              </div>
                            </div>
                            {dog.guardianHome.notes && (
                              <div className='col-span-2'>
                                <div className='text-muted-foreground'>Notes</div>
                                <div className='font-medium'>{dog.guardianHome.notes}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Parents & Pedigree */}
                <AccordionItem value="parents">
                  <AccordionTrigger>
                    <span className='font-semibold'>Parents & Pedigree</span>
                  </AccordionTrigger>
                  <AccordionContent className='space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                      <div>
                        <div className='text-muted-foreground'>Sire</div>
                        <div className='font-medium'>
                          {sire ? (
                            <Link to={`/dogs/${sire.id}`} className='text-primary hover:underline'>
                              {sire.name}
                            </Link>
                          ) : dog.externalSire ? (
                            <span>
                              {dog.externalSire.name}
                              {dog.externalSire.kennelName && (
                                <span className='text-muted-foreground text-xs ml-1'>
                                  ({dog.externalSire.kennelName})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className='text-muted-foreground'>Unknown</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>Dam</div>
                        <div className='font-medium'>
                          {dam ? (
                            <Link to={`/dogs/${dam.id}`} className='text-primary hover:underline'>
                              {dam.name}
                            </Link>
                          ) : dog.externalDam ? (
                            <span>
                              {dog.externalDam.name}
                              {dog.externalDam.kennelName && (
                                <span className='text-muted-foreground text-xs ml-1'>
                                  ({dog.externalDam.kennelName})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className='text-muted-foreground'>Unknown</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='pt-4'>
                      <PedigreeTree dogId={dog.id} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Registration Information */}
                <AccordionItem value="registration">
                  <AccordionTrigger>
                    <span className='font-semibold'>
                      Registry Information
                      {dog.registrations && dog.registrations.length > 0 && (
                        <span className='ml-2 text-xs text-muted-foreground'>
                          ({dog.registrations.length})
                        </span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {dog.registrations && dog.registrations.length > 0 ? (
                      <div className='space-y-3'>
                        {dog.registrations.map((reg) => (
                          <div key={reg.id} className='text-sm border-l-2 border-primary pl-3 py-2'>
                            <div className='font-semibold'>{reg.registry}</div>
                            <div className='text-muted-foreground'>#{reg.registrationNumber}</div>
                            {reg.registeredName && reg.registeredName !== dog.name && (
                              <div className='text-xs text-muted-foreground mt-1'>
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
                  </AccordionContent>
                </AccordionItem>

                {/* DNA Profile */}
                <AccordionItem value="dna">
                  <AccordionTrigger>
                    <span className='font-semibold'>DNA Profile & Genetic Testing</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {dog.dnaProfile ? (
                      <DnaProfileDisplay dnaProfile={dog.dnaProfile} />
                    ) : (
                      <div className='text-sm text-muted-foreground'>
                        No DNA profile on file.{' '}
                        <button
                          onClick={() => setDnaDialogOpen(true)}
                          className='text-primary hover:underline'
                        >
                          Add DNA Profile
                        </button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Health & Weight Tracking */}
                <AccordionItem value="health">
                  <AccordionTrigger>
                    <span className='font-semibold'>Health & Weight Tracking</span>
                  </AccordionTrigger>
                  <AccordionContent className='space-y-4'>
                    <WeightTracker dogId={dog.id} />
                    <WeightChart dogId={dog.id} />
                    <HealthTracking
                      dogId={dog.id}
                      medications={dog.medications || []}
                      dewormings={dog.dewormings || []}
                      vetVisits={dog.vetVisits || []}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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

      {/* Image Gallery Dialog */}
      {dog.photos && dog.photos.length > 0 && (
        <ImageGalleryDialog
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          images={dog.photos}
          initialIndex={galleryInitialIndex}
          title={`${dog.name}'s Photos`}
          onDelete={async (index) => {
            const newPhotos = [...dog.photos!];
            newPhotos.splice(index, 1);
            await updateDog(dog.id, { photos: newPhotos });
          }}
        />
      )}
    </div>
  );
}
