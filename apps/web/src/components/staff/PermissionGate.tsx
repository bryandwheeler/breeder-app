import { ReactNode } from 'react';
import { useKennel } from '@/contexts/KennelContext';
import { StaffPermissions } from '@breeder/types';

interface PermissionGateProps {
  /**
   * Single permission to check
   */
  permission?: keyof StaffPermissions;

  /**
   * Multiple permissions - user must have ALL of these
   */
  permissions?: (keyof StaffPermissions)[];

  /**
   * Multiple permissions - user must have ANY of these
   */
  anyPermission?: (keyof StaffPermissions)[];

  /**
   * Content to render when user has permission
   */
  children: ReactNode;

  /**
   * Optional fallback content when user lacks permission
   * If not provided, nothing is rendered
   */
  fallback?: ReactNode;

  /**
   * If true, also allows owners (not just checking staff permissions)
   * Default: true (owners always have access)
   */
  allowOwner?: boolean;
}

/**
 * Conditionally renders children based on user permissions
 *
 * Usage examples:
 *
 * ```tsx
 * // Single permission
 * <PermissionGate permission="canEditDogs">
 *   <EditButton />
 * </PermissionGate>
 *
 * // Multiple permissions (must have ALL)
 * <PermissionGate permissions={['canViewDogs', 'canEditDogs']}>
 *   <EditPanel />
 * </PermissionGate>
 *
 * // Multiple permissions (must have ANY)
 * <PermissionGate anyPermission={['canManageTasks', 'canCompleteTasks']}>
 *   <TaskActions />
 * </PermissionGate>
 *
 * // With fallback
 * <PermissionGate permission="canDeleteDogs" fallback={<span>No access</span>}>
 *   <DeleteButton />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  permissions,
  anyPermission,
  children,
  fallback = null,
  allowOwner = true,
}: PermissionGateProps) {
  const { isOwner, hasPermission, hasAllPermissions, hasAnyPermission } = useKennel();

  // Owners always have access if allowOwner is true
  if (allowOwner && isOwner) {
    return <>{children}</>;
  }

  // Check single permission
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
  }

  // Check all permissions (AND logic)
  if (permissions && permissions.length > 0) {
    if (!hasAllPermissions(...permissions)) {
      return <>{fallback}</>;
    }
  }

  // Check any permission (OR logic)
  if (anyPermission && anyPermission.length > 0) {
    if (!hasAnyPermission(...anyPermission)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook version for programmatic permission checks
 *
 * Usage:
 * ```tsx
 * const canEdit = usePermission('canEditDogs');
 * const canViewOrEdit = useAnyPermission(['canViewDogs', 'canEditDogs']);
 * const canFullyManage = useAllPermissions(['canViewDogs', 'canEditDogs', 'canDeleteDogs']);
 * ```
 */
export function usePermission(permission: keyof StaffPermissions): boolean {
  const { isOwner, hasPermission } = useKennel();
  return isOwner || hasPermission(permission);
}

export function useAnyPermission(permissions: (keyof StaffPermissions)[]): boolean {
  const { isOwner, hasAnyPermission } = useKennel();
  return isOwner || hasAnyPermission(...permissions);
}

export function useAllPermissions(permissions: (keyof StaffPermissions)[]): boolean {
  const { isOwner, hasAllPermissions } = useKennel();
  return isOwner || hasAllPermissions(...permissions);
}
