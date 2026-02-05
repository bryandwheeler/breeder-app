import { ContractSigner, SIGNER_ROLE_LABELS, SIGNER_STATUS_LABELS } from '@breeder/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  User,
  Mail,
  Phone,
  Clock,
  Eye,
  PenTool,
  XCircle,
  Send,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignerListProps {
  signers: ContractSigner[];
  onResendInvite?: (signer: ContractSigner) => void;
  onGetSigningLink?: (signer: ContractSigner) => void;
  className?: string;
}

const statusConfig = {
  pending: {
    className: 'bg-gray-100 text-gray-700',
    icon: Clock,
  },
  sent: {
    className: 'bg-blue-100 text-blue-700',
    icon: Send,
  },
  viewed: {
    className: 'bg-indigo-100 text-indigo-700',
    icon: Eye,
  },
  signed: {
    className: 'bg-green-100 text-green-700',
    icon: PenTool,
  },
  declined: {
    className: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
};

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SignerList({
  signers,
  onResendInvite,
  onGetSigningLink,
  className,
}: SignerListProps) {
  if (!signers || signers.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground py-4', className)}>
        No signers added
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {signers.map((signer, index) => {
        const config = statusConfig[signer.status] || statusConfig.pending;
        const StatusIcon = config.icon;

        return (
          <Card key={signer.id || index}>
            <CardContent className='p-4'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex items-start gap-3'>
                  {/* Avatar/Order */}
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium'>
                    {signer.order || index + 1}
                  </div>

                  {/* Info */}
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{signer.name}</span>
                      <Badge variant='outline' className='text-xs'>
                        {SIGNER_ROLE_LABELS[signer.role] || signer.role}
                      </Badge>
                    </div>

                    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                      <span className='flex items-center gap-1'>
                        <Mail className='h-3 w-3' />
                        {signer.email}
                      </span>
                      {signer.phone && (
                        <span className='flex items-center gap-1'>
                          <Phone className='h-3 w-3' />
                          {signer.phone}
                        </span>
                      )}
                    </div>

                    {/* Status timestamps */}
                    <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                      {signer.viewedAt && (
                        <span>Viewed: {formatDate(signer.viewedAt)}</span>
                      )}
                      {signer.signedAt && (
                        <span className='text-green-600'>
                          Signed: {formatDate(signer.signedAt)}
                        </span>
                      )}
                      {signer.declinedAt && (
                        <span className='text-red-600'>
                          Declined: {formatDate(signer.declinedAt)}
                        </span>
                      )}
                    </div>

                    {signer.declineReason && (
                      <p className='text-xs text-red-600 mt-1'>
                        Reason: {signer.declineReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className='flex flex-col items-end gap-2'>
                  <Badge className={cn('flex items-center gap-1', config.className)}>
                    <StatusIcon className='h-3 w-3' />
                    {SIGNER_STATUS_LABELS[signer.status] || signer.status}
                  </Badge>

                  <div className='flex gap-1'>
                    {signer.status !== 'signed' && signer.status !== 'declined' && (
                      <>
                        {onResendInvite && signer.inviteId && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onResendInvite(signer)}
                          >
                            <Send className='h-3 w-3 mr-1' />
                            Resend
                          </Button>
                        )}
                        {onGetSigningLink && signer.inviteId && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onGetSigningLink(signer)}
                          >
                            <ExternalLink className='h-3 w-3 mr-1' />
                            Sign Link
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
