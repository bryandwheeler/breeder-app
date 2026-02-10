import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore } from '@breeder/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Shield,
  TrendingUp,
  Search,
  Settings,
  LogIn,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { UserListDialog } from '@/components/UserListDialog';
import { AnalyticsComponent } from '@/components/AnalyticsComponent';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    users,
    adminStats,
    subscribeToUsers,
    subscribeToAppSettings,
    checkIsAdmin,
    updateUserRole,
    toggleUserActive,
    setImpersonatedUser,
    getAdminStats,
    syncAllUserCounts,
  } = useAdminStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [userListDialogOpen, setUserListDialogOpen] = useState(false);
  const [userListFilter, setUserListFilter] = useState<
    'all' | 'active' | 'new' | 'inactive'
  >('all');
  const [userListTitle, setUserListTitle] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const adminStatus = await checkIsAdmin(currentUser.uid);
      if (!adminStatus) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [currentUser, navigate, checkIsAdmin]);

  useEffect(() => {
    if (isAdmin) {
      const unsubUsers = subscribeToUsers();
      const unsubSettings = subscribeToAppSettings();

      // Sync all user counts on first load
      syncAllUserCounts().catch((e) =>
        console.error('Failed to sync user counts:', e)
      );

      return () => {
        unsubUsers();
        unsubSettings();
      };
    }
  }, [isAdmin, subscribeToUsers, subscribeToAppSettings, syncAllUserCounts]);

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    (async () => {
      if (mounted) setStatsLoading(true);
      try {
        await getAdminStats();
      } finally {
        if (mounted) setStatsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAdmin, users, getAdminStats]);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.kennelName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImpersonate = (uid: string) => {
    setImpersonatedUser(uid);
    navigate('/');
  };

  const handleToggleRole = async (
    uid: string,
    currentRole: 'user' | 'admin'
  ) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateUserRole(uid, newRole);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    }
  };

  const handleToggleActive = async (uid: string, isActive: boolean) => {
    try {
      await toggleUserActive(uid, !isActive);
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Failed to update user status');
    }
  };

  const openUserList = (
    filter: 'all' | 'active' | 'new' | 'inactive',
    title: string
  ) => {
    setUserListFilter(filter);
    setUserListTitle(title);
    setUserListDialogOpen(true);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <Shield className='h-8 w-8' />
            Admin Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Manage users and application settings
          </p>
        </div>
        <Button onClick={() => navigate('/admin/settings')} variant='outline'>
          <Settings className='mr-2 h-4 w-4' />
          App Settings
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card
          className='cursor-pointer hover:shadow-lg transition-shadow'
          onClick={() => openUserList('all', 'All Users')}
        >
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              <Users className='h-4 w-4' />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {statsLoading ? '...' : adminStats?.totalUsers || 0}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Click to view all
            </p>
          </CardContent>
        </Card>

        <Card
          className='cursor-pointer hover:shadow-lg transition-shadow'
          onClick={() => openUserList('active', 'Active Users')}
        >
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2'>
              <CheckCircle className='h-4 w-4' />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {statsLoading ? '...' : adminStats?.activeUsers || 0}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Click to view all
            </p>
          </CardContent>
        </Card>

        <Card
          className='cursor-pointer hover:shadow-lg transition-shadow'
          onClick={() => openUserList('new', 'New Users This Month')}
        >
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />
              New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
              {statsLoading ? '...' : adminStats?.newUsersThisMonth || 0}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Click to view all
            </p>
          </CardContent>
        </Card>

        <Card
          className='cursor-pointer hover:shadow-lg transition-shadow'
          onClick={() => openUserList('inactive', 'Inactive Users')}
        >
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2'>
              <Ban className='h-4 w-4' />
              Inactive Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-rose-600 dark:text-rose-400'>
              {statsLoading
                ? '...'
                : users.filter((u) => !u.isActive).length || 0}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Click to view all
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <AnalyticsComponent />

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
          <div className='mt-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by email, name, or kennel...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {filteredUsers.length === 0 ? (
              <p className='text-center text-muted-foreground py-8'>
                No users found
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='font-semibold truncate'>
                          {user.displayName}
                        </h3>
                        {user.role === 'admin' && (
                          <Badge className='bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'>
                            <Shield className='h-3 w-3 mr-1' />
                            Admin
                          </Badge>
                        )}
                        {!user.isActive && (
                          <Badge variant='outline' className='text-red-600'>
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
                      <div className='flex gap-4 mt-2 text-xs text-muted-foreground'>
                        <span>{user.totalDogs || 0} dogs</span>
                        <span>{user.totalLitters || 0} litters</span>
                        <span>
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className='flex flex-col gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleImpersonate(user.uid)}
                      >
                        <LogIn className='mr-2 h-3 w-3' />
                        Impersonate
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleToggleRole(user.uid, user.role)}
                      >
                        {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                      <Button
                        size='sm'
                        variant={user.isActive ? 'destructive' : 'default'}
                        onClick={() =>
                          handleToggleActive(user.uid, user.isActive)
                        }
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User List Dialog */}
      <UserListDialog
        open={userListDialogOpen}
        onOpenChange={setUserListDialogOpen}
        title={userListTitle}
        users={users}
        filterType={userListFilter}
        onImpersonate={handleImpersonate}
        onToggleRole={handleToggleRole}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
