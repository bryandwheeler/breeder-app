import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCrmStore, useDogStore, useWaitlistStore } from '@breeder/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Plus,
  Edit,
  UserPlus,
  ListPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { EmailCompose } from '@/components/EmailCompose';
import { Send, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Customer } from '@breeder/types';

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customers, addQuickNote, updateCustomer } = useCrmStore();
  const { litters } = useDogStore();
  const { addContactToWaitlist, waitlist } = useWaitlistStore();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [emailComposeOpen, setEmailComposeOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [waitlistForm, setWaitlistForm] = useState({
    litterId: '',
    preferredSex: 'either' as 'male' | 'female' | 'either',
    notes: '',
  });

  const customer = customers.find((c) => c.id === id);

  // Initialize edit form when customer changes
  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        type: customer.type,
        status: customer.status,
        notes: customer.notes,
      });
    }
  }, [customer]);

  // Get available litters (upcoming or current)
  const availableLitters = litters.filter((l) => {
    const birthDate = l.dateOfBirth ? new Date(l.dateOfBirth) : null;
    const isRecent = birthDate && (Date.now() - birthDate.getTime()) < 180 * 24 * 60 * 60 * 1000; // Within 6 months
    const isExpected = l.status === 'expected' || l.status === 'confirmed';
    return isRecent || isExpected;
  });

  // Check if contact is already on any waitlist
  const existingWaitlistEntries = waitlist.filter((e) => e.contactId === id);

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return;
    setSaving(true);
    try {
      await addQuickNote(id, noteText.trim());
      toast({
        title: 'Note added',
        description: 'Your note has been saved to the activity timeline.',
      });
      setNoteText('');
      setNoteDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateCustomer(id, editForm);
      toast({
        title: 'Contact updated',
        description: 'Contact information has been saved.',
      });
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update contact. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: Customer['status']) => {
    if (!id) return;
    try {
      await updateCustomer(id, { status: newStatus });
      toast({
        title: 'Status updated',
        description: `Contact status changed to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const handleTypeChange = async (newType: Customer['type']) => {
    if (!id) return;
    try {
      await updateCustomer(id, { type: newType });
      toast({
        title: 'Type updated',
        description: `Contact type changed to ${newType}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update type.',
        variant: 'destructive',
      });
    }
  };

  const handleAddToWaitlist = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await addContactToWaitlist(
        id,
        waitlistForm.litterId || undefined,
        {
          preferredSex: waitlistForm.preferredSex,
          notes: waitlistForm.notes,
        }
      );
      toast({
        title: 'Added to waitlist',
        description: waitlistForm.litterId
          ? 'Contact has been added to the litter waitlist.'
          : 'Contact has been added to the general waitlist.',
      });
      setWaitlistDialogOpen(false);
      setWaitlistForm({ litterId: '', preferredSex: 'either', notes: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to waitlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => setEditDialogOpen(true)}>
            <Edit className='h-4 w-4 mr-2' />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline'>
                Actions
                <MoreVertical className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuItem onClick={() => setEmailComposeOpen(true)}>
                <Mail className='mr-2 h-4 w-4' />
                Send Email
              </DropdownMenuItem>
              {customer.phone && (
                <DropdownMenuItem asChild>
                  <a href={`tel:${customer.phone}`}>
                    <Phone className='mr-2 h-4 w-4' />
                    Call
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate(`/messaging?contact=${customer.id}`)}>
                <MessageSquare className='mr-2 h-4 w-4' />
                View Messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setWaitlistDialogOpen(true)}>
                <ListPlus className='mr-2 h-4 w-4' />
                Add to Waitlist
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tag className='mr-2 h-4 w-4' />
                  Change Status
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                    Active {customer.status === 'active' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('inactive')}>
                    Inactive {customer.status === 'inactive' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
                    Archived {customer.status === 'archived' && '✓'}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <User className='mr-2 h-4 w-4' />
                  Change Type
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleTypeChange('prospect')}>
                    Prospect {customer.type === 'prospect' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTypeChange('waitlist')}>
                    Waitlist {customer.type === 'waitlist' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTypeChange('buyer')}>
                    Buyer {customer.type === 'buyer' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTypeChange('past_buyer')}>
                    Past Buyer {customer.type === 'past_buyer' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTypeChange('guardian')}>
                    Guardian {customer.type === 'guardian' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTypeChange('stud_client')}>
                    Stud Client {customer.type === 'stud_client' && '✓'}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
              <Button
                variant='outline'
                className='w-full justify-start'
                onClick={() => setEmailComposeOpen(true)}
              >
                <Mail className='mr-2 h-4 w-4' />
                Send Email
              </Button>
              {customer.phone && (
                <Button variant='outline' className='w-full justify-start' asChild>
                  <a href={`tel:${customer.phone}`}>
                    <Phone className='mr-2 h-4 w-4' />
                    Call
                  </a>
                </Button>
              )}
              <Button
                variant='outline'
                className='w-full justify-start'
                onClick={() => setNoteDialogOpen(true)}
              >
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
                <CardHeader className='flex flex-row items-center justify-between'>
                  <CardTitle className='text-lg'>Email History</CardTitle>
                  <Button size='sm' onClick={() => setEmailComposeOpen(true)}>
                    <Send className='mr-2 h-4 w-4' />
                    Compose Email
                  </Button>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const emailInteractions = customer.interactions?.filter((i) => i.type === 'email') || [];
                    if (emailInteractions.length === 0) {
                      return (
                        <div className='text-center py-8 text-muted-foreground'>
                          <Mail className='h-12 w-12 mx-auto mb-3 opacity-50' />
                          <p>No email history yet.</p>
                          <p className='text-sm'>Sent and received emails will appear here.</p>
                          <div className='flex gap-2 justify-center mt-4'>
                            <Button onClick={() => setEmailComposeOpen(true)}>
                              <Send className='mr-2 h-4 w-4' />
                              Send Email
                            </Button>
                            <Button variant='outline' asChild>
                              <a href={`mailto:${customer.email}`}>
                                <Mail className='mr-2 h-4 w-4' />
                                Open Email Client
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className='space-y-4'>
                        {emailInteractions
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((email) => (
                            <div key={email.id} className='p-4 border rounded-lg'>
                              <div className='flex items-start justify-between'>
                                <div className='flex items-center gap-2'>
                                  {email.direction === 'inbound' ? (
                                    <ArrowDownLeft className='h-4 w-4 text-blue-500' />
                                  ) : (
                                    <ArrowUpRight className='h-4 w-4 text-green-500' />
                                  )}
                                  <span className='font-medium'>{email.subject || 'No Subject'}</span>
                                </div>
                                <Badge variant='outline' className='text-xs'>
                                  {email.direction === 'inbound' ? 'Received' : 'Sent'}
                                </Badge>
                              </div>
                              {email.notes && (
                                <p className='text-sm text-muted-foreground mt-2 whitespace-pre-wrap'>
                                  {email.notes}
                                </p>
                              )}
                              {email.content && (
                                <div className='mt-2 p-3 bg-muted/50 rounded text-sm'>
                                  {email.content.length > 300 ? (
                                    <p>{email.content.substring(0, 300)}...</p>
                                  ) : (
                                    <p className='whitespace-pre-wrap'>{email.content}</p>
                                  )}
                                </div>
                              )}
                              <div className='text-xs text-muted-foreground mt-2'>
                                {format(new Date(email.date), 'MMM d, yyyy h:mm a')}
                              </div>
                            </div>
                          ))}
                      </div>
                    );
                  })()}
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
                <CardHeader className='flex flex-row items-center justify-between'>
                  <CardTitle className='text-lg'>Notes</CardTitle>
                  <Button size='sm' onClick={() => setNoteDialogOpen(true)}>
                    <Plus className='mr-2 h-4 w-4' />
                    Add Note
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Show note-type interactions */}
                  {customer.interactions?.filter((i) => i.subject === 'Note' || i.type === 'other').length === 0 &&
                  !customer.notes ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <FileText className='h-12 w-12 mx-auto mb-3 opacity-50' />
                      <p>No notes yet.</p>
                      <p className='text-sm'>Add notes to track important information about this contact.</p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {/* Legacy notes field */}
                      {customer.notes && (
                        <div className='p-3 border rounded-lg bg-muted/30'>
                          <div className='text-xs text-muted-foreground mb-1'>General Notes</div>
                          <div className='whitespace-pre-wrap text-sm'>{customer.notes}</div>
                        </div>
                      )}
                      {/* Note-type interactions */}
                      {customer.interactions
                        ?.filter((i) => i.subject === 'Note' || i.type === 'other')
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((note) => (
                          <div key={note.id} className='p-3 border rounded-lg'>
                            <div className='flex justify-between items-start'>
                              <div className='text-sm whitespace-pre-wrap'>{note.notes}</div>
                              <div className='text-xs text-muted-foreground'>
                                {format(new Date(note.date), 'MMM d, yyyy')}
                              </div>
                            </div>
                          </div>
                        ))}
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

      {/* Quick Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note about {customer.name}. This will appear in their activity timeline.
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <Textarea
              placeholder='Enter your note...'
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className='resize-none'
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={saving || !noteText.trim()}>
              {saving ? 'Saving...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Compose Dialog */}
      <EmailCompose
        open={emailComposeOpen}
        setOpen={setEmailComposeOpen}
        defaultTo={customer.email}
        customerId={customer.id}
        onSent={() => {
          toast({
            title: 'Email sent',
            description: `Email sent to ${customer.name}`,
          });
        }}
      />

      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information for {customer.name}.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='col-span-2'>
                <Label htmlFor='edit-name'>Name</Label>
                <Input
                  id='edit-name'
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='edit-email'>Email</Label>
                <Input
                  id='edit-email'
                  type='email'
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='edit-phone'>Phone</Label>
                <Input
                  id='edit-phone'
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className='col-span-2'>
                <Label htmlFor='edit-address'>Address</Label>
                <Input
                  id='edit-address'
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='edit-city'>City</Label>
                <Input
                  id='edit-city'
                  value={editForm.city || ''}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='edit-state'>State</Label>
                <Input
                  id='edit-state'
                  value={editForm.state || ''}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='edit-zip'>Zip Code</Label>
                <Input
                  id='edit-zip'
                  value={editForm.zipCode || ''}
                  onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='edit-type'>Type</Label>
                <Select
                  value={editForm.type || 'prospect'}
                  onValueChange={(value) => setEditForm({ ...editForm, type: value as Customer['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='prospect'>Prospect</SelectItem>
                    <SelectItem value='waitlist'>Waitlist</SelectItem>
                    <SelectItem value='buyer'>Buyer</SelectItem>
                    <SelectItem value='past_buyer'>Past Buyer</SelectItem>
                    <SelectItem value='guardian'>Guardian</SelectItem>
                    <SelectItem value='stud_client'>Stud Client</SelectItem>
                    <SelectItem value='referral_source'>Referral Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-status'>Status</Label>
                <Select
                  value={editForm.status || 'active'}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value as Customer['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                    <SelectItem value='archived'>Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='col-span-2'>
                <Label htmlFor='edit-notes'>General Notes</Label>
                <Textarea
                  id='edit-notes'
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveContact} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Waitlist Dialog */}
      <Dialog open={waitlistDialogOpen} onOpenChange={setWaitlistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Waitlist</DialogTitle>
            <DialogDescription>
              Add {customer.name} to a waitlist.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            {existingWaitlistEntries.length > 0 && (
              <div className='p-3 bg-muted rounded-lg'>
                <div className='text-sm font-medium mb-2'>Already on waitlist:</div>
                <div className='space-y-1'>
                  {existingWaitlistEntries.map((entry) => {
                    const litter = litters.find((l) => l.id === entry.assignedLitterId);
                    return (
                      <div key={entry.id} className='text-sm text-muted-foreground'>
                        • {litter ? litter.litterName || `${litter.damId} litter` : 'General waitlist'}
                        {entry.assignedPuppyId && ' (Puppy assigned)'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor='waitlist-litter'>Litter (Optional)</Label>
              <Select
                value={waitlistForm.litterId || 'general'}
                onValueChange={(value) => setWaitlistForm({ ...waitlistForm, litterId: value === 'general' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a litter or leave empty for general waitlist' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='general'>General Waitlist</SelectItem>
                  {availableLitters.map((litter) => (
                    <SelectItem key={litter.id} value={litter.id}>
                      {litter.litterName || `Litter from ${litter.dateOfBirth || 'TBD'}`}
                      {litter.status === 'expected' && ' (Expected)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='waitlist-sex'>Preferred Sex</Label>
              <Select
                value={waitlistForm.preferredSex}
                onValueChange={(value) => setWaitlistForm({ ...waitlistForm, preferredSex: value as 'male' | 'female' | 'either' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='either'>Either</SelectItem>
                  <SelectItem value='male'>Male</SelectItem>
                  <SelectItem value='female'>Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='waitlist-notes'>Notes</Label>
              <Textarea
                id='waitlist-notes'
                value={waitlistForm.notes}
                onChange={(e) => setWaitlistForm({ ...waitlistForm, notes: e.target.value })}
                placeholder='Any preferences or notes...'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setWaitlistDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToWaitlist} disabled={saving}>
              {saving ? 'Adding...' : 'Add to Waitlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
