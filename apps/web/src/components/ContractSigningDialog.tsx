import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SignaturePad } from './SignaturePad';
import { Puppy, Litter, Dog, Buyer } from '@breeder/types';
import {
  generateSignedContract,
  generateSignedHealthGuarantee,
  generateBreedingRightsContract,
  generateCoOwnershipContract
} from '@/lib/pdfGenerator';
import { FileText } from 'lucide-react';

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
}: ContractSigningDialogProps) {
  const [breederSignature, setBreederSignature] = useState<string | null>(null);
  const [buyerSignature, setBuyerSignature] = useState<string | null>(null);

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

  const title = type === 'contract' ? `Sign ${getContractTypeName()}` : 'Sign Health Guarantee';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        </div>

        <div className='flex justify-end gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate}>
            Generate Signed PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
