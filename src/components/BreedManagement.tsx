import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminStore } from '@/store/adminStore';
import { Plus, Trash2, Users, AlertCircle } from 'lucide-react';
import { DOG_BREEDS } from '@/data/dogBreeds';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/types/guards';

type SortOption = 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc';

interface BreedCount {
  breed: string;
  count: number;
  isGlobal: boolean;
}

export function BreedManagement() {
  const { appSettings, updateAppSettings } = useAdminStore();
  const initialBreeds =
    (appSettings as unknown as { globalBreeds?: string[] })?.globalBreeds ?? [];
  const [localBreeds, setLocalBreeds] = useState<string[]>(initialBreeds);
  const [newBreed, setNewBreed] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [breedCounts, setBreedCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  // Fetch breed counts from all breeder profiles
  useEffect(() => {
    const fetchBreedCounts = async () => {
      try {
        setLoading(true);
        const profilesSnapshot = await getDocs(
          collection(db, FIRESTORE_COLLECTIONS.BREEDER_PROFILES)
        );
        const counts = new Map<string, number>();

        profilesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const primaryBreed = data.primaryBreed;
          const otherBreeds = data.otherBreeds || [];

          if (primaryBreed) {
            counts.set(primaryBreed, (counts.get(primaryBreed) || 0) + 1);
          }

          otherBreeds.forEach((breed: string) => {
            counts.set(breed, (counts.get(breed) || 0) + 1);
          });
        });

        setBreedCounts(counts);
      } catch (error) {
        console.error('Error fetching breed counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBreedCounts();
  }, []);

  // Get all breeds with counts and categorization
  const allBreedData = useMemo<BreedCount[]>(() => {
    const globalBreeds =
      (appSettings as unknown as { globalBreeds?: string[] })?.globalBreeds ||
      localBreeds;
    const globalSet = new Set(globalBreeds);
    const allBreedNames = new Set([...globalBreeds, ...breedCounts.keys()]);

    return Array.from(allBreedNames).map((breed) => ({
      breed,
      count: breedCounts.get(breed) || 0,
      isGlobal: globalSet.has(breed),
    }));
  }, [appSettings, localBreeds, breedCounts]);

  // Sort and filter breeds
  const displayedBreeds = useMemo<BreedCount[]>(() => {
    const sorted = [...allBreedData];

    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.breed.localeCompare(b.breed));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.breed.localeCompare(a.breed));
        break;
      case 'count-desc':
        sorted.sort((a, b) => b.count - a.count);
        break;
      case 'count-asc':
        sorted.sort((a, b) => a.count - b.count);
        break;
    }

    return sorted;
  }, [allBreedData, sortBy]);

  // Separate global and custom breeds
  const globalBreeds = displayedBreeds.filter((b) => b.isGlobal);
  const customOnlyBreeds = displayedBreeds.filter(
    (b) => !b.isGlobal && b.count > 0
  );

  const addBreed = async () => {
    const b = newBreed.trim();
    if (!b) return;
    const currentGlobalBreeds =
      (appSettings as unknown as { globalBreeds?: string[] })?.globalBreeds ||
      localBreeds;
    if (currentGlobalBreeds.includes(b)) {
      setNewBreed('');
      return;
    }
    const updated = [...currentGlobalBreeds, b].sort();
    setLocalBreeds(updated);
    setNewBreed('');
    await updateAppSettings({});
    await updateAppSettings({
      globalRegistries: appSettings?.globalRegistries ?? [],
    });
    // Update breeds using a direct Firestore call as a fallback to avoid TS friction
    try {
      (await import('firebase/firestore')).updateDoc(
        (await import('firebase/firestore')).doc(
          (await import('@/lib/firebase')).db,
          'admin',
          'settings'
        ),
        { globalBreeds: updated }
      );
    } catch (e) {
      console.error('Failed to update globalBreeds:', e);
    }
  };

  const removeBreed = async (breed: string) => {
    const currentGlobalBreeds =
      (appSettings as unknown as { globalBreeds?: string[] })?.globalBreeds ||
      localBreeds;
    const updated = currentGlobalBreeds.filter((r) => r !== breed);
    setLocalBreeds(updated);
    // no-op compatible call to satisfy type narrowing (kept for symmetry)
    await updateAppSettings({});
    await updateAppSettings({
      globalRegistries: appSettings?.globalRegistries ?? [],
    });
    try {
      (await import('firebase/firestore')).updateDoc(
        (await import('firebase/firestore')).doc(
          (await import('@/lib/firebase')).db,
          'admin',
          'settings'
        ),
        { globalBreeds: updated }
      );
    } catch (e) {
      console.error('Failed to update globalBreeds:', e);
    }
  };

  const importAllDefaults = async () => {
    const merged = Array.from(
      new Set([
        ...((appSettings as unknown as { globalBreeds?: string[] })
          ?.globalBreeds ?? []),
        ...DOG_BREEDS,
      ])
    ).sort((a: string, b: string) => a.localeCompare(b));
    setLocalBreeds(merged);
    await updateAppSettings({});
    await updateAppSettings({
      globalRegistries: appSettings?.globalRegistries ?? [],
    });
    try {
      (await import('firebase/firestore')).updateDoc(
        (await import('firebase/firestore')).doc(
          (await import('@/lib/firebase')).db,
          'admin',
          'settings'
        ),
        { globalBreeds: merged }
      );
    } catch (e) {
      console.error('Failed to import default breeds:', e);
    }
  };

  const clearAllBreeds = async () => {
    setLocalBreeds([]);
    await updateAppSettings({});
    await updateAppSettings({
      globalRegistries: appSettings?.globalRegistries ?? [],
    });
    try {
      (await import('firebase/firestore')).updateDoc(
        (await import('firebase/firestore')).doc(
          (await import('@/lib/firebase')).db,
          'admin',
          'settings'
        ),
        { globalBreeds: [] }
      );
    } catch (e) {
      console.error('Failed to clear globalBreeds:', e);
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Global Breeds Management</CardTitle>
          <CardDescription>
            Manage the global list of dog breeds available in autocomplete.
            Breed counts show how many breeders are registered for each breed.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Add/Import Controls */}
          <div className='flex flex-wrap gap-2'>
            <Input
              placeholder='Add breed (e.g., Goldendoodle)'
              value={newBreed}
              onChange={(e) => setNewBreed(e.target.value)}
              className='max-w-xs'
            />
            <Button onClick={addBreed}>
              <Plus className='mr-2 h-4 w-4' /> Add
            </Button>
            <Button variant='outline' onClick={importAllDefaults}>
              Import all default breeds
            </Button>
            <Button variant='destructive' onClick={clearAllBreeds}>
              Clear all
            </Button>
          </div>

          {/* Sort Controls */}
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className='w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='name-asc'>Name (A-Z)</SelectItem>
                <SelectItem value='name-desc'>Name (Z-A)</SelectItem>
                <SelectItem value='count-desc'>
                  Breeder Count (High-Low)
                </SelectItem>
                <SelectItem value='count-asc'>
                  Breeder Count (Low-High)
                </SelectItem>
              </SelectContent>
            </Select>
            {loading && (
              <span className='text-sm text-muted-foreground'>
                Loading counts...
              </span>
            )}
          </div>

          {/* Global Breeds List */}
          <div>
            <h4 className='text-sm font-semibold mb-3 flex items-center gap-2'>
              Global Breeds ({globalBreeds.length})
            </h4>
            {globalBreeds.length === 0 ? (
              <p className='text-muted-foreground text-sm'>
                No global breeds configured yet.
              </p>
            ) : (
              <div className='border rounded-lg overflow-hidden'>
                <div className='bg-muted/50 px-4 py-2 grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground'>
                  <div className='col-span-7'>Breed Name</div>
                  <div className='col-span-3'>Breeders</div>
                  <div className='col-span-2 text-right'>Actions</div>
                </div>
                <div className='divide-y'>
                  {globalBreeds.map(({ breed, count }) => (
                    <div
                      key={breed}
                      className='px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/30 transition-colors'
                    >
                      <div className='col-span-7 font-medium'>{breed}</div>
                      <div className='col-span-3 flex items-center gap-1 text-sm text-muted-foreground'>
                        <Users className='h-4 w-4' />
                        <span>{count}</span>
                      </div>
                      <div className='col-span-2 flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground'
                          onClick={() => removeBreed(breed)}
                          title='Remove from global list'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Breeds Section */}
      {customOnlyBreeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-orange-500' />
              Custom Breeds Not in Global List ({customOnlyBreeds.length})
            </CardTitle>
            <CardDescription>
              These breeds are being used by breeders but are not in the global
              list. Consider adding them if they are legitimate breeds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='border rounded-lg overflow-hidden'>
              <div className='bg-orange-50 dark:bg-orange-950/20 px-4 py-2 grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground'>
                <div className='col-span-7'>Breed Name</div>
                <div className='col-span-3'>Breeders</div>
                <div className='col-span-2 text-right'>Actions</div>
              </div>
              <div className='divide-y'>
                {customOnlyBreeds.map(({ breed, count }) => (
                  <div
                    key={breed}
                    className='px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/30 transition-colors'
                  >
                    <div className='col-span-7 font-medium'>{breed}</div>
                    <div className='col-span-3 flex items-center gap-1 text-sm text-muted-foreground'>
                      <Users className='h-4 w-4' />
                      <span>{count}</span>
                    </div>
                    <div className='col-span-2 flex justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 hover:bg-green-600 hover:text-white'
                        onClick={async () => {
                          const currentGlobalBreeds =
                            (
                              appSettings as unknown as {
                                globalBreeds?: string[];
                              }
                            )?.globalBreeds || localBreeds;
                          const updated = [
                            ...currentGlobalBreeds,
                            breed,
                          ].sort();
                          setLocalBreeds(updated);
                          setNewBreed('');
                          await updateAppSettings({});
                          await updateAppSettings({
                            globalRegistries:
                              appSettings?.globalRegistries ?? [],
                          });
                          try {
                            (await import('firebase/firestore')).updateDoc(
                              (await import('firebase/firestore')).doc(
                                (await import('@/lib/firebase')).db,
                                'admin',
                                'settings'
                              ),
                              { globalBreeds: updated }
                            );
                          } catch (e) {
                            console.error('Failed to add breed:', e);
                          }
                        }}
                        title='Add to global list'
                      >
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
