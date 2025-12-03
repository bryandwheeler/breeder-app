import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Registration } from '@/types/dog';
import { Plus, Trash2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminStore } from '@/store/adminStore';
import { useBreederStore } from '@/store/breederStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MultiRegistrationManagerProps {
  registrations: Registration[];
  onChange: (registrations: Registration[]) => void;
}

export function MultiRegistrationManager({
  registrations,
  onChange,
}: MultiRegistrationManagerProps) {
  const { appSettings } = useAdminStore();
  const { profile } = useBreederStore();
  const [customRegistry, setCustomRegistry] = useState('');
  const [addCustomDialogOpen, setAddCustomDialogOpen] = useState(false);
  const [additionalRegistries, setAdditionalRegistries] = useState<string[]>(
    []
  );

  const availableRegistries = useMemo(() => {
    // Combine default registries, global admin registries, and breeder custom registries
    const defaultRegistries = ['AKC', 'CKC', 'UKC', 'FCI', 'IABCA', 'ABKC'];
    const globalRegistries = appSettings?.globalRegistries || [];
    const breederRegistries = profile?.customRegistries || [];

    const combined = Array.from(
      new Set([
        ...defaultRegistries,
        ...globalRegistries,
        ...breederRegistries,
        ...additionalRegistries,
      ])
    );
    return combined.sort();
  }, [appSettings, profile, additionalRegistries]);

  const addRegistration = () => {
    const newRegistration: Registration = {
      registry: availableRegistries[0] || 'AKC',
      registrationType: 'none',
      status: 'not_started',
    };
    onChange([...registrations, newRegistration]);
  };

  const removeRegistration = (index: number) => {
    const updated = registrations.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateRegistration = (
    index: number,
    field: keyof Registration,
    value: string
  ) => {
    const updated = [...registrations];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addCustomRegistryToList = () => {
    if (customRegistry && !availableRegistries.includes(customRegistry)) {
      setAdditionalRegistries([...additionalRegistries, customRegistry]);
      setCustomRegistry('');
      setAddCustomDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'submitted':
        return 'bg-blue-500';
      case 'approved':
        return 'bg-green-500';
      case 'issued':
        return 'bg-green-700';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-lg font-semibold'>Registrations</Label>
        <div className='flex gap-2'>
          <Dialog
            open={addCustomDialogOpen}
            onOpenChange={setAddCustomDialogOpen}
          >
            <DialogTrigger asChild>
              <Button type='button' variant='outline' size='sm'>
                Add Custom Registry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Registry</DialogTitle>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div>
                  <Label htmlFor='customRegistry'>Registry Name</Label>
                  <Input
                    id='customRegistry'
                    value={customRegistry}
                    onChange={(e) => setCustomRegistry(e.target.value)}
                    placeholder='e.g., Continental Kennel Club'
                  />
                </div>
                <Button
                  type='button'
                  onClick={addCustomRegistryToList}
                  className='w-full'
                >
                  Add Registry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button type='button' onClick={addRegistration} size='sm'>
            <Plus className='h-4 w-4 mr-2' />
            Add Registration
          </Button>
        </div>
      </div>

      {registrations.length === 0 && (
        <Card>
          <CardContent className='pt-6 text-center text-muted-foreground'>
            <FileText className='h-12 w-12 mx-auto mb-2 opacity-50' />
            <p>No registrations added yet.</p>
            <p className='text-sm'>Click "Add Registration" to get started.</p>
          </CardContent>
        </Card>
      )}

      {registrations.map((reg, index) => (
        <Card key={index}>
          <CardContent className='pt-6 space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Badge className={getStatusColor(reg.status)}>
                  {reg.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {reg.registrationNumber && (
                  <span className='text-sm font-medium'>
                    #{reg.registrationNumber}
                  </span>
                )}
              </div>
              <Button
                type='button'
                variant='destructive'
                size='sm'
                onClick={() => removeRegistration(index)}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div>
                <Label>Registry</Label>
                <Select
                  value={reg.registry}
                  onValueChange={(value) =>
                    updateRegistration(index, 'registry', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRegistries.map((registry) => (
                      <SelectItem key={registry} value={registry}>
                        {registry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  value={reg.registrationType}
                  onValueChange={(value) =>
                    updateRegistration(index, 'registrationType', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>No Registration</SelectItem>
                    <SelectItem value='limited'>Limited</SelectItem>
                    <SelectItem value='full'>Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={reg.status}
                  onValueChange={(value) =>
                    updateRegistration(index, 'status', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='not_started'>Not Started</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='submitted'>Submitted</SelectItem>
                    <SelectItem value='approved'>Approved</SelectItem>
                    <SelectItem value='issued'>Issued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {reg.registrationType !== 'none' && (
              <>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <Label>Registration Number</Label>
                    <Input
                      value={reg.registrationNumber || ''}
                      onChange={(e) =>
                        updateRegistration(
                          index,
                          'registrationNumber',
                          e.target.value
                        )
                      }
                      placeholder='e.g., WS12345678'
                    />
                  </div>
                  <div>
                    <Label>Registered Name</Label>
                    <Input
                      value={reg.registeredName || ''}
                      onChange={(e) =>
                        updateRegistration(
                          index,
                          'registeredName',
                          e.target.value
                        )
                      }
                      placeholder='Official registered name'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4'>
                  <div>
                    <Label className='text-xs'>Application Date</Label>
                    <Input
                      type='date'
                      value={reg.applicationDate || ''}
                      onChange={(e) =>
                        updateRegistration(
                          index,
                          'applicationDate',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className='text-xs'>Submission Date</Label>
                    <Input
                      type='date'
                      value={reg.submissionDate || ''}
                      onChange={(e) =>
                        updateRegistration(
                          index,
                          'submissionDate',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className='text-xs'>Approval Date</Label>
                    <Input
                      type='date'
                      value={reg.approvalDate || ''}
                      onChange={(e) =>
                        updateRegistration(
                          index,
                          'approvalDate',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className='text-xs text-red-600'>Deadline</Label>
                    <Input
                      type='date'
                      value={reg.registrationDeadline || ''}
                      onChange={(e) =>
                        updateRegistration(
                          index,
                          'registrationDeadline',
                          e.target.value
                        )
                      }
                      className='border-red-300'
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Input
                    value={reg.notes || ''}
                    onChange={(e) =>
                      updateRegistration(index, 'notes', e.target.value)
                    }
                    placeholder='Additional notes...'
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
