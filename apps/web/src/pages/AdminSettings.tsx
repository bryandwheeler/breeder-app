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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import { AppSettings } from '@breeder/types';
import { RegistryManagement } from '@/components/RegistryManagement';
import { BreedManagement } from '@/components/BreedManagement';
import { SubscriptionManagement } from '@/components/SubscriptionManagement';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { StripeSettings } from '@/components/StripeSettings';
import { DefaultTasksManager } from '@/components/DefaultTasksManager';

export function AdminSettings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    appSettings,
    checkIsAdmin,
    updateAppSettings,
    subscribeToAppSettings,
  } = useAdminStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AppSettings>({
    maintenanceMode: false,
    maintenanceMessage: '',
    allowSignups: true,
    maxDogsPerUser: 100,
    maxLittersPerUser: 50,
    featuresEnabled: {
      connections: true,
      waitlist: true,
      publicPages: true,
      emailNotifications: true,
    },
  });

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
      const unsubscribe = subscribeToAppSettings();
      return unsubscribe;
    }
  }, [isAdmin, subscribeToAppSettings]);

  useEffect(() => {
    if (appSettings) {
      setFormData(appSettings);
    }
  }, [appSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAppSettings(formData);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6 max-w-4xl'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => navigate('/admin')}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold'>Application Settings</h1>
          <p className='text-muted-foreground'>
            Configure global application settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className='mr-2 h-4 w-4' />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Control maintenance mode and user registration
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='maintenance-mode'>Maintenance Mode</Label>
              <p className='text-sm text-muted-foreground'>
                Prevent users from accessing the application
              </p>
            </div>
            <Switch
              id='maintenance-mode'
              checked={formData.maintenanceMode}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, maintenanceMode: checked })
              }
            />
          </div>

          {formData.maintenanceMode && (
            <div>
              <Label htmlFor='maintenance-message'>Maintenance Message</Label>
              <Textarea
                id='maintenance-message'
                placeholder='We are currently performing maintenance. Please check back soon.'
                value={formData.maintenanceMessage || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maintenanceMessage: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
          )}

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='allow-signups'>Allow New Signups</Label>
              <p className='text-sm text-muted-foreground'>
                Enable or disable new user registration
              </p>
            </div>
            <Switch
              id='allow-signups'
              checked={formData.allowSignups}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowSignups: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* User Limits */}
      <Card>
        <CardHeader>
          <CardTitle>User Limits</CardTitle>
          <CardDescription>Set maximum limits for users' data</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='max-dogs'>Maximum Dogs Per User</Label>
            <Input
              id='max-dogs'
              type='number'
              min='1'
              max='1000'
              value={formData.maxDogsPerUser}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxDogsPerUser: parseInt(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label htmlFor='max-litters'>Maximum Litters Per User</Label>
            <Input
              id='max-litters'
              type='number'
              min='1'
              max='1000'
              value={formData.maxLittersPerUser}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxLittersPerUser: parseInt(e.target.value),
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Enable or disable specific application features
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='feat-connections'>Breeder Connections</Label>
              <p className='text-sm text-muted-foreground'>
                Allow breeders to connect and share data
              </p>
            </div>
            <Switch
              id='feat-connections'
              checked={formData.featuresEnabled.connections}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  featuresEnabled: {
                    ...formData.featuresEnabled,
                    connections: checked,
                  },
                })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='feat-waitlist'>Waitlist Feature</Label>
              <p className='text-sm text-muted-foreground'>
                Allow breeders to manage waitlists for puppies
              </p>
            </div>
            <Switch
              id='feat-waitlist'
              checked={formData.featuresEnabled.waitlist}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  featuresEnabled: {
                    ...formData.featuresEnabled,
                    waitlist: checked,
                  },
                })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='feat-public'>Public Pages</Label>
              <p className='text-sm text-muted-foreground'>
                Allow breeders to create public-facing pages
              </p>
            </div>
            <Switch
              id='feat-public'
              checked={formData.featuresEnabled.publicPages}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  featuresEnabled: {
                    ...formData.featuresEnabled,
                    publicPages: checked,
                  },
                })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='feat-email'>Email Notifications</Label>
              <p className='text-sm text-muted-foreground'>
                Enable email notifications throughout the app
              </p>
            </div>
            <Switch
              id='feat-email'
              checked={formData.featuresEnabled.emailNotifications}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  featuresEnabled: {
                    ...formData.featuresEnabled,
                    emailNotifications: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Management Sections */}
      <Tabs defaultValue='global' className='w-full'>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger value='global'>Global Lists</TabsTrigger>
          <TabsTrigger value='tasks'>Task Templates</TabsTrigger>
          <TabsTrigger value='registries'>Registries</TabsTrigger>
          <TabsTrigger value='subscriptions'>Subscriptions</TabsTrigger>
          <TabsTrigger value='stripe'>Stripe</TabsTrigger>
          <TabsTrigger value='audit'>Audit Logs</TabsTrigger>
        </TabsList>

        {/* Global Lists Tab */}
        <TabsContent value='global'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <BreedManagement />
          </div>
        </TabsContent>

        {/* Task Templates Tab */}
        <TabsContent value='tasks'>
          <DefaultTasksManager />
        </TabsContent>

        {/* Registries Tab */}
        <TabsContent value='registries'>
          <RegistryManagement />
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value='subscriptions'>
          <SubscriptionManagement />
        </TabsContent>

        {/* Stripe Settings Tab */}
        <TabsContent value='stripe'>
          <StripeSettings />
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value='audit'>
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
