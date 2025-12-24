// src/pages/DogFormPage.tsx – THIS IS THE FIX
import { DogFormDialog } from '@/components/DogFormDialog';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dog } from '@breeder/types';

export function DogFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dog = location.state?.dog as Dog | null;

  const handleClose = () => {
    navigate(-1); // go back to where we came from
  };

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <DogFormDialog open={true} setOpen={handleClose} dog={dog} />
    </div>
  );
}
