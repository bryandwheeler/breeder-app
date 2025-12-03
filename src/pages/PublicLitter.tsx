import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Heart } from 'lucide-react';
import { format, differenceInWeeks } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Litter, Dog, Puppy } from '@/types/dog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export function PublicLitter() {
  const { userId, litterId } = useParams<{
    userId: string;
    litterId: string;
  }>();
  const [litter, setLitter] = useState<Litter | null>(null);
  const [dam, setDam] = useState<Dog | null>(null);
  const [sire, setSire] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!userId || !litterId) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      try {
        // Fetch litter
        const litterDoc = await getDoc(
          doc(db, 'users', userId, 'litters', litterId)
        );
        if (!litterDoc.exists()) {
          setError('Litter not found');
          setLoading(false);
          return;
        }
        const litterData = { id: litterDoc.id, ...litterDoc.data() } as Litter;
        setLitter(litterData);

        // Fetch dam and sire
        const [damDoc, sireDoc] = await Promise.all([
          getDoc(doc(db, 'users', userId, 'dogs', litterData.damId)),
          getDoc(doc(db, 'users', userId, 'dogs', litterData.sireId)),
        ]);

        if (damDoc.exists()) {
          setDam({ id: damDoc.id, ...damDoc.data() } as Dog);
        }
        if (sireDoc.exists()) {
          setSire({ id: sireDoc.id, ...sireDoc.data() } as Dog);
        }
      } catch (err) {
        console.error('Error fetching litter:', err);
        setError('Unable to load litter information');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, litterId]);

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto' />
          <p className='mt-4 text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !litter) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Card className='max-w-md'>
          <CardContent className='pt-6 text-center'>
            <p className='text-lg text-muted-foreground'>
              {error || 'Litter not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const puppies = litter.puppies || [];
  const availablePuppies = puppies.filter((p) => p.status === 'available');
  const reservedPuppies = puppies.filter((p) => p.status === 'reserved');
  const weeksOld = differenceInWeeks(new Date(), new Date(litter.dateOfBirth));

  const getStatusColor = (status: Puppy['status']) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'reserved':
        return 'secondary';
      case 'sold':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b bg-card'>
        <div className='container mx-auto px-4 py-6'>
          <div className='text-center'>
            <h1 className='text-3xl font-bold'>
              {litter.litterName || 'Available Puppies'}
            </h1>
            {dam?.kennelName && (
              <p className='text-muted-foreground mt-1'>{dam.kennelName}</p>
            )}
          </div>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8 space-y-8'>
        {/* Litter Info */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Calendar className='h-5 w-5' /> Litter Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div>
                <strong>Born:</strong>{' '}
                {format(new Date(litter.dateOfBirth), 'MMMM d, yyyy')}
              </div>
              <div>
                <strong>Age:</strong> {weeksOld} weeks old
              </div>
              {litter.pickupReadyDate && (
                <div>
                  <strong>Ready for Pickup:</strong>{' '}
                  {format(new Date(litter.pickupReadyDate), 'MMMM d, yyyy')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Heart className='h-5 w-5' /> Parents
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {dam && (
                <div>
                  <p className='text-sm text-muted-foreground'>Dam (Mother)</p>
                  <p className='font-medium'>{dam.name}</p>
                  {dam.photos?.[0] && (
                    <img
                      src={dam.photos[0]}
                      alt={dam.name}
                      className='w-20 h-20 object-cover rounded-lg mt-2'
                    />
                  )}
                </div>
              )}
              {sire && (
                <div>
                  <p className='text-sm text-muted-foreground'>Sire (Father)</p>
                  <p className='font-medium'>{sire.name}</p>
                  {sire.photos?.[0] && (
                    <img
                      src={sire.photos[0]}
                      alt={sire.name}
                      className='w-20 h-20 object-cover rounded-lg mt-2'
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Availability</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span>Available:</span>
                <Badge variant='default'>{availablePuppies.length}</Badge>
              </div>
              <div className='flex justify-between items-center'>
                <span>Reserved:</span>
                <Badge variant='secondary'>{reservedPuppies.length}</Badge>
              </div>
              {litter.pricing?.petPrice && (
                <div className='pt-4 border-t'>
                  <strong>Starting at:</strong> $
                  {litter.pricing.petPrice.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Puppies Grid */}
        <div>
          <h2 className='text-2xl font-bold mb-6'>Our Puppies</h2>
          {puppies.filter((p) => p.status !== 'sold' && p.status !== 'kept')
            .length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <p className='text-muted-foreground'>
                  All puppies from this litter have found their forever homes!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {puppies
                .filter((p) => p.status !== 'sold' && p.status !== 'kept')
                .map((puppy) => (
                  <Card key={puppy.id} className='overflow-hidden'>
                    {puppy.photos?.[0] && (
                      <img
                        src={puppy.photos[0]}
                        alt={puppy.name || puppy.tempName || 'Puppy'}
                        className='w-full h-64 object-cover'
                      />
                    )}
                    <CardHeader>
                      <div className='flex justify-between items-start'>
                        <CardTitle className='text-lg'>
                          {puppy.name || puppy.tempName || 'Unnamed'}
                        </CardTitle>
                        <Badge variant={getStatusColor(puppy.status)}>
                          {puppy.status === 'available'
                            ? 'Available'
                            : 'Reserved'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                      <div className='flex gap-2'>
                        <Badge variant='outline'>
                          {puppy.sex === 'male' ? '♂ Male' : '♀ Female'}
                        </Badge>
                        <Badge variant='outline'>{puppy.color}</Badge>
                      </div>
                      {puppy.collar && (
                        <p className='text-sm text-muted-foreground'>
                          {puppy.collar} collar
                        </p>
                      )}
                      {puppy.notes && (
                        <p className='text-sm text-muted-foreground mt-2'>
                          {puppy.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* Contact Info */}
        {dam?.breederName && (
          <Card>
            <CardHeader>
              <CardTitle>Interested in a Puppy?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Contact {dam.breederName} at {dam.kennelName || 'our kennel'} to
                inquire about available puppies.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className='border-t bg-card mt-12'>
        <div className='container mx-auto px-4 py-6 text-center text-sm text-muted-foreground'>
          {dam?.kennelName || 'Breeder'} • Puppy Listing
        </div>
      </footer>
    </div>
  );
}
