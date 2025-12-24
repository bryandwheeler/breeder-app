import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText } from 'lucide-react';
import { useAdminStore } from '@breeder/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function RegistryManagement() {
  const { appSettings, updateAppSettings } = useAdminStore();
  const [newRegistry, setNewRegistry] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Always use appSettings.globalRegistries, with defaults as fallback
  const registries = useMemo(() => {
    if (
      appSettings?.globalRegistries &&
      appSettings.globalRegistries.length > 0
    ) {
      return appSettings.globalRegistries;
    }
    // Use defaults only if nothing is in appSettings
    return ['AKC', 'CKC', 'UKC', 'FCI', 'IABCA', 'ABKC'];
  }, [appSettings?.globalRegistries]);

  const handleAddRegistry = async () => {
    if (!newRegistry.trim()) return;

    const trimmed = newRegistry.trim();
    if (registries.includes(trimmed)) {
      alert('This registry already exists');
      return;
    }

    const updated = [...registries, trimmed].sort();

    try {
      await updateAppSettings({ globalRegistries: updated });
      setNewRegistry('');
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding registry:', error);
      alert('Failed to add registry');
    }
  };

  const handleRemoveRegistry = async (registry: string) => {
    if (
      !confirm(
        `Remove ${registry} from global registries? Breeders can still use it if they've added it to their custom list.`
      )
    ) {
      return;
    }

    const updated = registries.filter((r) => r !== registry);

    try {
      await updateAppSettings({ globalRegistries: updated });
    } catch (error) {
      console.error('Error removing registry:', error);
      alert('Failed to remove registry');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5' />
              Global Registry Management
            </CardTitle>
            <CardDescription className='mt-2'>
              Manage the list of dog registries available to all breeders.
              Breeders can also add custom registries to their own profiles.
            </CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                Add Registry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Global Registry</DialogTitle>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div>
                  <Label htmlFor='newRegistry'>Registry Name</Label>
                  <Input
                    id='newRegistry'
                    value={newRegistry}
                    onChange={(e) => setNewRegistry(e.target.value)}
                    placeholder='e.g., Continental Kennel Club'
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRegistry();
                      }
                    }}
                  />
                </div>
                <Button
                  type='button'
                  onClick={handleAddRegistry}
                  className='w-full'
                >
                  Add Registry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {registries.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            <FileText className='h-12 w-12 mx-auto mb-2 opacity-50' />
            <p>No global registries configured yet.</p>
            <p className='text-sm'>Click "Add Registry" to get started.</p>
          </div>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {registries.map((registry) => (
              <Badge
                key={registry}
                variant='secondary'
                className='text-sm px-3 py-1.5 flex items-center gap-2'
              >
                {registry}
                <button
                  onClick={() => handleRemoveRegistry(registry)}
                  className='hover:text-destructive transition-colors'
                  title={`Remove ${registry}`}
                >
                  <Trash2 className='h-3 w-3' />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className='mt-4 text-sm text-muted-foreground border-t pt-4'>
          <p className='font-semibold mb-1'>Note:</p>
          <p>
            These global registries are available to all breeders. Breeders can
            also add custom registries specific to their kennel in their
            settings. Dogs can be registered with multiple registries.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
