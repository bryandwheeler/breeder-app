import { useState, useRef, useCallback, useEffect } from 'react';
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

// Max dimension for the working image fed to the cropper.
// Large source images are pre-resized to this before cropping.
const MAX_SOURCE_SIZE = 2048;
// Max dimension for the final cropped output
const MAX_OUTPUT_SIZE = 1200;
// JPEG quality for final output (0.85 balances quality & file size)
const OUTPUT_QUALITY = 0.85;

/**
 * Convert a remote URL to a same-origin blob URL by fetching it.
 * This avoids CORS canvas tainting when drawing Firebase Storage
 * images (or any cross-origin images) onto a canvas.
 */
async function fetchAsBlobUrl(src: string): Promise<string> {
  const response = await fetch(src);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Pre-process a source image for the crop dialog:
 * 1. Remote URLs are fetched and converted to same-origin blob URLs
 *    (avoids CORS canvas tainting with Firebase Storage, etc.)
 * 2. Images larger than maxDim are resized down
 * Returns a same-origin blob URL safe for canvas operations.
 */
async function preProcessImage(src: string, maxDim: number): Promise<string> {
  // Step 1: Ensure we have a same-origin URL for canvas safety
  let localSrc = src;
  if (src.startsWith('http://') || src.startsWith('https://')) {
    localSrc = await fetchAsBlobUrl(src);
  }

  // Step 2: Load and check dimensions
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;

      // If already within limits, use the local blob URL as-is
      if (w <= maxDim && h <= maxDim) {
        resolve(localSrc);
        return;
      }

      // Step 3: Resize down
      const scale = Math.min(maxDim / w, maxDim / h);
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(w * scale);
      canvas.height = Math.floor(h * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context for pre-resize'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          // Revoke the intermediate blob URL since we have a new one
          if (localSrc !== src) URL.revokeObjectURL(localSrc);
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Pre-resize failed to produce blob'));
          }
        },
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => {
      if (localSrc !== src) URL.revokeObjectURL(localSrc);
      reject(new Error('Failed to load image for pre-resize'));
    };
    img.src = localSrc;
  });
}

export function ImageCropDialog({ open, setOpen, imageSrc, onCropComplete }: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [resizedSrc, setResizedSrc] = useState<string | null>(null);
  const [preProcessing, setPreProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Pre-resize the source image when the dialog opens or imageSrc changes
  useEffect(() => {
    if (!open || !imageSrc) {
      setResizedSrc(null);
      return;
    }

    let cancelled = false;
    setPreProcessing(true);
    setError(null);

    preProcessImage(imageSrc, MAX_SOURCE_SIZE)
      .then((url) => {
        if (!cancelled) {
          setResizedSrc(url);
          setPreProcessing(false);
        }
      })
      .catch((err) => {
        console.error('Pre-process error:', err);
        if (!cancelled) {
          // Fallback: try original src (will work for data URLs, may fail for remote)
          setResizedSrc(imageSrc);
          setPreProcessing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, imageSrc]);

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

      // Calculate actual crop dimensions in the (pre-resized) source
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      // Scale down to MAX_OUTPUT_SIZE for the final image
      let outputScale = 1;
      if (cropWidth > MAX_OUTPUT_SIZE || cropHeight > MAX_OUTPUT_SIZE) {
        outputScale = Math.min(MAX_OUTPUT_SIZE / cropWidth, MAX_OUTPUT_SIZE / cropHeight);
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(cropWidth * outputScale);
      canvas.height = Math.floor(cropHeight * outputScale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

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
        OUTPUT_QUALITY
      );
    } catch (err) {
      console.error('Error cropping image:', err);
      setError('Failed to process image. Please try a smaller image or take the photo at a lower resolution.');
      setProcessing(false);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
      setProcessing(false);
      setPreProcessing(false);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setImageLoaded(false);
      // Revoke the pre-resized blob URL to free memory
      if (resizedSrc && resizedSrc !== imageSrc) {
        URL.revokeObjectURL(resizedSrc);
      }
      setResizedSrc(null);
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
          {(preProcessing || (!imageLoaded && resizedSrc)) && (
            <div className='text-muted-foreground py-8'>
              {preProcessing ? 'Optimizing image...' : 'Loading image...'}
            </div>
          )}
          {resizedSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={undefined}
              disabled={processing}
            >
              <img
                ref={imgRef}
                src={resizedSrc}
                alt='Crop preview'
                crossOrigin='anonymous'
                style={{ maxHeight: '60vh', maxWidth: '100%' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            disabled={processing || preProcessing || !imageLoaded || !completedCrop}
          >
            {processing ? 'Processing...' : preProcessing ? 'Optimizing...' : !imageLoaded ? 'Loading...' : 'Apply Crop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
