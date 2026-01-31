import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
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
import { Combobox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { useDogStore, useTaskStore } from '@breeder/firebase';
import { Litter } from '@breeder/types';
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
  const { dogs, addLitter, updateLitter, litters } = useDogStore();
  const { generateAllLitterTasks } = useTaskStore();

  // Filter for active breeding dogs only
  const activeDams = dogs.filter(
    (d) => d.sex === 'female' && d.breedingStatus === 'active-dam'
  );
  const activeStuds = dogs.filter(
    (d) => d.sex === 'male' && d.breedingStatus === 'active-stud'
  );

  // Create options for combobox with name and breed info
  const damOptions = activeDams.map((dog) => ({
    value: dog.id,
    label: `${dog.name}${dog.breed ? ` (${dog.breed})` : ''}`,
  }));

  const studOptions = activeStuds.map((dog) => ({
    value: dog.id,
    label: `${dog.name}${dog.breed ? ` (${dog.breed})` : ''}`,
  }));

  const [formData, setFormData] = useState<Omit<Litter, 'id'>>({
    litterName: '',
    damId: '',
    sireId: '',
    dateOfBirth: '',
    status: 'planned',
    puppies: [],
    buyers: [],
    dewClawRemoval: false,
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

  // Puppy count state
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);

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
        dewClawRemoval: litter.dewClawRemoval,
      });
      // Calculate existing puppy counts
      const males = litter.puppies?.filter(p => p.sex === 'male').length || 0;
      const females = litter.puppies?.filter(p => p.sex === 'female').length || 0;
      setMaleCount(males);
      setFemaleCount(females);
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
      setMaleCount(0);
      setFemaleCount(0);
    }
  }, [litter, open]);

  const generatePuppies = () => {
    const existingPuppies = formData.puppies || [];
    const existingMales = existingPuppies.filter(p => p.sex === 'male');
    const existingFemales = existingPuppies.filter(p => p.sex === 'female');

    const puppies: typeof existingPuppies = [];

    // Keep existing male puppies, add or remove as needed
    for (let i = 0; i < maleCount; i++) {
      if (existingMales[i]) {
        puppies.push(existingMales[i]);
      } else {
        puppies.push({
          id: crypto.randomUUID(),
          tempName: `Male ${i + 1}`,
          sex: 'male',
          color: '',
          photos: [],
          status: 'available',
          healthTests: [],
          shotRecords: [],
          weightHistory: [],
        });
      }
    }

    // Keep existing female puppies, add or remove as needed
    for (let i = 0; i < femaleCount; i++) {
      if (existingFemales[i]) {
        puppies.push(existingFemales[i]);
      } else {
        puppies.push({
          id: crypto.randomUUID(),
          tempName: `Female ${i + 1}`,
          sex: 'female',
          color: '',
          photos: [],
          status: 'available',
          healthTests: [],
          shotRecords: [],
          weightHistory: [],
        });
      }
    }

    return puppies;
  };

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

    // Generate puppy records based on counts
    const puppies = generatePuppies();

    // Prepare litter data with external sire info if applicable
    const litterData = { ...formData, puppies };
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
      toast({
        title: 'Litter updated',
        description: `Litter now has ${puppies.length} puppy record${puppies.length !== 1 ? 's' : ''}.`,
      });
    } else {
      await addLitter(litterData);

      // Auto-generate tasks if the litter has a birth date
      if (formData.dateOfBirth && currentUser) {
        // Wait a moment for the litter to be added to Firestore and synced
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find the newly created litter by matching dam, sire, and date
        const latestLitters = useDogStore.getState().litters;
        const newLitter = latestLitters.find(
          l => l.damId === formData.damId &&
               l.dateOfBirth === formData.dateOfBirth &&
               (l.sireId === formData.sireId || (!l.sireId && externalSire))
        );

        if (newLitter) {
          try {
            await generateAllLitterTasks(
              newLitter.id,
              currentUser.uid,
              formData.dateOfBirth,
              formData.litterName,
              { dewClawRemoval: formData.dewClawRemoval }
            );
            toast({
              title: 'Litter created with care schedule',
              description: `Created litter with ${puppies.length} puppy record${puppies.length !== 1 ? 's' : ''} and daily care tasks.`,
            });
          } catch (error) {
            console.error('Error generating tasks:', error);
            toast({
              title: 'Litter created',
              description: `Created litter with ${puppies.length} puppy record${puppies.length !== 1 ? 's' : ''}. You can generate care tasks from the litter page.`,
            });
          }
        } else {
          toast({
            title: 'Litter created',
            description: `Created litter with ${puppies.length} puppy record${puppies.length !== 1 ? 's' : ''}.`,
          });
        }
      } else {
        toast({
          title: 'Litter created',
          description: `Created litter with ${puppies.length} puppy record${puppies.length !== 1 ? 's' : ''}.`,
        });
      }
    }

    setOpen(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogContent className='md:max-w-2xl'>
        <ResponsiveDialogHeader onClose={() => setOpen(false)}>
          <ResponsiveDialogTitle>
            {litter ? 'Edit Litter' : 'Plan New Litter'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
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

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor='damId'>Dam (Active Dams) *</Label>
                </TooltipTrigger>
                <TooltipContent>
                  Select from active dams. To add more, set a female dog's breeding status to "Active Dam".
                </TooltipContent>
              </Tooltip>
              <Combobox
                options={damOptions}
                value={formData.damId}
                onValueChange={(value) =>
                  setFormData({ ...formData, damId: value })
                }
                placeholder='Search active dams...'
                searchPlaceholder='Type to search...'
                emptyText={activeDams.length === 0 ? 'No active dams. Set a female dog\'s breeding status to "Active Dam".' : 'No matching dams found.'}
              />
              {activeDams.length === 0 && (
                <p className='text-xs text-amber-600 mt-1'>
                  No active dams found. Update a female dog's breeding status to "Active Dam".
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label>Sire (Active Studs) *</Label>
                </TooltipTrigger>
                <TooltipContent>
                  Choose from active studs or search for an external sire
                </TooltipContent>
              </Tooltip>

              {!sireSearchMode && !externalSire ? (
                <div className='space-y-2'>
                  <Combobox
                    options={studOptions}
                    value={formData.sireId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sireId: value })
                    }
                    placeholder='Search active studs...'
                    searchPlaceholder='Type to search...'
                    emptyText={activeStuds.length === 0 ? 'No active studs. Set a male dog\'s breeding status to "Active Stud".' : 'No matching studs found.'}
                  />
                  {activeStuds.length === 0 && (
                    <p className='text-xs text-amber-600'>
                      No active studs found. Update a male dog's breeding status to "Active Stud".
                    </p>
                  )}
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

          {/* Puppy Count Section */}
          <div className='space-y-3 p-4 border rounded-lg bg-muted/30'>
            <h3 className='font-semibold text-sm'>Puppy Count</h3>
            <p className='text-xs text-muted-foreground'>
              {litter
                ? 'Update the count to add or remove puppy records. Existing puppies will be preserved.'
                : 'Specify how many puppies to create records for. You can edit individual details later.'}
            </p>
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='maleCount'>Male Puppies</Label>
                <Input
                  id='maleCount'
                  type='number'
                  min='0'
                  value={maleCount}
                  onChange={(e) => setMaleCount(parseInt(e.target.value) || 0)}
                  placeholder='0'
                />
              </div>
              <div>
                <Label htmlFor='femaleCount'>Female Puppies</Label>
                <Input
                  id='femaleCount'
                  type='number'
                  min='0'
                  value={femaleCount}
                  onChange={(e) => setFemaleCount(parseInt(e.target.value) || 0)}
                  placeholder='0'
                />
              </div>
              <div>
                <Label>Total Puppies</Label>
                <div className='h-10 flex items-center justify-center font-semibold text-lg border rounded-md bg-background'>
                  {maleCount + femaleCount}
                </div>
              </div>
            </div>

            {/* Dew Claw Removal Option */}
            <div className='flex items-center space-x-2 pt-2'>
              <Checkbox
                id='dewClawRemoval'
                checked={formData.dewClawRemoval || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, dewClawRemoval: checked as boolean })
                }
              />
              <Label htmlFor='dewClawRemoval' className='cursor-pointer font-normal text-sm'>
                Schedule dew claw removal (creates task for days 2-5)
              </Label>
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

          {/* Desktop buttons */}
          <div className='hidden sm:flex justify-end gap-2 pt-4'>
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
        </ResponsiveDialogBody>
        {/* Mobile footer with action buttons */}
        <ResponsiveDialogFooter className='sm:hidden'>
          <Button
            type='button'
            variant='outline'
            className='flex-1'
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type='button'
            className='flex-1'
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
          >
            {litter ? 'Update Litter' : 'Create Litter'}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
