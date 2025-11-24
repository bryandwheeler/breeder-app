import { WeightEntry } from '@/types/dog';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useDogStore } from '@/store/dogStoreFirebase';
import { WeightTracker } from '@/components/WeightTracker';

interface WeightChartProps {
  weightHistory: WeightEntry[];
  dogName: string;
  dogId: string;
}

export function WeightChart({ weightHistory, dogName, dogId }: WeightChartProps) {
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const { updateDog, dogs } = useDogStore();

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) return;

    const dog = dogs.find((d) => d.id === dogId);
    if (!dog) return;

    const updatedWeightHistory = dog.weightHistory.filter((w) => w.id !== entryId);
    await updateDog(dogId, { weightHistory: updatedWeightHistory });
  };

  if (!weightHistory || weightHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-center py-8'>
            No weight entries yet. Add weights to see growth trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Convert weights to selected unit and sort by date
  const convertWeight = (weight: number, fromUnit: 'lbs' | 'kg'): number => {
    if (fromUnit === unit) return weight;
    if (unit === 'kg') return weight * 0.453592; // lbs to kg
    return weight * 2.20462; // kg to lbs
  };

  const chartData = [...weightHistory]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
      date: format(new Date(entry.date), 'MMM dd, yyyy'),
      weight: parseFloat(convertWeight(entry.weight, entry.unit).toFixed(1)),
      notes: entry.notes,
    }));

  const currentWeight = chartData[chartData.length - 1]?.weight || 0;
  const startWeight = chartData[0]?.weight || 0;
  const weightGain = currentWeight - startWeight;
  const percentGain = startWeight > 0 ? ((weightGain / startWeight) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <CardTitle>Weight History - {dogName}</CardTitle>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant={unit === 'lbs' ? 'default' : 'outline'}
              onClick={() => setUnit('lbs')}
            >
              lbs
            </Button>
            <Button
              size='sm'
              variant={unit === 'kg' ? 'default' : 'outline'}
              onClick={() => setUnit('kg')}
            >
              kg
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Stats Summary */}
        <div className='grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg'>
          <div className='text-center'>
            <div className='text-2xl font-bold'>{currentWeight}</div>
            <div className='text-sm text-muted-foreground'>Current ({unit})</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold'>
              {weightGain > 0 ? '+' : ''}
              {weightGain.toFixed(1)}
            </div>
            <div className='text-sm text-muted-foreground'>Gain ({unit})</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold'>
              {percentGain}%
            </div>
            <div className='text-sm text-muted-foreground'>Growth</div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='date'
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor='end'
              height={80}
            />
            <YAxis
              label={{ value: `Weight (${unit})`, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className='bg-card border rounded-lg p-3 shadow-lg'>
                      <p className='font-semibold'>{data.date}</p>
                      <p className='text-primary'>
                        {data.weight} {unit}
                      </p>
                      {data.notes && (
                        <p className='text-sm text-muted-foreground mt-1'>{data.notes}</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type='monotone'
              dataKey='weight'
              stroke='hsl(var(--primary))'
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name={`Weight (${unit})`}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Weight Entries Table */}
        <div className='mt-6'>
          <h4 className='font-semibold mb-2'>Weight Log</h4>
          <div className='border rounded-lg'>
            <table className='w-full'>
              <thead className='bg-muted/50'>
                <tr>
                  <th className='text-left p-2'>Date</th>
                  <th className='text-right p-2'>Weight</th>
                  <th className='text-left p-2'>Notes</th>
                  <th className='text-right p-2'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...weightHistory]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <tr key={entry.id} className='border-t hover:bg-muted/30'>
                      <td className='p-2'>{format(new Date(entry.date), 'PPP')}</td>
                      <td className='text-right p-2'>
                        {convertWeight(entry.weight, entry.unit).toFixed(1)} {unit}
                      </td>
                      <td className='p-2 text-muted-foreground'>{entry.notes || '-'}</td>
                      <td className='p-2 text-right'>
                        <div className='flex gap-1 justify-end'>
                          <WeightTracker dogId={dogId} editEntry={entry} />
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
