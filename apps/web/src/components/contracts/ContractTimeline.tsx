import { ContractAuditEvent } from '@breeder/types';
import {
  FileText,
  Upload,
  Send,
  Eye,
  PenTool,
  XCircle,
  Clock,
  Ban,
  CheckCircle,
  Download,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractTimelineProps {
  events: ContractAuditEvent[];
  className?: string;
}

const eventIcons: Record<string, React.ElementType> = {
  created: FileText,
  uploaded_to_signnow: Upload,
  invite_sent: Send,
  viewed: Eye,
  signed: PenTool,
  declined: XCircle,
  expired: Clock,
  cancelled: Ban,
  voided: Ban,
  reminder_sent: Bell,
  completed: CheckCircle,
  downloaded: Download,
  resent: RefreshCw,
};

const eventColors: Record<string, string> = {
  created: 'bg-gray-500',
  uploaded_to_signnow: 'bg-blue-500',
  invite_sent: 'bg-blue-500',
  viewed: 'bg-indigo-500',
  signed: 'bg-green-500',
  declined: 'bg-red-500',
  expired: 'bg-rose-500',
  cancelled: 'bg-gray-500',
  voided: 'bg-red-500',
  reminder_sent: 'bg-yellow-500',
  completed: 'bg-green-600',
  downloaded: 'bg-green-500',
  resent: 'bg-blue-500',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ContractTimeline({ events, className }: ContractTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground py-4', className)}>
        No activity yet
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {events.map((event, index) => {
        const Icon = eventIcons[event.eventType] || FileText;
        const color = eventColors[event.eventType] || 'bg-gray-500';
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className='relative flex gap-4'>
            {/* Timeline line */}
            {!isLast && (
              <div className='absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] bg-border' />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                color
              )}
            >
              <Icon className='h-4 w-4 text-white' />
            </div>

            {/* Content */}
            <div className='flex-1 pb-6'>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <p className='text-sm font-medium'>{event.description}</p>
                  {event.actorEmail && event.actorType !== 'system' && (
                    <p className='text-xs text-muted-foreground'>
                      by {event.actorName || event.actorEmail}
                    </p>
                  )}
                </div>
                <time className='text-xs text-muted-foreground whitespace-nowrap'>
                  {formatDate(event.timestamp)}
                </time>
              </div>
              {event.ipAddress && (
                <p className='text-xs text-muted-foreground mt-1'>
                  IP: {event.ipAddress}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
