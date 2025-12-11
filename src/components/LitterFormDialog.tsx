import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDogStore } from '@/store/dogStoreFirebase';
import { Litter } from '@/types/dog';
import { searchDogs, type DogSearchResult } from '@/lib/kennelSearch';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface LitterFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  litter: Litter | null;
}

export function LitterFormDialog({
  open,
  setOpen,
  litter,
}: LitterFormDialogProps) {
  const { currentUser } = useAuth();
  const { dogs, addLitter, updateLitter } = useDogStore();
  const females = dogs.filter((d) => d.sex === 'female');
  const males = dogs.filter((d) => d.sex === 'male');

  const [formData, setFormData] = useState<Omit<Litter, 'id'>>({
    litterName: '',
    damId: '',
    sireId: '',
    dateOfBirth: '',
    status: 'planned',
    puppies: [],
    buyers: [],
  });

  // Sire search state
  const [sireSearchMode, setSireSearchMode] = useState(false);
  const [sireSearchTerm, setSireSearchTerm] = useState('');
  const [sireSearching, setSireSearching] = useState(false);
  const [sireSearchResults, setSireSearchResults] = useState<DogSearchResult[]>(
    []
  );
  const [externalSire, setExternalSire] = useState<DogSearchResult | null>(
    null
  );

  useEffect(() => {
    if (litter) {
      setFormData({
        litterName: litter.litterName,
        damId: litter.damId,
        sireId: litter.sireId,
        dateOfBirth: litter.dateOfBirth,
        expectedDateOfBirth: litter.expectedDateOfBirth,
        status: litter.status,
        puppies: litter.puppies,
        buyers: litter.buyers,
        announceDate: litter.announceDate,
        pickupReadyDate: litter.pickupReadyDate,
        litterNotes: litter.litterNotes,
        pricing: litter.pricing,
        ownerInfo: litter.ownerInfo,
      });
    } else {
      setFormData({
        litterName: '',
        damId: '',
        sireId: '',
        dateOfBirth: '',
        status: 'planned',
        puppies: [],
        buyers: [],
      });
    }
  }, [litter, open]);

  const handleSireSearch = async () => {
    if (!sireSearchTerm.trim() || !currentUser) return;

    setSireSearching(true);
    setSireSearchResults([]);

    try {
      const results = await searchDogs(sireSearchTerm, currentUser.uid);
      const maleResults = results.filter((r) => r.sex === 'male');

      if (maleResults.length > 0) {
        setSireSearchResults(maleResults);
      } else {
        toast({
          title: 'No males found',
          description:
            'No male dogs found matching your search. Try different keywords.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching for sire:', error);
      toast({
        title: 'Search error',
        description: 'Failed to search for dogs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSireSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one date is provided
    if (!formData.dateOfBirth && !formData.expectedDateOfBirth) {
      toast({
        title: 'Missing date',
        description: 'Please provide either an expected due date or actual birth date.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare litter data with external sire info if applicable
    const litterData = { ...formData };
    if (externalSire) {
      litterData.sireId = ''; // Clear internal sire ID
      litterData.externalSire = {
        name: externalSire.dogName,
        registrationNumber: externalSire.registrationNumber,
        breed: externalSire.breed,
        kennelName: externalSire.ownerKennel,
        breederName: externalSire.ownerBreederName,
      };
    }

    if (litter) {
      await updateLitter(litter.id, litterData);
    } else {
      await addLitter(litterData);
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {litter ? 'Edit Litter' : 'Plan New Litter'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor='litterName'>Litter Name (Optional)</Label>
              </TooltipTrigger>
              <TooltipContent>Give this litter a memorable name</TooltipContent>
            </Tooltip>
            <Input
              id='litterName'
              value={formData.litterName || ''}
              onChange={(e) =>
                setFormData({ ...formData, litterName: e.target.value })
              }
              placeholder='e.g., Spring 2025 Litter'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor='damId'>Dam *</Label>
                </TooltipTrigger>
                <TooltipContent>
                  Select the mother from your female dogs
                </TooltipContent>
              </Tooltip>
              <Select
                value={formData.damId}
                onValueChange={(value) =>
                  setFormData({ ...formData, damId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select dam' />
                </SelectTrigger>
                <SelectContent>
                  {females.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label>Sire *</Label>
                </TooltipTrigger>
                <TooltipContent>
                  Choose from your males or search external sire
                </TooltipContent>
              </Tooltip>

              {!sireSearchMode && !externalSire ? (
                <div className='space-y-2'>
                  <Select
                    value={formData.sireId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sireId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select sire from your dogs' />
                    </SelectTrigger>
                    <SelectContent>
                      {males.map((dog) => (
                        <SelectItem key={dog.id} value={dog.id}>
                          {dog.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSireSearchMode(true);
                      setFormData({ ...formData, sireId: '' });
                    }}
                  >
                    <Search className='h-4 w-4 mr-2' />
                    Search External Sire
                  </Button>
                </div>
              ) : externalSire ? (
                <div className='p-3 bg-muted rounded-lg'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <div className='text-sm font-semibold text-muted-foreground'>
                        External Sire
                      </div>
                      <div className='font-bold'>{externalSire.dogName}</div>
                      <div className='text-sm text-muted-foreground'>
                        {externalSire.breed && (
                          <span>{externalSire.breed}</span>
                        )}
                        {externalSire.registrationNumber && (
                          <span> • {externalSire.registrationNumber}</span>
                        )}
                      </div>
                      <div className='text-sm text-muted-foreground mt-1'>
                        Owner: {externalSire.ownerKennel}
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setExternalSire(null);
                        setSireSearchMode(false);
                        setSireSearchResults([]);
                        setSireSearchTerm('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      value={sireSearchTerm}
                      onChange={(e) => setSireSearchTerm(e.target.value)}
                      placeholder='Search by name, reg #, kennel, or breeder...'
                      disabled={sireSearching}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSireSearch();
                        }
                      }}
                    />
                    <Button
                      type='button'
                      onClick={handleSireSearch}
                      disabled={sireSearching || !sireSearchTerm.trim()}
                      size='icon'
                    >
                      {sireSearching ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Search className='h-4 w-4' />
                      )}
                    </Button>
                  </div>

                  {sireSearchResults.length > 0 && (
                    <div className='border rounded-lg max-h-48 overflow-y-auto'>
                      <div className='text-sm font-medium p-2 bg-muted'>
                        Found {sireSearchResults.length} male
                        {sireSearchResults.length !== 1 ? 's' : ''} - Click to
                        select:
                      </div>
                      {sireSearchResults.map((dog) => (
                        <button
                          key={dog.dogId}
                          type='button'
                          onClick={() => {
                            setExternalSire(dog);
                            setSireSearchResults([]);
                            setFormData({ ...formData, sireId: '' });
                          }}
                          className='w-full text-left p-3 hover:bg-accent border-b last:border-b-0 transition-colors'
                        >
                          <div className='font-semibold'>{dog.dogName}</div>
                          <div className='text-sm text-muted-foreground'>
                            {dog.breed && <span>{dog.breed}</span>}
                            {dog.registrationNumber && (
                              <span> • {dog.registrationNumber}</span>
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground mt-1'>
                            Owner: {dog.ownerKennel}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSireSearchMode(false);
                      setSireSearchResults([]);
                      setSireSearchTerm('');
                    }}
                  >
                    Use My Dogs Instead
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor='expectedDateOfBirth'>
                    Expected Due Date
                    {!formData.dateOfBirth && ' *'}
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  Estimated due date (typically 63 days from breeding)
                </TooltipContent>
              </Tooltip>
              <Input
                id='expectedDateOfBirth'
                type='date'
                value={formData.expectedDateOfBirth || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedDateOfBirth: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor='dateOfBirth'>
                    Actual Birth Date
                    {formData.dateOfBirth && ' *'}
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  Leave empty for pending litters - fill in once puppies are born
                </TooltipContent>
              </Tooltip>
              <Input
                id='dateOfBirth'
                type='date'
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as
                      | 'planned'
                      | 'pregnant'
                      | 'born'
                      | 'weaning'
                      | 'ready'
                      | 'completed',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='planned'>Planned</SelectItem>
                  <SelectItem value='pregnant'>Pregnant</SelectItem>
                  <SelectItem value='born'>Born</SelectItem>
                  <SelectItem value='weaning'>Weaning</SelectItem>
                  <SelectItem value='ready'>Ready for Pickup</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='pickupReadyDate'>Pickup Ready Date</Label>
              <Input
                id='pickupReadyDate'
                type='date'
                value={formData.pickupReadyDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, pickupReadyDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor='announceDate'>Announcement Date</Label>
            <Input
              id='announceDate'
              type='date'
              value={formData.announceDate || ''}
              onChange={(e) =>
                setFormData({ ...formData, announceDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label className='mb-2 block'>Pricing (Optional)</Label>
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='petPrice' className='text-sm'>
                  Pet Price
                </Label>
                <Input
                  id='petPrice'
                  type='number'
                  value={formData.pricing?.petPrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        petPrice: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder='0.00'
                />
              </div>

              <div>
                <Label htmlFor='breedingPrice' className='text-sm'>
                  Breeding Rights
                </Label>
                <Input
                  id='breedingPrice'
                  type='number'
                  value={formData.pricing?.breedingPrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        breedingPrice: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder='0.00'
                />
              </div>

              <div>
                <Label htmlFor='showPrice' className='text-sm'>
                  Show Quality
                </Label>
                <Input
                  id='showPrice'
                  type='number'
                  value={formData.pricing?.showPrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        showPrice: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder='0.00'
                />
              </div>
            </div>
          </div>

          {/* Owner/Revenue Split Section */}
          <div className='space-y-4 p-4 border rounded-lg'>
            <h3 className='font-semibold'>Owner Revenue Split (Optional)</h3>
            <p className='text-sm text-muted-foreground'>
              For guardian homes, co-owned dogs, or other revenue sharing arrangements
            </p>

            <div>
              <Label htmlFor='ownerName'>Owner Name</Label>
              <Input
                id='ownerName'
                value={formData.ownerInfo?.ownerName || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ownerInfo: {
                      ...formData.ownerInfo,
                      ownerName: e.target.value,
                    },
                  })
                }
                placeholder='Name of the owner (if different from breeder)'
              />
            </div>

            <div>
              <Label htmlFor='ownerContact'>Owner Contact</Label>
              <Input
                id='ownerContact'
                value={formData.ownerInfo?.ownerContact || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ownerInfo: {
                      ...formData.ownerInfo,
                      ownerContact: e.target.value,
                    },
                  })
                }
                placeholder='Email or phone'
              />
            </div>

            <div>
              <Label htmlFor='revenueSplitType'>Revenue Split Type</Label>
              <Select
                value={formData.ownerInfo?.revenueSplitType || ''}
                onValueChange={(value: 'percentage' | 'fixed_amount') =>
                  setFormData({
                    ...formData,
                    ownerInfo: {
                      ...formData.ownerInfo,
                      revenueSplitType: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select split type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='percentage'>Percentage Split</SelectItem>
                  <SelectItem value='fixed_amount'>Fixed Amount per Puppy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.ownerInfo?.revenueSplitType === 'percentage' && (
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='ownerPercentage'>Owner %</Label>
                  <Input
                    id='ownerPercentage'
                    type='number'
                    min='0'
                    max='100'
                    value={formData.ownerInfo?.ownerPercentage || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ownerInfo: {
                          ...formData.ownerInfo,
                          ownerPercentage: parseFloat(e.target.value) || undefined,
                          breederPercentage: 100 - (parseFloat(e.target.value) || 0),
                        },
                      })
                    }
                    placeholder='0-100'
                  />
                </div>
                <div>
                  <Label htmlFor='breederPercentage'>Breeder %</Label>
                  <Input
                    id='breederPercentage'
                    type='number'
                    value={formData.ownerInfo?.breederPercentage || ''}
                    disabled
                    placeholder='Auto-calculated'
                  />
                </div>
              </div>
            )}

            {formData.ownerInfo?.revenueSplitType === 'fixed_amount' && (
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='ownerFixedAmount'>Owner $ per Puppy</Label>
                  <Input
                    id='ownerFixedAmount'
                    type='number'
                    min='0'
                    step='100'
                    value={formData.ownerInfo?.ownerFixedAmount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ownerInfo: {
                          ...formData.ownerInfo,
                          ownerFixedAmount: parseFloat(e.target.value) || undefined,
                        },
                      })
                    }
                    placeholder='0.00'
                  />
                </div>
                <div>
                  <Label htmlFor='breederFixedAmount'>Breeder $ per Puppy</Label>
                  <Input
                    id='breederFixedAmount'
                    type='number'
                    min='0'
                    step='100'
                    value={formData.ownerInfo?.breederFixedAmount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ownerInfo: {
                          ...formData.ownerInfo,
                          breederFixedAmount: parseFloat(e.target.value) || undefined,
                        },
                      })
                    }
                    placeholder='0.00'
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor='ownerNotes'>Revenue Split Notes</Label>
              <Textarea
                id='ownerNotes'
                value={formData.ownerInfo?.notes || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ownerInfo: {
                      ...formData.ownerInfo,
                      notes: e.target.value,
                    },
                  })
                }
                placeholder='Any notes about the revenue split arrangement'
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='litterNotes'>Litter Notes</Label>
            <Textarea
              id='litterNotes'
              value={formData.litterNotes || ''}
              onChange={(e) =>
                setFormData({ ...formData, litterNotes: e.target.value })
              }
              placeholder='Any notes about this litter'
              rows={3}
            />
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit'>
              {litter ? 'Update Litter' : 'Create Litter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
