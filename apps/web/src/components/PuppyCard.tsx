import { Puppy, Buyer, WaitlistEntry } from '@breeder/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, User, FileText, Users, ExternalLink, CheckCircle2 } from 'lucide-react';

interface PuppyCardProps {
  puppy: Puppy;
  buyer?: Buyer;
  waitlistEntry?: WaitlistEntry; // Waitlist entry assigned to this puppy
  onEdit?: (puppy: Puppy) => void;
  onDelete?: (puppyId: string) => void;
  onReserve?: (puppyId: string) => void;
  onGenerateContract?: (puppy: Puppy) => void;
  onGenerateHealthGuarantee?: (puppy: Puppy) => void;
}

export function PuppyCard({ puppy, buyer, waitlistEntry, onEdit, onDelete, onReserve, onGenerateContract, onGenerateHealthGuarantee }: PuppyCardProps) {
  const getStatusColor = (status: Puppy['status']) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'reserved':
        return 'secondary';
      case 'sold':
        return 'outline';
      case 'kept':
        return 'destructive';
      case 'unavailable':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: Puppy['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              {puppy.name || puppy.tempName || 'Unnamed Puppy'}
              {puppy.collar && (
                <Badge variant='outline' className='text-xs'>
                  {puppy.collar} Collar
                </Badge>
              )}
            </CardTitle>
            <div className='flex gap-2 mt-2'>
              <Badge variant={getStatusColor(puppy.status)}>
                {getStatusLabel(puppy.status)}
              </Badge>
              {puppy.isDeceased && (
                <Badge variant='destructive'>Deceased</Badge>
              )}
              <Badge variant='outline'>
                {puppy.sex === 'male' ? '♂ Male' : '♀ Female'}
              </Badge>
              <Badge variant='outline'>{puppy.color}</Badge>
            </div>
          </div>
          <div className='flex gap-1'>
            {onEdit && (
              <Button size='sm' variant='ghost' onClick={() => onEdit(puppy)}>
                <Edit className='h-4 w-4' />
              </Button>
            )}
            {onDelete && (
              <Button size='sm' variant='ghost' onClick={() => onDelete(puppy.id)}>
                <Trash2 className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {puppy.photos && puppy.photos.length > 0 && (
          <div className='mb-4 grid grid-cols-2 gap-2'>
            {puppy.photos.slice(0, 2).map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`${puppy.name || 'Puppy'} ${index + 1}`}
                className='w-full h-32 object-cover rounded-lg'
              />
            ))}
          </div>
        )}

        <div className='space-y-2 text-sm'>
          {puppy.weight && (
            <div>
              <strong>Weight:</strong> {puppy.weight} {puppy.weightUnit || 'lbs'}
            </div>
          )}
          {puppy.microchip && (
            <div>
              <strong>Microchip:</strong> {puppy.microchip}
            </div>
          )}
          {buyer && (
            <div className='flex items-center gap-2 p-2 bg-muted rounded'>
              <User className='h-4 w-4' />
              <div>
                <div className='font-medium'>{buyer.name}</div>
                <div className='text-xs text-muted-foreground'>{buyer.email}</div>
              </div>
            </div>
          )}
          {waitlistEntry && !buyer && (
            <div className='flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded'>
              <Users className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              <div>
                <div className='font-medium text-blue-900 dark:text-blue-100'>{waitlistEntry.name}</div>
                <div className='text-xs text-blue-600 dark:text-blue-400'>{waitlistEntry.email}</div>
                <div className='text-xs text-blue-500 dark:text-blue-500'>From Waitlist</div>
              </div>
            </div>
          )}
          {puppy.salePrice && (
            <div>
              <strong>Sale Price:</strong> ${puppy.salePrice.toLocaleString()}
            </div>
          )}
          {puppy.depositAmount && (
            <div>
              <strong>Deposit:</strong> ${puppy.depositAmount.toLocaleString()}
              {puppy.depositPaid && (
                <Badge variant='default' className='ml-2 text-xs'>
                  Paid
                </Badge>
              )}
            </div>
          )}
          {puppy.pickupDate && (
            <div>
              <strong>Pickup Date:</strong>{' '}
              {new Date(puppy.pickupDate).toLocaleDateString()}
            </div>
          )}
          {puppy.notes && (
            <div className='pt-2 border-t'>
              <strong>Notes:</strong> {puppy.notes}
            </div>
          )}

          {/* Uploaded Documents */}
          {(puppy.contractDocument || puppy.healthGuaranteeDocument) && (
            <div className='pt-2 border-t space-y-2'>
              <strong>Documents:</strong>
              {puppy.contractDocument && (
                <a
                  href={puppy.contractDocument.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors'
                >
                  <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium text-green-900 dark:text-green-100 text-xs'>Contract Uploaded</div>
                    <div className='text-xs text-green-600 dark:text-green-400 truncate'>{puppy.contractDocument.name}</div>
                  </div>
                  <ExternalLink className='h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0' />
                </a>
              )}
              {puppy.healthGuaranteeDocument && (
                <a
                  href={puppy.healthGuaranteeDocument.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors'
                >
                  <CheckCircle2 className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium text-blue-900 dark:text-blue-100 text-xs'>Health Guarantee Uploaded</div>
                    <div className='text-xs text-blue-600 dark:text-blue-400 truncate'>{puppy.healthGuaranteeDocument.name}</div>
                  </div>
                  <ExternalLink className='h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0' />
                </a>
              )}
            </div>
          )}
        </div>

        {onReserve && puppy.status === 'available' && (
          <Button onClick={() => onReserve(puppy.id)} className='w-full mt-4'>
            Reserve Puppy
          </Button>
        )}

        {(onGenerateContract || onGenerateHealthGuarantee) && (
          <div className='flex gap-2 mt-4'>
            {onGenerateContract && (
              <Button size='sm' variant='outline' onClick={() => onGenerateContract(puppy)} className='flex-1'>
                <FileText className='mr-1 h-3 w-3' /> Contract
              </Button>
            )}
            {onGenerateHealthGuarantee && (
              <Button size='sm' variant='outline' onClick={() => onGenerateHealthGuarantee(puppy)} className='flex-1'>
                <FileText className='mr-1 h-3 w-3' /> Health
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
