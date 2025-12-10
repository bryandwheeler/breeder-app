// src/pages/DogList.tsx
import { useDogStore } from '@/store/dogStoreFirebase';
import { useHeatCycleStore } from '@/store/heatCycleStore';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Dog } from '@/types/dog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowRight, Home, Heart, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteDogDialog } from '@/components/DeleteDogDialog';
import { differenceInDays, parseISO } from 'date-fns';

type ProgramStatus = 'owned' | 'guardian' | 'external_stud' | 'co-owned';
type BreedingStatus = 'future-stud' | 'future-dam' | 'active-stud' | 'active-dam' | 'retired' | 'pet' | 'guardian';

export function DogList({
  openEditDialog,
}: {
  openEditDialog: (dog: Dog | null) => void;
}) {
  const navigate = useNavigate();
  const { dogs, deleteDog, updateDog, litters } = useDogStore();
  const { getBreedingRecordsForDog } = useHeatCycleStore();
  const [programFilters, setProgramFilters] = useState<ProgramStatus[]>([]);
  const [breedingStatusFilters, setBreedingStatusFilters] = useState<BreedingStatus[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dogToDelete, setDogToDelete] = useState<Dog | null>(null);

  const handleDeleteClick = (dog: Dog) => {
    setDogToDelete(dog);
    setDeleteDialogOpen(true);
  };

  const handleDelete = (dogId: string) => {
    deleteDog(dogId);
  };

  const handleMarkRetired = (dog: Dog) => {
    updateDog(dog.id, {
      notes: dog.notes
        ? `${dog.notes}\n\nRetired: ${new Date().toLocaleDateString()}`
        : `Retired: ${new Date().toLocaleDateString()}`,
    });
  };

  const handleMarkDeceased = (dog: Dog) => {
    updateDog(dog.id, {
      isDeceased: true,
      dateOfDeath: new Date().toISOString().split('T')[0],
    });
  };

  const columns: ColumnDef<Dog>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/dogs/${row.original.id}`)} // ← THIS MAKES THE NAME CLICKABLE AGAIN
          className='font-semibold text-left hover:text-primary hover:underline flex items-center gap-2 transition'
        >
          {row.original.name}
          <ArrowRight className='h-4 w-4 opacity-50' />
        </button>
      ),
    },
    { accessorKey: 'callName', header: 'Call Name' },
    {
      accessorKey: 'sex',
      header: 'Sex',
      cell: ({ row }) => (
        <span
          className={
            row.original.sex === 'female' ? 'text-pink-600' : 'text-blue-600'
          }
        >
          {row.original.sex === 'female' ? '♀' : '♂'} {row.original.sex}
        </span>
      ),
    },
    { accessorKey: 'breed', header: 'Breed' },
    { accessorKey: 'dateOfBirth', header: 'DOB' },
    {
      id: 'breedingStatus',
      header: 'Status',
      cell: ({ row }) => {
        const dog = row.original;

        // Only show breeding status for females
        if (dog.sex !== 'female') return null;

        // Check for recent breeding records (last 90 days)
        const breedingRecords = getBreedingRecordsForDog(dog.id);
        const recentBreedings = breedingRecords.filter((record) => {
          const breedingDate = parseISO(record.breedingDate);
          const daysSince = differenceInDays(new Date(), breedingDate);
          return daysSince >= 0 && daysSince <= 90; // Within last 90 days
        });

        // Check for planned/pregnant litters
        const pendingLitters = litters.filter(
          (litter) =>
            litter.damId === dog.id &&
            (litter.status === 'planned' || litter.status === 'pregnant')
        );

        if (pendingLitters.length > 0) {
          const litter = pendingLitters[0];
          if (litter.status === 'pregnant') {
            return (
              <Badge variant="default" className="bg-pink-600">
                <Heart className="h-3 w-3 mr-1" />
                Pregnant
              </Badge>
            );
          } else {
            return (
              <Badge variant="secondary">
                <Heart className="h-3 w-3 mr-1" />
                Bred
              </Badge>
            );
          }
        }

        if (recentBreedings.length > 0) {
          return (
            <Badge variant="outline" className="border-pink-600 text-pink-600">
              <Heart className="h-3 w-3 mr-1" />
              Recently Bred
            </Badge>
          );
        }

        return null;
      },
    },
    {
      accessorKey: 'programStatus',
      header: 'Program',
      cell: ({ row }) => {
        const status = row.original.programStatus || 'owned';
        const isGuardian = status === 'guardian';

        return (
          <div className='flex items-center gap-2'>
            {isGuardian && <Home className='h-4 w-4 text-primary' />}
            <span className='text-sm'>
              {status === 'owned' && 'Owned'}
              {status === 'guardian' && 'Guardian'}
              {status === 'external_stud' && 'External Stud'}
              {status === 'co-owned' && 'Co-Owned'}
            </span>
            {isGuardian && row.original.guardianHome && (
              <span className='text-xs text-muted-foreground'>
                ({row.original.guardianHome.littersCompleted}/
                {row.original.guardianHome.littersAllowed})
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => openEditDialog(row.original)}
          >
            <Edit className='h-4 w-4' />
          </Button>
          <Button
            size='sm'
            variant='destructive'
            onClick={() => handleDeleteClick(row.original)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      ),
    },
  ];

  const toggleProgramFilter = (status: ProgramStatus) => {
    setProgramFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleBreedingStatusFilter = (status: BreedingStatus) => {
    setBreedingStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const programOptions: { value: ProgramStatus; label: string }[] = [
    { value: 'owned', label: 'Owned' },
    { value: 'guardian', label: 'Guardian Home' },
    { value: 'external_stud', label: 'External Stud' },
    { value: 'co-owned', label: 'Co-Owned' },
  ];

  const breedingStatusOptions: { value: BreedingStatus; label: string }[] = [
    { value: 'future-stud', label: 'Future Stud' },
    { value: 'future-dam', label: 'Future Dam' },
    { value: 'active-stud', label: 'Active Stud' },
    { value: 'active-dam', label: 'Active Dam' },
    { value: 'retired', label: 'Retired' },
    { value: 'pet', label: 'Pet Quality' },
    { value: 'guardian', label: 'Guardian Program' },
  ];

  // Filter and sort dogs
  const filteredDogs = dogs
    .filter((dog) => {
      // Filter by program status
      if (programFilters.length > 0) {
        const dogProgram = (dog.programStatus || 'owned') as ProgramStatus;
        if (!programFilters.includes(dogProgram)) {
          return false;
        }
      }

      // Filter by breeding status
      if (breedingStatusFilters.length > 0) {
        if (!dog.breedingStatus || !breedingStatusFilters.includes(dog.breedingStatus as BreedingStatus)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by name alphabetically
      return a.name.localeCompare(b.name);
    });

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto'>
            {/* Program Filter */}
            <div className='flex flex-col xs:flex-row items-start xs:items-center gap-2 w-full sm:w-auto'>
              <label className='text-sm font-medium whitespace-nowrap'>
                Program:
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full xs:w-[200px] justify-between'
                  >
                    <span className='truncate'>
                      {programFilters.length === 0
                        ? 'All'
                        : programFilters.length === 1
                        ? programOptions.find(o => o.value === programFilters[0])?.label
                        : `${programFilters.length} selected`}
                    </span>
                    <ChevronDown className='ml-2 h-4 w-4 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[200px] p-3'>
                  <div className='space-y-2'>
                    {programFilters.length > 0 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='w-full justify-start text-xs h-7'
                        onClick={() => setProgramFilters([])}
                      >
                        <X className='mr-2 h-3 w-3' />
                        Clear filters
                      </Button>
                    )}
                    {programOptions.map((option) => (
                      <div
                        key={option.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`program-${option.value}`}
                          checked={programFilters.includes(option.value)}
                          onCheckedChange={() => toggleProgramFilter(option.value)}
                        />
                        <label
                          htmlFor={`program-${option.value}`}
                          className='text-sm cursor-pointer flex-1'
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Breeding Status Filter */}
            <div className='flex flex-col xs:flex-row items-start xs:items-center gap-2 w-full sm:w-auto'>
              <label className='text-sm font-medium whitespace-nowrap'>
                Breeding Status:
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full xs:w-[200px] justify-between'
                  >
                    <span className='truncate'>
                      {breedingStatusFilters.length === 0
                        ? 'All'
                        : breedingStatusFilters.length === 1
                        ? breedingStatusOptions.find(o => o.value === breedingStatusFilters[0])?.label
                        : `${breedingStatusFilters.length} selected`}
                    </span>
                    <ChevronDown className='ml-2 h-4 w-4 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[200px] p-3'>
                  <div className='space-y-2'>
                    {breedingStatusFilters.length > 0 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='w-full justify-start text-xs h-7'
                        onClick={() => setBreedingStatusFilters([])}
                      >
                        <X className='mr-2 h-3 w-3' />
                        Clear filters
                      </Button>
                    )}
                    {breedingStatusOptions.map((option) => (
                      <div
                        key={option.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`breeding-${option.value}`}
                          checked={breedingStatusFilters.includes(option.value)}
                          onCheckedChange={() => toggleBreedingStatusFilter(option.value)}
                        />
                        <label
                          htmlFor={`breeding-${option.value}`}
                          className='text-sm cursor-pointer flex-1'
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            onClick={() => openEditDialog(null)}
            size='sm'
            className='w-full sm:w-auto'
          >
            <Edit className='h-4 w-4 mr-2' />
            Add Dog
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredDogs}
        searchPlaceholder='Search all dogs...'
      />

      <DeleteDogDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        dog={dogToDelete}
        onDelete={handleDelete}
        onMarkRetired={handleMarkRetired}
        onMarkDeceased={handleMarkDeceased}
      />
    </div>
  );
}
