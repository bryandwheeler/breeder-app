// src/pages/DogList.tsx
import { useDogStore } from '@/store/dogStoreFirebase';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Dog } from '@/types/dog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ArrowRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteDogDialog } from '@/components/DeleteDogDialog';

export function DogList({
  openEditDialog,
}: {
  openEditDialog: (dog: Dog) => void;
}) {
  const { dogs, deleteDog, updateDog } = useDogStore();
  const navigate = useNavigate();
  const [programFilter, setProgramFilter] = useState<string>('all');
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
      accessorKey: 'programStatus',
      header: 'Program Status',
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
                ({row.original.guardianHome.littersCompleted}/{row.original.guardianHome.littersAllowed})
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

  // Filter dogs based on program status
  const filteredDogs = dogs.filter((dog) => {
    if (programFilter === 'all') return true;
    return (dog.programStatus || 'owned') === programFilter;
  });

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <label className='text-sm font-medium'>Filter by Program:</label>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Dogs</SelectItem>
              <SelectItem value='owned'>Owned</SelectItem>
              <SelectItem value='guardian'>Guardian Home</SelectItem>
              <SelectItem value='external_stud'>External Stud</SelectItem>
              <SelectItem value='co-owned'>Co-Owned</SelectItem>
            </SelectContent>
          </Select>
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
