import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageCropDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
}

export function ImageCropDialog({ open, setOpen, imageSrc, onCropComplete }: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          setOpen(false);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className='flex justify-center items-center max-h-[60vh] overflow-auto'>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={undefined}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt='Crop preview'
              style={{ maxHeight: '60vh', maxWidth: '100%' }}
            />
          </ReactCrop>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
