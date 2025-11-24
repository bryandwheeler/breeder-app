import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dog } from '@/types/dog';
import { format } from 'date-fns';
import { GitBranch } from 'lucide-react';

interface PuppyPedigreeProps {
  dam: Dog | null;
  sire: Dog | null;
  puppyName?: string;
}

function DogCard({ dog, role }: { dog: Dog | null; role: string }) {
  if (!dog) {
    return (
      <div className="p-3 border rounded-lg bg-muted/30">
        <p className="text-sm text-muted-foreground">{role}</p>
        <p className="font-medium">Unknown</p>
      </div>
    );
  }

  return (
    <div className="p-3 border rounded-lg bg-card">
      <div className="flex items-start gap-3">
        {dog.photos?.[0] && (
          <img
            src={dog.photos[0]}
            alt={dog.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{role}</p>
          <p className="font-semibold">{dog.name}</p>
          {dog.registeredName && (
            <p className="text-xs text-muted-foreground truncate">{dog.registeredName}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="outline" className="text-xs">
              {dog.sex === 'female' ? '♀' : '♂'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {dog.color}
            </Badge>
          </div>
          {dog.dateOfBirth && (
            <p className="text-xs text-muted-foreground mt-1">
              Born {format(new Date(dog.dateOfBirth), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* Health Tests */}
      {dog.healthTests && dog.healthTests.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-medium mb-1">Health Tests:</p>
          <div className="flex flex-wrap gap-1">
            {dog.healthTests.map((test) => (
              <Badge
                key={test.id}
                variant={test.result.toLowerCase().includes('clear') ? 'default' : 'secondary'}
                className="text-xs"
              >
                {test.test}: {test.result}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PuppyPedigree({ dam, sire, puppyName }: PuppyPedigreeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          {puppyName ? `${puppyName}'s Pedigree` : 'Pedigree'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Visual Tree */}
          <div className="flex flex-col items-center">
            {/* Puppy */}
            <div className="w-32 h-12 border-2 border-primary rounded-lg flex items-center justify-center bg-primary/10 font-medium text-sm">
              {puppyName || 'Puppy'}
            </div>

            {/* Connector */}
            <div className="w-0.5 h-4 bg-border" />
            <div className="w-48 h-0.5 bg-border" />
            <div className="flex w-48 justify-between">
              <div className="w-0.5 h-4 bg-border" />
              <div className="w-0.5 h-4 bg-border" />
            </div>
          </div>

          {/* Parents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DogCard dog={sire} role="Sire (Father)" />
            <DogCard dog={dam} role="Dam (Mother)" />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground pt-4 border-t">
            <span className="flex items-center gap-1">
              <Badge variant="default" className="text-xs h-4">Clear</Badge>
              = Passed test
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs h-4">Carrier</Badge>
              = Other result
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
