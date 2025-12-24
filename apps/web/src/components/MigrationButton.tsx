import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { migrateDogsData } from '@/utils/migrateDogsData';
import { useAuth } from '@/contexts/AuthContext';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';

export function MigrationButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ updated: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const handleMigration = async () => {
    if (!currentUser) {
      setError('You must be logged in to run migration');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const migrationResult = await migrateDogsData(currentUser.uid);
      setResult(migrationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Alert>
        <Database className='h-4 w-4' />
        <AlertDescription>
          <strong>Database Migration</strong>
          <p className='mt-2 text-sm'>
            This will add new health tracking fields (weight history, medications, dewormings, vet
            visits) to all your existing dogs. You only need to run this once.
          </p>
        </AlertDescription>
      </Alert>

      <Button onClick={handleMigration} disabled={isRunning}>
        {isRunning ? 'Running Migration...' : 'Run Migration'}
      </Button>

      {result && (
        <Alert>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertDescription>
            <strong className='text-green-600'>Migration Successful!</strong>
            <p className='mt-1 text-sm'>
              Updated {result.updated} dog{result.updated !== 1 ? 's' : ''}, skipped{' '}
              {result.skipped} (already migrated)
            </p>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            <strong>Migration Error</strong>
            <p className='mt-1 text-sm'>{error}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
