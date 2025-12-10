// src/pages/LitterForecast.tsx
import { useState, useMemo } from 'react';
import { useDogStore } from '@/store/dogStoreFirebase';
import { useHeatCycleStore } from '@/store/heatCycleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Edit, TrendingUp } from 'lucide-react';
import { addMonths, addDays, format, parseISO, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface ForecastedLitter {
  id: string;
  dogId: string;
  dogName: string;
  day1Heat: Date | null;
  matingDate: Date | null;
  ultrasoundDate: Date | null;
  dueDate: Date | null;
  goHomeDate: Date | null;
  estimatedPuppies: number;
  pricePerPuppy: number;
  totalIncome: number;
  isEstimated: boolean;
  heatCycleId?: string;
}

export function LitterForecast() {
  const { dogs, litters } = useDogStore();
  const { heatCycles } = useHeatCycleStore();
  const [timeframeMonths, setTimeframeMonths] = useState(12);
  const [editingForecast, setEditingForecast] = useState<{ [key: string]: Partial<ForecastedLitter> }>({});

  // Get breeding-capable females
  const breedingFemales = dogs.filter(
    (dog) =>
      dog.sex === 'female' &&
      !dog.isDeceased &&
      dog.breedingStatus !== 'retired' &&
      dog.breedingStatus !== 'pet' &&
      !dog.spayedNeutered
  );

  // Calculate average heat cycle interval for each dog
  const getAverageHeatInterval = (dogId: string): number => {
    const dogHeatCycles = heatCycles
      .filter((hc) => hc.dogId === dogId && hc.startDate)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    if (dogHeatCycles.length < 2) {
      return 180; // Default to 6 months if no history
    }

    const intervals: number[] = [];
    for (let i = 1; i < dogHeatCycles.length; i++) {
      const prev = parseISO(dogHeatCycles[i - 1].startDate);
      const curr = parseISO(dogHeatCycles[i].startDate);
      intervals.push(differenceInDays(curr, prev));
    }

    return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
  };

  // Get average litter size for each dog
  const getAverageLitterSize = (dogId: string): number => {
    const dogLitters = litters.filter(
      (litter) => litter.damId === dogId && litter.puppies && litter.puppies.length > 0
    );

    if (dogLitters.length === 0) {
      return 8; // Default estimate
    }

    const totalPuppies = dogLitters.reduce((sum, litter) => sum + (litter.puppies?.length || 0), 0);
    return Math.round(totalPuppies / dogLitters.length);
  };

  // Get most recent puppy price for each dog
  const getMostRecentPuppyPrice = (dogId: string): number => {
    const dogLitters = litters
      .filter((litter) => litter.damId === dogId && litter.puppies)
      .sort((a, b) => {
        const dateA = a.dateOfBirth || a.expectedDateOfBirth || '';
        const dateB = b.dateOfBirth || b.expectedDateOfBirth || '';
        return dateB.localeCompare(dateA);
      });

    if (dogLitters.length === 0) {
      return 3000; // Default price
    }

    const mostRecentLitter = dogLitters[0];
    const puppiesWithPrices = mostRecentLitter.puppies?.filter((p) => p.price && p.price > 0);

    if (!puppiesWithPrices || puppiesWithPrices.length === 0) {
      return 3000;
    }

    const avgPrice = puppiesWithPrices.reduce((sum, p) => sum + (p.price || 0), 0) / puppiesWithPrices.length;
    return Math.round(avgPrice);
  };

  // Generate forecasted litters
  const forecastedLitters = useMemo(() => {
    const forecasts: ForecastedLitter[] = [];
    const endDate = addMonths(new Date(), timeframeMonths);

    breedingFemales.forEach((dog) => {
      const avgInterval = getAverageHeatInterval(dog.id);
      const avgLitterSize = getAverageLitterSize(dog.id);
      const avgPrice = getMostRecentPuppyPrice(dog.id);

      // Get the most recent heat cycle
      const dogHeatCycles = heatCycles
        .filter((hc) => hc.dogId === dog.id && hc.startDate)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      let nextHeatDate: Date;
      if (dogHeatCycles.length > 0) {
        const lastHeat = parseISO(dogHeatCycles[0].startDate);
        nextHeatDate = addDays(lastHeat, avgInterval);
      } else {
        // No heat cycle history, estimate based on age
        nextHeatDate = addDays(new Date(), 30); // Start in a month
      }

      // Generate forecasts until we reach the end date
      let currentHeatDate = nextHeatDate;
      let forecastIndex = 0;

      while (currentHeatDate < endDate) {
        const matingDate = addDays(currentHeatDate, 7); // Day 8-14 typically
        const ultrasoundDate = addDays(matingDate, 28); // ~4 weeks after mating
        const dueDate = addDays(matingDate, 63); // ~63 days gestation
        const goHomeDate = addDays(dueDate, 56); // 8 weeks after birth

        const forecastId = `${dog.id}-forecast-${forecastIndex}`;
        const edited = editingForecast[forecastId] || {};

        forecasts.push({
          id: forecastId,
          dogId: dog.id,
          dogName: dog.name,
          day1Heat: currentHeatDate,
          matingDate,
          ultrasoundDate,
          dueDate,
          goHomeDate,
          estimatedPuppies: edited.estimatedPuppies ?? avgLitterSize,
          pricePerPuppy: edited.pricePerPuppy ?? avgPrice,
          totalIncome: (edited.estimatedPuppies ?? avgLitterSize) * (edited.pricePerPuppy ?? avgPrice),
          isEstimated: dogHeatCycles.length === 0,
          ...edited,
        });

        currentHeatDate = addDays(currentHeatDate, avgInterval);
        forecastIndex++;
      }
    });

    return forecasts.sort((a, b) => {
      if (!a.day1Heat || !b.day1Heat) return 0;
      return a.day1Heat.getTime() - b.day1Heat.getTime();
    });
  }, [breedingFemales, heatCycles, timeframeMonths, editingForecast]);

  const totalProjectedIncome = forecastedLitters.reduce((sum, f) => sum + f.totalIncome, 0);
  const totalProjectedPuppies = forecastedLitters.reduce((sum, f) => sum + f.estimatedPuppies, 0);

  const updateForecast = (forecastId: string, field: keyof ForecastedLitter, value: any) => {
    setEditingForecast((prev) => {
      const current = prev[forecastId] || {};
      const updated = { ...current, [field]: value };

      // Recalculate total if puppies or price changed
      if (field === 'estimatedPuppies' || field === 'pricePerPuppy') {
        const puppies = field === 'estimatedPuppies' ? value : (updated.estimatedPuppies ?? 8);
        const price = field === 'pricePerPuppy' ? value : (updated.pricePerPuppy ?? 3000);
        updated.totalIncome = puppies * price;
      }

      return { ...prev, [forecastId]: updated };
    });
  };

  return (
    <div className='container mx-auto py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Litter Forecast & Income Planning</h1>
          <p className='text-muted-foreground'>
            Project future litters and income based on heat cycle history
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Label>Timeframe:</Label>
            <Input
              type='number'
              value={timeframeMonths}
              onChange={(e) => setTimeframeMonths(parseInt(e.target.value) || 12)}
              className='w-20'
              min={1}
              max={36}
            />
            <span className='text-sm'>months</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Projected Litters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{forecastedLitters.length}</div>
            <p className='text-xs text-muted-foreground'>
              in next {timeframeMonths} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />
              Total Puppies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalProjectedPuppies}</div>
            <p className='text-xs text-muted-foreground'>estimated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <DollarSign className='h-4 w-4' />
              Projected Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(totalProjectedIncome)}</div>
            <p className='text-xs text-muted-foreground'>
              {formatCurrency(totalProjectedIncome / timeframeMonths)}/month avg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>Litter Schedule Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dog Name</TableHead>
                  <TableHead>Day 1 Heat</TableHead>
                  <TableHead>Mating Date</TableHead>
                  <TableHead>Ultrasound Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Go Home Date</TableHead>
                  <TableHead className='text-center'># of Puppies</TableHead>
                  <TableHead className='text-right'>Price/Puppy</TableHead>
                  <TableHead className='text-right'>Total Income</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastedLitters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className='text-center text-muted-foreground py-8'>
                      No breeding females or insufficient heat cycle data to generate forecasts
                    </TableCell>
                  </TableRow>
                ) : (
                  forecastedLitters.map((forecast) => (
                    <TableRow key={forecast.id} className={forecast.isEstimated ? 'bg-muted/30' : ''}>
                      <TableCell className='font-medium'>
                        {forecast.dogName}
                        {forecast.isEstimated && (
                          <Badge variant='secondary' className='ml-2 text-xs'>
                            Estimated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {forecast.day1Heat ? format(forecast.day1Heat, 'M/d/yy') : '-'}
                      </TableCell>
                      <TableCell>
                        {forecast.matingDate ? format(forecast.matingDate, 'M/d/yy') : '-'}
                      </TableCell>
                      <TableCell>
                        {forecast.ultrasoundDate ? format(forecast.ultrasoundDate, 'M/d/yy') : '-'}
                      </TableCell>
                      <TableCell>
                        {forecast.dueDate ? format(forecast.dueDate, 'M/d/yy') : '-'}
                      </TableCell>
                      <TableCell>
                        {forecast.goHomeDate ? format(forecast.goHomeDate, 'M/d/yy') : '-'}
                      </TableCell>
                      <TableCell className='text-center'>
                        <Input
                          type='number'
                          value={forecast.estimatedPuppies}
                          onChange={(e) =>
                            updateForecast(forecast.id, 'estimatedPuppies', parseInt(e.target.value) || 0)
                          }
                          className='w-16 text-center'
                          min={1}
                          max={15}
                        />
                      </TableCell>
                      <TableCell className='text-right'>
                        <Input
                          type='number'
                          value={forecast.pricePerPuppy}
                          onChange={(e) =>
                            updateForecast(forecast.id, 'pricePerPuppy', parseInt(e.target.value) || 0)
                          }
                          className='w-24 text-right'
                          min={0}
                          step={100}
                        />
                      </TableCell>
                      <TableCell className='text-right font-semibold'>
                        {formatCurrency(forecast.totalIncome)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {forecastedLitters.length > 0 && (
            <div className='mt-4 p-4 bg-muted/50 rounded-lg'>
              <div className='text-sm text-muted-foreground space-y-1'>
                <p>
                  <strong>Note:</strong> Forecasts are based on historical heat cycle intervals and litter sizes.
                </p>
                <p>
                  • Rows marked "Estimated" indicate dogs with no heat cycle history (using 6-month default interval)
                </p>
                <p>
                  • You can edit the number of puppies and price per puppy for each forecasted litter
                </p>
                <p>
                  • Dates are calculated as: Mating (Day 8), Ultrasound (+28 days), Due (+63 days), Go Home (+56 days)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
