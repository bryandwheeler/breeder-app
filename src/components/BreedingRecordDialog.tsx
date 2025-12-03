import { useState, useEffect } from 'react';
import { useDogStore } from '@/store/dogStore';
import { useHeatCycleStore } from '@/store/heatCycleStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { searchDogs, type DogSearchResult } from '@/lib/kennelSearch';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BreedingRecordDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dogId: string;
  heatCycleId: string | null;
}

export function BreedingRecordDialog({ open, setOpen, dogId, heatCycleId }: BreedingRecordDialogProps) {
  const { currentUser } = useAuth();
  const { dogs } = useDogStore();
  const { addBreedingRecord } = useHeatCycleStore();

  const [studSource, setStudSource] = useState<'own' | 'external'>('external');
  const [studId, setStudId] = useState('');
  const [studName, setStudName] = useState('');
  const [breedingDate, setBreedingDate] = useState('');
  const [method, setMethod] = useState<'natural' | 'ai' | 'surgical_ai'>('natural');
  const [aiDetails, setAiDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // External stud search state
  const [studSearchTerm, setStudSearchTerm] = useState('');
  const [studSearching, setStudSearching] = useState(false);
  const [studSearchResults, setStudSearchResults] = useState<DogSearchResult[]>([]);
  const [externalStud, setExternalStud] = useState<DogSearchResult | null>(null);

  // Get male dogs from the kennel
  const maleDogs = dogs.filter((dog) => dog.sex === 'male' && !dog.isDeceased);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setStudSource('external');
      setStudId('');
      setStudName('');
      setBreedingDate('');
      setMethod('natural');
      setAiDetails('');
      setNotes('');
      setExternalStud(null);
      setStudSearchTerm('');
      setStudSearchResults([]);
    }
  }, [open]);

  const handleStudSearch = async () => {
    if (!studSearchTerm.trim() || !currentUser) return;

    setStudSearching(true);
    setStudSearchResults([]);

    try {
      const results = await searchDogs(studSearchTerm, currentUser.uid);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!heatCycleId) {
      alert('No heat cycle selected');
      return;
    }

    setSaving(true);

    try {
      let finalStudName = studName;

      // If using own stud, get the dog's name
      if (studSource === 'own' && studId) {
        const selectedStud = maleDogs.find((dog) => dog.id === studId);
        if (selectedStud) {
          finalStudName = selectedStud.registeredName || selectedStud.name;
        }
      } else if (studSource === 'external' && externalStud) {
        // If using external stud from search, get its name
        finalStudName = externalStud.dogName;
      }

      if (!finalStudName) {
        alert('Please select or enter a stud');
        setSaving(false);
        return;
      }

      await addBreedingRecord({
        dogId,
        heatCycleId,
        studId: studSource === 'own' ? studId : undefined,
        studName: finalStudName,
        breedingDate,
        method,
        aiDetails: method !== 'natural' ? aiDetails : undefined,
        notes,
      });

      setOpen(false);
    } catch (error) {
      console.error('Error saving breeding record:', error);
      alert('Failed to save breeding record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Breeding Record</DialogTitle>
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
              <Select value={studId} onValueChange={setStudId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a male dog" />
                </SelectTrigger>
                <SelectContent>
                  {maleDogs.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No male dogs in kennel
                    </SelectItem>
                  ) : (
                    maleDogs.map((dog) => (
                      <SelectItem key={dog.id} value={dog.id}>
                        {dog.registeredName || dog.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
