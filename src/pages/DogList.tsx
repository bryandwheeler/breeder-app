// src/pages/DogList.tsx
import { useDogStore } from '@/store/dogStoreFirebase';
import { useHeatCycleStore } from '@/store/heatCycleStore';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Dog } from '@/types/dog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowRight, Home, Heart, X, ChevronDown, Settings2, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteDogDialog } from '@/components/DeleteDogDialog';
import { differenceInDays, parseISO } from 'date-fns';
import { calculateAge } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ProgramStatus = 'owned' | 'guardian' | 'external_stud' | 'co-owned';
type BreedingStatus = 'future-stud' | 'future-dam' | 'active-stud' | 'active-dam' | 'retired' | 'pet' | 'guardian';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name', label: 'Name', visible: true },
  { id: 'callName', label: 'Call Name', visible: true },
  { id: 'sex', label: 'Sex', visible: true },
  { id: 'breed', label: 'Breed', visible: true },
  { id: 'dateOfBirth', label: 'DOB', visible: true },
  { id: 'age', label: 'Age', visible: true },
  { id: 'breedingStatusColumn', label: 'Breeding Status', visible: true },
  { id: 'litterStatus', label: 'Litter Status', visible: true },
  { id: 'programStatus', label: 'Program', visible: true },
  { id: 'actions', label: 'Actions', visible: true },
];

const STORAGE_KEY = 'dogListColumnConfig';

function SortableColumnItem({ id, label, checked, onCheckedChange }: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center space-x-2 p-2 bg-background border rounded hover:bg-accent'
    >
      <div {...attributes} {...listeners} className='cursor-move'>
        <GripVertical className='h-4 w-4 text-muted-foreground' />
      </div>
      <Checkbox
        id={`column-${id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={id === 'name' || id === 'actions'}
      />
      <label
        htmlFor={`column-${id}`}
        className='text-sm cursor-pointer flex-1'
      >
        {label}
        {(id === 'name' || id === 'actions') && (
          <span className='text-xs text-muted-foreground ml-1'>(required)</span>
        )}
      </label>
    </div>
  );
}

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
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumnConfig((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumnConfig((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const resetColumns = () => {
    setColumnConfig(DEFAULT_COLUMNS);
  };

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

  // Define all possible columns
  const allColumnsMap: Record<string, ColumnDef<Dog>> = useMemo(() => ({
    name: {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/dogs/${row.original.id}`)}
          className='font-semibold text-left hover:text-primary hover:underline flex items-center gap-2 transition'
        >
          {row.original.name}
          <ArrowRight className='h-4 w-4 opacity-50' />
        </button>
      ),
    },
    callName: {
      accessorKey: 'callName',
      header: 'Call Name',
      cell: ({ row }) => row.original.callName || '-'
    },
    sex: {
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
    breed: { accessorKey: 'breed', header: 'Breed' },
    dateOfBirth: { accessorKey: 'dateOfBirth', header: 'DOB' },
    age: {
      id: 'age',
      header: 'Age',
      cell: ({ row }) => (
        <span className='text-sm'>{calculateAge(row.original.dateOfBirth)}</span>
      ),
    },
    breedingStatusColumn: {
      id: 'breedingStatusColumn',
      header: 'Breeding Status',
      cell: ({ row }) => {
        const dog = row.original;
        if (!dog.breedingStatus) return <span className='text-muted-foreground text-sm'>-</span>;

        const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
          'future-stud': { label: 'Future Stud', variant: 'secondary' },
          'future-dam': { label: 'Future Dam', variant: 'secondary' },
          'active-stud': { label: 'Active Stud', variant: 'default' },
          'active-dam': { label: 'Active Dam', variant: 'default' },
          'retired': { label: 'Retired', variant: 'outline' },
          'pet': { label: 'Pet', variant: 'secondary' },
          'guardian': { label: 'Guardian', variant: 'secondary' },
        };

        const status = statusLabels[dog.breedingStatus];
        return status ? (
          <Badge variant={status.variant}>{status.label}</Badge>
        ) : null;
      },
    },
    litterStatus: {
      id: 'litterStatus',
      header: 'Litter Status',
      cell: ({ row }) => {
        const dog = row.original;

        // Only show for females
        if (dog.sex !== 'female') return null;

        // Check for recent breeding records (last 90 days)
        const breedingRecords = getBreedingRecordsForDog(dog.id);
        const recentBreedings = breedingRecords.filter((record) => {
          const breedingDate = parseISO(record.breedingDate);
          const daysSince = differenceInDays(new Date(), breedingDate);
          return daysSince >= 0 && daysSince <= 90;
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
    programStatus: {
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
    actions: {
      id: 'actions',
      header: 'Actions',
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
  }), [navigate, openEditDialog, litters, getBreedingRecordsForDog]);

  // Build columns array based on columnConfig order and visibility
  const columns: ColumnDef<Dog>[] = useMemo(() => {
    return columnConfig
      .filter(col => col.visible)
      .map(col => allColumnsMap[col.id])
      .filter(Boolean);
  }, [columnConfig, allColumnsMap]);

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

          <div className='flex gap-2 w-full sm:w-auto'>
            <Popover open={columnSettingsOpen} onOpenChange={setColumnSettingsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full sm:w-auto'
                >
                  <Settings2 className='h-4 w-4 mr-2' />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[300px] p-4' align='end'>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-semibold text-sm'>Customize Columns</h4>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={resetColumns}
                      className='h-7 text-xs'
                    >
                      Reset
                    </Button>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Drag to reorder, check to show/hide
                  </p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={columnConfig.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className='space-y-2 max-h-[400px] overflow-y-auto'>
                        {columnConfig.map((col) => (
                          <SortableColumnItem
                            key={col.id}
                            id={col.id}
                            label={col.label}
                            checked={col.visible}
                            onCheckedChange={() => toggleColumnVisibility(col.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </PopoverContent>
            </Popover>

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
