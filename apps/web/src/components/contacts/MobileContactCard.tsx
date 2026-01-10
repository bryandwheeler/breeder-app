import { Customer, ContactRole } from '@breeder/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, Phone, MoreVertical, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileContactCardProps {
  customer: Customer;
  onNavigate?: (customerId: string) => void;
  onViewDetails?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  getContactRoles: (customer: Customer) => ContactRole[];
}

export function MobileContactCard({
  customer,
  onNavigate,
  onViewDetails,
  onDelete,
  getContactRoles,
}: MobileContactCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'archived':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const roles = getContactRoles(customer);

  return (
    <Card
      className='p-4 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted'
      onClick={() => onNavigate?.(customer.id)}
    >
      <div className='flex items-start gap-3'>
        {/* Avatar */}
        <Avatar className='h-12 w-12 flex-shrink-0'>
          <AvatarImage src={customer.instagramProfilePicture} />
          <AvatarFallback className='bg-primary/10 text-primary text-sm'>
            {getInitials(customer.name)}
          </AvatarFallback>
        </Avatar>

        {/* Main Content */}
        <div className='flex-1 min-w-0'>
          {/* Name and Status Row */}
          <div className='flex items-center gap-2 mb-1'>
            <span className='font-medium truncate'>{customer.name}</span>
            <Badge className={`${getStatusColor(customer.status)} text-xs px-1.5 py-0`}>
              {customer.status}
            </Badge>
          </div>

          {/* Roles */}
          {roles.length > 0 && (
            <div className='flex flex-wrap gap-1 mb-2'>
              {roles.slice(0, 3).map((role) => (
                <Badge key={role} variant='outline' className='text-xs capitalize'>
                  {role.replace('_', ' ')}
                </Badge>
              ))}
              {roles.length > 3 && (
                <Badge variant='outline' className='text-xs'>
                  +{roles.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Contact Actions */}
          <div className='flex items-center gap-3 text-sm' onClick={(e) => e.stopPropagation()}>
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className='flex items-center gap-1 text-primary hover:underline'
              >
                <Mail className='h-4 w-4' />
                <span className='sr-only'>Email</span>
              </a>
            )}
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className='flex items-center gap-1 text-primary hover:underline'
              >
                <Phone className='h-4 w-4' />
                <span className='truncate max-w-[120px]'>{customer.phone}</span>
              </a>
            )}
          </div>

          {/* Stats Row */}
          {(customer.totalPurchases || customer.totalRevenue) ? (
            <div className='flex items-center gap-4 mt-2 text-xs text-muted-foreground'>
              {customer.totalPurchases ? (
                <span>{customer.totalPurchases} purchases</span>
              ) : null}
              {customer.totalRevenue ? (
                <span>{formatCurrency(customer.totalRevenue)}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onViewDetails?.(customer)}>
                <Eye className='h-4 w-4 mr-2' />
                View Details
              </DropdownMenuItem>
              {customer.email && (
                <DropdownMenuItem asChild>
                  <a href={`mailto:${customer.email}`}>
                    <Mail className='h-4 w-4 mr-2' />
                    Send Email
                  </a>
                </DropdownMenuItem>
              )}
              {customer.phone && (
                <DropdownMenuItem asChild>
                  <a href={`tel:${customer.phone}`}>
                    <Phone className='h-4 w-4 mr-2' />
                    Call
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(customer.id)}
                className='text-destructive'
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className='h-5 w-5 text-muted-foreground' />
        </div>
      </div>
    </Card>
  );
}
