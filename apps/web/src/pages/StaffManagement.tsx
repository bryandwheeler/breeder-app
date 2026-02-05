import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffStore } from '@breeder/firebase';
import {
  StaffMember,
  StaffInvitation,
  StaffAuditLog,
  STAFF_ROLE_LABELS,
  STAFF_STATUS_LABELS,
  StaffPermissions,
  StaffRole,
} from '@breeder/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StaffInviteDialog, StaffPermissionsEditor } from '@/components/staff';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Mail,
  Shield,
  Ban,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  AlertTriangle,
  History,
} from 'lucide-react';

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'accepted':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'revoked':
    case 'declined':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'accepted':
      return <CheckCircle className="h-3 w-3" />;
    case 'pending':
      return <Clock className="h-3 w-3" />;
    case 'revoked':
    case 'declined':
      return <XCircle className="h-3 w-3" />;
    default:
      return null;
  }
}

export function StaffManagement() {
  const { currentUser } = useAuth();
  const {
    staffMembers,
    sentInvitations,
    auditLogs,
    loading,
    subscribeToStaffMembers,
    subscribeToSentInvitations,
    subscribeToAuditLogs,
    cancelInvitation,
    resendInvitation,
    revokeStaffAccess,
    deleteStaffMember,
    updateStaffPermissions,
  } = useStaffStore();
  const { toast } = useToast();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState<StaffRole>('assistant');
  const [editPermissions, setEditPermissions] = useState<StaffPermissions | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Subscribe to data
  useEffect(() => {
    if (!currentUser) return;

    const unsubMembers = subscribeToStaffMembers(currentUser.uid);
    const unsubInvitations = subscribeToSentInvitations(currentUser.uid);
    const unsubAudit = subscribeToAuditLogs(currentUser.uid, 50);

    return () => {
      unsubMembers();
      unsubInvitations();
      unsubAudit();
    };
  }, [currentUser, subscribeToStaffMembers, subscribeToSentInvitations, subscribeToAuditLogs]);

  // Filter active vs inactive staff
  const activeStaff = staffMembers.filter((m) => m.status === 'accepted');
  const pendingStaff = staffMembers.filter((m) => m.status === 'pending');
  const inactiveStaff = staffMembers.filter((m) => ['revoked', 'declined', 'expired'].includes(m.status));

  const handleCancelInvitation = async (invitation: StaffInvitation) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      await cancelInvitation(invitation.id);
      toast({
        title: 'Invitation Cancelled',
        description: 'The invitation has been cancelled.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel invitation.',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvitation = async (invitation: StaffInvitation) => {
    try {
      await resendInvitation(invitation.id);
      toast({
        title: 'Invitation Resent',
        description: 'A new invitation has been sent.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation.',
        variant: 'destructive',
      });
    }
  };

  const handleEditMember = (member: StaffMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditPermissions(member.permissions);
    setShowEditDialog(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedMember || !editPermissions) return;

    setActionLoading(true);
    try {
      await updateStaffPermissions(selectedMember.id, editRole, editPermissions);
      toast({
        title: 'Permissions Updated',
        description: 'Staff member permissions have been updated.',
      });
      setShowEditDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update permissions.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeMember = (member: StaffMember) => {
    setSelectedMember(member);
    setShowRevokeDialog(true);
  };

  const handleConfirmRevoke = async () => {
    if (!selectedMember || !currentUser) return;

    setActionLoading(true);
    try {
      await revokeStaffAccess(selectedMember.id, currentUser.uid);
      toast({
        title: 'Access Revoked',
        description: 'Staff member access has been revoked.',
      });
      setShowRevokeDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke access.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMember = async (member: StaffMember) => {
    if (!confirm('Are you sure you want to permanently delete this staff record? This cannot be undone.')) {
      return;
    }

    try {
      await deleteStaffMember(member.id);
      toast({
        title: 'Staff Record Deleted',
        description: 'The staff record has been permanently deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete staff record.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Staff Management
          </h2>
          <p className="text-muted-foreground">
            Manage your kennel staff and their permissions
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeStaff.length}</p>
                <p className="text-xs text-muted-foreground">Active Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{pendingStaff.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {sentInvitations.filter((i) => i.status === 'pending').length}
                </p>
                <p className="text-xs text-muted-foreground">Open Invitations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <History className="h-8 w-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{inactiveStaff.length}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Staff ({activeStaff.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingStaff.length})</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Active Staff */}
        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
              {activeStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">No active staff</h3>
                  <p className="text-muted-foreground mb-4">
                    Invite your first staff member to get started
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Staff
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeStaff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{member.staffDisplayName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{member.staffEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{STAFF_ROLE_LABELS[member.role]}</Badge>
                        </TableCell>
                        <TableCell>{member.title || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(member.acceptedAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(member.lastActiveAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Edit Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRevokeMember(member)}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Revoke Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Staff */}
        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              {pendingStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No pending invitations</h3>
                  <p className="text-muted-foreground">
                    All invitations have been responded to
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingStaff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <p className="font-medium">{member.staffEmail}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{STAFF_ROLE_LABELS[member.role]}</Badge>
                        </TableCell>
                        <TableCell>{member.title || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(member.invitedAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Edit Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteMember(member)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations */}
        <TabsContent value="invitations">
          <Card>
            <CardContent className="p-0">
              {sentInvitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No invitations sent</h3>
                  <p className="text-muted-foreground">
                    Invite staff members to see them here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentInvitations.map((invitation) => {
                      const isExpired =
                        invitation.status === 'pending' &&
                        new Date(invitation.expiresAt) < new Date();

                      return (
                        <TableRow key={invitation.id}>
                          <TableCell>
                            <p className="font-medium">{invitation.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                isExpired
                                  ? 'outline'
                                  : getStatusBadgeVariant(invitation.status)
                              }
                              className="flex items-center gap-1 w-fit"
                            >
                              {isExpired ? (
                                <>
                                  <AlertTriangle className="h-3 w-3" />
                                  Expired
                                </>
                              ) : (
                                <>
                                  {getStatusIcon(invitation.status)}
                                  {STAFF_STATUS_LABELS[invitation.status]}
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {STAFF_ROLE_LABELS[invitation.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(invitation.createdAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(invitation.expiresAt)}
                          </TableCell>
                          <TableCell>
                            {(invitation.status === 'pending' || isExpired) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {isExpired && (
                                    <DropdownMenuItem
                                      onClick={() => handleResendInvitation(invitation)}
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Resend
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleCancelInvitation(invitation)}
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History (Inactive Staff) */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              {inactiveStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No history</h3>
                  <p className="text-muted-foreground">
                    Past staff members will appear here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveStaff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {member.staffDisplayName || member.staffEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.staffEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(member.status)}>
                            {STAFF_STATUS_LABELS[member.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{STAFF_ROLE_LABELS[member.role]}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(member.revokedAt || member.updatedAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.revokedReason || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMember(member)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Staff Activity Log</CardTitle>
              <CardDescription>
                Recent actions performed by staff members in your kennel
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No activity yet</h3>
                  <p className="text-muted-foreground">
                    Staff actions will be logged here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <p className="font-medium">{log.staffDisplayName}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm capitalize">{log.targetType.replace('_', ' ')}</p>
                            {log.targetName && (
                              <p className="text-xs text-muted-foreground">{log.targetName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTime(log.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <StaffInviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />

      {/* Edit Permissions Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {selectedMember?.staffDisplayName || selectedMember?.staffEmail}
            </DialogDescription>
          </DialogHeader>

          {editPermissions && (
            <StaffPermissionsEditor
              role={editRole}
              permissions={editPermissions}
              onRoleChange={setEditRole}
              onPermissionsChange={setEditPermissions}
              disabled={actionLoading}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={actionLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Revoke Staff Access
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke access for{' '}
              <strong>{selectedMember?.staffDisplayName || selectedMember?.staffEmail}</strong>?
              They will immediately lose access to your kennel data.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmRevoke} disabled={actionLoading}>
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
