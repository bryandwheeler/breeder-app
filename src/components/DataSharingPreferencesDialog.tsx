import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DogSharingPreferences } from '@/types/dog';

interface DataSharingPreferencesDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dogName: string;
  requesterName: string;
  onApprove: (preferences: DogSharingPreferences, responseMessage?: string) => void;
}

const DEFAULT_PREFERENCES: DogSharingPreferences = {
  shareBasicInfo: true,
  shareRegistration: true,
  sharePhoto: true,
  shareDateOfBirth: true,
  sharePedigree: false,
  shareHealthTests: false,
  shareHealthRecords: false,
  shareVaccinations: false,
  shareDnaProfile: false,
  shareTitles: true,
  shareShows: false,
  shareBreedingHistory: false,
  shareBreedingRights: false,
  shareOwnerContact: false,
};

export function DataSharingPreferencesDialog({
  open,
  setOpen,
  dogName,
  requesterName,
  onApprove,
}: DataSharingPreferencesDialogProps) {
  const [preferences, setPreferences] = useState<DogSharingPreferences>(DEFAULT_PREFERENCES);
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = () => {
    onApprove(preferences, responseMessage || undefined);
    setOpen(false);
    setPreferences(DEFAULT_PREFERENCES);
    setResponseMessage('');
  };

  const updatePreference = (key: keyof DogSharingPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const preferenceGroups = [
    {
      title: 'Basic Information',
      description: 'Essential identifying information',
      items: [
        { key: 'shareBasicInfo' as const, label: 'Basic Info', description: 'Name, sex, breed, color' },
        { key: 'shareRegistration' as const, label: 'Registration', description: 'Registration numbers and papers' },
        { key: 'sharePhoto' as const, label: 'Photo', description: 'Dog photos' },
        { key: 'shareDateOfBirth' as const, label: 'Date of Birth', description: 'Birth date and age' },
      ],
    },
    {
      title: 'Pedigree & Lineage',
      description: 'Family tree and ancestry',
      items: [
        { key: 'sharePedigree' as const, label: 'Pedigree', description: 'Complete family tree' },
        { key: 'shareBreedingHistory' as const, label: 'Breeding History', description: 'Past litters and offspring' },
      ],
    },
    {
      title: 'Health Information',
      description: 'Medical records and test results',
      items: [
        { key: 'shareHealthTests' as const, label: 'Health Tests', description: 'OFA, genetic tests, etc.' },
        { key: 'shareHealthRecords' as const, label: 'Health Records', description: 'Vet visits and medical history' },
        { key: 'shareVaccinations' as const, label: 'Vaccinations', description: 'Vaccination records' },
        { key: 'shareDnaProfile' as const, label: 'DNA Profile', description: 'DNA test results and profile' },
      ],
    },
    {
      title: 'Achievements & Show History',
      description: 'Titles, awards, and show records',
      items: [
        { key: 'shareTitles' as const, label: 'Titles', description: 'Championships and titles earned' },
        { key: 'shareShows' as const, label: 'Show History', description: 'Complete show record' },
      ],
    },
    {
      title: 'Breeding & Contact',
      description: 'Breeding information and owner details',
      items: [
        { key: 'shareBreedingRights' as const, label: 'Breeding Rights', description: 'Breeding restrictions and rights' },
        { key: 'shareOwnerContact' as const, label: 'Owner Contact', description: 'Your contact information' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Approve Connection Request</DialogTitle>
          <DialogDescription>
            Select what information about {dogName} you want to share with {requesterName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {preferenceGroups.map((group) => (
            <div key={group.title} className="border rounded-lg p-4 bg-card">
              <div className="mb-3">
                <h4 className="font-semibold text-base text-foreground">{group.title}</h4>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4 p-2 rounded hover:bg-muted/50">
                    <div className="flex-1">
                      <Label htmlFor={item.key} className="font-medium cursor-pointer text-foreground">
                        {item.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                    <Switch
                      id={item.key}
                      checked={preferences[item.key]}
                      onCheckedChange={(checked) => updatePreference(item.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="responseMessage">Optional Message (Optional)</Label>
            <Textarea
              id="responseMessage"
              placeholder="Add a message to include with your approval..."
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Approve Connection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
