import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@breeder/firebase';
import {
  AuditLogEntry,
  AuditEventCategory,
  AuditEventAction,
  AuditLogFilters,
} from '@breeder/types';

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: {
  category: AuditEventCategory;
  action: AuditEventAction;
  actorUid: string;
  actorEmail: string;
  actorDisplayName: string;
  targetUid?: string;
  targetEmail?: string;
  targetDisplayName?: string;
  description: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    const logEntry: Partial<Omit<AuditLogEntry, 'id'>> = {
      timestamp: new Date().toISOString(),
      category: params.category,
      action: params.action,
      actorUid: params.actorUid,
      actorEmail: params.actorEmail,
      actorDisplayName: params.actorDisplayName,
      description: params.description,
      success: params.success !== false, // default to true
    };

    // Only include optional fields if they are defined
    if (params.targetUid !== undefined) logEntry.targetUid = params.targetUid;
    if (params.targetEmail !== undefined) logEntry.targetEmail = params.targetEmail;
    if (params.targetDisplayName !== undefined) logEntry.targetDisplayName = params.targetDisplayName;
    if (params.metadata !== undefined) logEntry.metadata = params.metadata;
    if (params.errorMessage !== undefined) logEntry.errorMessage = params.errorMessage;

    await addDoc(collection(db, 'audit_logs'), logEntry);
  } catch (error) {
    // Don't let audit logging failures break the app
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(
  filters: AuditLogFilters = {},
  maxResults: number = 100
): Promise<AuditLogEntry[]> {
  try {
    const logsRef = collection(db, 'audit_logs');
    let q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxResults));

    // Apply filters
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters.action) {
      q = query(q, where('action', '==', filters.action));
    }
    if (filters.actorUid) {
      q = query(q, where('actorUid', '==', filters.actorUid));
    }
    if (filters.targetUid) {
      q = query(q, where('targetUid', '==', filters.targetUid));
    }
    if (filters.successOnly) {
      q = query(q, where('success', '==', true));
    }

    const snapshot = await getDocs(q);
    const logs: AuditLogEntry[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<AuditLogEntry, 'id'>),
    }));

    // Apply date filters client-side (Firestore limitations with multiple orderBy/where)
    let filteredLogs = logs;

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp >= filters.startDate!
      );
    }
    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp <= filters.endDate!
      );
    }

    // Apply search query client-side
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.description.toLowerCase().includes(searchLower) ||
          log.actorEmail.toLowerCase().includes(searchLower) ||
          log.actorDisplayName.toLowerCase().includes(searchLower) ||
          log.targetEmail?.toLowerCase().includes(searchLower) ||
          log.targetDisplayName?.toLowerCase().includes(searchLower)
      );
    }

    return filteredLogs;
  } catch (error) {
    console.error('Failed to query audit logs:', error);
    return [];
  }
}

/**
 * Helper functions for common audit log scenarios
 */

export async function logUserLogin(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  await createAuditLog({
    category: 'auth',
    action: 'login',
    actorUid: uid,
    actorEmail: email,
    actorDisplayName: displayName,
    description: `${displayName} logged in`,
  });
}

export async function logUserSignup(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  await createAuditLog({
    category: 'auth',
    action: 'signup',
    actorUid: uid,
    actorEmail: email,
    actorDisplayName: displayName,
    description: `New user signed up: ${displayName}`,
  });
}

export async function logRoleChange(
  adminUid: string,
  adminEmail: string,
  adminDisplayName: string,
  targetUid: string,
  targetEmail: string,
  targetDisplayName: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await createAuditLog({
    category: 'user_management',
    action: 'role_change',
    actorUid: adminUid,
    actorEmail: adminEmail,
    actorDisplayName: adminDisplayName,
    targetUid,
    targetEmail,
    targetDisplayName,
    description: `${adminDisplayName} changed ${targetDisplayName}'s role from ${oldRole} to ${newRole}`,
    metadata: { oldRole, newRole },
  });
}

