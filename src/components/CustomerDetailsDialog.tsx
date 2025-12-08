import { useState } from 'react';
import { Customer, Interaction, Purchase } from '@/types/dog';
import { useCrmStore } from '@/store/crmStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  Plus,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
  Edit2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { EmailCompose } from '@/components/EmailCompose';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  customer: Customer;
}

export function CustomerDetailsDialog({ open, setOpen, customer }: Props) {
  const { updateCustomer, addInteraction, addPurchase, deleteInteraction, addTag, removeTag } =
    useCrmStore();
  const [formData, setFormData] = useState(customer);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [emailComposeOpen, setEmailComposeOpen] = useState(false);

  // Interaction form state
  const [newInteraction, setNewInteraction] = useState<Omit<Interaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'email',
    subject: '',
    notes: '',
    outcome: '',
    followUpDate: '',
    followUpCompleted: false,
  });

  // Purchase form state
  const [newPurchase, setNewPurchase] = useState<Omit<Purchase, 'id'>>({
    litterId: '',
    puppyId: '',
    puppyName: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    amount: 0,
    depositAmount: 0,
    type: 'pet',
    status: 'reserved',
  });

  const handleSave = async () => {
    await updateCustomer(customer.id, formData);
    setOpen(false);
  };

  const handleAddInteraction = async () => {
    await addInteraction(customer.id, newInteraction);
    setShowAddInteraction(false);
    // Reset form
    setNewInteraction({
      date: new Date().toISOString().split('T')[0],
      type: 'email',
      subject: '',
      notes: '',
      outcome: '',
      followUpDate: '',
      followUpCompleted: false,
    });
  };

  const handleAddPurchase = async () => {
    await addPurchase(customer.id, newPurchase);
    setShowAddPurchase(false);
    // Reset form
    setNewPurchase({
      litterId: '',
      puppyId: '',
      puppyName: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      amount: 0,
      depositAmount: 0,
      type: 'pet',
      status: 'reserved',
    });
  };

  const handleAddTag = async () => {
    if (newTag.trim()) {
      await addTag(customer.id, newTag.trim());
      setNewTag('');
    }
  };

  const handleRemoveTag = async (tag: string) => {
    await removeTag(customer.id, tag);
  };

  const getTypeColor = (type: Customer['type']) => {
    switch (type) {
      case 'prospect':
        return 'bg-yellow-500';
      case 'waitlist':
        return 'bg-blue-500';
      case 'buyer':
        return 'bg-green-500';
      case 'past_buyer':
        return 'bg-purple-500';
      case 'guardian':
        return 'bg-cyan-500';
      case 'stud_client':
        return 'bg-pink-500';
      case 'referral_source':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Customer Profile</DialogTitle>
            <Badge className={getTypeColor(formData.type)}>
              {formData.type.replace('_', ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="interactions">
              Interactions ({customer.interactions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="purchases">
              Purchases ({customer.purchases?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <div className="font-medium">Name</div>
                  <div className="text-lg">{customer.name}</div>
                </div>

                <div className="col-span-2">
                  <div className="font-medium mb-1">Email</div>
                  <div className="flex items-center justify-between">
                    <a
                      href={`mailto:${customer.email}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {customer.email}
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEmailComposeOpen(true)}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Compose
                    </Button>
                  </div>
                </div>

                {customer.phone && (
                  <div className="col-span-2">
                    <div className="font-medium mb-1">Phone</div>
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </a>
                  </div>
                )}

                {(customer.address || customer.city || customer.state) && (
                  <div className="col-span-2">
                    <div className="font-medium mb-1">Address</div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <div>
                        {customer.address && <div>{customer.address}</div>}
                        {(customer.city || customer.state) && (
                          <div>
                            {customer.city}
                            {customer.city && customer.state && ', '}
                            {customer.state}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Stats */}
            <div className="space-y-3">
              <h3 className="font-semibold">Customer Stats</h3>
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Total Purchases</div>
                  <div className="text-xl font-bold">{customer.totalPurchases || 0}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(customer.totalRevenue || 0)}
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Lifetime Value</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(customer.lifetimeValue || 0)}
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Interactions</div>
                  <div className="text-xl font-bold">{customer.interactions?.length || 0}</div>
                </Card>
              </div>
            </div>

            {/* Important Dates */}
            <div className="space-y-3">
              <h3 className="font-semibold">Important Dates</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">First Contact</div>
                  <div>
                    {customer.firstContactDate
                      ? new Date(customer.firstContactDate).toLocaleDateString()
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Last Contact</div>
                  <div>
                    {customer.lastContactDate
                      ? new Date(customer.lastContactDate).toLocaleDateString()
                      : '-'}
                  </div>
                </div>
                {customer.lastPurchaseDate && (
                  <div>
                    <div className="font-medium">Last Purchase</div>
                    <div>{new Date(customer.lastPurchaseDate).toLocaleDateString()}</div>
                  </div>
                )}
                {customer.birthday && (
                  <div>
                    <div className="font-medium">Birthday</div>
                    <div>{new Date(customer.birthday).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <h3 className="font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {customer.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            {customer.notes && (
              <div className="space-y-3">
                <h3 className="font-semibold">Notes</h3>
                <div className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap">
                  {customer.notes}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Communication History</h3>
              <Button
                size="sm"
                onClick={() => setShowAddInteraction(!showAddInteraction)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Interaction
              </Button>
            </div>

            {showAddInteraction && (
              <Card className="p-4 space-y-4">
                <h4 className="font-medium">New Interaction</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newInteraction.date}
                      onChange={(e) =>
                        setNewInteraction({ ...newInteraction, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newInteraction.type}
                      onValueChange={(value: Interaction['type']) =>
                        setNewInteraction({ ...newInteraction, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="text">Text/SMS</SelectItem>
                        <SelectItem value="instagram_dm">Instagram DM</SelectItem>
                        <SelectItem value="facebook_msg">Facebook Message</SelectItem>
                        <SelectItem value="tiktok_msg">TikTok Message</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="video_call">Video Call</SelectItem>
                        <SelectItem value="visit">Visit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Subject</Label>
                    <Input
                      value={newInteraction.subject}
                      onChange={(e) =>
                        setNewInteraction({ ...newInteraction, subject: e.target.value })
                      }
                      placeholder="What was discussed?"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      rows={3}
                      value={newInteraction.notes}
                      onChange={(e) =>
                        setNewInteraction({ ...newInteraction, notes: e.target.value })
                      }
                      placeholder="Details about the interaction..."
                    />
                  </div>
                  <div>
                    <Label>Follow-up Date</Label>
                    <Input
                      type="date"
                      value={newInteraction.followUpDate}
                      onChange={(e) =>
                        setNewInteraction({ ...newInteraction, followUpDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddInteraction(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddInteraction}>Add Interaction</Button>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {customer.interactions && customer.interactions.length > 0 ? (
                [...customer.interactions]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((interaction) => (
                    <Card key={interaction.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {interaction.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(interaction.date).toLocaleDateString()}
                            </span>
                            {interaction.followUpDate && !interaction.followUpCompleted && (
                              <Badge variant="secondary" className="text-xs">
                                Follow-up: {new Date(interaction.followUpDate).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                          <div className="font-medium mb-1">{interaction.subject}</div>
                          {interaction.notes && (
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {interaction.notes}
                            </div>
                          )}
                          {interaction.outcome && (
                            <div className="text-sm mt-2">
                              <span className="font-medium">Outcome:</span> {interaction.outcome}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInteraction(customer.id, interaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No interactions logged yet</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Purchase History</h3>
              <Button
                size="sm"
                onClick={() => setShowAddPurchase(!showAddPurchase)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Purchase
              </Button>
            </div>

            {showAddPurchase && (
              <Card className="p-4 space-y-4">
                <h4 className="font-medium">New Purchase</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Purchase Date</Label>
                    <Input
                      type="date"
                      value={newPurchase.purchaseDate}
                      onChange={(e) =>
                        setNewPurchase({ ...newPurchase, purchaseDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Puppy Name</Label>
                    <Input
                      value={newPurchase.puppyName}
                      onChange={(e) =>
                        setNewPurchase({ ...newPurchase, puppyName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newPurchase.amount}
                      onChange={(e) =>
                        setNewPurchase({ ...newPurchase, amount: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label>Deposit Amount</Label>
                    <Input
                      type="number"
                      value={newPurchase.depositAmount}
                      onChange={(e) =>
                        setNewPurchase({
                          ...newPurchase,
                          depositAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newPurchase.type}
                      onValueChange={(value: Purchase['type']) =>
                        setNewPurchase({ ...newPurchase, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pet">Pet</SelectItem>
                        <SelectItem value="breeding">Breeding</SelectItem>
                        <SelectItem value="show">Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={newPurchase.status}
                      onValueChange={(value: Purchase['status']) =>
                        setNewPurchase({ ...newPurchase, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddPurchase(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPurchase}>Add Purchase</Button>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {customer.purchases && customer.purchases.length > 0 ? (
                customer.purchases.map((purchase) => (
                  <Card key={purchase.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{purchase.status}</Badge>
                          <Badge variant="outline" className="capitalize">
                            {purchase.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="font-medium mb-1">{purchase.puppyName || 'Unnamed Puppy'}</div>
                        <div className="text-sm">
                          <span className="font-medium">Amount:</span> {formatCurrency(purchase.amount)}
                          {purchase.depositAmount && purchase.depositAmount > 0 && (
                            <span className="text-muted-foreground">
                              {' '}
                              (Deposit: {formatCurrency(purchase.depositAmount)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No purchases recorded yet</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Customer Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Customer['type']) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="past_buyer">Past Buyer</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="stud_client">Stud Client</SelectItem>
                      <SelectItem value="referral_source">Referral Source</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Customer['status']) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Preferred Contact Method</Label>
                  <Select
                    value={formData.preferredContact}
                    onValueChange={(value: Customer['preferredContact']) =>
                      setFormData({ ...formData, preferredContact: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value: Customer['source']) =>
                      setFormData({ ...formData, source: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="advertising">Advertising</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                rows={4}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add your notes about this customer..."
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>

      {/* Email Compose Dialog */}
      <EmailCompose
        open={emailComposeOpen}
        setOpen={setEmailComposeOpen}
        defaultTo={customer.email}
        customerId={customer.id}
        onSent={() => {
          // Optionally refresh customer data or log interaction
          console.log('Email sent to customer:', customer.email);
        }}
      />
    </Dialog>
  );
}
