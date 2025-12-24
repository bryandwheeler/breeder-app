import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@breeder/firebase';
import { useBreederStore } from '@breeder/firebase';
import { DOG_BREEDS } from '@/data/dogBreeds';

interface BreedAutocompleteProps {
  value: string;
  onChange: (breed: string) => void;
  label?: string;
  placeholder?: string;
}

export function BreedAutocomplete({
  value,
  onChange,
  label = 'Breed *',
  placeholder = 'Start typing to search breeds...',
}: BreedAutocompleteProps) {
  const { appSettings } = useAdminStore();
  const profile = useBreederStore((s) => s.profile);
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);

  const allBreeds = useMemo(() => {
    const defaults = DOG_BREEDS; // array of strings
    // Access admin-managed breeds if present
    const globals =
      (appSettings as unknown as { globalBreeds?: string[] })?.globalBreeds ||
      [];
    const custom = profile?.otherBreeds || [];
    const combined = Array.from(
      new Set([...defaults, ...globals, ...(custom || [])])
    );
    return combined.sort((a, b) => a.localeCompare(b));
  }, [appSettings, profile]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allBreeds.slice(0, 20);
    return allBreeds.filter((b) => b.toLowerCase().includes(q)).slice(0, 20);
  }, [query, allBreeds]);

  const handleSelect = (breed: string) => {
    onChange(breed);
    setQuery(breed);
    setOpen(false);
  };

  return (
    <div className='relative'>
      {label && <Label>{label}</Label>}
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && (
        <Card
          className={cn(
            // Fully readable panel with subtle blur to soften underlying content
            'absolute z-[60] mt-1 w-full max-h-64 overflow-y-auto rounded-md border shadow-lg backdrop-blur-sm',
            'bg-white/95 dark:bg-gray-900/90',
            'ring-1 ring-black/5 dark:ring-white/10'
          )}
        >
          {filtered.length === 0 ? (
            <div className='p-3 text-sm text-muted-foreground'>
              No matches. Press Enter to use custom breed.
            </div>
          ) : (
            <ul className='divide-y divide-border/60 dark:divide-white/10'>
              {filtered.map((b) => (
                <li
                  key={b}
                  className='px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(b)}
                >
                  {b}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
