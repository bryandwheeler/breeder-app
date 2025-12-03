import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminStore } from '@/store/adminStore';
import { LogOut, Shield } from 'lucide-react';

export function ImpersonationBanner() {
  const navigate = useNavigate();
  const { impersonatedUserId, users, setImpersonatedUser } = useAdminStore();
  const [impersonatedUserName, setImpersonatedUserName] = useState<string>('');

  useEffect(() => {
    if (impersonatedUserId) {
      const user = users.find((u) => u.uid === impersonatedUserId);
      if (user) {
        setImpersonatedUserName(user.displayName || user.email);
      }
    }
  }, [impersonatedUserId, users]);

  if (!impersonatedUserId) return null;

  const handleExitImpersonation = () => {
    setImpersonatedUser(null);
    navigate('/admin');
  };

  return (
    <Alert className='sticky top-16 z-40 rounded-none border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950'>
      <Shield className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
      <AlertDescription className='flex items-center justify-between gap-4'>
        <span className='text-yellow-800 dark:text-yellow-200'>
          <strong>Admin Mode:</strong> You are viewing as {impersonatedUserName}
        </span>
        <Button
          size='sm'
          variant='outline'
          onClick={handleExitImpersonation}
          className='bg-white dark:bg-background'
        >
          <LogOut className='mr-2 h-3 w-3' />
          Exit Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  );
}