export async function logUserDeactivation(
  adminUid: string,
  adminEmail: string,
  adminDisplayName: string,
  targetUid: string,
  targetEmail: string,
  targetDisplayName: string
): Promise<void> {
  await createAuditLog({
    category: 'user_management',
    action: 'user_deactivate',
    actorUid: adminUid,
    actorEmail: adminEmail,
    actorDisplayName: adminDisplayName,
    targetUid,
    targetEmail,
    targetDisplayName,
    description: `${adminDisplayName} deactivated user ${targetDisplayName}`,
  });
}

export async function logUserActivation(
  adminUid: string,
  adminEmail: string,
  adminDisplayName: string,
  targetUid: string,
  targetEmail: string,
  targetDisplayName: string
): Promise<void> {
  await createAuditLog({
    category: 'user_management',
    action: 'user_activate',
    actorUid: adminUid,
    actorEmail: adminEmail,
    actorDisplayName: adminDisplayName,
    targetUid,
    targetEmail,
    targetDisplayName,
    description: `${adminDisplayName} activated user ${targetDisplayName}`,
  });
}

export async function logSettingsUpdate(
  adminUid: string,
  adminEmail: string,
  adminDisplayName: string,
  changes: Record<string, unknown>
): Promise<void> {
  const changesList = Object.keys(changes).join(', ');
  await createAuditLog({
    category: 'settings',
    action: 'settings_updated',
    actorUid: adminUid,
    actorEmail: adminEmail,
    actorDisplayName: adminDisplayName,
    description: `${adminDisplayName} updated app settings: ${changesList}`,
    metadata: changes,
  });
}

export async function logSubscriptionChange(
  adminUid: string,
  adminEmail: string,
  adminDisplayName: string,
  targetUid: string,
  targetEmail: string,
  targetDisplayName: string,
  oldTier: string,
  newTier: string
): Promise<void> {
  await createAuditLog({
    category: 'subscription',
    action: 'tier_change',
    actorUid: adminUid,
    actorEmail: adminEmail,
    actorDisplayName: adminDisplayName,
    targetUid,
    targetEmail,
    targetDisplayName,
    description: `${targetDisplayName}'s subscription changed from ${oldTier} to ${newTier}`,
    metadata: { oldTier, newTier },
  });
}

export async function logCouponApplied(
  uid: string,
  email: string,
  displayName: string,
  couponCode: string
): Promise<void> {
  await createAuditLog({
    category: 'subscription',
    action: 'coupon_applied',
    actorUid: uid,
    actorEmail: email,
    actorDisplayName: displayName,
    description: `${displayName} applied coupon code: ${couponCode}`,
    metadata: { couponCode },
  });
}

export async function logDataExport(
  adminUid: string,
  adminEmail: string,
  adminDisplayName: string,
  exportType: string,
  recordCount: number
): Promise<void> {
  await createAuditLog({
    category: 'data_export',
    action: 'data_exported',
    actorUid: adminUid,
    actorEmail: adminEmail,
    actorDisplayName: adminDisplayName,
    description: `${adminDisplayName} exported ${recordCount} ${exportType} records`,
    metadata: { exportType, recordCount },
  });
}

export async function logImpersonationStart(
  adminUid: string,
  adminEmail: string,
  adminDisplayName: string,
  targetUid: string,
  targetEmail: string,
  targetDisplayName: string
): Promise<void> {
  await createAuditLog({
    category: 'security',
    action: 'impersonation_started',
    actorUid: adminUid,
    actorEmail: adminEmail,
    actorDisplayName: adminDisplayName,
    targetUid,
    targetEmail,
    targetDisplayName,
    description: `${adminDisplayName} started impersonating ${targetDisplayName}`,
  });
}

export async function logImpersonationEnd(
  adminUid: string,
  adminEmail: string,
  adminDisplayName: string,
  targetUid: string,
  targetEmail: string,
  targetDisplayName: string
): Promise<void> {
  await createAuditLog({
    category: 'security',
    action: 'impersonation_ended',
    actorUid: adminUid,
    actorEmail: adminEmail,
    actorDisplayName: adminDisplayName,
    targetUid,
    targetEmail,
    targetDisplayName,
    description: `${adminDisplayName} ended impersonation of ${targetDisplayName}`,
  });
}
