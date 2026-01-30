import { useState, useEffect } from 'react';
import { useDogStore } from '@breeder/firebase';
import { useStudJobStore } from '@/store/studJobStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { StudJob, StudJobBreeding, StudJobAddOn } from '@breeder/types';
import { toast } from '@/hooks/use-toast';
import { searchDogs, type DogSearchResult } from '@/lib/kennelSearch';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Loader2, Plus, Trash2, FileText } from 'lucide-react';
import { ContactSearchSelector } from './ContactSearchSelector';

interface StudJobDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  editingJob?: StudJob | null;
  preselectedStudId?: string;
}

export function StudJobDialog({ open, setOpen, editingJob, preselectedStudId }: StudJobDialogProps) {
  const { currentUser } = useAuth();
  const { dogs } = useDogStore();
  const { addStudJob, updateStudJob, getAllStudJobs } = useStudJobStore();

  // Get all stud jobs for rebreed selection
  const allStudJobs = getAllStudJobs();

  // Get active male studs and female dogs from the kennel
  // Only show males that are marked as 'active-stud' in breeding status
  const maleDogs = dogs.filter((dog) =>
    dog.sex === 'male' &&
    !dog.isDeceased &&
    dog.breedingStatus === 'active-stud'
  );
  const femaleDogs = dogs.filter((dog) => dog.sex === 'female' && !dog.isDeceased);

  const [studId, setStudId] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'>('pending');
  const [femaleSource, setFemaleSource] = useState<'own' | 'external'>('external');
  const [femaleDogName, setFemaleDogName] = useState('');
  const [femaleDogId, setFemaleDogId] = useState('');
  const [contactId, setContactId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [breedings, setBreedings] = useState<StudJobBreeding[]>([]);
  const [puppyCount, setPuppyCount] = useState('');
  const [studFee, setStudFee] = useState('');
  const [studFeePaid, setStudFeePaid] = useState(false);
  const [additionalBreedingFee, setAdditionalBreedingFee] = useState('');
  const [additionalBreedingsPaid, setAdditionalBreedingsPaid] = useState(false);
  const [pickOfLitter, setPickOfLitter] = useState(false);
  const [isRebreed, setIsRebreed] = useState(false);
  const [rebreedOriginalJobId, setRebreedOriginalJobId] = useState('');
  const [addOns, setAddOns] = useState<StudJobAddOn[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Female dog search state
  const [femaleSearchTerm, setFemaleSearchTerm] = useState('');
  const [femaleSearching, setFemaleSearching] = useState(false);
  const [femaleSearchResults, setFemaleSearchResults] = useState<DogSearchResult[]>([]);

  useEffect(() => {
    if (open && editingJob) {
      // Populate form with existing job data
      setStudId(editingJob.studId);
      setStatus(editingJob.status);
      setFemaleDogName(editingJob.femaleDogName);
      setFemaleDogId(editingJob.femaleDogId || '');

      // Determine if using own kennel or external female
      if (editingJob.femaleDogId && femaleDogs.some(d => d.id === editingJob.femaleDogId)) {
        setFemaleSource('own');
      } else {
        setFemaleSource('external');
      }

      setContactId(editingJob.contactId || '');
      setScheduledDate(editingJob.scheduledDate || '');
      setBreedings(editingJob.breedings || []);
      setPuppyCount(editingJob.puppyCount?.toString() || '');
      setStudFee(editingJob.studFee?.toString() || '');
      setStudFeePaid(editingJob.studFeePaid || false);
      setAdditionalBreedingFee(editingJob.additionalBreedingFee?.toString() || '');
      setAdditionalBreedingsPaid(editingJob.additionalBreedingsPaid || false);
      setPickOfLitter(editingJob.pickOfLitter || false);
      setIsRebreed(editingJob.isRebreed || false);
      setRebreedOriginalJobId(editingJob.rebreedOriginalJobId || '');
      setAddOns(editingJob.addOns || []);
      setNotes(editingJob.notes || '');
    } else if (open && !editingJob) {
      // New job - use preselected stud if provided
      if (preselectedStudId) {
        setStudId(preselectedStudId);
      }
    } else if (!open) {
      // Reset form when dialog closes
      setStudId('');
      setStatus('pending');
      setFemaleSource('external');
      setFemaleDogName('');
      setFemaleDogId('');
      setContactId('');
      setScheduledDate('');
      setBreedings([]);
      setPuppyCount('');
      setStudFee('');
      setStudFeePaid(false);
      setAdditionalBreedingFee('');
      setAdditionalBreedingsPaid(false);
      setPickOfLitter(false);
      setIsRebreed(false);
      setRebreedOriginalJobId('');
      setAddOns([]);
      setNotes('');
      setFemaleSearchTerm('');
      setFemaleSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingJob, preselectedStudId]);

  // Breeding management
  const addBreeding = () => {
    const newBreeding: StudJobBreeding = {
      id: crypto.randomUUID(),
      date: '',
      method: 'natural',
      status: 'scheduled',
      notes: '',
    };
    setBreedings([...breedings, newBreeding]);
  };

  const updateBreeding = (id: string, updates: Partial<StudJobBreeding>) => {
    setBreedings(breedings.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBreeding = (id: string) => {
    setBreedings(breedings.filter(b => b.id !== id));
  };

  // Add-on service management
  const addAddOn = () => {
    const newAddOn: StudJobAddOn = {
      id: crypto.randomUUID(),
      service: '',
      cost: 0,
      paid: false,
      notes: '',
    };
    setAddOns([...addOns, newAddOn]);
  };

  const updateAddOn = (id: string, updates: Partial<StudJobAddOn>) => {
    setAddOns(addOns.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAddOn = (id: string) => {
    setAddOns(addOns.filter(a => a.id !== id));
  };

  const handleFemaleSearch = async () => {
    if (!femaleSearchTerm.trim() || !currentUser) return;

    setFemaleSearching(true);
    setFemaleSearchResults([]);

    try {
      const results = await searchDogs(femaleSearchTerm);
      const femaleResults = results.filter((r) => r.sex === 'female');

      if (femaleResults.length > 0) {
        setFemaleSearchResults(femaleResults);
      } else {
        toast({
          title: 'No females found',
          description: 'No female dogs found matching your search. Try different keywords.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching for female dog:', error);
      toast({
        title: 'Search error',
        description: 'Failed to search for dogs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFemaleSearching(false);
    }
  };

  const selectFemale = (dog: DogSearchResult) => {
    setFemaleDogName(dog.dogName);
    setFemaleDogId(dog.dogId);
    setFemaleSearchResults([]);
    setFemaleSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studId) {
      toast({
        title: 'Error',
        description: 'Please select a stud dog',
        variant: 'destructive',
      });
      return;
    }

    if (!femaleDogName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the female dog name',
        variant: 'destructive',
      });
      return;
    }

    if (!contactId) {
      toast({
        title: 'Error',
        description: 'Please select a breeder contact',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const jobData: any = {
        studId,
        status,
        femaleDogName: femaleDogName.trim(),
        contactId: contactId,
        breedings: breedings,
        notes: notes.trim(),
      };

      // Only add optional fields if they have values
      if (femaleDogId) jobData.femaleDogId = femaleDogId;
      if (scheduledDate) jobData.scheduledDate = scheduledDate;
      if (puppyCount) jobData.puppyCount = parseInt(puppyCount);
      if (studFee) jobData.studFee = parseFloat(studFee);
      if (studFeePaid) jobData.studFeePaid = studFeePaid;
      if (additionalBreedingFee) jobData.additionalBreedingFee = parseFloat(additionalBreedingFee);
      if (additionalBreedingsPaid) jobData.additionalBreedingsPaid = additionalBreedingsPaid;
      if (pickOfLitter) jobData.pickOfLitter = pickOfLitter;
      if (isRebreed) jobData.isRebreed = isRebreed;
      if (rebreedOriginalJobId) jobData.rebreedOriginalJobId = rebreedOriginalJobId;
      if (addOns && addOns.length > 0) jobData.addOns = addOns;

      if (editingJob) {
        await updateStudJob(editingJob.id, jobData);
        toast({
          title: 'Success',
          description: 'Stud job updated successfully',
        });
      } else {
        await addStudJob(jobData);
        toast({
          title: 'Success',
          description: 'Stud job added successfully',
        });
      }

      setOpen(false);
    } catch (error) {
      console.error('Error saving stud job:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save stud job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingJob ? 'Edit Stud Job' : 'Add Stud Job'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studId">Stud Dog *</Label>
              <Select value={studId} onValueChange={setStudId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select stud" />
                </SelectTrigger>
                <SelectContent>
                  {maleDogs.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No active studs in kennel
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

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Female Dog *</Label>
            <RadioGroup value={femaleSource} onValueChange={(value: 'own' | 'external') => {
              setFemaleSource(value);
              setFemaleDogName('');
              setFemaleDogId('');
              setFemaleSearchResults([]);
            }}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="own" id="own-female" />
                <Label htmlFor="own-female" className="cursor-pointer font-normal">
                  From my kennel
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="external" id="external-female" />
                <Label htmlFor="external-female" className="cursor-pointer font-normal">
                  External (search or enter manually)
                </Label>
              </div>
            </RadioGroup>

            {femaleSource === 'own' ? (
              <Select value={femaleDogId} onValueChange={(value) => {
                setFemaleDogId(value);
                const selectedFemale = femaleDogs.find(d => d.id === value);
                if (selectedFemale) {
                  setFemaleDogName(selectedFemale.registeredName || selectedFemale.name);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select female from kennel" />
                </SelectTrigger>
                <SelectContent>
                  {femaleDogs.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No female dogs in kennel
                    </SelectItem>
                  ) : (
                    femaleDogs.map((dog) => (
                      <SelectItem key={dog.id} value={dog.id}>
                        {dog.registeredName || dog.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={femaleSearchTerm}
                    onChange={(e) => setFemaleSearchTerm(e.target.value)}
                    placeholder="Search by name or kennel..."
                    disabled={femaleSearching}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFemaleSearch();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleFemaleSearch}
                    disabled={femaleSearching || !femaleSearchTerm.trim()}
                    size="icon"
                  >
                    {femaleSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {femaleSearchResults.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    <div className="text-sm font-medium p-2 bg-muted">
                      Found {femaleSearchResults.length} female{femaleSearchResults.length !== 1 ? 's' : ''} - Click to
                      select:
                    </div>
                    {femaleSearchResults.map((dog) => (
                      <button
                        key={dog.dogId}
                        type="button"
                        onClick={() => selectFemale(dog)}
                        className="w-full text-left p-3 hover:bg-accent border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-semibold">{dog.dogName}</div>
                        <div className="text-sm text-muted-foreground">
                          {dog.breed && <span>{dog.breed}</span>}
                          {dog.registrationNumber && <span> • {dog.registrationNumber}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Owner: {dog.ownerKennel}</div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-sm text-muted-foreground">Or enter name manually:</div>
                <Input
                  value={femaleDogName}
                  onChange={(e) => setFemaleDogName(e.target.value)}
                  placeholder="Enter female dog name"
                  required={femaleSource === 'external'}
                />
              </>
            )}
          </div>

          <div className="space-y-2">
            <ContactSearchSelector
              value={contactId}
              onChange={setContactId}
              roles={['stud_job_customer', 'breeder', 'customer']}
              label="Breeder / Client Contact"
              placeholder="Search for breeder by name, email, or phone..."
              allowCreate={true}
              required={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Scheduled Date (optional)</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">For planning/reservations before actual breeding</p>
          </div>

          {/* Breedings Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Breeding Dates</Label>
                <p className="text-sm text-muted-foreground">Track all breeding attempts</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addBreeding}>
                <Plus className="h-4 w-4 mr-1" />
                Add Breeding
              </Button>
            </div>

            {breedings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No breedings recorded yet. Click "Add Breeding" to track breeding dates.
              </p>
            ) : (
              <div className="space-y-4">
                {breedings.map((breeding, index) => (
                  <Card key={breeding.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Breeding #{index + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBreeding(breeding.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Date *</Label>
                          <Input
                            type="date"
                            value={breeding.date}
                            onChange={(e) => updateBreeding(breeding.id, { date: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Method</Label>
                          <Select
                            value={breeding.method}
                            onValueChange={(value: any) => updateBreeding(breeding.id, { method: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="natural">Natural</SelectItem>
                              <SelectItem value="ai">AI</SelectItem>
                              <SelectItem value="surgical_ai">Surgical AI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select
                            value={breeding.status || 'scheduled'}
                            onValueChange={(value: any) => updateBreeding(breeding.id, { status: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="no_show">No Show</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {breeding.method !== 'natural' && (
                        <div className="space-y-1">
                          <Label className="text-xs">AI Details</Label>
                          <Input
                            value={breeding.aiDetails || ''}
                            onChange={(e) => updateBreeding(breeding.id, { aiDetails: e.target.value })}
                            placeholder="Fresh, chilled, or frozen semen..."
                            className="h-9"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Notes</Label>
                        <Textarea
                          value={breeding.notes || ''}
                          onChange={(e) => updateBreeding(breeding.id, { notes: e.target.value })}
                          placeholder="Any notes about this breeding..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Financial Section */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base">Financial & Litter Info</Label>

            {/* Rebreed Section - at top of financial since it affects fees */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRebreed"
                  checked={isRebreed}
                  onCheckedChange={(checked) => {
                    const isChecked = checked as boolean;
                    setIsRebreed(isChecked);
                    if (isChecked) {
                      // Auto-set fee to 0 for rebreeds
                      setStudFee('0');
                      setStudFeePaid(true);
                    }
                    if (!isChecked) {
                      setRebreedOriginalJobId('');
                    }
                  }}
                />
                <Label htmlFor="isRebreed" className="cursor-pointer font-normal">
                  Guaranteed Rebreed (no charge - previous breeding didn't result in pregnancy)
                </Label>
              </div>

              {isRebreed && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="rebreedOriginalJobId">Original Failed Stud Job</Label>
                  <Select
                    value={rebreedOriginalJobId || 'none'}
                    onValueChange={(val) => setRebreedOriginalJobId(val === 'none' ? '' : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select original job (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not linked / Unknown</SelectItem>
                      {allStudJobs
                        .filter(job =>
                          job.id !== editingJob?.id && // Not the current job
                          job.studId === studId && // Same stud
                          job.status === 'completed' && // Must be completed
                          (!job.puppyCount || job.puppyCount === 0) // No puppies (failed)
                        )
                        .map(job => {
                          const studDog = dogs.find(d => d.id === job.studId);
                          const studName = studDog?.name || 'Unknown';
                          const dateStr = job.breedings?.[0]?.date || job.scheduledDate || '';
                          const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : 'No date';
                          return (
                            <SelectItem key={job.id} value={job.id}>
                              {job.femaleDogName} × {studName} ({formattedDate})
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Link this rebreed to the original stud job that didn't result in pregnancy
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studFee">Base Stud Fee ($)</Label>
                <Input
                  id="studFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={studFee}
                  onChange={(e) => setStudFee(e.target.value)}
                  placeholder="0.00"
                  disabled={isRebreed}
                />
                {isRebreed && (
                  <p className="text-xs text-muted-foreground">Fee is $0 for guaranteed rebreeds</p>
                )}
              </div>

              <div className="space-y-2 pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="studFeePaid"
                    checked={studFeePaid}
                    onCheckedChange={(checked) => setStudFeePaid(checked as boolean)}
                    disabled={isRebreed}
                  />
                  <Label htmlFor="studFeePaid" className="cursor-pointer font-normal">
                    Base Fee Paid
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="additionalBreedingFee">Additional Breeding Fee ($)</Label>
                <Input
                  id="additionalBreedingFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={additionalBreedingFee}
                  onChange={(e) => setAdditionalBreedingFee(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Cost per additional breeding attempt</p>
              </div>

              <div className="space-y-2 pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="additionalBreedingsPaid"
                    checked={additionalBreedingsPaid}
                    onCheckedChange={(checked) => setAdditionalBreedingsPaid(checked as boolean)}
                  />
                  <Label htmlFor="additionalBreedingsPaid" className="cursor-pointer font-normal">
                    Additional Fees Paid
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pickOfLitter"
                checked={pickOfLitter}
                onCheckedChange={(checked) => setPickOfLitter(checked as boolean)}
              />
              <Label htmlFor="pickOfLitter" className="cursor-pointer font-normal">
                Pick of the Litter Agreement
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="puppyCount">Puppy Count (if known)</Label>
              <Input
                id="puppyCount"
                type="number"
                min="0"
                value={puppyCount}
                onChange={(e) => setPuppyCount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Add-On Services Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Add-On Services</Label>
                <p className="text-sm text-muted-foreground">Additional services and fees</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addAddOn}>
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </div>

            {addOns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No add-on services. Click "Add Service" to track additional fees.
              </p>
            ) : (
              <div className="space-y-3">
                {addOns.map((addOn) => (
                  <Card key={addOn.id} className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Service</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAddOn(addOn.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs">Service Name *</Label>
                          <Input
                            value={addOn.service}
                            onChange={(e) => updateAddOn(addOn.id, { service: e.target.value })}
                            placeholder="e.g., Boarding, Transport, etc."
                            className="h-9"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Cost ($) *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={addOn.cost}
                            onChange={(e) => updateAddOn(addOn.id, { cost: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            className="h-9"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`paid-${addOn.id}`}
                          checked={addOn.paid}
                          onCheckedChange={(checked) => updateAddOn(addOn.id, { paid: checked as boolean })}
                        />
                        <Label htmlFor={`paid-${addOn.id}`} className="text-xs cursor-pointer font-normal">
                          Paid
                        </Label>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Notes</Label>
                        <Textarea
                          value={addOn.notes || ''}
                          onChange={(e) => updateAddOn(addOn.id, { notes: e.target.value })}
                          placeholder="Details about this service..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or details..."
              rows={3}
            />
          </div>

          {/* Contract Section */}
          {editingJob && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Service Contract</Label>
                  <p className="text-sm text-muted-foreground">Generate and manage stud service agreement</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: 'Coming Soon',
                      description: 'Contract management feature will be available soon. Save this stud job first, then you can generate a contract from the main Stud Jobs page.',
                    });
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {editingJob?.contract ? 'View Contract' : 'Generate Contract'}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingJob ? 'Update Stud Job' : 'Add Stud Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
