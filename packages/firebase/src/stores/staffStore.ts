import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc,
  setDoc,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  StaffMember,
  StaffInvitation,
  StaffPermissions,
  StaffRole,
  StaffAuditLog,
  StaffAuditAction,
  StaffAuditTargetType,
  StaffKennelContext,
  DEFAULT_STAFF_PERMISSIONS,
} from '@breeder/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate staff member document ID
function getStaffMemberId(staffUserId: string, breederId: string): string {
  return `${staffUserId}_${breederId}`;
}

// Helper to convert Firestore timestamp to ISO string
function toISOString(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

interface StaffStore {
  // State for breeders (viewing their staff)
  staffMembers: StaffMember[];
  sentInvitations: StaffInvitation[];
  auditLogs: StaffAuditLog[];
  loading: boolean;
  error: string | null;

  // State for staff users (viewing their kennel memberships)
  myKennels: StaffKennelContext[];
  pendingInvitations: StaffInvitation[];

  // =========================================================================
  // Breeder Actions - Managing Staff
  // =========================================================================

  /**
   * Invite a new staff member by email
   * Creates an invitation that the staff member can accept
   */
  inviteStaff: (params: {
    breederId: string;
    breederName: string;
    kennelName?: string;
    email: string;
    role: StaffRole;
    permissions: StaffPermissions;
    title?: string;
    notes?: string;
  }) => Promise<string>;

  /**
   * Cancel a pending invitation
   */
  cancelInvitation: (invitationId: string) => Promise<void>;

  /**
   * Resend an expired invitation with a new code and expiry
   */
  resendInvitation: (invitationId: string) => Promise<void>;

  /**
   * Update a staff member's role and permissions
   */
  updateStaffPermissions: (
    staffMemberId: string,
    role: StaffRole,
    permissions: StaffPermissions
  ) => Promise<void>;

  /**
   * Update staff member metadata (title, notes)
   */
  updateStaffMember: (
    staffMemberId: string,
    updates: { title?: string; notes?: string }
  ) => Promise<void>;

  /**
   * Revoke a staff member's access
   */
  revokeStaffAccess: (
    staffMemberId: string,
    revokedBy: string,
    reason?: string
  ) => Promise<void>;

  /**
   * Permanently delete a staff member record
   */
  deleteStaffMember: (staffMemberId: string) => Promise<void>;

  // =========================================================================
  // Staff User Actions - Managing Their Access
  // =========================================================================

  /**
   * Accept an invitation to join a kennel
   */
  acceptInvitation: (
    invitationId: string,
    staffUserId: string,
    staffDisplayName?: string
  ) => Promise<void>;

  /**
   * Decline an invitation
   */
  declineInvitation: (invitationId: string) => Promise<void>;

  /**
   * Update last active timestamp for a kennel
   */
  updateLastActive: (staffUserId: string, breederId: string) => Promise<void>;

  /**
   * Get staff member's permissions for a specific kennel
   */
  getPermissions: (staffUserId: string, breederId: string) => Promise<StaffPermissions | null>;

  /**
   * Check if user has a specific permission for a kennel
   */
  hasPermission: (
    staffUserId: string,
    breederId: string,
    permission: keyof StaffPermissions
  ) => Promise<boolean>;

  // =========================================================================
  // Audit Logging
  // =========================================================================

  /**
   * Log a staff action for audit trail
   */
  logStaffAction: (params: {
    breederId: string;
    staffUserId: string;
    staffDisplayName: string;
    action: StaffAuditAction;
    targetType: StaffAuditTargetType;
    targetId?: string;
    targetName?: string;
    details?: Record<string, unknown>;
  }) => Promise<void>;

  // =========================================================================
  // Subscriptions
  // =========================================================================

  /**
   * Subscribe to staff members for a breeder
   */
  subscribeToStaffMembers: (breederId: string) => () => void;

  /**
   * Subscribe to invitations sent by a breeder
   */
  subscribeToSentInvitations: (breederId: string) => () => void;

  /**
   * Subscribe to pending invitations for a staff user (by email)
   */
  subscribeToPendingInvitations: (email: string) => () => void;

  /**
   * Subscribe to kennel memberships for a staff user
   */
  subscribeToMyKennels: (staffUserId: string) => () => void;

  /**
   * Subscribe to audit logs for a breeder
   */
  subscribeToAuditLogs: (breederId: string, limitCount?: number) => () => void;

  /**
   * Clear all subscriptions and reset state
   */
  reset: () => void;
}

export const useStaffStore = create<StaffStore>((set, get) => ({
  // Initial state
  staffMembers: [],
  sentInvitations: [],
  auditLogs: [],
  loading: false,
  error: null,
  myKennels: [],
  pendingInvitations: [],

  // =========================================================================
  // Breeder Actions
  // =========================================================================

  inviteStaff: async ({
    breederId,
    breederName,
    kennelName,
    email,
    role,
    permissions,
    title,
    notes,
  }) => {
    const inviteCode = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation: Omit<StaffInvitation, 'id'> = {
      breederId,
      breederName,
      kennelName,
      email: email.toLowerCase().trim(),
      role,
      permissions,
      inviteCode,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };

    const docRef = await addDoc(collection(db, 'staffInvitations'), invitation);

    // Also create a placeholder staff member record with pending status
    const staffMemberData: Omit<StaffMember, 'id'> = {
      breederId,
      staffUserId: '', // Will be filled when accepted
      staffEmail: email.toLowerCase().trim(),
      role,
      permissions,
      status: 'pending',
      title,
      notes,
      invitedAt: now.toISOString(),
      invitedBy: breederId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await addDoc(collection(db, 'staffMembers'), staffMemberData);

    return docRef.id;
  },

  cancelInvitation: async (invitationId) => {
    const docRef = doc(db, 'staffInvitations', invitationId);
    const invitationSnap = await getDoc(docRef);

    if (!invitationSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationSnap.data() as StaffInvitation;

    // Update invitation status
    await updateDoc(docRef, {
      status: 'revoked',
    });

    // Also update the corresponding staff member if exists
    const staffQuery = query(
      collection(db, 'staffMembers'),
      where('breederId', '==', invitation.breederId),
      where('staffEmail', '==', invitation.email),
      where('status', '==', 'pending')
    );
    const staffSnap = await getDocs(staffQuery);
    for (const staffDoc of staffSnap.docs) {
      await updateDoc(staffDoc.ref, {
        status: 'revoked',
        updatedAt: serverTimestamp(),
      });
    }
  },

  resendInvitation: async (invitationId) => {
    const docRef = doc(db, 'staffInvitations', invitationId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await updateDoc(docRef, {
      inviteCode: uuidv4(),
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
    });
  },

  updateStaffPermissions: async (staffMemberId, role, permissions) => {
    const docRef = doc(db, 'staffMembers', staffMemberId);
    await updateDoc(docRef, {
      role,
      permissions,
      updatedAt: serverTimestamp(),
    });
  },

  updateStaffMember: async (staffMemberId, updates) => {
    const docRef = doc(db, 'staffMembers', staffMemberId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  revokeStaffAccess: async (staffMemberId, revokedBy, reason) => {
    const docRef = doc(db, 'staffMembers', staffMemberId);
    await updateDoc(docRef, {
      status: 'revoked',
      revokedAt: new Date().toISOString(),
      revokedBy,
      revokedReason: reason,
      updatedAt: serverTimestamp(),
    });
  },

  deleteStaffMember: async (staffMemberId) => {
    const docRef = doc(db, 'staffMembers', staffMemberId);
    await deleteDoc(docRef);
  },

  // =========================================================================
  // Staff User Actions
  // =========================================================================

  acceptInvitation: async (invitationId, staffUserId, staffDisplayName) => {
    const invitationRef = doc(db, 'staffInvitations', invitationId);
    const invitationSnap = await getDoc(invitationRef);

    if (!invitationSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationSnap.data() as StaffInvitation;

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      throw new Error('This invitation is no longer valid');
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      await updateDoc(invitationRef, { status: 'expired' });
      throw new Error('This invitation has expired');
    }

    const now = new Date().toISOString();

    // Update the invitation
    await updateDoc(invitationRef, {
      status: 'accepted',
      acceptedAt: now,
      staffUserId,
    });

    // Find and update the pending staff member record
    const staffQuery = query(
      collection(db, 'staffMembers'),
      where('breederId', '==', invitation.breederId),
      where('staffEmail', '==', invitation.email),
      where('status', '==', 'pending')
    );
    const staffSnap = await getDocs(staffQuery);

    if (staffSnap.empty) {
      // Create a new staff member if the placeholder doesn't exist
      const staffMemberId = getStaffMemberId(staffUserId, invitation.breederId);
      const staffMemberData: Omit<StaffMember, 'id'> = {
        breederId: invitation.breederId,
        staffUserId,
        staffEmail: invitation.email,
        staffDisplayName,
        role: invitation.role,
        permissions: invitation.permissions,
        status: 'accepted',
        invitedAt: invitation.createdAt,
        invitedBy: invitation.breederId,
        acceptedAt: now,
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
      };

      await setDoc(doc(db, 'staffMembers', staffMemberId), {
        ...staffMemberData,
        id: staffMemberId,
      });
    } else {
      // Update existing placeholder
      const staffDoc = staffSnap.docs[0];
      await updateDoc(staffDoc.ref, {
        staffUserId,
        staffDisplayName,
        status: 'accepted',
        acceptedAt: now,
        updatedAt: now,
        lastActiveAt: now,
      });
    }
  },

  declineInvitation: async (invitationId) => {
    const invitationRef = doc(db, 'staffInvitations', invitationId);
    const invitationSnap = await getDoc(invitationRef);

    if (!invitationSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationSnap.data() as StaffInvitation;

    await updateDoc(invitationRef, {
      status: 'declined',
    });

    // Also update the placeholder staff member record
    const staffQuery = query(
      collection(db, 'staffMembers'),
      where('breederId', '==', invitation.breederId),
      where('staffEmail', '==', invitation.email),
      where('status', '==', 'pending')
    );
    const staffSnap = await getDocs(staffQuery);
    for (const staffDoc of staffSnap.docs) {
      await updateDoc(staffDoc.ref, {
        status: 'declined',
        updatedAt: serverTimestamp(),
      });
    }
  },

  updateLastActive: async (staffUserId, breederId) => {
    const staffMemberId = getStaffMemberId(staffUserId, breederId);
    const docRef = doc(db, 'staffMembers', staffMemberId);

    try {
      await updateDoc(docRef, {
        lastActiveAt: new Date().toISOString(),
      });
    } catch (error) {
      // Silently fail - not critical
      console.warn('[staffStore] Failed to update lastActiveAt:', error);
    }
  },

  getPermissions: async (staffUserId, breederId) => {
    const staffMemberId = getStaffMemberId(staffUserId, breederId);
    const docRef = doc(db, 'staffMembers', staffMemberId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as StaffMember;
    if (data.status !== 'accepted') {
      return null;
    }

    return data.permissions;
  },

  hasPermission: async (staffUserId, breederId, permission) => {
    const permissions = await get().getPermissions(staffUserId, breederId);
    if (!permissions) {
      return false;
    }
    return permissions[permission] === true;
  },

  // =========================================================================
  // Audit Logging
  // =========================================================================

  logStaffAction: async ({
    breederId,
    staffUserId,
    staffDisplayName,
    action,
    targetType,
    targetId,
    targetName,
    details,
  }) => {
    const auditLog: Omit<StaffAuditLog, 'id'> = {
      breederId,
      staffUserId,
      staffDisplayName,
      action,
      targetType,
      targetId,
      targetName,
      details,
      timestamp: new Date().toISOString(),
    };

    await addDoc(collection(db, 'staffAuditLogs'), auditLog);
  },

  // =========================================================================
  // Subscriptions
  // =========================================================================

  subscribeToStaffMembers: (breederId) => {
    set({ loading: true, error: null });

    const q = query(
      collection(db, 'staffMembers'),
      where('breederId', '==', breederId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const members: StaffMember[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            breederId: data.breederId,
            staffUserId: data.staffUserId || '',
            staffEmail: data.staffEmail,
            staffDisplayName: data.staffDisplayName,
            role: data.role,
            permissions: data.permissions,
            status: data.status,
            title: data.title,
            notes: data.notes,
            invitedAt: toISOString(data.invitedAt),
            invitedBy: data.invitedBy,
            acceptedAt: data.acceptedAt ? toISOString(data.acceptedAt) : undefined,
            revokedAt: data.revokedAt ? toISOString(data.revokedAt) : undefined,
            revokedBy: data.revokedBy,
            revokedReason: data.revokedReason,
            createdAt: toISOString(data.createdAt),
            updatedAt: toISOString(data.updatedAt),
            lastActiveAt: data.lastActiveAt ? toISOString(data.lastActiveAt) : undefined,
          };
        });

        set({
          staffMembers: members.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          loading: false,
        });
      },
      (error) => {
        console.error('[staffStore] Staff members snapshot error:', error);
        set({ error: error.message, loading: false });
      }
    );
  },

  subscribeToSentInvitations: (breederId) => {
    const q = query(
      collection(db, 'staffInvitations'),
      where('breederId', '==', breederId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const invitations: StaffInvitation[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            breederId: data.breederId,
            breederName: data.breederName,
            kennelName: data.kennelName,
            email: data.email,
            role: data.role,
            permissions: data.permissions,
            inviteCode: data.inviteCode,
            status: data.status,
            expiresAt: toISOString(data.expiresAt),
            createdAt: toISOString(data.createdAt),
            acceptedAt: data.acceptedAt ? toISOString(data.acceptedAt) : undefined,
            staffUserId: data.staffUserId,
          };
        });

        set({
          sentInvitations: invitations.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        });
      },
      (error) => {
        console.error('[staffStore] Sent invitations snapshot error:', error);
      }
    );
  },

  subscribeToPendingInvitations: (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const q = query(
      collection(db, 'staffInvitations'),
      where('email', '==', normalizedEmail),
      where('status', '==', 'pending')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const invitations: StaffInvitation[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            breederId: data.breederId,
            breederName: data.breederName,
            kennelName: data.kennelName,
            email: data.email,
            role: data.role,
            permissions: data.permissions,
            inviteCode: data.inviteCode,
            status: data.status,
            expiresAt: toISOString(data.expiresAt),
            createdAt: toISOString(data.createdAt),
            acceptedAt: data.acceptedAt ? toISOString(data.acceptedAt) : undefined,
            staffUserId: data.staffUserId,
          };
        });

        // Filter out expired invitations
        const validInvitations = invitations.filter(
          (inv) => new Date(inv.expiresAt) > new Date()
        );

        set({
          pendingInvitations: validInvitations.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        });
      },
      (error) => {
        console.error('[staffStore] Pending invitations snapshot error:', error);
      }
    );
  },

  subscribeToMyKennels: (staffUserId) => {
    const q = query(
      collection(db, 'staffMembers'),
      where('staffUserId', '==', staffUserId),
      where('status', '==', 'accepted')
    );

    return onSnapshot(
      q,
      async (snapshot) => {
        const kennels: StaffKennelContext[] = [];

        for (const staffDoc of snapshot.docs) {
          const data = staffDoc.data() as StaffMember;

          // Fetch breeder profile for name and kennel name
          let breederName = 'Unknown Breeder';
          let kennelName: string | undefined;

          try {
            const breederProfileRef = doc(db, 'breederProfiles', data.breederId);
            const breederProfileSnap = await getDoc(breederProfileRef);
            if (breederProfileSnap.exists()) {
              const profile = breederProfileSnap.data();
              breederName = profile.businessName || profile.displayName || breederName;
              kennelName = profile.kennelName;
            }
          } catch (err) {
            console.warn('[staffStore] Failed to fetch breeder profile:', err);
          }

          kennels.push({
            breederId: data.breederId,
            breederName,
            kennelName,
            role: data.role,
            permissions: data.permissions,
            lastActiveAt: data.lastActiveAt,
          });
        }

        set({ myKennels: kennels });
      },
      (error) => {
        console.error('[staffStore] My kennels snapshot error:', error);
      }
    );
  },

  subscribeToAuditLogs: (breederId, limitCount = 100) => {
    const q = query(
      collection(db, 'staffAuditLogs'),
      where('breederId', '==', breederId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const logs: StaffAuditLog[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            breederId: data.breederId,
            staffUserId: data.staffUserId,
            staffDisplayName: data.staffDisplayName,
            action: data.action,
            targetType: data.targetType,
            targetId: data.targetId,
            targetName: data.targetName,
            details: data.details,
            ipAddress: data.ipAddress,
            timestamp: toISOString(data.timestamp),
          };
        });

        set({ auditLogs: logs });
      },
      (error) => {
        console.error('[staffStore] Audit logs snapshot error:', error);
      }
    );
  },

  reset: () => {
    set({
      staffMembers: [],
      sentInvitations: [],
      auditLogs: [],
      loading: false,
      error: null,
      myKennels: [],
      pendingInvitations: [],
    });
  },
}));
