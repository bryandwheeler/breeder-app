import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SignaturePad } from './SignaturePad';
import { Puppy, Litter, Dog, Buyer, ContractDocument } from '@breeder/types';
import {
  generateSignedContract,
  generateSignedHealthGuarantee,
  generateBreedingRightsContract,
  generateCoOwnershipContract
} from '@/lib/pdfGenerator';
import { uploadContractDocument, formatFileSize } from '@/lib/uploadContractDocument';
import { FileText, Upload, Pen, File, X, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContractSigningDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  type: 'contract' | 'health';
  puppy: Puppy;
  litter: Litter;
  dam: Dog;
  sire: Dog;
  buyer?: Buyer;
  kennelName: string;
  breederName: string;
  onDocumentUploaded?: (document: ContractDocument) => void;
}

export function ContractSigningDialog({
  open,
  setOpen,
  type,
  puppy,
  litter,
  dam,
  sire,
  buyer,
  kennelName,
  breederName,
  onDocumentUploaded,
}: ContractSigningDialogProps) {
  const [breederSignature, setBreederSignature] = useState<string | null>(null);
  const [buyerSignature, setBuyerSignature] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('generate');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    const contractData = {
      puppy,
      litter,
      dam,
      sire,
      buyer: buyer!,
      kennelName,
      breederName,
      breederSignature: breederSignature || undefined,
      buyerSignature: buyerSignature || undefined,
    };

    if (type === 'contract') {
      if (!buyer) {
        alert('Please assign a buyer first');
        return;
      }

      // Generate appropriate contract based on contract type
      const contractType = puppy.contractType || 'pet';

      switch (contractType) {
        case 'breeding_rights':
          if (!puppy.breedingRights) {
            alert('Breeding rights information is missing. Please update puppy details.');
            return;
          }
          generateBreedingRightsContract(contractData);
          break;

        case 'co_ownership':
          if (!puppy.coOwnership) {
            alert('Co-ownership information is missing. Please update puppy details.');
            return;
          }
          generateCoOwnershipContract(contractData);
          break;

        case 'pet':
        default:
          generateSignedContract(contractData);
          break;
      }
    } else {
      // Health guarantee
      generateSignedHealthGuarantee(contractData);
    }

    setOpen(false);
    setBreederSignature(null);
    setBuyerSignature(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const isValidType = validTypes.includes(file.type.toLowerCase()) ||
                        file.name.toLowerCase().endsWith('.pdf') ||
                        file.name.toLowerCase().endsWith('.heic') ||
                        file.name.toLowerCase().endsWith('.heif');

    if (!isValidType) {
      setUploadError('Please select a PDF or image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const documentType = type === 'contract' ? 'contract' : 'health_guarantee';
      const document = await uploadContractDocument(
        selectedFile,
        litter.id,
        puppy.id,
        documentType
      );

      if (onDocumentUploaded) {
        onDocumentUploaded(document);
      }

      setOpen(false);
      resetState();
    } catch (error) {
      console.error('Error uploading contract:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setBreederSignature(null);
    setBuyerSignature(null);
    setSelectedFile(null);
    setUploadError(null);
    setActiveTab('generate');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    setOpen(newOpen);
  };

  const getContractTypeName = () => {
    if (type === 'health') return 'Health Guarantee';

    const contractType = puppy.contractType || 'pet';
    switch (contractType) {
      case 'breeding_rights':
        return 'Breeding Rights Contract';
      case 'co_ownership':
        return 'Co-Ownership Agreement';
      case 'pet':
      default:
        return 'Pet Sales Contract';
    }
  };

  const title = type === 'contract' ? getContractTypeName() : 'Health Guarantee';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='bg-muted p-4 rounded-lg space-y-2'>
            <h3 className='font-semibold'>Document Details</h3>
            {type === 'contract' && (
              <p className='text-sm'>
                <strong>Contract Type:</strong>{' '}
                <span className='text-primary font-medium'>{getContractTypeName()}</span>
              </p>
            )}
            <p className='text-sm'><strong>Puppy:</strong> {puppy.name || puppy.tempName}</p>
            <p className='text-sm'><strong>Color:</strong> {puppy.color}</p>
            {buyer && <p className='text-sm'><strong>Buyer:</strong> {buyer.name}</p>}
            {puppy.coOwnership && type === 'contract' && (
              <p className='text-sm'><strong>Co-Owner:</strong> {puppy.coOwnership.coOwnerName}</p>
            )}
            {puppy.salePrice && <p className='text-sm'><strong>Price:</strong> ${puppy.salePrice.toLocaleString()}</p>}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'generate' | 'upload')}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='generate' className='flex items-center gap-2'>
                <Pen className='h-4 w-4' />
                Generate & Sign
              </TabsTrigger>
              <TabsTrigger value='upload' className='flex items-center gap-2'>
                <Upload className='h-4 w-4' />
                Upload Document
              </TabsTrigger>
            </TabsList>

            <TabsContent value='generate' className='space-y-6 mt-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <SignaturePad
                  label='Breeder Signature'
                  onSignatureChange={setBreederSignature}
                  width={300}
                  height={120}
                />
                <SignaturePad
                  label='Buyer Signature'
                  onSignatureChange={setBuyerSignature}
                  width={300}
                  height={120}
                />
              </div>

              <p className='text-xs text-muted-foreground'>
                By signing, both parties agree to the terms outlined in the {type === 'contract' ? 'sales contract' : 'health guarantee'}.
              </p>

              <div className='flex justify-end gap-2 pt-4 border-t'>
                <Button variant='outline' onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate}>
                  Generate Signed PDF
                </Button>
              </div>
            </TabsContent>

            <TabsContent value='upload' className='space-y-6 mt-6'>
              <div className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  Upload a signed contract document (PDF or image) that you've already created.
                </p>

                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,image/*,application/pdf'
                  onChange={handleFileSelect}
                  className='hidden'
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors'
                  >
                    <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                    <p className='text-sm font-medium'>Click to select a file</p>
                    <p className='text-xs text-muted-foreground mt-1'>PDF or image, max 10MB</p>
                  </div>
                ) : (
                  <div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
                    <File className='h-8 w-8 text-blue-500 flex-shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>{selectedFile.name}</p>
                      <p className='text-xs text-muted-foreground'>{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                )}

                {uploadError && (
                  <div className='bg-destructive/15 text-destructive text-sm p-3 rounded-md'>
                    {uploadError}
                  </div>
                )}
              </div>

              <div className='flex justify-end gap-2 pt-4 border-t'>
                <Button variant='outline' onClick={() => setOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Uploading...
                    </>
                  ) : (
                    'Upload Document'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
