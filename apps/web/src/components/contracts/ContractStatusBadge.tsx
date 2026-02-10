import { Badge } from '@/components/ui/badge';
import {
  ContractStatus,
  CONTRACT_STATUS_LABELS,
} from '@breeder/types';
import {
  FileText,
  Send,
  Eye,
  PenTool,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<ContractStatus, {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon: React.ElementType;
}> = {
  draft: {
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: FileText,
  },
  pending_upload: {
    variant: 'secondary',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    icon: Clock,
  },
  sent: {
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: Send,
  },
  viewed: {
    variant: 'default',
    className: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    icon: Eye,
  },
  partially_signed: {
    variant: 'default',
    className: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: PenTool,
  },
  signed: {
    variant: 'default',
    className: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCircle,
  },
  declined: {
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 border-red-300',
    icon: XCircle,
  },
  expired: {
    variant: 'secondary',
    className: 'bg-rose-100 text-rose-700 border-rose-300',
    icon: AlertTriangle,
  },
  cancelled: {
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-500 border-gray-300',
    icon: Ban,
  },
  voided: {
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 border-red-300',
    icon: Ban,
  },
};

export function ContractStatusBadge({
  status,
  className,
  showIcon = true,
}: ContractStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, 'font-medium', className)}
    >
      {showIcon && <Icon className='h-3 w-3 mr-1' />}
      {CONTRACT_STATUS_LABELS[status] || status}
    </Badge>
  );
}
