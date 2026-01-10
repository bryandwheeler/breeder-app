import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCrmStore } from '@breeder/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  MoreVertical,
  MessageSquare,
  Instagram,
  Facebook,
  Clock,
  DollarSign,
  User,
  FileText,
  Settings,
  Activity,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers } = useCrmStore();

  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <h2 className='text-xl font-semibold mb-2'>Contact Not Found</h2>
        <p className='text-muted-foreground mb-4'>
          The contact you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/customers')}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Contacts
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      prospect: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      breeder: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      vet: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      guardian: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={() => navigate('/customers')}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back
          </Button>
          <div className='flex items-center gap-3'>
            <Avatar className='h-12 w-12'>
              <AvatarImage src={customer.instagramProfilePicture} />
              <AvatarFallback className='bg-primary/10 text-primary'>
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className='text-2xl font-bold'>{customer.name}</h1>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                {customer.instagramUsername && (
                  <span className='flex items-center gap-1'>
                    <Instagram className='h-3 w-3' />@{customer.instagramUsername}
                  </span>
                )}
                {customer.status && (
                  <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                    {customer.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              Actions
              <MoreVertical className='ml-2 h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem asChild>
              <a href={`mailto:${customer.email}`}>
                <Mail className='mr-2 h-4 w-4' />
                Send Email
              </a>
            </DropdownMenuItem>
            {customer.phone && (
              <DropdownMenuItem asChild>
                <a href={`tel:${customer.phone}`}>
                  <Phone className='mr-2 h-4 w-4' />
                  Call
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/messaging?contact=${customer.id}`)}>
              <MessageSquare className='mr-2 h-4 w-4' />
              View Messages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6'>
        {/* Sidebar */}
        <div className='space-y-4'>
          {/* Contact Info Card */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <User className='h-4 w-4' />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              {customer.email && (
                <div className='flex items-start gap-2'>
                  <Mail className='h-4 w-4 mt-0.5 text-muted-foreground' />
                  <div>
                    <a href={`mailto:${customer.email}`} className='text-primary hover:underline'>
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className='flex items-start gap-2'>
                  <Phone className='h-4 w-4 mt-0.5 text-muted-foreground' />
                  <a href={`tel:${customer.phone}`} className='text-primary hover:underline'>
                    {customer.phone}
                  </a>
                </div>
              )}
              {(customer.address || customer.city || customer.state) && (
                <div className='flex items-start gap-2'>
                  <MapPin className='h-4 w-4 mt-0.5 text-muted-foreground' />
                  <div>
                    {customer.address && <div>{customer.address}</div>}
                    {(customer.city || customer.state) && (
                      <div>
                        {customer.city}
                        {customer.city && customer.state && ', '}
                        {customer.state} {customer.zipCode}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Links */}
          {(customer.instagramUsername || customer.facebook) && (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>Social Media</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                {customer.instagramUsername && (
                  <a
                    href={`https://instagram.com/${customer.instagramUsername}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-sm text-primary hover:underline'
                  >
                    <Instagram className='h-4 w-4' />
                    @{customer.instagramUsername}
                  </a>
                )}
                {customer.facebook && (
                  <a
                    href={customer.facebook}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-sm text-primary hover:underline'
                  >
                    <Facebook className='h-4 w-4' />
                    Facebook Profile
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Roles & Tags */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Tag className='h-4 w-4' />
                Roles & Tags
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {customer.contactRoles && customer.contactRoles.length > 0 && (
                <div>
                  <div className='text-xs text-muted-foreground mb-1'>Roles</div>
                  <div className='flex flex-wrap gap-1'>
                    {customer.contactRoles.map((role) => (
                      <Badge key={role} className={getRoleBadgeColor(role)} variant='secondary'>
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {customer.tags && customer.tags.length > 0 && (
                <div>
                  <div className='text-xs text-muted-foreground mb-1'>Tags</div>
                  <div className='flex flex-wrap gap-1'>
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Activity className='h-4 w-4' />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Total Purchases</span>
                <span className='font-medium'>{customer.totalPurchases || 0}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Total Revenue</span>
                <span className='font-medium'>${(customer.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Lifetime Value</span>
                <span className='font-medium'>${(customer.lifetimeValue || 0).toLocaleString()}</span>
              </div>
              {customer.lastContactDate && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Last Contact</span>
                  <span className='font-medium'>
                    {format(new Date(customer.lastContactDate), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className='pt-4 space-y-2'>
              <Button variant='outline' className='w-full justify-start' asChild>
                <a href={`mailto:${customer.email}`}>
                  <Mail className='mr-2 h-4 w-4' />
                  Send Email
                </a>
              </Button>
              {customer.phone && (
                <Button variant='outline' className='w-full justify-start' asChild>
                  <a href={`tel:${customer.phone}`}>
                    <Phone className='mr-2 h-4 w-4' />
                    Call
                  </a>
                </Button>
              )}
              <Button variant='outline' className='w-full justify-start'>
                <FileText className='mr-2 h-4 w-4' />
                Add Note
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div>
          <Tabs defaultValue='activity' className='w-full'>
            <TabsList className='mb-4'>
              <TabsTrigger value='activity' className='gap-2'>
                <Activity className='h-4 w-4' />
                Activity
              </TabsTrigger>
              <TabsTrigger value='email' className='gap-2'>
                <Mail className='h-4 w-4' />
                Email
              </TabsTrigger>
              <TabsTrigger value='messages' className='gap-2'>
                <MessageSquare className='h-4 w-4' />
                Messages
              </TabsTrigger>
              <TabsTrigger value='purchases' className='gap-2'>
                <DollarSign className='h-4 w-4' />
                Purchases
              </TabsTrigger>
              <TabsTrigger value='notes' className='gap-2'>
                <FileText className='h-4 w-4' />
                Notes
              </TabsTrigger>
              <TabsTrigger value='settings' className='gap-2'>
                <Settings className='h-4 w-4' />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value='activity'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {(!customer.interactions || customer.interactions.length === 0) ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <Activity className='h-12 w-12 mx-auto mb-3 opacity-50' />
                      <p>No activity recorded yet.</p>
                      <p className='text-sm'>Interactions, emails, and messages will appear here.</p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {customer.interactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((interaction) => (
                          <div key={interaction.id} className='flex gap-3 pb-4 border-b last:border-0'>
                            <div className='mt-1'>
                              {interaction.type === 'email' && <Mail className='h-4 w-4 text-blue-500' />}
                              {interaction.type === 'phone' && <Phone className='h-4 w-4 text-green-500' />}
                              {interaction.type === 'instagram_dm' && <Instagram className='h-4 w-4 text-pink-500' />}
                              {interaction.type === 'facebook_msg' && <Facebook className='h-4 w-4 text-blue-600' />}
                              {!['email', 'phone', 'instagram_dm', 'facebook_msg'].includes(interaction.type) && (
                                <MessageSquare className='h-4 w-4 text-gray-500' />
                              )}
                            </div>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <span className='font-medium'>{interaction.subject || interaction.type}</span>
                                {interaction.direction && (
                                  <Badge variant='outline' className='text-xs'>
                                    {interaction.direction}
                                  </Badge>
                                )}
                              </div>
                              {interaction.notes && (
                                <p className='text-sm text-muted-foreground mt-1'>{interaction.notes}</p>
                              )}
                              <div className='text-xs text-muted-foreground mt-1'>
                                {format(new Date(interaction.date), 'MMM d, yyyy h:mm a')}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='email'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Email History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center py-8 text-muted-foreground'>
                    <Mail className='h-12 w-12 mx-auto mb-3 opacity-50' />
                    <p>Email integration coming soon.</p>
                    <p className='text-sm'>View and send emails directly from this contact.</p>
                    <Button className='mt-4' asChild>
                      <a href={`mailto:${customer.email}`}>
                        <Mail className='mr-2 h-4 w-4' />
                        Open Email Client
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='messages'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center py-8 text-muted-foreground'>
                    <MessageSquare className='h-12 w-12 mx-auto mb-3 opacity-50' />
                    <p>No message conversations found.</p>
                    <p className='text-sm'>Instagram and Facebook messages will appear here.</p>
                    {customer.conversationIds && customer.conversationIds.length > 0 ? (
                      <Button className='mt-4' onClick={() => navigate(`/messaging?contact=${customer.id}`)}>
                        View in Messaging
                      </Button>
                    ) : (
                      <div className='mt-4 space-y-2'>
                        {customer.instagramUsername && (
                          <Button variant='outline' asChild>
                            <a
                              href={`https://instagram.com/${customer.instagramUsername}`}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <Instagram className='mr-2 h-4 w-4' />
                              Message on Instagram
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='purchases'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Purchase History</CardTitle>
                </CardHeader>
                <CardContent>
                  {(!customer.purchases || customer.purchases.length === 0) ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <DollarSign className='h-12 w-12 mx-auto mb-3 opacity-50' />
                      <p>No purchases recorded.</p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {customer.purchases.map((purchase) => (
                        <div key={purchase.id} className='flex justify-between items-start p-3 border rounded-lg'>
                          <div>
                            <div className='font-medium'>{purchase.puppyName || 'Purchase'}</div>
                            <div className='text-sm text-muted-foreground'>
                              {purchase.date && format(new Date(purchase.date), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='font-semibold'>${(purchase.amount || 0).toLocaleString()}</div>
                            <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                              {purchase.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='notes'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.notes ? (
                    <div className='whitespace-pre-wrap text-sm'>{customer.notes}</div>
                  ) : (
                    <div className='text-center py-8 text-muted-foreground'>
                      <FileText className='h-12 w-12 mx-auto mb-3 opacity-50' />
                      <p>No notes yet.</p>
                      <Button className='mt-4' variant='outline'>
                        <FileText className='mr-2 h-4 w-4' />
                        Add Note
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='settings'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Contact Settings</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <div className='text-sm text-muted-foreground'>Type</div>
                      <div className='font-medium capitalize'>{customer.type || 'Not set'}</div>
                    </div>
                    <div>
                      <div className='text-sm text-muted-foreground'>Status</div>
                      <div className='font-medium capitalize'>{customer.status || 'Not set'}</div>
                    </div>
                    <div>
                      <div className='text-sm text-muted-foreground'>Preferred Contact</div>
                      <div className='font-medium capitalize'>{customer.preferredContact || 'Not set'}</div>
                    </div>
                    <div>
                      <div className='text-sm text-muted-foreground'>Source</div>
                      <div className='font-medium capitalize'>{customer.source || 'Not set'}</div>
                    </div>
                  </div>
                  <div className='pt-4 border-t'>
                    <div className='text-sm text-muted-foreground mb-2'>Communication Preferences</div>
                    <div className='flex gap-4'>
                      <Badge variant={customer.emailOptIn ? 'default' : 'outline'}>
                        {customer.emailOptIn ? 'Email Opted In' : 'Email Opted Out'}
                      </Badge>
                      <Badge variant={customer.smsOptIn ? 'default' : 'outline'}>
                        {customer.smsOptIn ? 'SMS Opted In' : 'SMS Opted Out'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
