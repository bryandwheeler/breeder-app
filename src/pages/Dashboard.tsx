import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDogStore } from '@/store/dogStoreFirebase';
import { useWaitlistStore } from '@/store/waitlistStore';
import { useCrmStore } from '@/store/crmStore';
import { useHeatCycleStore } from '@/store/heatCycleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Dog,
  Users,
  DollarSign,
  ShoppingCart,
  Heart,
  Calendar,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { differenceInDays, addDays, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

type PreviewType =
  | 'dogs'
  | 'dams'
  | 'sires'
  | 'retired'
  | 'puppies'
  | 'forSale'
  | 'income';

export function Dashboard() {
  const navigate = useNavigate();
  const { dogs, litters } = useDogStore();
  const { waitlist } = useWaitlistStore();
  const { customers } = useCrmStore();
  const { getHeatCyclesForDog } = useHeatCycleStore();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<PreviewType | null>(null);

  // Calculate statistics and detailed data
  const stats = useMemo(() => {
    const activeDams = dogs.filter((d) => d.sex === 'female' && !d.isDeceased);
    const activeSires = dogs.filter((d) => d.sex === 'male' && !d.isDeceased);
    const retiredDogs = dogs.filter((d) => d.isDeceased);

    const allPuppies = litters.flatMap((litter) =>
      (litter.puppies || []).map((p) => ({ ...p, litter }))
    );

    const forSalePuppies = allPuppies.filter((p) => p.status === 'available');

    const thisYearLitters = litters.filter((litter) => {
      const litterDate = new Date(
        litter.dateOfBirth || litter.expectedDateOfBirth || ''
      );
      return litterDate.getFullYear() === new Date().getFullYear();
    });

    const yearlyIncome = thisYearLitters.reduce((sum, litter) => {
      const litterIncome =
        litter.puppies?.reduce((puppySum, puppy) => {
          if (puppy.status === 'sold' && puppy.salePrice) {
            return puppySum + puppy.salePrice;
          }
          return puppySum;
        }, 0) || 0;
      return sum + litterIncome;
    }, 0);

    return {
      totalDogs: dogs.filter((d) => !d.isDeceased).length,
      activeDams,
      activeSires,
      retiredDogs,
      allPuppies,
      forSalePuppies,
      yearlyIncome,
      thisYearLitters,
      eKennelVisitors: 0,
    };
  }, [dogs, litters]);

  // Calculate upcoming heats
  const upcomingHeats = useMemo(() => {
    const femaleDogs = dogs.filter((d) => d.sex === 'female' && !d.isDeceased);
    const predictions: Array<{
      dog: (typeof dogs)[0];
      lastHeat: Date;
      nextExpected: Date;
      daysUntil: number;
    }> = [];

    femaleDogs.forEach((dog) => {
      const heatCycles = getHeatCyclesForDog(dog.id);
      if (heatCycles.length > 0) {
        const sortedCycles = [...heatCycles].sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        const lastHeat = parseISO(sortedCycles[0].startDate);

        let avgCycleLength = 197;
        if (sortedCycles.length >= 2) {
          const intervals: number[] = [];
          for (let i = 0; i < sortedCycles.length - 1; i++) {
            const current = parseISO(sortedCycles[i].startDate);
            const previous = parseISO(sortedCycles[i + 1].startDate);
            intervals.push(differenceInDays(current, previous));
          }
          avgCycleLength = Math.round(
            intervals.reduce((sum, val) => sum + val, 0) / intervals.length
          );
        }

        const nextExpected = addDays(lastHeat, avgCycleLength);
        const daysUntil = differenceInDays(nextExpected, new Date());

        if (daysUntil <= 60 && daysUntil >= -30) {
          predictions.push({ dog, lastHeat, nextExpected, daysUntil });
        }
      }
    });

    return predictions.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
  }, [dogs, getHeatCyclesForDog]);

  // Calculate upcoming litters
  const upcomingLitters = useMemo(() => {
    const plannedOrPregnantLitters = litters.filter(
      (l) => l.status === 'planned' || l.status === 'pregnant'
    );

    return plannedOrPregnantLitters
      .map((litter) => {
        const dam = dogs.find((d) => d.id === litter.damId);
        const sire = dogs.find((d) => d.id === litter.sireId);
        const expectedDate = litter.expectedDateOfBirth
          ? parseISO(litter.expectedDateOfBirth)
          : null;
        const daysUntil = expectedDate
          ? differenceInDays(expectedDate, new Date())
          : null;
        return { litter, dam, sire, expectedDate, daysUntil };
      })
      .filter((item) => item.expectedDate)
      .sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0))
      .slice(0, 5);
  }, [litters, dogs]);

  const handleCardClick = (type: PreviewType, route?: string) => {
    setPreviewType(type);
    setPreviewOpen(true);
  };

  const renderPreviewContent = () => {
    switch (previewType) {
      case 'dogs':
        const activeDogs = dogs.filter((d) => !d.isDeceased);
        return (
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {activeDogs.map((dog) => (
              <Link
                key={dog.id}
                to={`/dogs/${dog.id}`}
                className='block p-3 border rounded-lg hover:bg-muted/50 transition'
                onClick={() => setPreviewOpen(false)}
              >
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-medium'>{dog.name}</p>
                    <p className='text-sm text-muted-foreground'>
                      {dog.sex === 'female' ? '♀' : '♂'} {dog.breed}
                    </p>
                  </div>
                  <Badge variant='secondary'>
                    {dog.sex === 'female' ? 'Dam' : 'Sire'}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        );

      case 'dams':
        return (
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {stats.activeDams.map((dog) => (
              <Link
                key={dog.id}
                to={`/dogs/${dog.id}`}
                className='block p-3 border rounded-lg hover:bg-muted/50 transition'
                onClick={() => setPreviewOpen(false)}
              >
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-medium'>{dog.name}</p>
                    <p className='text-sm text-muted-foreground'>{dog.breed}</p>
                  </div>
                  <Heart className='h-4 w-4 text-pink-500' />
                </div>
              </Link>
            ))}
          </div>
        );

      case 'sires':
        return (
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {stats.activeSires.map((dog) => (
              <Link
                key={dog.id}
                to={`/dogs/${dog.id}`}
                className='block p-3 border rounded-lg hover:bg-muted/50 transition'
                onClick={() => setPreviewOpen(false)}
              >
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-medium'>{dog.name}</p>
                    <p className='text-sm text-muted-foreground'>{dog.breed}</p>
                  </div>
                  <Dog className='h-4 w-4 text-sky-500' />
                </div>
              </Link>
            ))}
          </div>
        );

      case 'retired':
        return (
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {stats.retiredDogs.map((dog) => (
              <Link
                key={dog.id}
                to={`/dogs/${dog.id}`}
                className='block p-3 border rounded-lg hover:bg-muted/50 transition'
                onClick={() => setPreviewOpen(false)}
              >
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-medium'>{dog.name}</p>
                    <p className='text-sm text-muted-foreground'>
                      {dog.sex === 'female' ? '♀' : '♂'} {dog.breed}
                    </p>
                    {dog.dateOfDeath && (
                      <p className='text-xs text-muted-foreground'>
                        {format(new Date(dog.dateOfDeath), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <Badge variant='outline'>Retired</Badge>
                </div>
              </Link>
            ))}
          </div>
        );

      case 'puppies':
        return (
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {stats.allPuppies.slice(0, 20).map((puppy) => (
              <Link
                key={puppy.id}
                to={`/litters/${puppy.litter.id}`}
                className='block p-3 border rounded-lg hover:bg-muted/50 transition'
                onClick={() => setPreviewOpen(false)}
              >
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-medium'>
                      {puppy.name || puppy.tempName || 'Unnamed'}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {puppy.sex === 'female' ? '♀' : '♂'} {puppy.color}
                    </p>
                  </div>
                  <Badge
                    variant={
                      puppy.status === 'available'
                        ? 'default'
                        : puppy.status === 'reserved'
                        ? 'secondary'
                        : puppy.status === 'sold'
                        ? 'outline'
                        : 'secondary'
                    }
                  >
                    {puppy.status}
                  </Badge>
                </div>
              </Link>
            ))}
            {stats.allPuppies.length > 20 && (
              <p className='text-center text-sm text-muted-foreground'>
                And {stats.allPuppies.length - 20} more...
              </p>
            )}
          </div>
        );

      case 'forSale':
        return (
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {stats.forSalePuppies.map((puppy) => (
              <Link
                key={puppy.id}
                to={`/litters/${puppy.litter.id}`}
                className='block p-3 border rounded-lg hover:bg-muted/50 transition'
                onClick={() => setPreviewOpen(false)}
              >
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-medium'>
                      {puppy.name || puppy.tempName || 'Unnamed'}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {puppy.sex === 'female' ? '♀' : '♂'} {puppy.color}
                    </p>
                    {puppy.salePrice && (
                      <p className='text-sm font-medium text-green-600'>
                        ${puppy.salePrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <ShoppingCart className='h-4 w-4 text-green-600' />
                </div>
              </Link>
            ))}
          </div>
        );

      case 'income':
        return (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='p-4 border rounded-lg'>
                <p className='text-sm text-muted-foreground'>
                  Litters This Year
                </p>
                <p className='text-2xl font-bold'>
                  {stats.thisYearLitters.length}
                </p>
              </div>
              <div className='p-4 border rounded-lg'>
                <p className='text-sm text-muted-foreground'>Puppies Sold</p>
                <p className='text-2xl font-bold'>
                  {stats.thisYearLitters.reduce(
                    (sum, l) =>
                      sum +
                      (l.puppies?.filter((p) => p.status === 'sold').length ||
                        0),
                    0
                  )}
                </p>
              </div>
            </div>
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {stats.thisYearLitters.map((litter) => {
                const soldPuppies =
                  litter.puppies?.filter((p) => p.status === 'sold') || [];
                const litterIncome = soldPuppies.reduce(
                  (sum, p) => sum + (p.salePrice || 0),
                  0
                );
                const dam = dogs.find((d) => d.id === litter.damId);
                const sire = dogs.find((d) => d.id === litter.sireId);

                return (
                  <Link
                    key={litter.id}
                    to={`/litters/${litter.id}`}
                    className='block p-3 border rounded-lg hover:bg-muted/50 transition'
                    onClick={() => setPreviewOpen(false)}
                  >
                    <div className='flex justify-between items-start'>
                      <div>
                        <p className='font-medium'>
                          {dam?.name || 'Unknown'} × {sire?.name || 'Unknown'}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {soldPuppies.length} puppies sold
                        </p>
                      </div>
                      <p className='font-bold text-green-600'>
                        ${litterIncome.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPreviewTitle = () => {
    switch (previewType) {
      case 'dogs':
        return 'All Active Dogs';
      case 'dams':
        return 'Active Dams';
      case 'sires':
        return 'Active Sires';
      case 'retired':
        return 'Retired Dogs';
      case 'puppies':
        return 'All Puppies';
      case 'forSale':
        return 'Puppies For Sale';
      case 'income':
        return 'Yearly Income Details';
      default:
        return '';
    }
  };

  const getPreviewRoute = () => {
    switch (previewType) {
      case 'dogs':
      case 'dams':
      case 'sires':
      case 'retired':
        return '/dogs';
      case 'puppies':
      case 'forSale':
      case 'income':
        return '/litters';
      default:
        return '/';
    }
  };

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Dashboard</h1>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Total Dogs */}
        <Card
          className='bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:scale-105 transition-transform'
          onClick={() => handleCardClick('dogs')}
        >
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90 mb-1'>Total Dogs</p>
                <p className='text-4xl font-bold'>{stats.totalDogs}</p>
              </div>
              <Dog className='h-12 w-12 opacity-80' />
            </div>
          </CardContent>
        </Card>

        {/* Active Dams */}
        <Card
          className='bg-gradient-to-br from-pink-400 to-pink-500 text-white cursor-pointer hover:scale-105 transition-transform'
          onClick={() => handleCardClick('dams')}
        >
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90 mb-1'>Active Dams</p>
                <p className='text-4xl font-bold'>{stats.activeDams.length}</p>
              </div>
              <Heart className='h-12 w-12 opacity-80' />
            </div>
          </CardContent>
        </Card>

        {/* Active Sires */}
        <Card
          className='bg-gradient-to-br from-sky-400 to-sky-500 text-white cursor-pointer hover:scale-105 transition-transform'
          onClick={() => handleCardClick('sires')}
        >
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90 mb-1'>Active Sires</p>
                <p className='text-4xl font-bold'>{stats.activeSires.length}</p>
              </div>
              <Dog className='h-12 w-12 opacity-80' />
            </div>
          </CardContent>
        </Card>

        {/* Retired Dogs */}
        <Card
          className='bg-gradient-to-br from-teal-400 to-teal-500 text-white cursor-pointer hover:scale-105 transition-transform'
          onClick={() => handleCardClick('retired')}
        >
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90 mb-1'>Retired Dogs</p>
                <p className='text-4xl font-bold'>{stats.retiredDogs.length}</p>
              </div>
              <Dog className='h-12 w-12 opacity-80' />
            </div>
          </CardContent>
        </Card>

        {/* Total Puppies */}
        <Card
          className='bg-gradient-to-br from-cyan-400 to-cyan-500 text-white cursor-pointer hover:scale-105 transition-transform'
          onClick={() => handleCardClick('puppies')}
        >
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90 mb-1'>Total Puppies</p>
                <p className='text-4xl font-bold'>{stats.allPuppies.length}</p>
              </div>
              <Dog className='h-12 w-12 opacity-80' />
            </div>
          </CardContent>
        </Card>

        {/* eKennel Visitors */}
        <Card className='bg-gradient-to-br from-teal-300 to-teal-400 text-white'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90 mb-1'>eKennel Visitors</p>
                <p className='text-4xl font-bold'>{stats.eKennelVisitors}</p>
              </div>
              <Users className='h-12 w-12 opacity-80' />
            </div>
          </CardContent>
        </Card>

        {/* For Sale */}
        <Card
          className='bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:scale-105 transition-transform'
          onClick={() => handleCardClick('forSale')}
        >
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90 mb-1'>For Sale</p>
                <p className='text-4xl font-bold'>
                  {stats.forSalePuppies.length}
                </p>
              </div>
              <ShoppingCart className='h-12 w-12 opacity-80' />
            </div>
          </CardContent>
        </Card>

        {/* Yearly Income */}
        <Card
          className='bg-gradient-to-br from-emerald-400 to-emerald-500 text-white cursor-pointer hover:scale-105 transition-transform'
          onClick={() => handleCardClick('income')}
        >
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90 mb-1'>Yearly Income</p>
                <p className='text-4xl font-bold'>
                  ${stats.yearlyIncome.toLocaleString()}
                </p>
              </div>
              <DollarSign className='h-12 w-12 opacity-80' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Upcoming Heats */}
        <Card>
          <CardHeader className='bg-gradient-to-r from-orange-500 to-orange-600 text-white'>
            <CardTitle className='flex items-center gap-2'>
              <Flame className='h-5 w-5' />
              Upcoming Heats
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {upcomingHeats.length === 0 ? (
              <p className='text-center text-muted-foreground py-8'>
                No upcoming heats predicted
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dam</TableHead>
                    <TableHead>Date Of</TableHead>
                    <TableHead>Future</TableHead>
                    <TableHead>From Now</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingHeats.map(
                    ({ dog, lastHeat, nextExpected, daysUntil }) => (
                      <TableRow key={dog.id}>
                        <TableCell>
                          <Link
                            to={`/dogs/${dog.id}`}
                            className='hover:text-primary font-medium'
                          >
                            {dog.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {format(lastHeat, 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(nextExpected, 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {daysUntil > 0 ? (
                            <Badge variant='secondary'>{daysUntil} Days</Badge>
                          ) : (
                            <Badge variant='destructive'>
                              Overdue by {Math.abs(daysUntil)} Days
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Litters */}
        <Card>
          <CardHeader className='bg-gradient-to-r from-green-600 to-green-700 text-white'>
            <CardTitle className='flex items-center gap-2'>
              <Dog className='h-5 w-5' />
              Upcoming Litters
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4'>
            {upcomingLitters.length === 0 ? (
              <p className='text-center text-muted-foreground py-4'>
                You have no upcoming litters
              </p>
            ) : (
              <div className='space-y-3'>
                {upcomingLitters.map(
                  ({ litter, dam, sire, expectedDate, daysUntil }) => (
                    <Link
                      key={litter.id}
                      to={`/litters/${litter.id}`}
                      className='block p-3 border rounded-lg hover:bg-muted/50 transition'
                    >
                      <div className='flex justify-between items-start'>
                        <div>
                          <p className='font-medium'>
                            {dam?.name || 'Unknown'} × {sire?.name || 'Unknown'}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            Expected:{' '}
                            {expectedDate &&
                              format(expectedDate, 'MMM dd, yyyy')}
                          </p>
                          {litter.litterName && (
                            <p className='text-sm text-muted-foreground italic'>
                              {litter.litterName}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={daysUntil! < 0 ? 'destructive' : 'secondary'}
                        >
                          {daysUntil! < 0
                            ? `${Math.abs(daysUntil!)} days overdue`
                            : `${daysUntil} days`}
                        </Badge>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Litters Scheduler */}
      <Card>
        <CardHeader className='bg-gradient-to-r from-teal-600 to-teal-700 text-white'>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Litters Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          <p className='text-center text-muted-foreground'>
            View all litters in the{' '}
            <Link to='/litters' className='text-primary hover:underline'>
              Litters page
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{getPreviewTitle()}</DialogTitle>
          </DialogHeader>
          <div className='mt-4'>{renderPreviewContent()}</div>
          <div className='flex justify-end gap-2 mt-4'>
            <Button variant='outline' onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                navigate(getPreviewRoute());
                setPreviewOpen(false);
              }}
            >
              View All <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
