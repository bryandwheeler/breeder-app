import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageCropDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
}

// Maximum canvas size for mobile browsers (conservative limit)
const MAX_CANVAS_SIZE = 4096;

export function ImageCropDialog({ open, setOpen, imageSrc, onCropComplete }: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Initialize crop when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // Create an initial crop that covers 90% of the image, centered
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        width / height, // Use image's natural aspect ratio
        width,
        height
      ),
      width,
      height
    );

    setCrop(initialCrop);
    setImageLoaded(true);

    // Calculate the initial pixel crop so button works immediately
    const pixelCrop: PixelCrop = {
      unit: 'px',
      x: (initialCrop.x / 100) * width,
      y: (initialCrop.y / 100) * height,
      width: (initialCrop.width / 100) * width,
      height: (initialCrop.height / 100) * height,
    };
    setCompletedCrop(pixelCrop);
  }, []);

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    setProcessing(true);
    setError(null);

    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Calculate actual crop dimensions in source image
      let cropWidth = completedCrop.width * scaleX;
      let cropHeight = completedCrop.height * scaleY;

      // Scale down if exceeding mobile canvas limits
      let outputScale = 1;
      if (cropWidth > MAX_CANVAS_SIZE || cropHeight > MAX_CANVAS_SIZE) {
        outputScale = Math.min(MAX_CANVAS_SIZE / cropWidth, MAX_CANVAS_SIZE / cropHeight);
      }

      // Also limit to reasonable output size for web (max 1600px)
      const maxOutputSize = 1600;
      if (cropWidth * outputScale > maxOutputSize || cropHeight * outputScale > maxOutputSize) {
        outputScale = Math.min(maxOutputSize / cropWidth, maxOutputSize / cropHeight, outputScale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(cropWidth * outputScale);
      canvas.height = Math.floor(cropHeight * outputScale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Use better quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) => {
          setProcessing(false);
          if (blob) {
            onCropComplete(blob);
            setOpen(false);
          } else {
            setError('Failed to create image. Please try again.');
          }
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      console.error('Error cropping image:', err);
      setError('Failed to process image. The image may be too large.');
      setProcessing(false);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
      setProcessing(false);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setImageLoaded(false);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        {error && (
          <div className='bg-destructive/15 text-destructive text-sm p-3 rounded-md'>
            {error}
          </div>
        )}

        <div className='flex justify-center items-center max-h-[60vh] overflow-auto'>
          {!imageLoaded && (
            <div className='text-muted-foreground py-8'>Loading image...</div>
          )}
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={undefined}
            disabled={processing}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt='Crop preview'
              style={{ maxHeight: '60vh', maxWidth: '100%' }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            disabled={processing || !imageLoaded || !completedCrop}
          >
            {processing ? 'Processing...' : !imageLoaded ? 'Loading...' : 'Apply Crop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
