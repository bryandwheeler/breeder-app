import { useDogStore } from '@breeder/firebase';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dog as DogIcon, ExternalLink } from 'lucide-react';
import { differenceInMonths } from 'date-fns';

export function Pedigrees() {
  const { dogs } = useDogStore();

  // Filter out puppies and deceased dogs for cleaner pedigree view
  const activeDogs = dogs.filter(d => {
    const isPuppy = d.dateOfBirth && differenceInMonths(new Date(), new Date(d.dateOfBirth)) < 12;
    return !isPuppy && !d.isDeceased;
  });

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-4xl font-bold'>Pedigrees</h1>
          <p className='text-muted-foreground mt-2'>
            View and manage pedigree records for all dogs
          </p>
        </div>
      </div>

      {activeDogs.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <DogIcon className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
            <p className='text-muted-foreground'>No active dogs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {activeDogs.map((dog) => (
            <Card key={dog.id} className='hover:shadow-lg transition-shadow'>
              <CardHeader>
                <div className='flex items-center gap-3'>
                  {dog.photos && dog.photos.length > 0 ? (
                    <img
                      src={dog.photos[0]}
                      alt={dog.name}
                      className='w-16 h-16 rounded-full object-cover border-2 border-white shadow'
                    />
                  ) : (
                    <div className='w-16 h-16 rounded-full flex items-center justify-center bg-muted border-2 border-white shadow'>
                      <DogIcon className='h-8 w-8 text-muted-foreground' />
                    </div>
                  )}
                  <div className='flex-1'>
                    <CardTitle className='text-lg'>{dog.name}</CardTitle>
                    <p className='text-sm text-muted-foreground'>
                      {dog.callName && `"${dog.callName}"`}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Sex:</span>
                    <Badge variant='secondary'>
                      {dog.sex === 'female' ? '♀ Female' : '♂ Male'}
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Breed:</span>
                    <span className='text-sm font-medium'>{dog.breed}</span>
                  </div>
                  {dog.dateOfBirth && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>DOB:</span>
                      <span className='text-sm font-medium'>{dog.dateOfBirth}</span>
                    </div>
                  )}
                  <Link to={`/dogs/${dog.id}`} className='block mt-4'>
                    <Button className='w-full' size='sm'>
                      <ExternalLink className='h-4 w-4 mr-2' />
                      View Pedigree
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
