import { useState } from 'react';
import { Puppy, Buyer, WaitlistEntry } from '@breeder/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, User, FileText, Users, ExternalLink, CheckCircle2, Eye, ClipboardCheck } from 'lucide-react';
import { ImageGalleryDialog } from '@/components/ImageGalleryDialog';

interface PuppyCardProps {
  puppy: Puppy;
  buyer?: Buyer;
  waitlistEntry?: WaitlistEntry; // Waitlist entry assigned to this puppy
  evaluationCount?: number; // Number of evaluations completed for this puppy
  onView?: (puppy: Puppy) => void;
  onEdit?: (puppy: Puppy) => void;
  onDelete?: (puppyId: string) => void;
  onReserve?: (puppyId: string) => void;
  onGenerateContract?: (puppy: Puppy) => void;
  onGenerateHealthGuarantee?: (puppy: Puppy) => void;
  onPhotoDelete?: (puppy: Puppy, photoIndex: number) => void;
}

export function PuppyCard({ puppy, buyer, waitlistEntry, evaluationCount, onView, onEdit, onDelete, onReserve, onGenerateContract, onGenerateHealthGuarantee, onPhotoDelete }: PuppyCardProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

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
            <div className='flex flex-wrap gap-2 mt-2'>
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
              {evaluationCount !== undefined && evaluationCount > 0 && (
                <Badge variant='secondary' className='flex items-center gap-1'>
                  <ClipboardCheck className='h-3 w-3' />
                  {evaluationCount} eval{evaluationCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          <div className='flex gap-1'>
            {onView && (
              <Button size='sm' variant='ghost' onClick={() => onView(puppy)} title='View Details'>
                <Eye className='h-4 w-4' />
              </Button>
            )}
            {onEdit && (
              <Button size='sm' variant='ghost' onClick={() => onEdit(puppy)} title='Edit'>
                <Edit className='h-4 w-4' />
              </Button>
            )}
            {onDelete && (
              <Button size='sm' variant='ghost' onClick={() => onDelete(puppy.id)} title='Delete'>
                <Trash2 className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {puppy.photos && puppy.photos.length > 0 && (
          <div className='mb-4 relative'>
            <div className='grid grid-cols-2 gap-2'>
              {puppy.photos.slice(0, 2).map((photo, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setGalleryInitialIndex(index);
                    setGalleryOpen(true);
                  }}
                  className='relative group'
                >
                  <img
                    src={photo}
                    alt={`${puppy.name || 'Puppy'} ${index + 1}`}
                    className='w-full h-32 object-cover rounded-lg cursor-pointer'
                  />
                  <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition flex items-center justify-center'>
                    <span className='text-white opacity-0 group-hover:opacity-100 text-sm font-medium'>
                      View
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {puppy.photos.length > 2 && (
              <button
                onClick={() => {
                  setGalleryInitialIndex(2);
                  setGalleryOpen(true);
                }}
                className='absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/80 transition'
              >
                +{puppy.photos.length - 2} more
              </button>
            )}
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

      {/* Image Gallery Dialog */}
      {puppy.photos && puppy.photos.length > 0 && (
        <ImageGalleryDialog
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          images={puppy.photos}
          initialIndex={galleryInitialIndex}
          title={`${puppy.name || 'Puppy'}'s Photos`}
          onDelete={onPhotoDelete ? (index) => onPhotoDelete(puppy, index) : undefined}
        />
      )}
    </Card>
  );
}
