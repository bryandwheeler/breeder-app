import { useState } from 'react';
import { Inquiry } from '@/types/dog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Mail, Phone, Calendar, Clock, CheckCircle, Send, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  inquiry: Inquiry;
  onUpdate: (updates: Partial<Inquiry>) => Promise<void>;
}

export function InquiryDetailsDialog({ open, setOpen, inquiry, onUpdate }: Props) {
  const [notes, setNotes] = useState(inquiry.notes || '');
  const [nextFollowUp, setNextFollowUp] = useState(inquiry.nextFollowUpDate || '');

  const handleSave = async () => {
    await onUpdate({
      notes,
      nextFollowUpDate: nextFollowUp || undefined,
      lastContactDate: new Date().toISOString().split('T')[0],
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inquiry Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Name</div>
                <div>{inquiry.name}</div>
              </div>
              <div>
                <div className="font-medium">Submitted</div>
                <div>
                  {inquiry.createdAt
                    ? new Date(inquiry.createdAt).toLocaleDateString()
                    : 'Unknown'}
                </div>
              </div>
              <div className="col-span-2">
                <div className="font-medium mb-1">Email</div>
                <a
                  href={`mailto:${inquiry.email}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {inquiry.email}
                </a>
              </div>
              {inquiry.phone && (
                <div className="col-span-2">
                  <div className="font-medium mb-1">Phone</div>
                  <a
                    href={`tel:${inquiry.phone}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {inquiry.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3">
            <h3 className="font-semibold">Preferences</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {inquiry.preferredBreed && (
                <div>
                  <div className="font-medium">Breed</div>
                  <div>{inquiry.preferredBreed}</div>
                </div>
              )}
              {inquiry.preferredSex && (
                <div>
                  <div className="font-medium">Sex</div>
                  <div className="capitalize">
                    {inquiry.preferredSex === 'either' ? 'No preference' : inquiry.preferredSex}
                  </div>
                </div>
              )}
              {inquiry.preferredColor && (
                <div>
                  <div className="font-medium">Color</div>
                  <div>{inquiry.preferredColor}</div>
                </div>
              )}
              {inquiry.timeline && (
                <div>
                  <div className="font-medium">Timeline</div>
                  <div>{inquiry.timeline}</div>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="font-semibold mb-2">Message</h3>
            <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
              {inquiry.message}
            </div>
          </div>

          {/* Source */}
          {inquiry.source && (
            <div>
              <h3 className="font-semibold mb-2">Source</h3>
              <div className="text-sm">
                {inquiry.source === 'website' && 'Website Contact Form'}
                {inquiry.source === 'referral' && `Referral${inquiry.referredBy ? ` from ${inquiry.referredBy}` : ''}`}
                {inquiry.source === 'social_media' && 'Social Media'}
                {inquiry.source === 'other' && 'Other'}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes about this inquiry..."
            />
          </div>

          {/* Follow-up */}
          <div>
            <Label htmlFor="followUp">
              <Calendar className="h-4 w-4 inline mr-2" />
              Next Follow-Up Date
            </Label>
            <Input
              id="followUp"
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
            />
          </div>

          {inquiry.lastContactDate && (
            <div className="text-sm text-muted-foreground">
              Last contacted: {new Date(inquiry.lastContactDate).toLocaleDateString()}
            </div>
          )}

          {/* Activity Timeline */}
          {inquiry.activityLog && inquiry.activityLog.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Activity History</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {inquiry.activityLog
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((log, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        {log.action.includes('email') || log.action.includes('Waitlist') ? (
                          <Send className="h-4 w-4 text-blue-500" />
                        ) : log.action.includes('received') || log.action.includes('submitted') ? (
                          <User className="h-4 w-4 text-green-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{log.action}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Waitlist Email Status */}
          {inquiry.waitlistEmailSent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <Send className="h-4 w-4" />
                <span className="font-semibold">Waitlist link sent</span>
              </div>
              <p className="text-green-600 mt-1">
                {format(new Date(inquiry.waitlistEmailSent), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save & Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
