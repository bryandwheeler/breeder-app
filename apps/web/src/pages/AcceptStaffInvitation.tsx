import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffStore, db } from '@breeder/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  StaffInvitation,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_DESCRIPTIONS,
  STAFF_PERMISSION_CATEGORIES,
  STAFF_PERMISSION_LABELS,
  StaffPermissions,
} from '@breeder/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  LogIn,
  Clock,
} from 'lucide-react';

export function AcceptStaffInvitation() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { acceptInvitation, declineInvitation } = useStaffStore();
  const { toast } = useToast();

  const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!invitationId) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const invitationRef = doc(db, 'staffInvitations', invitationId);
        const invitationSnap = await getDoc(invitationRef);

        if (!invitationSnap.exists()) {
          setError('Invitation not found');
          setLoading(false);
          return;
        }

        const data = invitationSnap.data() as Omit<StaffInvitation, 'id'>;
        setInvitation({ id: invitationSnap.id, ...data });
      } catch (err: any) {
        console.error('[AcceptStaffInvitation] Error fetching invitation:', err);
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [invitationId]);

  // Check invitation status
  const isExpired = invitation
    ? new Date(invitation.expiresAt) < new Date()
    : false;
  const isAlreadyUsed = invitation?.status !== 'pending';
  const emailMismatch =
    currentUser && invitation && currentUser.email?.toLowerCase() !== invitation.email.toLowerCase();

  const handleAccept = async () => {
    if (!invitation || !currentUser) return;

    setActionLoading(true);
    try {
      await acceptInvitation(
        invitation.id,
        currentUser.uid,
        currentUser.displayName || undefined
      );

      toast({
        title: 'Invitation Accepted',
        description: `You are now a staff member at ${invitation.kennelName || invitation.breederName}.`,
      });

      // Redirect to home (they can use kennel switcher to access the new kennel)
      navigate('/');
    } catch (err: any) {
      console.error('[AcceptStaffInvitation] Error accepting invitation:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    setActionLoading(true);
    try {
      await declineInvitation(invitation.id);

      toast({
        title: 'Invitation Declined',
        description: 'You have declined the staff invitation.',
      });

      navigate('/');
    } catch (err: any) {
      console.error('[AcceptStaffInvitation] Error declining invitation:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to decline invitation',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Count enabled permissions
  const countEnabledPermissions = (permissions: StaffPermissions): number => {
    return Object.values(permissions).filter((v) => v === true).length;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>
              {error || 'This invitation could not be found.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Expired invitation
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" />
              Invitation Expired
            </CardTitle>
            <CardDescription>
              This invitation expired on{' '}
              {new Date(invitation.expiresAt).toLocaleDateString()}. Please
              contact the kennel owner to request a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{invitation.kennelName || invitation.breederName}</p>
              <p className="text-sm text-muted-foreground">
                Invited by {invitation.breederName}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Already used invitation
  if (isAlreadyUsed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {invitation.status === 'accepted' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Invitation Already Accepted
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Invitation {invitation.status === 'declined' ? 'Declined' : 'Cancelled'}
                </>
              )}
            </CardTitle>
            <CardDescription>
              {invitation.status === 'accepted'
                ? 'This invitation has already been accepted. You can access the kennel from your dashboard.'
                : 'This invitation is no longer valid.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Invitation
            </CardTitle>
            <CardDescription>
              You've been invited to join a kennel as a staff member. Please sign
              in or create an account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-medium text-lg">
                    {invitation.kennelName || invitation.breederName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Invited by {invitation.breederName}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Role: <Badge variant="secondary">{STAFF_ROLE_LABELS[invitation.role]}</Badge>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Invited to: {invitation.email}
            </p>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button asChild className="w-full">
              <Link to={`/login?redirect=/accept-invitation/${invitationId}`}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to={`/signup?redirect=/accept-invitation/${invitationId}`}>
                Create Account
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Email mismatch warning
  if (emailMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Email Mismatch
            </CardTitle>
            <CardDescription>
              This invitation was sent to <strong>{invitation.email}</strong>, but
              you're signed in as <strong>{currentUser.email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please sign in with the email address the invitation was sent to, or
              contact the kennel owner to send a new invitation to your current email.
            </p>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Valid invitation - show accept/decline options
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Invitation
          </CardTitle>
          <CardDescription>
            You've been invited to join a kennel as a staff member
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Kennel Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-12 w-12 text-primary" />
              <div>
                <p className="font-medium text-lg">
                  {invitation.kennelName || invitation.breederName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Invited by {invitation.breederName}
                </p>
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Your Role</span>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge>{STAFF_ROLE_LABELS[invitation.role]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {STAFF_ROLE_DESCRIPTIONS[invitation.role]}
              </p>
            </div>
          </div>

          {/* Permissions Preview */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Permissions ({countEnabledPermissions(invitation.permissions)} granted)
            </p>
            <Accordion type="single" collapsible className="border rounded-lg">
              {Object.entries(STAFF_PERMISSION_CATEGORIES).map(([categoryKey, category]) => {
                const enabledInCategory = category.permissions.filter(
                  (p) => invitation.permissions[p as keyof StaffPermissions]
                ).length;

                if (enabledInCategory === 0) return null;

                return (
                  <AccordionItem key={categoryKey} value={categoryKey} className="border-0">
                    <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                      <span className="flex items-center gap-2">
                        {category.label}
                        <Badge variant="secondary" className="ml-auto">
                          {enabledInCategory}/{category.permissions.length}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2">
                      <div className="space-y-1">
                        {category.permissions
                          .filter((p) => invitation.permissions[p as keyof StaffPermissions])
                          .map((p) => (
                            <div key={p} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {STAFF_PERMISSION_LABELS[p as keyof StaffPermissions]}
                            </div>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* Expiry notice */}
          <p className="text-xs text-muted-foreground text-center">
            This invitation expires on{' '}
            {new Date(invitation.expiresAt).toLocaleDateString()}
          </p>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDecline}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Decline'
            )}
          </Button>
          <Button className="flex-1" onClick={handleAccept} disabled={actionLoading}>
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Invitation
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
