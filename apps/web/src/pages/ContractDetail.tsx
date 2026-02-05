import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContractStore } from '@breeder/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ContractStatusBadge,
  ContractTimeline,
  SignerList,
} from '@/components/contracts';
import { CONTRACT_TEMPLATE_TYPE_LABELS, ContractSigner } from '@breeder/types';
import {
  ArrowLeft,
  FileSignature,
  Download,
  Send,
  XCircle,
  ExternalLink,
  FileText,
  Users,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  uploadContractFile,
  sendContractForSigning,
  getSigningUrl,
} from '@/lib/signnow';

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ContractDetail() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    currentContract,
    currentContractSigners,
    currentContractAuditEvents,
    loading,
    error,
    subscribeToContract,
    subscribeToContractSigners,
    subscribeToContractAuditEvents,
    cancelContract,
  } = useContractStore();
  const { toast } = useToast();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!contractId) return;

    const unsubContract = subscribeToContract(contractId);
    const unsubSigners = subscribeToContractSigners(contractId);
    const unsubEvents = subscribeToContractAuditEvents(contractId);

    return () => {
      unsubContract();
      unsubSigners();
      unsubEvents();
    };
  }, [contractId, subscribeToContract, subscribeToContractSigners, subscribeToContractAuditEvents]);

  const handleCancel = async () => {
    if (!currentContract) return;
    if (!confirm('Are you sure you want to cancel this contract?')) return;

    setActionLoading('cancel');
    try {
      await cancelContract(currentContract.id);
      toast({
        title: 'Contract cancelled',
        description: 'The contract has been cancelled.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to cancel contract',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendForSigning = async () => {
    if (!currentContract) return;

    setActionLoading('send');
    try {
      // For now, just show a message about needing to upload a PDF first
      toast({
        title: 'Upload Required',
        description: 'Please upload a PDF document before sending for signature. This feature is coming soon.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send contract',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleGetSigningLink = async (signer: ContractSigner) => {
    if (!currentContract || !signer.id) return;

    setActionLoading(`link-${signer.id}`);
    try {
      const result = await getSigningUrl(currentContract.id, signer.id);
      if (result?.url) {
        window.open(result.url, '_blank');
      } else {
        toast({
          title: 'Error',
          description: 'Could not get signing link',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to get signing link',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !currentContract) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2' />
          <p className='text-muted-foreground'>Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto py-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const canCancel = ['draft', 'sent', 'viewed', 'partially_signed'].includes(currentContract.status);
  const canSend = currentContract.status === 'draft';

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => navigate('/contracts')}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold'>{currentContract.name}</h1>
            <ContractStatusBadge status={currentContract.status} />
          </div>
          <p className='text-muted-foreground'>
            {CONTRACT_TEMPLATE_TYPE_LABELS[currentContract.templateType] || currentContract.templateType}
          </p>
        </div>
        <div className='flex gap-2'>
          {canSend && (
            <Button
              onClick={handleSendForSigning}
              disabled={actionLoading === 'send'}
            >
              {actionLoading === 'send' ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <Send className='h-4 w-4 mr-2' />
              )}
              Send for Signing
            </Button>
          )}
          {currentContract.signedPdfUrl && (
            <Button variant='outline' asChild>
              <a href={currentContract.signedPdfUrl} target='_blank' rel='noopener noreferrer'>
                <Download className='h-4 w-4 mr-2' />
                Download Signed PDF
              </a>
            </Button>
          )}
          {canCancel && (
            <Button
              variant='outline'
              onClick={handleCancel}
              disabled={actionLoading === 'cancel'}
            >
              {actionLoading === 'cancel' ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <XCircle className='h-4 w-4 mr-2' />
              )}
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          <Tabs defaultValue='signers'>
            <TabsList>
              <TabsTrigger value='signers' className='flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Signers
              </TabsTrigger>
              <TabsTrigger value='activity' className='flex items-center gap-2'>
                <Clock className='h-4 w-4' />
                Activity
              </TabsTrigger>
              <TabsTrigger value='document' className='flex items-center gap-2'>
                <FileText className='h-4 w-4' />
                Document
              </TabsTrigger>
            </TabsList>

            <TabsContent value='signers' className='mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Signers</CardTitle>
                  <CardDescription>
                    People who need to sign this contract
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SignerList
                    signers={currentContractSigners.length > 0 ? currentContractSigners : currentContract.signers}
                    onGetSigningLink={handleGetSigningLink}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='activity' className='mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>
                    Complete history of this contract
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContractTimeline events={currentContractAuditEvents} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='document' className='mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Document</CardTitle>
                  <CardDescription>
                    Contract PDF document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentContract.originalPdfUrl ? (
                    <div className='space-y-4'>
                      <Button variant='outline' asChild>
                        <a
                          href={currentContract.originalPdfUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <ExternalLink className='h-4 w-4 mr-2' />
                          View Original PDF
                        </a>
                      </Button>
                      {currentContract.signedPdfUrl && (
                        <Button variant='outline' asChild>
                          <a
                            href={currentContract.signedPdfUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <Download className='h-4 w-4 mr-2' />
                            Download Signed PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                      <p className='text-muted-foreground'>
                        No document uploaded yet
                      </p>
                      <p className='text-sm text-muted-foreground mt-1'>
                        Upload a PDF to send for signature
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Status</p>
                <ContractStatusBadge status={currentContract.status} />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Type</p>
                <p className='text-sm font-medium'>
                  {CONTRACT_TEMPLATE_TYPE_LABELS[currentContract.templateType] || currentContract.templateType}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Signing Order</p>
                <p className='text-sm font-medium capitalize'>
                  {currentContract.signingOrder}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Created</p>
                <p className='text-sm'>{formatDate(currentContract.createdAt)}</p>
              </div>
              {currentContract.sentAt && (
                <div>
                  <p className='text-sm text-muted-foreground'>Sent</p>
                  <p className='text-sm'>{formatDate(currentContract.sentAt)}</p>
                </div>
              )}
              {currentContract.completedAt && (
                <div>
                  <p className='text-sm text-muted-foreground'>Completed</p>
                  <p className='text-sm text-green-600'>{formatDate(currentContract.completedAt)}</p>
                </div>
              )}
              {currentContract.expiresAt && (
                <div>
                  <p className='text-sm text-muted-foreground'>Expires</p>
                  <p className='text-sm'>{formatDate(currentContract.expiresAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SignNow Info */}
          {currentContract.signNowDocumentId && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileSignature className='h-4 w-4' />
                  SignNow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-xs text-muted-foreground'>Document ID</p>
                <p className='text-xs font-mono truncate'>
                  {currentContract.signNowDocumentId}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
