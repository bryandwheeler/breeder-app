import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConnectionStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useBreederStore } from '@breeder/firebase';
import { Loader2, Search } from 'lucide-react';
import { searchDogs, type DogSearchResult } from '@/lib/kennelSearch';

interface ConnectionRequestDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function ConnectionRequestDialog({ open, setOpen }: ConnectionRequestDialogProps) {
  const { currentUser } = useAuth();
  const profile = useBreederStore((state) => state.profile);
  const createConnectionRequest = useConnectionStore((state) => state.createConnectionRequest);

  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<DogSearchResult[]>([]);
  const [selectedDog, setSelectedDog] = useState<DogSearchResult | null>(null);
  const [purpose, setPurpose] = useState<'sire' | 'dam' | 'offspring' | 'relative' | 'reference'>('sire');
  const [purposeDetails, setPurposeDetails] = useState('');
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
        alert('No dogs found matching your search. Try searching by dog name, registration number, kennel name, or breeder name.');
      }
    } catch (error) {
      console.error('Error searching for dogs:', error);
      alert('Error searching for dogs. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectDog = (dog: DogSearchResult) => {
    setSelectedDog(dog);
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!selectedDog || !currentUser || !profile) return;

    setSubmitting(true);

    try {
      // Create the connection request
      const requestData: any = {
        requesterId: currentUser.uid,
        requesterKennelName: profile.kennelName || profile.breederName || 'Unknown',
        ownerId: selectedDog.ownerId,
        ownerKennelName: selectedDog.ownerKennel,
        dogId: selectedDog.dogId,
        dogName: selectedDog.dogName,
        purpose,
        requestDate: new Date().toISOString(),
      };

      // Only add optional fields if they have values
      if (selectedDog.registrationNumber) {
        requestData.dogRegistrationNumber = selectedDog.registrationNumber;
      }
      if (purposeDetails?.trim()) {
        requestData.purposeDetails = purposeDetails.trim();
      }
      if (message?.trim()) {
        requestData.message = message.trim();
      }

      await createConnectionRequest(requestData);

      // Notification and email are handled by Cloud Functions (onConnectionRequestCreated)

      alert('Connection request sent successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating connection request:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedDog(null);
    setPurpose('sire');
    setPurposeDetails('');
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Dog Connection</DialogTitle>
          <DialogDescription>
            Search for a dog by name, registration number, kennel name, or breeder name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-2">
            <Label htmlFor="search">Search for Dog</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Dog name, reg #, kennel, or breeder..."
                disabled={searching || !!selectedDog}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !searching && searchTerm.trim() && !selectedDog) {
                    handleSearch();
                  }
                }}
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !searchTerm.trim() || !!selectedDog}
                size="icon"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && !selectedDog && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              <div className="text-sm font-medium p-2 bg-muted">
                Found {searchResults.length} dog{searchResults.length !== 1 ? 's' : ''} - Click to select:
              </div>
              {searchResults.map((dog) => (
                <button
                  key={dog.dogId}
                  onClick={() => handleSelectDog(dog)}
                  className="w-full text-left p-3 hover:bg-accent border-b last:border-b-0 transition-colors"
                >
                  <div className="font-semibold">{dog.dogName}</div>
                  <div className="text-sm text-muted-foreground">
                    {dog.breed && <span>{dog.breed}</span>}
                    {dog.sex && <span> • {dog.sex}</span>}
                    {dog.registrationNumber && <span> • {dog.registrationNumber}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Owner: {dog.ownerKennel}
                    {dog.ownerBreederName && ` (${dog.ownerBreederName})`}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Dog Display */}
          {selectedDog && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-muted-foreground">Selected Dog</div>
                  <div className="text-lg font-bold">{selectedDog.dogName}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedDog.breed && <span>{selectedDog.breed}</span>}
                    {selectedDog.sex && <span> • {selectedDog.sex}</span>}
                  </div>
                  {selectedDog.registrationNumber && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Reg: {selectedDog.registrationNumber}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">
                    Owner: {selectedDog.ownerKennel}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDog(null);
                    setSearchResults([]);
                  }}
                >
                  Change
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="purpose">Connection Purpose</Label>
                  <Select value={purpose} onValueChange={(value: any) => setPurpose(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sire">Sire (Male used for breeding)</SelectItem>
                      <SelectItem value="dam">Dam (Female used for breeding)</SelectItem>
                      <SelectItem value="offspring">Offspring (Puppy from my litter)</SelectItem>
                      <SelectItem value="relative">Relative (Related dog)</SelectItem>
                      <SelectItem value="reference">Reference (For pedigree)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="purposeDetails">Purpose Details (Optional)</Label>
                  <Input
                    id="purposeDetails"
                    value={purposeDetails}
                    onChange={(e) => setPurposeDetails(e.target.value)}
                    placeholder="e.g., Used as sire for Litter #123"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message to Owner</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Introduce yourself and explain why you'd like to connect..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          {selectedDog && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
