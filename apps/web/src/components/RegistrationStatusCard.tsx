import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Puppy } from '@breeder/types';
import { FileText, AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

interface RegistrationStatusCardProps {
  puppies: Puppy[];
  onManageRegistration: (puppy: Puppy) => void;
}

export function RegistrationStatusCard({ puppies, onManageRegistration }: RegistrationStatusCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'approved':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'submitted':
        return <Clock className='h-4 w-4 text-blue-500' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-500' />;
      case 'not_started':
      default:
        return <AlertCircle className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-700 hover:bg-green-700';
      case 'approved':
        return 'bg-green-500 hover:bg-green-500';
      case 'submitted':
        return 'bg-blue-500 hover:bg-blue-500';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-500';
      case 'not_started':
      default:
        return 'bg-gray-500 hover:bg-gray-500';
    }
  };

  const getDeadlineWarning = (deadline?: string) => {
    if (!deadline) return null;

    const daysUntil = differenceInDays(parseISO(deadline), new Date());

    if (daysUntil < 0) {
      return (
        <Badge variant='destructive' className='ml-2'>
          <AlertTriangle className='h-3 w-3 mr-1' />
          Overdue
        </Badge>
      );
    } else if (daysUntil <= 7) {
      return (
        <Badge variant='destructive' className='ml-2 bg-orange-500 hover:bg-orange-500'>
          <AlertTriangle className='h-3 w-3 mr-1' />
          {daysUntil}d left
        </Badge>
      );
    } else if (daysUntil <= 30) {
      return (
        <Badge variant='outline' className='ml-2 border-yellow-500 text-yellow-600'>
          <Clock className='h-3 w-3 mr-1' />
          {daysUntil}d left
        </Badge>
      );
    }

    return null;
  };

  const registrationStats = {
    total: puppies.length,
    notStarted: puppies.filter((p) => !p.registrations?.[0] || p.registrations?.[0].status === 'not_started').length,
    pending: puppies.filter((p) => p.registrations?.[0]?.status === 'pending').length,
    submitted: puppies.filter((p) => p.registrations?.[0]?.status === 'submitted').length,
    approved: puppies.filter((p) => p.registrations?.[0]?.status === 'approved').length,
    issued: puppies.filter((p) => p.registrations?.[0]?.status === 'issued').length,
  };

  const upcomingDeadlines = puppies
    .filter((p) => p.registrations?.[0]?.registrationDeadline)
    .map((p) => ({
      puppy: p,
      daysUntil: differenceInDays(parseISO(p.registrations![0].registrationDeadline!), new Date()),
    }))
    .filter((d) => d.daysUntil >= 0 && d.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileText className='h-5 w-5' />
          Registration Status
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Summary Stats */}
        <div className='grid grid-cols-3 sm:grid-cols-6 gap-2'>
          <div className='text-center p-2 bg-muted rounded'>
            <div className='text-2xl font-bold'>{registrationStats.total}</div>
            <div className='text-xs text-muted-foreground'>Total</div>
          </div>
          <div className='text-center p-2 bg-gray-100 rounded'>
            <div className='text-2xl font-bold text-gray-600'>{registrationStats.notStarted}</div>
            <div className='text-xs text-muted-foreground'>Not Started</div>
          </div>
          <div className='text-center p-2 bg-yellow-50 rounded'>
            <div className='text-2xl font-bold text-yellow-600'>{registrationStats.pending}</div>
            <div className='text-xs text-muted-foreground'>Pending</div>
          </div>
          <div className='text-center p-2 bg-blue-50 rounded'>
            <div className='text-2xl font-bold text-blue-600'>{registrationStats.submitted}</div>
            <div className='text-xs text-muted-foreground'>Submitted</div>
          </div>
          <div className='text-center p-2 bg-green-50 rounded'>
            <div className='text-2xl font-bold text-green-600'>{registrationStats.approved}</div>
            <div className='text-xs text-muted-foreground'>Approved</div>
          </div>
          <div className='text-center p-2 bg-green-100 rounded'>
            <div className='text-2xl font-bold text-green-700'>{registrationStats.issued}</div>
            <div className='text-xs text-muted-foreground'>Issued</div>
          </div>
        </div>

        {/* Upcoming Deadlines Alert */}
        {upcomingDeadlines.length > 0 && (
          <div className='bg-orange-50 border border-orange-200 rounded-lg p-3'>
            <div className='flex items-center gap-2 mb-2'>
              <AlertTriangle className='h-4 w-4 text-orange-600' />
              <strong className='text-sm text-orange-800'>Upcoming Deadlines</strong>
            </div>
            <div className='space-y-1'>
              {upcomingDeadlines.map(({ puppy, daysUntil }) => (
                <div key={puppy.id} className='text-sm text-orange-700'>
                  {puppy.name || puppy.tempName} - {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Puppy List */}
        <div className='space-y-2 max-h-96 overflow-y-auto'>
          {puppies.map((puppy) => {
            const reg = puppy.registrations?.[0];
            const regType = reg?.registrationType || 'none';

            return (
              <div
                key={puppy.id}
                className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50'
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{puppy.name || puppy.tempName}</span>
                    {puppy.status === 'sold' && (
                      <Badge variant='outline' className='text-xs'>
                        Sold
                      </Badge>
                    )}
                  </div>
                  <div className='flex items-center gap-2 mt-1'>
                    {getStatusIcon(reg?.status || 'not_started')}
                    <Badge className={getStatusBadgeColor(reg?.status || 'not_started')}>
                      {(reg?.status || 'not_started').replace('_', ' ').toUpperCase()}
                    </Badge>
                    {regType !== 'none' && (
                      <span className='text-xs text-muted-foreground'>
                        {reg?.registry || 'AKC'} - {regType === 'limited' ? 'Limited' : 'Full'}
                      </span>
                    )}
                    {regType === 'none' && (
                      <span className='text-xs text-muted-foreground'>No Registration</span>
                    )}
                    {getDeadlineWarning(reg?.registrationDeadline)}
                  </div>
                  {reg?.registrationNumber && (
                    <div className='text-xs text-muted-foreground mt-1'>
                      Reg #: {reg.registrationNumber}
                    </div>
                  )}
                </div>
                <Button variant='outline' size='sm' onClick={() => onManageRegistration(puppy)}>
                  Manage
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
