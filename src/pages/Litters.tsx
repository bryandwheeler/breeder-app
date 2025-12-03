// src/pages/Litters.tsx – FULL LITTER PLANNER
import { useDogStore } from '@/store/dogStoreFirebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LitterFormDialog } from '@/components/LitterFormDialog';
import { Litter } from '@/types/dog';

export function Litters() {
  const { litters, dogs, deleteLitter } = useDogStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLitter, setEditingLitter] = useState<Litter | null>(null);

  const getStatusColor = (status: Litter['status']) => {
    switch (status) {
      case 'planned':
        return 'outline';
      case 'pregnant':
        return 'secondary';
      case 'born':
        return 'default';
      case 'weaning':
        return 'default';
      case 'ready':
        return 'default';
      case 'completed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleEdit = (litter: Litter) => {
    setEditingLitter(litter);
    setDialogOpen(true);
  };

  const handleDelete = async (litterId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this litter? This cannot be undone.'
      )
    )
      return;
    await deleteLitter(litterId);
  };

  const handleAddNew = () => {
    setEditingLitter(null);
    setDialogOpen(true);
  };

  return (
    <div className='space-y-4 sm:space-y-6 md:space-y-8'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
        <h1 className='text-2xl sm:text-3xl md:text-4xl font-bold'>Litters</h1>
        <Button
          size='default'
          onClick={handleAddNew}
          className='w-full sm:w-auto'
        >
          <Plus className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
          <span className='hidden xs:inline'>Plan New Litter</span>
          <span className='xs:hidden'>New Litter</span>
        </Button>
      </div>

      {litters.length === 0 ? (
        <Card className='p-8 sm:p-12 text-center'>
          <Calendar className='h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4' />
          <p className='text-lg sm:text-xl text-muted-foreground'>
            No litters planned yet
          </p>
        </Card>
      ) : (
        <div className='grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
          {litters.map((litter) => {
            // Skip litters without required fields (old data structure)
            if (!litter.dateOfBirth) {
              console.warn(
                'Skipping litter with missing dateOfBirth:',
                litter.id
              );
              return null;
            }

            const dam = dogs.find((d) => d.id === litter.damId);
            const sire = dogs.find((d) => d.id === litter.sireId);
            const litterName =
              litter.litterName || `${dam?.name} x ${sire?.name}`;

            const puppies = litter.puppies || [];
            const availablePuppies = puppies.filter(
              (p) => p.status === 'available'
            ).length;
            const reservedPuppies = puppies.filter(
              (p) => p.status === 'reserved'
            ).length;
            const soldPuppies = puppies.filter(
              (p) => p.status === 'sold'
            ).length;

            return (
              <Card key={litter.id} className='hover:shadow-lg transition'>
                <CardHeader>
                  <div className='flex justify-between items-start'>
                    <CardTitle className='text-lg'>{litterName}</CardTitle>
                    <Badge variant={getStatusColor(litter.status || 'planned')}>
                      {(litter.status || 'planned').charAt(0).toUpperCase() +
                        (litter.status || 'planned').slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <p className='text-sm'>
                      <strong>Dam:</strong> {dam?.name || 'Unknown'}
                    </p>
                    <p className='text-sm'>
                      <strong>Sire:</strong> {sire?.name || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <p className='text-sm'>
                      <strong>Date of Birth:</strong>{' '}
                      {format(new Date(litter.dateOfBirth), 'PPP')}
                    </p>
                    {litter.pickupReadyDate && (
                      <p className='text-sm'>
                        <strong>Ready:</strong>{' '}
                        {format(new Date(litter.pickupReadyDate), 'PPP')}
                      </p>
                    )}
                  </div>

                  <div className='flex items-center gap-2 text-sm'>
                    <Users className='h-4 w-4' />
                    <span>
                      {puppies.length} puppies ({availablePuppies} available,{' '}
                      {reservedPuppies} reserved, {soldPuppies} sold)
                    </span>
                  </div>

                  <div className='flex gap-2 pt-4'>
                    <Link to={`/litters/${litter.id}`} className='flex-1'>
                      <Button size='sm' variant='default' className='w-full'>
                        <Eye className='mr-2 h-4 w-4' /> View Details
                      </Button>
                    </Link>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleEdit(litter)}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => handleDelete(litter.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <LitterFormDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        litter={editingLitter}
      />
    </div>
  );
}
