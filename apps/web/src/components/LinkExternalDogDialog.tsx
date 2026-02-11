import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConnectionStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useBreederStore } from '@breeder/firebase';
import { Loader2, Search, Link2, X } from 'lucide-react';
import { searchDogs, type DogSearchResult } from '@/lib/algoliaSearch';
import { useToast } from '@/hooks/use-toast';
import { Dog } from '@breeder/types';
import { cn } from '@/lib/utils';

interface LinkExternalDogDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dog: Dog;
}

export function LinkExternalDogDialog({ open, setOpen, dog }: LinkExternalDogDialogProps) {
  const { currentUser } = useAuth();
  const profile = useBreederStore((state) => state.profile);
  const createConnectionRequest = useConnectionStore((state) => state.createConnectionRequest);
  const { toast } = useToast();

  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<DogSearchResult[]>([]);
  const [selectedDog, setSelectedDog] = useState<DogSearchResult | null>(null);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim() || !currentUser) return;

    setSearching(true);
    setSearchResults([]);
    setSelectedDog(null);

    try {
      const results = await searchDogs(searchTerm, currentUser.uid);

      if (results.length > 0) {
        setSearchResults(results);
      } else {
        toast({
          title: 'No Results',
          description: 'No dogs found. Try searching by dog name, registration number, kennel name, or breeder name.',
        });
      }
    } catch (error) {
      console.error('Error searching for dogs:', error);
      toast({
        title: 'Error',
        description: 'Error searching for dogs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectDog = (result: DogSearchResult) => {
    setSelectedDog(result);
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!selectedDog || !currentUser) return;
    if (!profile) {
      toast({
        title: 'Profile Not Loaded',
        description: 'Your breeder profile is not available. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const requestData: any = {
        requesterId: currentUser.uid,
        requesterKennelName: profile.kennelName || profile.breederName || 'Unknown',
        ownerId: selectedDog.ownerId,
        ownerKennelName: selectedDog.ownerKennel,
        dogId: selectedDog.dogId,
        dogName: selectedDog.dogName,
        purpose: 'reference',
        requestDate: new Date().toISOString(),
        requesterDogId: dog.id,
        linkToExisting: true,
      };

      if (selectedDog.registrationNumber) {
        requestData.dogRegistrationNumber = selectedDog.registrationNumber;
      }

      requestData.message = message.trim()
        || `Requesting to link my existing dog "${dog.name}" to the original record in your program.`;

      await createConnectionRequest(requestData);

      toast({
        title: 'Link Request Sent',
        description: `Connection request sent to ${selectedDog.ownerKennel}. Once approved, you can merge the shared data.`,
      });
      handleClose();
    } catch (error) {
      console.error('Error creating link request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send link request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedDog(null);
    setMessage('');
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm' />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-[60] grid w-full gap-4 border bg-white dark:bg-zinc-950 p-6 shadow-2xl duration-200',
            'inset-0 max-h-screen overflow-y-auto',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:max-h-[90vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl',
            'flex flex-col'
          )}
        >
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Link2 className='h-5 w-5' />
              Link to External Program
            </DialogTitle>
            <DialogDescription>
              Search for <strong>{dog.name}</strong> in another breeder's records to link and sync data.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 overflow-y-auto flex-1 min-h-0'>
            {/* Search Section */}
            <div className='space-y-2'>
              <Label htmlFor='link-search'>Search for Dog</Label>
              <div className='flex gap-2'>
                <Input
                  id='link-search'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder='Dog name, reg #, kennel, or breeder...'
                  disabled={searching || !!selectedDog}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!searching && searchTerm.trim() && !selectedDog) {
                        handleSearch();
                      }
                    }
                  }}
                />
                <Button
                  type='button'
                  onClick={handleSearch}
                  disabled={searching || !searchTerm.trim() || !!selectedDog}
                  size='icon'
                >
                  {searching ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedDog && (
              <div className='border rounded-lg max-h-60 overflow-y-auto'>
                <div className='text-sm font-medium p-2 bg-muted'>
                  Found {searchResults.length} dog{searchResults.length !== 1 ? 's' : ''} - Click to select:
                </div>
                {searchResults.map((result) => (
                  <button
                    type='button'
                    key={result.dogId}
                    onClick={() => handleSelectDog(result)}
                    className='w-full text-left p-3 hover:bg-accent border-b last:border-b-0 transition-colors'
                  >
                    <div className='font-semibold'>{result.dogName}</div>
                    <div className='text-sm text-muted-foreground'>
                      {result.breed && <span>{result.breed}</span>}
                      {result.sex && <span> &bull; {result.sex}</span>}
                      {result.registrationNumber && <span> &bull; {result.registrationNumber}</span>}
                    </div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      Owner: {result.ownerKennel}
                      {result.ownerBreederName && ` (${result.ownerBreederName})`}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Dog Display */}
            {selectedDog && (
              <div className='p-4 bg-muted rounded-lg space-y-3'>
                <div className='flex items-start justify-between'>
                  <div>
                    <div className='text-sm font-semibold text-muted-foreground'>Link To</div>
                    <div className='text-lg font-bold'>{selectedDog.dogName}</div>
                    <div className='text-sm text-muted-foreground'>
                      {selectedDog.breed && <span>{selectedDog.breed}</span>}
                      {selectedDog.sex && <span> &bull; {selectedDog.sex}</span>}
                    </div>
                    {selectedDog.registrationNumber && (
                      <div className='text-xs text-muted-foreground mt-1'>
                        Reg: {selectedDog.registrationNumber}
                      </div>
                    )}
                    <div className='text-sm text-muted-foreground mt-1'>
                      Owner: {selectedDog.ownerKennel}
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setSelectedDog(null);
                      setSearchResults([]);
                    }}
                  >
                    Change
                  </Button>
                </div>

                <div className='p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800 dark:text-blue-200'>
                  The owner will need to approve this request and choose what data to share. Once approved, you'll be able to review and merge the data with your existing record for <strong>{dog.name}</strong>.
                </div>

                <div>
                  <Label htmlFor='link-message'>Message to Owner (Optional)</Label>
                  <Textarea
                    id='link-message'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder={`Hi! I have ${dog.name} from your program and would like to link our records...`}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button type='button' variant='outline' onClick={handleClose} disabled={submitting} className='w-full sm:w-auto'>
              Cancel
            </Button>
            {selectedDog && (
              <Button type='button' onClick={handleSubmit} disabled={submitting} className='w-full sm:w-auto'>
                {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Send Link Request
              </Button>
            )}
          </DialogFooter>

          <DialogPrimitive.Close className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'>
            <X className='h-4 w-4' />
            <span className='sr-only'>Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
