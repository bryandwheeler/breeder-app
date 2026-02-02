import { useState, useEffect } from 'react';
import { useDogStore } from '@breeder/firebase';
import { useHeatCycleStore } from '@breeder/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { searchDogs, type DogSearchResult } from '@/lib/kennelSearch';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { BreedingRecord, BreedingStatus } from '@breeder/types';

interface BreedingRecordDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dogId: string;
  heatCycleId: string | null;
  editingRecord?: BreedingRecord | null;
}

export function BreedingRecordDialog({ open, setOpen, dogId, heatCycleId, editingRecord }: BreedingRecordDialogProps) {
  const { currentUser } = useAuth();
  const { dogs, addLitter } = useDogStore();
  const { addBreedingRecord, updateBreedingRecord } = useHeatCycleStore();

  const [studSource, setStudSource] = useState<'own' | 'external'>('external');
  const [studId, setStudId] = useState('');
  const [studName, setStudName] = useState('');
  const [breedingDate, setBreedingDate] = useState('');
  const [method, setMethod] = useState<'natural' | 'ai' | 'surgical_ai'>('natural');
  const [aiDetails, setAiDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Tie/breeding success tracking
  const [tieSuccessful, setTieSuccessful] = useState(true);
  const [tieDuration, setTieDuration] = useState<number | ''>('');
  const [status, setStatus] = useState<BreedingStatus>('pending');

  // External stud search state
  const [studSearchTerm, setStudSearchTerm] = useState('');
  const [studSearching, setStudSearching] = useState(false);
  const [studSearchResults, setStudSearchResults] = useState<DogSearchResult[]>([]);
  const [externalStud, setExternalStud] = useState<DogSearchResult | null>(null);

  // Own kennel stud combobox state
  const [studComboboxOpen, setStudComboboxOpen] = useState(false);

  // Get active male dogs from the kennel
  const maleDogs = dogs.filter(
    (dog) => dog.sex === 'male' && !dog.isDeceased && dog.status === 'active'
  );

  useEffect(() => {
    if (open && editingRecord) {
      // Populate form with existing record data
      setBreedingDate(editingRecord.breedingDate);
      setMethod(editingRecord.method);
      setAiDetails(editingRecord.aiDetails || '');
      setNotes(editingRecord.notes || '');
      setStudName(editingRecord.studName);
      setTieSuccessful(editingRecord.tieSuccessful ?? true);
      setTieDuration(editingRecord.tieDuration || '');
      setStatus(editingRecord.status || 'pending');

      // Determine if using own kennel or external stud
      if (editingRecord.studId) {
        setStudSource('own');
        setStudId(editingRecord.studId);
      } else {
        setStudSource('external');
        setStudId('');
      }
    } else if (!open) {
      // Reset form when dialog closes
      setStudSource('external');
      setStudId('');
      setStudName('');
      setBreedingDate('');
      setMethod('natural');
      setAiDetails('');
      setNotes('');
      setTieSuccessful(true);
      setTieDuration('');
      setStatus('pending');
      setExternalStud(null);
      setStudSearchTerm('');
      setStudSearchResults([]);
      setStudComboboxOpen(false);
    }
  }, [open, editingRecord]);

  const handleStudSearch = async () => {
    if (!studSearchTerm.trim() || !currentUser) return;

    setStudSearching(true);
    setStudSearchResults([]);

    try {
      // Don't exclude own dogs - allow searching all dogs including own kennel
      const results = await searchDogs(studSearchTerm);
      const maleResults = results.filter(r => r.sex === 'male');

      if (maleResults.length > 0) {
        setStudSearchResults(maleResults);
      } else {
        toast({
          title: 'No males found',
          description: 'No male dogs found matching your search. Try different keywords.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching for stud:', error);
      toast({
        title: 'Search error',
        description: 'Failed to search for dogs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setStudSearching(false);
    }
  };

  // Calculate expected due date (63 days from breeding)
  const calculateExpectedDueDate = (breedingDateStr: string): string => {
    const breedingDateObj = new Date(breedingDateStr);
    const expectedDueDate = new Date(breedingDateObj);
    expectedDueDate.setDate(expectedDueDate.getDate() + 63);
    return expectedDueDate.toISOString().split('T')[0];
  };

  const createPendingLitter = async (
    damId: string,
    sireId: string | undefined,
    breedingDateStr: string,
    externalStud: DogSearchResult | null
  ): Promise<string | undefined> => {
    const expectedDateOfBirth = calculateExpectedDueDate(breedingDateStr);

    // Get the dam's name for the litter name
    const dam = dogs.find((d) => d.id === damId);
    const damName = dam?.name || 'Unknown';

    // Create litter data
    const litterData: any = {
      litterName: `${damName}'s ${new Date().getFullYear()} Litter`,
      damId,
      sireId: sireId || '',
      dateOfBirth: '', // Empty for pending litter
      expectedDateOfBirth,
      status: 'planned', // Start as 'planned', update to 'pregnant' after confirmation (~30 days)
      puppies: [],
      buyers: [],
    };

    // Add external sire info if applicable
    if (!sireId && externalStud) {
      litterData.externalSire = {
        name: externalStud.dogName,
        registrationNumber: externalStud.registrationNumber,
        breed: externalStud.breed,
        kennelName: externalStud.ownerKennel,
        breederName: externalStud.ownerBreederName,
      };
    }

    const litterId = await addLitter(litterData);
    return litterId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!heatCycleId) {
      toast({
        title: 'Error',
        description: 'No heat cycle selected',
        variant: 'destructive',
      });
      return;
    }

    if (!breedingDate) {
      toast({
        title: 'Error',
        description: 'Please select a breeding date',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      let finalStudName = studName;
      let finalStudId = undefined;

      // If using own stud, get the dog's name
      if (studSource === 'own') {
        if (!studId) {
          toast({
            title: 'Error',
            description: 'Please select a male dog from your kennel',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
        const selectedStud = maleDogs.find((dog) => dog.id === studId);
        if (selectedStud) {
          finalStudName = selectedStud.registeredName || selectedStud.name;
          finalStudId = studId;
        } else {
          toast({
            title: 'Error',
            description: 'Selected dog not found. Please try again.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
      } else if (studSource === 'external' && externalStud) {
        // If using external stud from search, get its name
        finalStudName = externalStud.dogName;
      }

      if (!finalStudName || finalStudName.trim() === '') {
        toast({
          title: 'Error',
          description: 'Please select or enter a stud name',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      // Calculate expected due date
      const expectedDueDate = calculateExpectedDueDate(breedingDate);

      const recordData: any = {
        dogId,
        heatCycleId,
        studName: finalStudName,
        breedingDate,
        method,
        notes,
        status: editingRecord ? status : 'pending', // New records start as pending
        tieSuccessful,
        expectedDueDate,
      };

      // Only add optional fields if they have values (Firestore doesn't allow undefined)
      if (finalStudId) {
        recordData.studId = finalStudId;
      }
      if (method !== 'natural' && aiDetails) {
        recordData.aiDetails = aiDetails;
      }
      if (method === 'natural' && tieDuration) {
        recordData.tieDuration = Number(tieDuration);
      }

      if (editingRecord) {
        // Update existing record
        await updateBreedingRecord(editingRecord.id, recordData);
        toast({
          title: 'Success',
          description: 'Breeding record updated successfully',
        });
      } else {
        // Create a pending litter for this breeding first
        const litterId = await createPendingLitter(dogId, finalStudId, breedingDate, externalStud);

        // Link the litter to the breeding record
        if (litterId) {
          recordData.litterId = litterId;
        }

        // Add new record
        await addBreedingRecord(recordData);

        toast({
          title: 'Success',
          description: 'Breeding record added and pending litter created',
        });
      }

      setOpen(false);
    } catch (error) {
      console.error('Error saving breeding record:', error);
      // Log detailed error info for debugging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      alert(`Failed to save breeding record:\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingRecord ? 'Edit Breeding Record' : 'Add Breeding Record'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="breedingDate">Breeding Date *</Label>
            <Input
              id="breedingDate"
              type="date"
              value={breedingDate}
              onChange={(e) => setBreedingDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Stud Source</Label>
            <RadioGroup value={studSource} onValueChange={(value: 'own' | 'external') => setStudSource(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="own" id="own" />
                <Label htmlFor="own" className="font-normal cursor-pointer">
                  From My Kennel
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="external" id="external" />
                <Label htmlFor="external" className="font-normal cursor-pointer">
                  External Stud
                </Label>
              </div>
            </RadioGroup>
          </div>

          {studSource === 'own' ? (
            <div className="space-y-2">
              <Label htmlFor="studId">Select Stud *</Label>
              <Popover open={studComboboxOpen} onOpenChange={setStudComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studComboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    {studId
                      ? maleDogs.find((dog) => dog.id === studId)?.registeredName ||
                        maleDogs.find((dog) => dog.id === studId)?.name ||
                        'Select a male dog'
                      : 'Select a male dog'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search studs..." />
                    <CommandList className="max-h-60">
                      <CommandEmpty>No active male dogs found.</CommandEmpty>
                      <CommandGroup>
                        {maleDogs.map((dog) => (
                          <CommandItem
                            key={dog.id}
                            value={`${dog.registeredName || ''} ${dog.name}`}
                            onSelect={() => {
                              setStudId(dog.id);
                              setStudComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                studId === dog.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{dog.registeredName || dog.name}</span>
                              {dog.registeredName && dog.name !== dog.registeredName && (
                                <span className="text-xs text-muted-foreground">
                                  Call name: {dog.name}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {maleDogs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active male dogs in your kennel. Add a male or use external stud.
                </p>
              )}
            </div>
          ) : externalStud ? (
            <div className="space-y-2">
              <Label>External Stud</Label>
              <div className='p-3 bg-muted rounded-lg'>
                <div className='flex items-start justify-between'>
                  <div>
                    <div className='font-bold'>{externalStud.dogName}</div>
                    <div className='text-sm text-muted-foreground'>
                      {externalStud.breed && <span>{externalStud.breed}</span>}
                      {externalStud.registrationNumber && <span> • {externalStud.registrationNumber}</span>}
                    </div>
                    <div className='text-sm text-muted-foreground mt-1'>
                      Owner: {externalStud.ownerKennel}
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setExternalStud(null);
                      setStudSearchResults([]);
                      setStudSearchTerm('');
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>External Stud</Label>
              <div className="space-y-2">
                <div className='flex gap-2'>
                  <Input
                    value={studSearchTerm}
                    onChange={(e) => setStudSearchTerm(e.target.value)}
                    placeholder='Search by name, reg #, kennel, or breeder...'
                    disabled={studSearching}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleStudSearch();
                      }
                    }}
                  />
                  <Button
                    type='button'
                    onClick={handleStudSearch}
                    disabled={studSearching || !studSearchTerm.trim()}
                    size='icon'
                  >
                    {studSearching ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
                  </Button>
                </div>

                {studSearchResults.length > 0 && (
                  <div className='border rounded-lg max-h-48 overflow-y-auto'>
                    <div className='text-sm font-medium p-2 bg-muted'>
                      Found {studSearchResults.length} male{studSearchResults.length !== 1 ? 's' : ''} - Click to select:
                    </div>
                    {studSearchResults.map((dog) => (
                      <button
                        key={dog.dogId}
                        type='button'
                        onClick={() => {
                          setExternalStud(dog);
                          setStudSearchResults([]);
                        }}
                        className='w-full text-left p-3 hover:bg-accent border-b last:border-b-0 transition-colors'
                      >
                        <div className='font-semibold'>{dog.dogName}</div>
                        <div className='text-sm text-muted-foreground'>
                          {dog.breed && <span>{dog.breed}</span>}
                          {dog.registrationNumber && <span> • {dog.registrationNumber}</span>}
                        </div>
                        <div className='text-xs text-muted-foreground mt-1'>
                          Owner: {dog.ownerKennel}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-sm text-muted-foreground">Or enter name manually:</div>
                <Input
                  id="studName"
                  value={studName}
                  onChange={(e) => setStudName(e.target.value)}
                  placeholder="Enter registered name or call name"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="method">Breeding Method *</Label>
            <Select value={method} onValueChange={(value: 'natural' | 'ai' | 'surgical_ai') => setMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="ai">Artificial Insemination (AI)</SelectItem>
                <SelectItem value="surgical_ai">Surgical AI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tie Success */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tieSuccessful"
              checked={tieSuccessful}
              onCheckedChange={(checked) => setTieSuccessful(checked === true)}
            />
            <Label htmlFor="tieSuccessful" className="font-normal cursor-pointer">
              {method === 'natural' ? 'Tie was successful' : 'Insemination was successful'}
            </Label>
          </div>

          {/* Tie Duration (for natural breeding) */}
          {method === 'natural' && (
            <div className="space-y-2">
              <Label htmlFor="tieDuration">Tie Duration (minutes)</Label>
              <Input
                id="tieDuration"
                type="number"
                min="1"
                max="60"
                value={tieDuration}
                onChange={(e) => setTieDuration(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="e.g., 15"
              />
              <p className="text-xs text-muted-foreground">
                Typical tie duration is 10-30 minutes
              </p>
            </div>
          )}

          {method !== 'natural' && (
            <div className="space-y-2">
              <Label htmlFor="aiDetails">AI Details</Label>
              <Textarea
                id="aiDetails"
                value={aiDetails}
                onChange={(e) => setAiDetails(e.target.value)}
                placeholder="Fresh, chilled, or frozen semen? Source details, etc."
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Breeding observations, timing, progesterone levels, etc."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Breeding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
