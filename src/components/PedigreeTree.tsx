import { useDogStore } from '@/store/dogStoreFirebase';
import { Dog } from '@/types/dog';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart, Dog as DogIcon, Calendar } from 'lucide-react';
import { differenceInMonths, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface PedigreeCardProps {
  dog: Dog | undefined;
}

function PedigreeCard({ dog }: PedigreeCardProps) {
  if (!dog) {
    return (
      <div className='flex flex-col items-center'>
        <Card className='w-40 h-32 flex items-center justify-center bg-muted/30 border-dashed'>
          <p className='text-sm text-muted-foreground'>Unknown</p>
        </Card>
      </div>
    );
  }

  const getAge = () => {
    if (!dog.dateOfBirth) return null;
    const birthDate = new Date(dog.dateOfBirth);
    const today = new Date();

    const months = differenceInMonths(today, birthDate);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const days = differenceInDays(today, birthDate) % 30;

    if (years > 0) {
      return remainingMonths > 0
        ? `${years} years, ${remainingMonths} weeks`
        : `${years} years`;
    } else if (remainingMonths > 0) {
      return `${remainingMonths} weeks${days > 0 ? `, ${days} days` : ''}`;
    } else {
      return `${days} days`;
    }
  };

  const age = getAge();
  const isFemale = dog.sex === 'female';
  const isPuppy =
    dog.dateOfBirth &&
    differenceInMonths(new Date(), new Date(dog.dateOfBirth)) < 12;

  return (
    <div className='flex flex-col items-center'>
      <Card
        className={cn(
          'w-40 p-3 transition-all hover:shadow-lg',
          isFemale && !isPuppy && 'border-pink-300 bg-pink-50/50',
          !isFemale && !isPuppy && 'border-blue-300 bg-blue-50/50',
          isPuppy && 'border-gray-300 bg-gray-50/50'
        )}
      >
        <div className='flex flex-col items-center space-y-2'>
          {/* Photo */}
          <div className='relative'>
            {dog.photos && dog.photos.length > 0 ? (
              <img
                src={dog.photos[0]}
                alt={dog.name}
                className='w-16 h-16 rounded-full object-cover border-2 border-white shadow'
              />
            ) : (
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center border-2 border-white shadow',
                  isFemale ? 'bg-pink-200' : 'bg-blue-200'
                )}
              >
                <DogIcon className='h-8 w-8 text-white' />
              </div>
            )}
            {/* Status badge on photo */}
            {dog.programStatus && (
              <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-1'>
                {isFemale && <Heart className='h-3 w-3 text-pink-500' />}
                {!isFemale && <DogIcon className='h-3 w-3 text-blue-500' />}
              </div>
            )}
          </div>

          {/* Name */}
          <div className='text-center w-full'>
            <p className='font-semibold text-sm truncate' title={dog.name}>
              {dog.name}
            </p>
          </div>

          {/* Status Badge */}
          <Badge
            variant={dog.isDeceased ? 'outline' : 'secondary'}
            className={cn(
              'text-xs px-2 py-0',
              isFemale &&
                !dog.isDeceased &&
                'bg-pink-100 text-pink-700 border-pink-200',
              !isFemale &&
                !dog.isDeceased &&
                'bg-blue-100 text-blue-700 border-blue-200'
            )}
          >
            {dog.isDeceased
              ? 'Retired'
              : isPuppy
              ? 'Puppy'
              : dog.programStatus === 'guardian'
              ? 'Guardian'
              : dog.programStatus === 'external_stud'
              ? 'External Stud'
              : isFemale
              ? 'Active Breeding Dog'
              : 'Active Breeding Dog'}
          </Badge>

          {/* Age */}
          {age && (
            <div className='text-xs text-muted-foreground flex items-center gap-1'>
              <Calendar className='h-3 w-3' />
              <span>Age: {age}</span>
            </div>
          )}

          {/* View Button */}
          <Link to={`/dogs/${dog.id}`}>
            <Button size='sm' variant='outline' className='w-full text-xs h-6'>
              <ExternalLink className='h-3 w-3 mr-1' />
              View
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export function PedigreeTree({ dogId }: { dogId: string }) {
  const { dogs } = useDogStore();
  const rootDog = dogs.find((d) => d.id === dogId);

  if (!rootDog) {
    return (
      <div className='text-center py-10 text-muted-foreground'>
        Dog not found
      </div>
    );
  }

  // Get all ancestors
  const sire = dogs.find((d) => d.id === rootDog.sireId);
  const dam = dogs.find((d) => d.id === rootDog.damId);

  // Paternal grandparents
  const paternalGrandsire = sire
    ? dogs.find((d) => d.id === sire.sireId)
    : undefined;
  const paternalGranddam = sire
    ? dogs.find((d) => d.id === sire.damId)
    : undefined;

  // Maternal grandparents
  const maternalGrandsire = dam
    ? dogs.find((d) => d.id === dam.sireId)
    : undefined;
  const maternalGranddam = dam
    ? dogs.find((d) => d.id === dam.damId)
    : undefined;

  // Great-grandparents (paternal side)
  const paternalGGS_S = paternalGrandsire
    ? dogs.find((d) => d.id === paternalGrandsire.sireId)
    : undefined;
  const paternalGGS_D = paternalGrandsire
    ? dogs.find((d) => d.id === paternalGrandsire.damId)
    : undefined;
  const paternalGGD_S = paternalGranddam
    ? dogs.find((d) => d.id === paternalGranddam.sireId)
    : undefined;
  const paternalGGD_D = paternalGranddam
    ? dogs.find((d) => d.id === paternalGranddam.damId)
    : undefined;

  // Great-grandparents (maternal side)
  const maternalGGS_S = maternalGrandsire
    ? dogs.find((d) => d.id === maternalGrandsire.sireId)
    : undefined;
  const maternalGGS_D = maternalGrandsire
    ? dogs.find((d) => d.id === maternalGrandsire.damId)
    : undefined;
  const maternalGGD_S = maternalGranddam
    ? dogs.find((d) => d.id === maternalGranddam.sireId)
    : undefined;
  const maternalGGD_D = maternalGranddam
    ? dogs.find((d) => d.id === maternalGranddam.damId)
    : undefined;

  return (
    <div className='w-full overflow-x-auto pb-8'>
      <div className='min-w-max p-8 bg-muted/20 rounded-lg'>
        <div className='mb-4'>
          <p className='text-sm text-muted-foreground italic'>
            This is the pedigree view for{' '}
            <span className='font-semibold text-foreground'>
              {rootDog.name}
            </span>
            . You can explore their lineage, including sire, dam, and
            descendants, all in one interactive tree.
          </p>
        </div>

        {/* Pedigree Grid Layout */}
        <div className='grid grid-cols-4 gap-x-16 relative'>
          {/* SVG for connecting lines - positioned absolutely */}
          <svg
            viewBox='0 0 1200 800'
            width='100%'
            height='100%'
            className='absolute inset-0 w-full h-full pointer-events-none'
            style={{ zIndex: 0 }}
          >
            <defs>
              <marker
                id='arrow'
                markerWidth='10'
                markerHeight='10'
                refX='5'
                refY='3'
                orient='auto'
                markerUnits='strokeWidth'
              >
                <path d='M0,0 L0,6 L9,3 z' fill='#9ca3af' />
              </marker>
            </defs>
            {/* Card positions: Generation 0 (subject): (150,400)
                Generation 1 (parents): (350,200) and (350,600)
                Generation 2 (grandparents): (550,100), (550,300), (550,500), (550,700)
                Generation 3 (great-grandparents): (750,50), (750,150), (750,250), (750,350), (750,450), (750,550), (750,650), (750,750)
                Card width: 160px, so lines should start/end at card edge (center +/- 80px)
            */}
            {/* Subject to Sire (curve from right edge of subject to left edge of sire) */}
            <path
              d='M 230 400 C 290 320, 320 260, 370 240'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            {/* Subject to Dam (curve from right edge of subject to left edge of dam) */}
            <path
              d='M 230 400 C 290 480, 320 540, 370 560'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            {/* Sire to Grandparents */}
            <path
              d='M 430 240 C 490 180, 520 140, 570 140'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            <path
              d='M 430 240 C 490 300, 520 340, 570 340'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            {/* Dam to Grandparents */}
            <path
              d='M 430 560 C 490 500, 520 540, 570 540'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            <path
              d='M 430 560 C 490 620, 520 740, 570 740'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            {/* Grandparents to Great-grandparents */}
            <path
              d='M 630 140 C 690 90, 720 70, 770 90'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            <path
              d='M 630 140 C 690 190, 720 210, 770 190'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            <path
              d='M 630 340 C 690 290, 720 270, 770 290'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            <path
              d='M 630 340 C 690 390, 720 410, 770 390'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            <path
              d='M 630 540 C 690 490, 720 470, 770 490'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            <path
              d='M 630 540 C 690 590, 720 610, 770 590'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            <path
              d='M 630 740 C 690 690, 720 670, 770 690'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
            <path
              d='M 630 740 C 690 790, 720 810, 770 790'
              stroke='#9ca3af'
              strokeWidth='2'
              fill='none'
            />
          </svg>

          {/* Generation 0 - Subject (centered vertically) */}
          <div
            className='flex items-center justify-center'
            style={{ gridRow: 'span 8', position: 'relative', zIndex: 1 }}
          >
            <PedigreeCard dog={rootDog} />
          </div>

          {/* Generation 1 - Parents */}
          <div
            className='flex flex-col justify-center gap-y-96'
            style={{ gridRow: 'span 8', position: 'relative', zIndex: 1 }}
          >
            <PedigreeCard dog={sire} />
            <PedigreeCard dog={dam} />
          </div>

          {/* Generation 2 - Grandparents */}
          <div
            className='flex flex-col justify-center gap-y-40'
            style={{ gridRow: 'span 8', position: 'relative', zIndex: 1 }}
          >
            <PedigreeCard dog={paternalGrandsire} />
            <PedigreeCard dog={paternalGranddam} />
            <PedigreeCard dog={maternalGrandsire} />
            <PedigreeCard dog={maternalGranddam} />
          </div>

          {/* Generation 3 - Great-grandparents */}
          <div
            className='flex flex-col justify-start gap-y-20 pt-2'
            style={{ gridRow: 'span 8', position: 'relative', zIndex: 1 }}
          >
            <PedigreeCard dog={paternalGGS_S} />
            <PedigreeCard dog={paternalGGS_D} />
            <PedigreeCard dog={paternalGGD_S} />
            <PedigreeCard dog={paternalGGD_D} />
            <PedigreeCard dog={maternalGGS_S} />
            <PedigreeCard dog={maternalGGS_D} />
            <PedigreeCard dog={maternalGGD_S} />
            <PedigreeCard dog={maternalGGD_D} />
          </div>
        </div>

        {/* Legend */}
        <div className='mt-8 pt-6 border-t flex gap-6 text-sm'>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded-full bg-pink-200 border border-pink-300'></div>
            <span>Female</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded-full bg-blue-200 border border-blue-300'></div>
            <span>Male</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded-full bg-gray-200 border border-gray-300'></div>
            <span>Puppy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
