import { useAdminStore } from '@/store/adminStore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function GlobalRegistriesList() {
  const { appSettings } = useAdminStore();
  const registries =
    (appSettings as unknown as { globalRegistries?: string[] })
      ?.globalRegistries ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Global Registries</CardTitle>
        <CardDescription>
          Registries available system-wide for dog registration tracking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {registries.length === 0 ? (
          <p className='text-muted-foreground'>
            No global registries configured.
          </p>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {registries.map((registry) => (
              <Badge key={registry} variant='default'>
                {registry}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
