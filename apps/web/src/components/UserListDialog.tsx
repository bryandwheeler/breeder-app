import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpDown,
  Search,
  LogIn,
  Mail,
  Shield,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { UserProfile } from '@breeder/types';

interface UserListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  users: UserProfile[];
  filterType: 'all' | 'active' | 'new' | 'inactive';
  onImpersonate: (uid: string) => void;
  onToggleRole: (uid: string, role: 'user' | 'admin') => void;
  onToggleActive: (uid: string, isActive: boolean) => void;
}

type SortField = 'name' | 'email' | 'joined' | 'dogs' | 'litters' | 'status';
type SortOrder = 'asc' | 'desc';

export function UserListDialog({
  open,
  onOpenChange,
  title,
  users,
  filterType,
  onImpersonate,
  onToggleRole,
  onToggleActive,
}: UserListDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('joined');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter users based on type
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Apply filter type
    if (filterType === 'active') {
      result = result.filter((u) => u.isActive);
    } else if (filterType === 'inactive') {
      result = result.filter((u) => !u.isActive);
    } else if (filterType === 'new') {
      // New users: created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter((u) => new Date(u.createdAt) > thirtyDaysAgo);
    }

    // Apply search filter
    result = result.filter(
      (user) =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.kennelName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting
    result.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'joined':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'dogs':
          aValue = a.totalDogs || 0;
          bValue = b.totalDogs || 0;
          break;
        case 'litters':
          aValue = a.totalLitters || 0;
          bValue = b.totalLitters || 0;
          break;
        case 'status':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return result;
  }, [users, filterType, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search and Sort Controls */}
          <div className='flex gap-2 flex-col sm:flex-row'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by email, name, or kennel...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select
              value={sortField}
              onValueChange={(value) => setSortField(value as SortField)}
            >
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='Sort by...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='name'>Name</SelectItem>
                <SelectItem value='email'>Email</SelectItem>
                <SelectItem value='joined'>Join Date</SelectItem>
                <SelectItem value='dogs'>Dogs</SelectItem>
                <SelectItem value='litters'>Litters</SelectItem>
                <SelectItem value='status'>Status</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size='icon'
              variant='outline'
              onClick={() => toggleSort(sortField)}
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ArrowUpDown className='h-4 w-4' />
            </Button>
          </div>

          {/* User Count */}
          <div className='text-sm text-muted-foreground'>
            Showing {filteredUsers.length} of {users.length} users
          </div>

          {/* User List */}
          <div className='space-y-2 max-h-[60vh] overflow-y-auto'>
            {filteredUsers.length === 0 ? (
              <p className='text-center text-muted-foreground py-8'>
                No users found
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  className='border rounded-lg p-3 hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1 flex-wrap'>
                        <h3 className='font-semibold truncate'>
                          {user.displayName}
                        </h3>
                        {user.role === 'admin' && (
                          <Badge className='bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 flex-shrink-0'>
                            <Shield className='h-3 w-3 mr-1' />
                            Admin
                          </Badge>
                        )}
                        {user.isActive ? (
                          <Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex-shrink-0'>
                            <CheckCircle className='h-3 w-3 mr-1' />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='text-red-600 flex-shrink-0'
                          >
                            <Ban className='h-3 w-3 mr-1' />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground truncate'>
                        {user.email}
                      </p>
                      {user.kennelName && (
                        <p className='text-sm text-muted-foreground'>
                          Kennel: {user.kennelName}
                        </p>
                      )}
                      <div className='flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap'>
                        <span>{user.totalDogs || 0} dogs</span>
                        <span>{user.totalLitters || 0} litters</span>
                        <span>
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        {user.lastLogin && (
                          <span>
                            Last login{' '}
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='flex flex-col gap-1 flex-shrink-0'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onImpersonate(user.uid)}
                      >
                        <LogIn className='h-3 w-3 mr-1' />
                        Impersonate
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onToggleRole(user.uid, user.role)}
                      >
                        {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                      <Button
                        size='sm'
                        variant={user.isActive ? 'destructive' : 'default'}
                        onClick={() => onToggleActive(user.uid, user.isActive)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-blue-600 dark:text-blue-400'
                      >
                        <Mail className='h-3 w-3 mr-1' />
                        Email
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
