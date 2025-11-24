import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Heart, Syringe, Weight, Clock, Camera, Download, FileText } from 'lucide-react';
import { format, differenceInWeeks } from 'date-fns';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Litter, Dog, Puppy, Buyer } from '@/types/dog';
import { MilestoneTimeline } from '@/components/MilestoneTimeline';
import { PuppyPedigree } from '@/components/PuppyPedigree';
import { generatePuppyHealthRecord } from '@/lib/pdfGenerator';

export function BuyerPortal() {
  const [searchParams] = useSearchParams();
  const [accessCode, setAccessCode] = useState(searchParams.get('code') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [puppy, setPuppy] = useState<Puppy | null>(null);
  const [litter, setLitter] = useState<Litter | null>(null);
  const [dam, setDam] = useState<Dog | null>(null);
  const [sire, setSire] = useState<Dog | null>(null);
  const [buyer, setBuyer] = useState<Buyer | null>(null);

  useEffect(() => {
    // Auto-login if code is in URL
    if (searchParams.get('code') && !isAuthenticated) {
      handleLogin();
    }
  }, []);

  const handleLogin = async () => {
    if (!accessCode.trim()) {
      setError('Please enter your access code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Search all users' litters for matching access code
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      let foundData: { puppy: Puppy; litter: Litter; buyer: Buyer; userId: string } | null = null;

      for (const userDoc of usersSnapshot.docs) {
        const littersRef = collection(db, 'users', userDoc.id, 'litters');
        const littersSnapshot = await getDocs(littersRef);

        for (const litterDoc of littersSnapshot.docs) {
          const litterData = { id: litterDoc.id, ...litterDoc.data() } as Litter;
          const buyers = litterData.buyers || [];
          const matchingBuyer = buyers.find(b => b.portalAccessCode === accessCode && b.portalEnabled);

          if (matchingBuyer) {
            const matchingPuppy = (litterData.puppies || []).find(p => p.buyerId === matchingBuyer.id);
            if (matchingPuppy) {
              foundData = {
                puppy: matchingPuppy,
                litter: litterData,
                buyer: matchingBuyer,
                userId: userDoc.id,
              };
              break;
            }
          }
        }
        if (foundData) break;
      }

      if (!foundData) {
        setError('Invalid access code or no puppy assigned');
        setLoading(false);
        return;
      }

      // Fetch dam and sire
      const [damDoc, sireDoc] = await Promise.all([
        getDoc(doc(db, 'users', foundData.userId, 'dogs', foundData.litter.damId)),
        getDoc(doc(db, 'users', foundData.userId, 'dogs', foundData.litter.sireId)),
      ]);

      setPuppy(foundData.puppy);
      setLitter(foundData.litter);
      setBuyer(foundData.buyer);
      if (damDoc.exists()) setDam({ id: damDoc.id, ...damDoc.data() } as Dog);
      if (sireDoc.exists()) setSire({ id: sireDoc.id, ...sireDoc.data() } as Dog);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Portal login error:', err);
      setError('Unable to access portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>Buyer Portal</CardTitle>
            <p className='text-muted-foreground'>Enter your access code to view your puppy</p>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Input
              placeholder='Access Code'
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className='text-sm text-red-500'>{error}</p>}
            <Button onClick={handleLogin} className='w-full' disabled={loading}>
              {loading ? 'Loading...' : 'Access Portal'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!puppy || !litter) return null;

  const weeksOld = differenceInWeeks(new Date(), new Date(litter.dateOfBirth));
  const updates = puppy.updates || [];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b bg-card'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold'>{puppy.name || puppy.tempName || 'Your Puppy'}</h1>
              <p className='text-muted-foreground'>Welcome, {buyer?.name}!</p>
            </div>
            <Badge>{puppy.status}</Badge>
          </div>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8 space-y-8'>
        {/* Puppy Overview */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Calendar className='h-8 w-8 text-primary' />
                <div>
                  <p className='text-sm text-muted-foreground'>Age</p>
                  <p className='text-2xl font-bold'>{weeksOld} weeks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Weight className='h-8 w-8 text-primary' />
                <div>
                  <p className='text-sm text-muted-foreground'>Weight</p>
                  <p className='text-2xl font-bold'>
                    {puppy.weight ? `${puppy.weight} ${puppy.weightUnit || 'lbs'}` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Heart className='h-8 w-8 text-primary' />
                <div>
                  <p className='text-sm text-muted-foreground'>Color</p>
                  <p className='text-2xl font-bold'>{puppy.color}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Clock className='h-8 w-8 text-primary' />
                <div>
                  <p className='text-sm text-muted-foreground'>Pickup Date</p>
                  <p className='text-lg font-bold'>
                    {puppy.pickupDate
                      ? format(new Date(puppy.pickupDate), 'MMM d, yyyy')
                      : litter.pickupReadyDate
                      ? format(new Date(litter.pickupReadyDate), 'MMM d, yyyy')
                      : 'TBD'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photos */}
        {puppy.photos && puppy.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Camera className='h-5 w-5' /> Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {puppy.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`${puppy.name || 'Puppy'} photo ${idx + 1}`}
                    className='w-full h-48 object-cover rounded-lg'
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parents */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Heart className='h-5 w-5' /> Parents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {dam && (
                <div className='flex gap-4'>
                  {dam.photos?.[0] && (
                    <img src={dam.photos[0]} alt={dam.name} className='w-24 h-24 object-cover rounded-lg' />
                  )}
                  <div>
                    <p className='text-sm text-muted-foreground'>Dam (Mother)</p>
                    <p className='font-semibold text-lg'>{dam.name}</p>
                    <p className='text-sm'>{dam.breed} • {dam.color}</p>
                  </div>
                </div>
              )}
              {sire && (
                <div className='flex gap-4'>
                  {sire.photos?.[0] && (
                    <img src={sire.photos[0]} alt={sire.name} className='w-24 h-24 object-cover rounded-lg' />
                  )}
                  <div>
                    <p className='text-sm text-muted-foreground'>Sire (Father)</p>
                    <p className='font-semibold text-lg'>{sire.name}</p>
                    <p className='text-sm'>{sire.breed} • {sire.color}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Development Milestones */}
        <MilestoneTimeline
          milestones={litter.milestones || []}
          dateOfBirth={litter.dateOfBirth}
          compact
        />

        {/* Pedigree */}
        <PuppyPedigree
          dam={dam}
          sire={sire}
          puppyName={puppy.name || puppy.tempName}
        />

        {/* Health Records */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Syringe className='h-5 w-5' /> Vaccinations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {puppy.shotRecords && puppy.shotRecords.length > 0 ? (
                <div className='space-y-3'>
                  {puppy.shotRecords.map((shot) => (
                    <div key={shot.id} className='flex justify-between items-center p-3 bg-muted rounded-lg'>
                      <div>
                        <p className='font-medium'>{shot.vaccine}</p>
                        <p className='text-sm text-muted-foreground'>
                          {format(new Date(shot.dateGiven), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant='outline'>Complete</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-muted-foreground'>No vaccinations recorded yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Weight className='h-5 w-5' /> Weight History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {puppy.weightHistory && puppy.weightHistory.length > 0 ? (
                <div className='space-y-3'>
                  {puppy.weightHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((entry) => (
                      <div key={entry.id} className='flex justify-between items-center p-3 bg-muted rounded-lg'>
                        <p className='text-sm text-muted-foreground'>
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </p>
                        <p className='font-semibold'>{entry.weight} {entry.unit}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className='text-muted-foreground'>No weight records yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Updates from Breeder</CardTitle>
          </CardHeader>
          <CardContent>
            {updates.length > 0 ? (
              <div className='space-y-6'>
                {updates
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((update) => (
                    <div key={update.id} className='border-b pb-6 last:border-0'>
                      <div className='flex justify-between items-start mb-2'>
                        <h3 className='font-semibold text-lg'>{update.title}</h3>
                        <span className='text-sm text-muted-foreground'>
                          {format(new Date(update.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className='text-muted-foreground whitespace-pre-wrap'>{update.content}</p>
                      {update.photos && update.photos.length > 0 && (
                        <div className='flex gap-2 mt-4 overflow-x-auto'>
                          {update.photos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`Update photo ${idx + 1}`}
                              className='h-32 w-32 object-cover rounded-lg flex-shrink-0'
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className='text-muted-foreground'>No updates yet. Check back soon!</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Total Price</p>
                <p className='text-xl font-bold'>${puppy.salePrice?.toLocaleString() || 'TBD'}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Deposit</p>
                <p className='text-xl font-bold'>${puppy.depositAmount?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Deposit Status</p>
                <Badge variant={puppy.depositPaid ? 'default' : 'secondary'}>
                  {puppy.depositPaid ? 'Paid' : 'Pending'}
                </Badge>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Balance Due</p>
                <p className='text-xl font-bold'>
                  ${((puppy.salePrice || 0) - (puppy.depositPaid ? (puppy.depositAmount || 0) : 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Downloads */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Download className='h-5 w-5' /> Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  if (dam && sire) {
                    generatePuppyHealthRecord({
                      puppy,
                      litter,
                      dam,
                      sire,
                      kennelName: dam.kennelName || 'Breeder',
                    });
                  }
                }}
              >
                <FileText className='mr-2 h-4 w-4' />
                Download Health Record
              </Button>
            </div>
            <p className='text-sm text-muted-foreground mt-3'>
              Health records include vaccination history, weight records, and parent health clearances.
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className='border-t bg-card mt-12'>
        <div className='container mx-auto px-4 py-6 text-center text-sm text-muted-foreground'>
          {dam?.kennelName || 'Breeder'} • Buyer Portal
        </div>
      </footer>
    </div>
  );
}
