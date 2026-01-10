import { Dog } from '@breeder/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, ChevronRight, Home, Heart } from 'lucide-react';
import { calculateAge } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MobileDogCardProps {
  dog: Dog;
  onEdit?: (dog: Dog) => void;
  onNavigate?: (dogId: string) => void;
  /** Optional: litter status for females (pregnant, bred, etc.) */
  litterStatus?: 'pregnant' | 'bred' | 'recently_bred' | null;
}

/**
 * MobileDogCard - Touch-friendly card layout for dog list on mobile
 * Shows essential info at a glance with quick actions
 */
export function MobileDogCard({
  dog,
  onEdit,
  onNavigate,
  litterStatus,
}: MobileDogCardProps) {
  const isGuardian = dog.programStatus === 'guardian';
  const isFemale = dog.sex === 'female';

  const getBreedingStatusBadge = () => {
    if (!dog.breedingStatus) return null;

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'future-stud': { label: 'Future Stud', variant: 'secondary' },
      'future-dam': { label: 'Future Dam', variant: 'secondary' },
      'active-stud': { label: 'Active Stud', variant: 'default' },
      'active-dam': { label: 'Active Dam', variant: 'default' },
      'retired': { label: 'Retired', variant: 'outline' },
      'pet': { label: 'Pet', variant: 'secondary' },
      'guardian': { label: 'Guardian', variant: 'secondary' },
    };

    const config = statusConfig[dog.breedingStatus];
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : null;
  };

  const getLitterStatusBadge = () => {
    if (!isFemale || !litterStatus) return null;

    switch (litterStatus) {
      case 'pregnant':
        return (
          <Badge variant="default" className="bg-pink-600">
            <Heart className="h-3 w-3 mr-1" />
            Pregnant
          </Badge>
        );
      case 'bred':
        return (
          <Badge variant="secondary">
            <Heart className="h-3 w-3 mr-1" />
            Bred
          </Badge>
        );
      case 'recently_bred':
        return (
          <Badge variant="outline" className="border-pink-600 text-pink-600">
            <Heart className="h-3 w-3 mr-1" />
            Recently Bred
          </Badge>
        );
      default:
        return null;
    }
  };

  const getProgramBadge = () => {
    if (!dog.programStatus || dog.programStatus === 'owned') return null;

    const statusLabels: Record<string, string> = {
      'guardian': 'Guardian',
      'external_stud': 'External',
      'co-owned': 'Co-Owned',
    };

    return (
      <Badge variant="outline" className="text-xs">
        {isGuardian && <Home className="h-3 w-3 mr-1" />}
        {statusLabels[dog.programStatus]}
      </Badge>
    );
  };

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate(dog.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(dog);
    }
  };

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer active:bg-muted/50 transition-colors',
        dog.isDeceased && 'opacity-60'
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        {/* Photo thumbnail */}
        <div className="flex-shrink-0">
          {dog.photos && dog.photos.length > 0 ? (
            <img
              src={dog.photos[0]}
              alt={dog.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div
              className={cn(
                'w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold text-white',
                dog.sex === 'female' ? 'bg-pink-500' : 'bg-blue-500'
              )}
            >
              {dog.sex === 'female' ? '♀' : '♂'}
            </div>
          )}
        </div>

        {/* Dog info */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">{dog.name}</h3>
            {dog.callName && dog.callName !== dog.name && (
              <span className="text-sm text-muted-foreground">({dog.callName})</span>
            )}
          </div>

          {/* Breed and generation */}
          <p className="text-sm text-muted-foreground truncate">
            {dog.breed}
            {dog.breedGeneration && ` • ${dog.breedGeneration}`}
          </p>

          {/* Age and sex */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                'text-sm font-medium',
                dog.sex === 'female' ? 'text-pink-600' : 'text-blue-600'
              )}
            >
              {dog.sex === 'female' ? '♀ Female' : '♂ Male'}
            </span>
            <span className="text-sm text-muted-foreground">
              • {calculateAge(dog.dateOfBirth)}
            </span>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {getBreedingStatusBadge()}
            {getLitterStatusBadge()}
            {getProgramBadge()}
            {dog.isDeceased && <Badge variant="destructive">Deceased</Badge>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEditClick}
              className="h-10 w-10"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}
