import { useState, useEffect } from 'react';
import { WaitlistEntry } from '@breeder/types';
import { useWaitlistStore, useDogStore } from '@breeder/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone, MapPin, Home, CheckCircle, XCircle, Clock, Send, User, Baby, Dog } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  entry: WaitlistEntry;
}

export function WaitlistDetailsDialog({ open, setOpen, entry }: Props) {
  const { updateWaitlistEntry, assignPuppyToWaitlistEntry } = useWaitlistStore();
  const { litters, dogs } = useDogStore();
  const [formData, setFormData] = useState(entry);

  // Reset form data when entry changes
  useEffect(() => {
    setFormData(entry);
  }, [entry]);

  // Get available litters for assignment
  const availableLitters = litters.filter((l) => {
    const birthDate = l.dateOfBirth ? new Date(l.dateOfBirth) : null;
    const isRecent = birthDate && (Date.now() - birthDate.getTime()) < 180 * 24 * 60 * 60 * 1000;
    const isExpected = l.status === 'expected' || l.status === 'confirmed';
    return isRecent || isExpected;
  });

  // Get assigned litter info (from original entry for display)
  const assignedLitter = litters.find((l) => l.id === entry.assignedLitterId);
  const assignedPuppy = assignedLitter?.puppies?.find((p) => p.id === entry.assignedPuppyId);

  // Get puppies from currently selected litter in form (for dropdown)
  const selectedLitter = litters.find((l) => l.id === formData.assignedLitterId);
  const litterPuppies = selectedLitter?.puppies || [];

  const handleSave = async () => {
    await updateWaitlistEntry(entry.id, formData);
    setOpen(false);
  };

  const getStatusColor = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'matched': return 'bg-purple-500';
      case 'reserved': return 'bg-cyan-500';
      case 'completed': return 'bg-gray-500';
      case 'withdrawn': return 'bg-rose-500';
      case 'declined': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Waitlist Application Details</DialogTitle>
          <DialogDescription>
            View and manage details for {entry.name}'s waitlist application.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Application Info</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="activity">Activity History</TabsTrigger>
          </TabsList>

          {/* Application Info */}
          <TabsContent value="info" className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Name</div>
                  <div>{entry.name}</div>
                </div>
                <div>
                  <div className="font-medium">Application Date</div>
                  <div>
                    {entry.applicationDate
                      ? new Date(entry.applicationDate).toLocaleDateString()
                      : '-'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="font-medium mb-1">Email</div>
                  <a
                    href={`mailto:${entry.email}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {entry.email}
                  </a>
                </div>
                {entry.phone && (
                  <div className="col-span-2">
                    <div className="font-medium mb-1">Phone</div>
                    <a
                      href={`tel:${entry.phone}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {entry.phone}
                    </a>
                  </div>
                )}
                {(entry.address || entry.city || entry.state) && (
                  <div className="col-span-2">
                    <div className="font-medium mb-1">Address</div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <div>
                        {entry.address && <div>{entry.address}</div>}
                        {(entry.city || entry.state) && (
                          <div>
                            {entry.city}
                            {entry.city && entry.state && ', '}
                            {entry.state} {entry.zipCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Home & Lifestyle */}
            <div className="space-y-3">
              <h3 className="font-semibold">Home & Lifestyle</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {entry.homeOwnership && (
                  <div>
                    <div className="font-medium">Home Ownership</div>
                    <div className="capitalize">{entry.homeOwnership}</div>
                  </div>
                )}
                <div>
                  <div className="font-medium">Yard</div>
                  <div>
                    {entry.hasYard ? (
                      <span className="flex items-center gap-1">
                        {entry.yardFenced ? 'Fenced yard' : 'Yard (not fenced)'}
                      </span>
                    ) : (
                      'No yard'
                    )}
                  </div>
                </div>
                {entry.children && (
                  <div className="col-span-2">
                    <div className="font-medium">Children</div>
                    <div>Yes{entry.childrenAges && ` - Ages: ${entry.childrenAges}`}</div>
                  </div>
                )}
                {entry.otherPets && (
                  <div className="col-span-2">
                    <div className="font-medium">Other Pets</div>
                    <div>{entry.otherPets}</div>
                  </div>
                )}
                {entry.lifestyle && (
                  <div className="col-span-2">
                    <div className="font-medium">Lifestyle</div>
                    <div className="capitalize">{entry.lifestyle.replace('_', ' ')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Experience & Motivation */}
            {(entry.experience || entry.reason) && (
              <div className="space-y-3">
                <h3 className="font-semibold">Experience & Motivation</h3>
                {entry.experience && (
                  <div>
                    <div className="font-medium mb-1">Dog Ownership Experience</div>
                    <div className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap">
                      {entry.experience}
                    </div>
                  </div>
                )}
                {entry.reason && (
                  <div>
                    <div className="font-medium mb-1">Why They Want This Breed</div>
                    <div className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap">
                      {entry.reason}
                    </div>
                  </div>
                )}
                {entry.vetReference && (
                  <div>
                    <div className="font-medium">Veterinarian Reference</div>
                    <div className="text-sm">{entry.vetReference}</div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {entry.preferredSex && (
                <div>
                  <div className="font-medium">Preferred Sex</div>
                  <div className="text-sm capitalize">
                    {entry.preferredSex === 'either' ? 'No preference' : entry.preferredSex}
                  </div>
                </div>
              )}
              {entry.preferredSize && (
                <div>
                  <div className="font-medium">Preferred Size</div>
                  <div className="text-sm capitalize">{entry.preferredSize}</div>
                </div>
              )}
              {entry.preferredColors && entry.preferredColors.length > 0 && (
                <div className="col-span-2">
                  <div className="font-medium">Preferred Colors</div>
                  <div className="text-sm">{entry.preferredColors.join(', ')}</div>
                </div>
              )}
              {entry.timeline && (
                <div className="col-span-2">
                  <div className="font-medium">Timeline</div>
                  <div className="text-sm">{entry.timeline}</div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Management */}
          <TabsContent value="management" className="space-y-6">
            {/* Litter & Puppy Assignment */}
            <div className="space-y-4">
              <h3 className="font-semibold">Litter & Puppy Assignment</h3>

              {/* Current Assignment Status */}
              {(assignedLitter || assignedPuppy) && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {assignedPuppy ? (
                      <>
                        <Baby className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          Assigned to Puppy: {assignedPuppy.name || assignedPuppy.collar || assignedPuppy.color || 'Unnamed'}
                        </span>
                      </>
                    ) : assignedLitter ? (
                      <>
                        <Dog className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          On Waitlist for: {assignedLitter.litterName || 'Litter'}
                        </span>
                      </>
                    ) : null}
                  </div>
                  {assignedLitter && (
                    <Link
                      to={`/litters/${assignedLitter.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Litter Details →
                    </Link>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Assigned Litter</Label>
                  <Select
                    value={formData.assignedLitterId || 'none'}
                    onValueChange={(value) => {
                      const litterId = value === 'none' ? undefined : value;
                      setFormData({
                        ...formData,
                        assignedLitterId: litterId,
                        // Clear puppy assignment if litter changes
                        assignedPuppyId: litterId !== formData.assignedLitterId ? undefined : formData.assignedPuppyId,
                        assignedPuppyName: litterId !== formData.assignedLitterId ? undefined : formData.assignedPuppyName,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No litter assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Litter (General Waitlist)</SelectItem>
                      {availableLitters.map((litter) => {
                        const dam = dogs.find((d) => d.id === litter.damId);
                        const sire = dogs.find((d) => d.id === litter.sireId);
                        return (
                          <SelectItem key={litter.id} value={litter.id}>
                            {litter.litterName || `${dam?.name || 'Unknown'} x ${sire?.name || litter.externalSire?.name || 'Unknown'}`}
                            {litter.status === 'expected' && ' (Expected)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Assigned Puppy</Label>
                  <Select
                    value={formData.assignedPuppyId || 'none'}
                    onValueChange={(value) => {
                      const puppyId = value === 'none' ? undefined : value;
                      const puppy = litterPuppies.find((p) => p.id === puppyId);
                      setFormData({
                        ...formData,
                        assignedPuppyId: puppyId,
                        assignedPuppyName: puppy?.name || puppy?.collar || puppy?.color,
                      });
                    }}
                    disabled={!formData.assignedLitterId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.assignedLitterId ? "Select a puppy" : "Select a litter first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Puppy Assigned</SelectItem>
                      {litterPuppies.map((puppy) => (
                        <SelectItem key={puppy.id} value={puppy.id}>
                          {puppy.name || puppy.collar || puppy.color || `Puppy ${puppy.id.slice(-4)}`}
                          {puppy.sex && ` (${puppy.sex.charAt(0).toUpperCase()})`}
                          {puppy.status !== 'available' && ` - ${puppy.status}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.assignedLitterId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Assign a litter first to select a puppy
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="space-y-4">
              <h3 className="font-semibold">Application Status</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: WaitlistEntry['status']) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <Badge className={getStatusColor(formData.status)}>{formData.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="active">Active (on waitlist)</SelectItem>
                      <SelectItem value="matched">Matched to Litter</SelectItem>
                      <SelectItem value="reserved">Reserved Puppy</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority || 'standard'}
                    onValueChange={(value: 'standard' | 'priority' | 'vip') =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Position in Waitlist</Label>
                  <Input
                    type="number"
                    value={formData.position || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, position: parseInt(e.target.value) || undefined })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Deposit Tracking */}
            <div className="space-y-4">
              <h3 className="font-semibold">Deposit Information</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="depositRequired"
                  checked={formData.depositRequired}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, depositRequired: checked as boolean })
                  }
                />
                <Label htmlFor="depositRequired">Deposit Required</Label>
              </div>

              {formData.depositRequired && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Deposit Amount</Label>
                    <Input
                      type="number"
                      value={formData.depositAmount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || undefined })
                      }
                      placeholder="500"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id="depositPaid"
                      checked={formData.depositPaid || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, depositPaid: checked as boolean })
                      }
                    />
                    <Label htmlFor="depositPaid">Deposit Paid</Label>
                  </div>

                  {formData.depositPaid && (
                    <>
                      <div>
                        <Label>Deposit Date</Label>
                        <Input
                          type="date"
                          value={formData.depositDate || ''}
                          onChange={(e) => setFormData({ ...formData, depositDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>Payment Method</Label>
                        <Input
                          value={formData.depositMethod || ''}
                          onChange={(e) => setFormData({ ...formData, depositMethod: e.target.value })}
                          placeholder="PayPal, Check, etc."
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="depositRefundable"
                      checked={formData.depositRefundable || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, depositRefundable: checked as boolean })
                      }
                    />
                    <Label htmlFor="depositRefundable">Refundable</Label>
                  </div>
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div>
              <Label>Internal Notes</Label>
              <Textarea
                rows={4}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add your notes about this application..."
              />
            </div>
          </TabsContent>

          {/* Activity History */}
          <TabsContent value="activity" className="space-y-6">
            {/* Submission Info */}
            {entry.submittedAt && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                  <CheckCircle className="h-5 w-5" />
                  Application Submitted
                </div>
                <p className="text-sm text-blue-600">
                  {format(new Date(entry.submittedAt), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  {formatDistanceToNow(new Date(entry.submittedAt), { addSuffix: true })}
                </p>
              </div>
            )}

            {/* Activity Timeline */}
            {entry.activityLog && entry.activityLog.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Timeline</h3>
                <div className="space-y-3">
                  {entry.activityLog
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((log, index) => (
                      <div key={index} className="flex gap-3 p-4 bg-muted/50 rounded-lg border">
                        <div className="flex-shrink-0 mt-0.5">
                          {log.action.includes('submitted') || log.action.includes('Application') ? (
                            <User className="h-5 w-5 text-green-500" />
                          ) : log.action.includes('approved') || log.action.includes('status') ? (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          ) : log.action.includes('email') || log.action.includes('sent') ? (
                            <Send className="h-5 w-5 text-purple-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm">{log.action}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                          </div>
                          {log.performedBy && (
                            <p className="text-xs text-muted-foreground mt-1">
                              By: {log.performedBy === 'customer' ? 'Customer' : 'Breeder'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No activity recorded yet</p>
              </div>
            )}
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
    </Dialog>
  );
}
