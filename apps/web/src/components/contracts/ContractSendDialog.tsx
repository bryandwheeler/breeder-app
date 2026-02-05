import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ContractTemplateType,
  CONTRACT_TEMPLATE_TYPE_LABELS,
  SignerRole,
  SIGNER_ROLE_LABELS,
} from '@breeder/types';
import { useContractStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Trash2,
  Send,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContractSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contractId: string) => void;
  // Pre-fill data
  puppyId?: string;
  puppyName?: string;
  litterId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
}

interface SignerInput {
  id: string;
  name: string;
  email: string;
  role: SignerRole;
  order: number;
}

export function ContractSendDialog({
  open,
  onOpenChange,
  onSuccess,
  puppyId,
  puppyName,
  litterId,
  customerId,
  customerName,
  customerEmail,
}: ContractSendDialogProps) {
  const { currentUser } = useAuth();
  const { createContract, templates } = useContractStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [contractName, setContractName] = useState('');
  const [templateType, setTemplateType] = useState<ContractTemplateType>('puppy_sale');
  const [signers, setSigners] = useState<SignerInput[]>([
    {
      id: crypto.randomUUID(),
      name: customerName || '',
      email: customerEmail || '',
      role: 'buyer',
      order: 1,
    },
  ]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const handleAddSigner = () => {
    setSigners([
      ...signers,
      {
        id: crypto.randomUUID(),
        name: '',
        email: '',
        role: 'buyer',
        order: signers.length + 1,
      },
    ]);
  };

  const handleRemoveSigner = (id: string) => {
    setSigners(signers.filter((s) => s.id !== id));
  };

  const handleSignerChange = (
    id: string,
    field: keyof SignerInput,
    value: string
  ) => {
    setSigners(
      signers.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    // Validation
    if (!contractName.trim()) {
      setError('Please enter a contract name');
      return;
    }

    const validSigners = signers.filter((s) => s.name && s.email);
    if (validSigners.length === 0) {
      setError('Please add at least one signer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contractId = await createContract({
        userId: currentUser.uid,
        name: contractName,
        templateType,
        status: 'draft',
        signers: validSigners.map((s, i) => ({
          ...s,
          status: 'pending',
          order: i + 1,
        })),
        signingOrder: 'parallel',
        puppyId,
        litterId,
        customerId,
        mergeData: {
          buyer_name: validSigners[0]?.name || '',
          buyer_email: validSigners[0]?.email || '',
          puppy_name: puppyName || '',
        },
      });

      toast({
        title: 'Contract created',
        description: 'Your contract has been created as a draft.',
      });

      onSuccess?.(contractId);
      onOpenChange(false);

      // Reset form
      setContractName('');
      setSigners([
        {
          id: crypto.randomUUID(),
          name: '',
          email: '',
          role: 'buyer',
          order: 1,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create contract';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Create New Contract
          </DialogTitle>
          <DialogDescription>
            Create a contract to send for e-signature via SignNow
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Contract Details */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='contract-name'>Contract Name</Label>
              <Input
                id='contract-name'
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder={`${puppyName ? `${puppyName} - ` : ''}Puppy Sale Contract`}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='template-type'>Contract Type</Label>
              <Select
                value={templateType}
                onValueChange={(value) => setTemplateType(value as ContractTemplateType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRACT_TEMPLATE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Signers */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label>Signers</Label>
              <Button
                variant='outline'
                size='sm'
                onClick={handleAddSigner}
              >
                <Plus className='h-4 w-4 mr-1' />
                Add Signer
              </Button>
            </div>

            <div className='space-y-3'>
              {signers.map((signer, index) => (
                <div
                  key={signer.id}
                  className='grid grid-cols-12 gap-2 items-start p-3 border rounded-lg'
                >
                  <div className='col-span-4'>
                    <Label className='text-xs text-muted-foreground'>Name</Label>
                    <Input
                      value={signer.name}
                      onChange={(e) =>
                        handleSignerChange(signer.id, 'name', e.target.value)
                      }
                      placeholder='Full name'
                    />
                  </div>
                  <div className='col-span-4'>
                    <Label className='text-xs text-muted-foreground'>Email</Label>
                    <Input
                      type='email'
                      value={signer.email}
                      onChange={(e) =>
                        handleSignerChange(signer.id, 'email', e.target.value)
                      }
                      placeholder='email@example.com'
                    />
                  </div>
                  <div className='col-span-3'>
                    <Label className='text-xs text-muted-foreground'>Role</Label>
                    <Select
                      value={signer.role}
                      onValueChange={(value) =>
                        handleSignerChange(signer.id, 'role', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SIGNER_ROLE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='col-span-1 pt-6'>
                    {signers.length > 1 && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleRemoveSigner(signer.id)}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Customization */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email-subject'>Email Subject (optional)</Label>
              <Input
                id='email-subject'
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder='Please sign your contract'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email-message'>Email Message (optional)</Label>
              <Textarea
                id='email-message'
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder='Please review and sign this contract at your earliest convenience.'
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Creating...
              </>
            ) : (
              <>
                <Send className='h-4 w-4 mr-2' />
                Create Contract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
