import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, RotateCcw, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { uploadImageToFirebase } from '@/lib/websiteImageUpload';
import { useAuth } from '@/contexts/AuthContext';

interface ImageUploadCropperProps {
  onImageSave: (imageUrl: string) => void;
  aspectRatio?: number; // width/height ratio (e.g., 3.2 for 1920x600)
  title: string;
  description?: string;
  imageType?: 'logo' | 'hero';
}

export function ImageUploadCropper({
  onImageSave,
  aspectRatio = 16 / 9,
  title,
  description,
  imageType = 'hero',
}: ImageUploadCropperProps) {
  const { currentUser } = useAuth();
  const [preview, setPreview] = useState<string>('');
  const [showCropper, setShowCropper] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPreview(event.target?.result as string);
        setShowCropper(true);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Redraw canvas when image, zoom, or offset changes
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !preview) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;

    // Function to redraw canvas
    const performRedraw = () => {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Clear canvas — preserve transparency for logos
      if (imageType === 'logo') {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      } else {
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const imgAspectRatio = imgWidth / imgHeight;
      const canvasAspectRatio = canvasWidth / canvasHeight;

      let drawWidth: number;
      let drawHeight: number;

      // Scale image to fit canvas while maintaining aspect ratio
      if (imgAspectRatio > canvasAspectRatio) {
        // Image is wider - fit to canvas width
        drawWidth = canvasWidth / zoom;
        drawHeight = drawWidth / imgAspectRatio;
      } else {
        // Image is taller - fit to canvas height
        drawHeight = canvasHeight / zoom;
        drawWidth = drawHeight * imgAspectRatio;
      }

      // Center the image with applied offsets
      const xOffset = (canvasWidth - drawWidth) / 2 + offsetX;
      const yOffset = (canvasHeight - drawHeight) / 2 + offsetY;

      // Draw the image
      ctx.drawImage(img, xOffset, yOffset, drawWidth, drawHeight);

      // Draw crop guide rectangle (target area)
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
      ctx.setLineDash([]);
    };

    // If image is already loaded, draw immediately
    if (img.complete && img.naturalWidth > 0) {
      performRedraw();
    } else {
      // Otherwise wait for load
      img.onload = () => {
        performRedraw();
      };
    }
  }, [preview, zoom, offsetX, offsetY, showCropper]);

  const cropImage = async () => {
    if (!canvasRef.current || !imageRef.current || !currentUser) return;

    setUploading(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imageRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Clear canvas — preserve transparency for logos
      if (imageType === 'logo') {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const imgAspectRatio = imgWidth / imgHeight;
      const canvasAspectRatio = canvasWidth / canvasHeight;

      let drawWidth: number;
      let drawHeight: number;

      // Scale image to fit canvas while maintaining aspect ratio
      if (imgAspectRatio > canvasAspectRatio) {
        // Image is wider - fit to canvas width
        drawWidth = canvasWidth / zoom;
        drawHeight = drawWidth / imgAspectRatio;
      } else {
        // Image is taller - fit to canvas height
        drawHeight = canvasHeight / zoom;
        drawWidth = drawHeight * imgAspectRatio;
      }

      // Center the image with applied offsets
      const xOffset = (canvasWidth - drawWidth) / 2 + offsetX;
      const yOffset = (canvasHeight - drawHeight) / 2 + offsetY;

      // Draw the image
      ctx.drawImage(img, xOffset, yOffset, drawWidth, drawHeight);

      // Convert canvas to data URL — PNG for logos to preserve transparency
      const imageData = imageType === 'logo'
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.95);

      // Upload to Firebase Storage
      const downloadUrl = await uploadImageToFirebase(
        currentUser.uid,
        imageType,
        imageData
      );

      onImageSave(downloadUrl);
      setShowCropper(false);
      setPreview('');
    } catch (error) {
      console.error('Error cropping and uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Card className='p-4'>
        <Label htmlFor='image-upload' className='block mb-2 font-semibold'>
          {title}
        </Label>
        {description && (
          <p className='text-sm text-muted-foreground mb-3'>{description}</p>
        )}

        <div className='relative border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 cursor-pointer transition'>
          <Input
            id='image-upload'
            type='file'
            accept='image/*'
            onChange={handleFileSelect}
            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
          />
          <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
          <p className='text-sm font-medium'>Click to upload image</p>
          <p className='text-xs text-muted-foreground'>
            PNG, JPG, GIF up to 10MB
          </p>
        </div>
      </Card>

      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className='max-w-4xl'>
          <DialogHeader>
            <DialogTitle>Crop and Position Image</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Preview Image (hidden, for reference) */}
            <img
              ref={imageRef}
              src={preview}
              style={{ display: 'none' }}
              alt='crop'
            />

            {/* Canvas for cropping */}
            <div className='bg-muted rounded-lg overflow-hidden border'>
              <div
                className='flex justify-center items-center relative'
                style={{
                  height: '400px',
                  backgroundColor: imageType === 'logo' ? undefined : '#f3f4f6',
                  ...(imageType === 'logo' ? {
                    backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  } : {}),
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={Math.floor(400 * aspectRatio)}
                  height={400}
                  style={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
            </div>

            {/* Controls */}
            <div className='space-y-3'>
              {/* Zoom Control */}
              <div className='flex items-center gap-3'>
                <Label className='text-sm font-medium min-w-fit'>Zoom:</Label>
                <div className='flex items-center gap-2 flex-1'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  >
                    <ZoomOut className='h-4 w-4' />
                  </Button>
                  <input
                    type='range'
                    min='0.5'
                    max='3'
                    step='0.1'
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  >
                    <ZoomIn className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* Reset Button */}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  setZoom(1);
                  setOffsetX(0);
                  setOffsetY(0);
                }}
              >
                <RotateCcw className='h-4 w-4 mr-2' />
                Reset Position
              </Button>

              <p className='text-xs text-muted-foreground text-center'>
                Drag to reposition • Use zoom controls to adjust size
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowCropper(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={cropImage} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Uploading...
                </>
              ) : (
                'Save Image'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
