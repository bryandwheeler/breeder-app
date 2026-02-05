import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffStore, useBreederStore } from '@breeder/firebase';
import {
  StaffRole,
  StaffPermissions,
  DEFAULT_STAFF_PERMISSIONS,
  STAFF_ROLE_LABELS,
} from '@breeder/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { StaffPermissionsEditor } from './StaffPermissionsEditor';
import { UserPlus, Loader2 } from 'lucide-react';

interface StaffInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function StaffInviteDialog({
  open,
  onOpenChange,
  onSuccess,
}: StaffInviteDialogProps) {
  const { currentUser } = useAuth();
  const { breederProfile } = useBreederStore();
  const { inviteStaff } = useStaffStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [role, setRole] = useState<StaffRole>('assistant');
  const [permissions, setPermissions] = useState<StaffPermissions>(
    DEFAULT_STAFF_PERMISSIONS.assistant
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to invite staff.',
        variant: 'destructive',
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await inviteStaff({
        breederId: currentUser.uid,
        breederName: breederProfile?.businessName || currentUser.displayName || 'Unknown',
        kennelName: breederProfile?.kennelName,
        email: email.trim(),
        role,
        permissions,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${email}.`,
      });

      // Reset form
      setEmail('');
      setTitle('');
      setNotes('');
      setRole('assistant');
      setPermissions(DEFAULT_STAFF_PERMISSIONS.assistant);

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('[StaffInviteDialog] Error inviting staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Staff Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to add a new staff member to your kennel. They will
            receive an email with instructions to accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              If they don't have an account, they'll be prompted to create one.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Kennel Manager, Assistant"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Private notes about this staff member..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Only visible to you, not the staff member.
            </p>
          </div>

          {/* Role and Permissions */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <StaffPermissionsEditor
              role={role}
              permissions={permissions}
              onRoleChange={setRole}
              onPermissionsChange={setPermissions}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
