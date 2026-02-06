import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dog, DogSharingPreferences } from '@breeder/types';
import { ArrowRight, Check, Plus, Equal } from 'lucide-react';

interface DataMergeDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  existingDog: Dog;
  sharedData: Record<string, any>;
  sharingPreferences: DogSharingPreferences;
  onMergeComplete: (mergedFields: Partial<Dog>) => void;
}

interface MergeField {
  key: string;
  label: string;
  category: string;
  localValue: any;
  externalValue: any;
  status: 'new' | 'same' | 'conflict' | 'local_only';
}

function displayValue(value: any): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return `${value.length} item${value.length !== 1 ? 's' : ''}`;
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 60) + '...';
  return String(value);
}

function hasValue(value: any): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function valuesMatch(a: any, b: any): boolean {
  if (!hasValue(a) && !hasValue(b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) return JSON.stringify(a) === JSON.stringify(b);
  if (typeof a === 'object' && typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);
  return String(a) === String(b);
}

const FIELD_DEFINITIONS: { key: string; label: string; category: string }[] = [
  // Basic Info
  { key: 'name', label: 'Name', category: 'Basic Information' },
  { key: 'breed', label: 'Breed', category: 'Basic Information' },
  { key: 'sex', label: 'Sex', category: 'Basic Information' },
  { key: 'color', label: 'Color', category: 'Basic Information' },
  // Registration
  { key: 'registrationNumber', label: 'Registration Number', category: 'Registration' },
  { key: 'microchipNumber', label: 'Microchip Number', category: 'Registration' },
  // Date of Birth
  { key: 'dateOfBirth', label: 'Date of Birth', category: 'Date of Birth' },
  // Photos
  { key: 'profileImage', label: 'Profile Image', category: 'Photos' },
  // Pedigree
  { key: 'sireName', label: 'Sire Name', category: 'Pedigree' },
  { key: 'damName', label: 'Dam Name', category: 'Pedigree' },
  // Health
  { key: 'healthTests', label: 'Health Tests', category: 'Health' },
  { key: 'dnaProfile', label: 'DNA Profile', category: 'Health' },
  // Vaccinations
  { key: 'shotRecords', label: 'Vaccination Records', category: 'Vaccinations' },
  // Breeding
  { key: 'breedingStatus', label: 'Breeding Status', category: 'Breeding' },
];

export function DataMergeDialog({
  open,
  setOpen,
  existingDog,
  sharedData,
  sharingPreferences,
  onMergeComplete,
}: DataMergeDialogProps) {
  const mergeFields = useMemo(() => {
    const fields: MergeField[] = [];

    for (const def of FIELD_DEFINITIONS) {
      const externalVal = sharedData[def.key];
      const localVal = (existingDog as any)[def.key];

      // Skip if external data doesn't have this field
      if (!hasValue(externalVal)) {
        if (hasValue(localVal)) {
          fields.push({ ...def, localValue: localVal, externalValue: externalVal, status: 'local_only' });
        }
        continue;
      }

      if (!hasValue(localVal)) {
        fields.push({ ...def, localValue: localVal, externalValue: externalVal, status: 'new' });
      } else if (valuesMatch(localVal, externalVal)) {
        fields.push({ ...def, localValue: localVal, externalValue: externalVal, status: 'same' });
      } else {
        fields.push({ ...def, localValue: localVal, externalValue: externalVal, status: 'conflict' });
      }
    }

    return fields;
  }, [existingDog, sharedData]);

  // Choices for conflict fields: 'local' or 'external'
  const [choices, setChoices] = useState<Record<string, 'local' | 'external'>>(() => {
    const initial: Record<string, 'local' | 'external'> = {};
    for (const field of mergeFields) {
      if (field.status === 'conflict') {
        initial[field.key] = 'local'; // Default to keeping local
      }
    }
    return initial;
  });

  const handleChoice = (key: string, choice: 'local' | 'external') => {
    setChoices((prev) => ({ ...prev, [key]: choice }));
  };

  const handleApplyMerge = () => {
    const merged: Partial<Dog> = {};

    for (const field of mergeFields) {
      if (field.status === 'new') {
        // Fill blank: use external value
        (merged as any)[field.key] = field.externalValue;
      } else if (field.status === 'conflict') {
        const choice = choices[field.key] || 'local';
        if (choice === 'external') {
          (merged as any)[field.key] = field.externalValue;
        }
        // If 'local', no change needed
      }
      // 'same' and 'local_only' - no changes
    }

    onMergeComplete(merged);
    setOpen(false);
  };

  // Group fields by category
  const groupedFields = useMemo(() => {
    const groups: Record<string, MergeField[]> = {};
    for (const field of mergeFields) {
      if (!groups[field.category]) groups[field.category] = [];
      groups[field.category].push(field);
    }
    return groups;
  }, [mergeFields]);

  const newFieldCount = mergeFields.filter((f) => f.status === 'new').length;
  const conflictCount = mergeFields.filter((f) => f.status === 'conflict').length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Review & Merge Data</DialogTitle>
          <DialogDescription>
            Compare your data for <strong>{existingDog.name}</strong> with the shared data from the external program.
            {newFieldCount > 0 && ` ${newFieldCount} new field${newFieldCount !== 1 ? 's' : ''} will be added.`}
            {conflictCount > 0 && ` ${conflictCount} field${conflictCount !== 1 ? 's have' : ' has'} different values — choose which to keep.`}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {Object.entries(groupedFields).map(([category, fields]) => (
            <div key={category} className='border rounded-lg p-4'>
              <h4 className='font-semibold text-sm mb-3'>{category}</h4>
              <div className='space-y-3'>
                {fields.map((field) => (
                  <div key={field.key} className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium'>{field.label}</span>
                      {field.status === 'new' && (
                        <Badge variant='default' className='text-xs bg-green-600'>
                          <Plus className='h-3 w-3 mr-1' /> New
                        </Badge>
                      )}
                      {field.status === 'same' && (
                        <Badge variant='secondary' className='text-xs'>
                          <Equal className='h-3 w-3 mr-1' /> Same
                        </Badge>
                      )}
                      {field.status === 'local_only' && (
                        <Badge variant='outline' className='text-xs'>
                          Yours only
                        </Badge>
                      )}
                      {field.status === 'conflict' && (
                        <Badge variant='destructive' className='text-xs'>
                          Different
                        </Badge>
                      )}
                    </div>

                    {field.status === 'new' && (
                      <div className='ml-4 text-sm'>
                        <span className='text-muted-foreground'>Will be set to: </span>
                        <span className='font-medium text-green-700 dark:text-green-400'>
                          {displayValue(field.externalValue)}
                        </span>
                      </div>
                    )}

                    {field.status === 'same' && (
                      <div className='ml-4 text-sm text-muted-foreground'>
                        {displayValue(field.localValue)}
                      </div>
                    )}

                    {field.status === 'local_only' && (
                      <div className='ml-4 text-sm text-muted-foreground'>
                        {displayValue(field.localValue)}
                      </div>
                    )}

                    {field.status === 'conflict' && (
                      <div className='ml-4 space-y-1'>
                        <label
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${
                            choices[field.key] === 'local'
                              ? 'border-primary bg-primary/5'
                              : 'border-transparent hover:bg-muted'
                          }`}
                        >
                          <input
                            type='radio'
                            name={field.key}
                            checked={choices[field.key] === 'local'}
                            onChange={() => handleChoice(field.key, 'local')}
                            className='accent-primary'
                          />
                          <div className='text-sm'>
                            <span className='font-medium'>Keep mine: </span>
                            <span>{displayValue(field.localValue)}</span>
                          </div>
                        </label>
                        <label
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${
                            choices[field.key] === 'external'
                              ? 'border-primary bg-primary/5'
                              : 'border-transparent hover:bg-muted'
                          }`}
                        >
                          <input
                            type='radio'
                            name={field.key}
                            checked={choices[field.key] === 'external'}
                            onChange={() => handleChoice(field.key, 'external')}
                            className='accent-primary'
                          />
                          <div className='text-sm'>
                            <span className='font-medium'>Use external: </span>
                            <span>{displayValue(field.externalValue)}</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {mergeFields.length === 0 && (
            <div className='text-center py-8 text-muted-foreground'>
              No shared data to merge. The external program didn't share any additional fields.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApplyMerge}>
            <Check className='mr-2 h-4 w-4' />
            Apply Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
