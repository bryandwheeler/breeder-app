import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { useStaffStore } from '@breeder/firebase';
import { StaffPermissions, StaffKennelContext } from '@breeder/types';

const ACTIVE_KENNEL_KEY = 'expert-breeder-active-kennel';

interface KennelContextType {
  /**
   * Whether the current user is operating as staff for another breeder
   * When true, all data operations should use `effectiveUserId` instead of current user's UID
   */
  isStaff: boolean;

  /**
   * Whether the current user is the owner of the active kennel
   * True when not in staff mode or when viewing their own kennel
   */
  isOwner: boolean;

  /**
   * The currently active kennel context (null if user is owner of their own kennel)
   */
  activeKennel: StaffKennelContext | null;

  /**
   * List of all kennels the staff user has access to
   */
  availableKennels: StaffKennelContext[];

  /**
   * The current permissions for the active kennel
   * Null if user is the owner (owners have all permissions)
   */
  permissions: StaffPermissions | null;

  /**
   * The user ID to use for data queries
   * - For owners: their own UID
   * - For staff: the breeder's UID they're working for
   */
  effectiveUserId: string;

  /**
   * Switch to a different kennel (for multi-kennel staff)
   */
  switchKennel: (breederId: string) => Promise<void>;

  /**
   * Switch back to user's own kennel (exit staff mode)
   */
  exitStaffMode: () => void;

  /**
   * Check if the user has a specific permission
   * Returns true for owners (full access), or checks staff permissions
   */
  hasPermission: (permission: keyof StaffPermissions) => boolean;

  /**
   * Check multiple permissions at once
   * Returns true if user has ALL specified permissions
   */
  hasAllPermissions: (...permissions: (keyof StaffPermissions)[]) => boolean;

  /**
   * Check multiple permissions at once
   * Returns true if user has ANY of the specified permissions
   */
  hasAnyPermission: (...permissions: (keyof StaffPermissions)[]) => boolean;

  /**
   * Loading state while fetching kennel memberships
   */
  loading: boolean;
}

const KennelContext = createContext<KennelContextType | undefined>(undefined);

export function useKennel() {
  const context = useContext(KennelContext);
  if (!context) {
    throw new Error('useKennel must be used within a KennelProvider');
  }
  return context;
}

export function KennelProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const {
    myKennels,
    subscribeToMyKennels,
    subscribeToPendingInvitations,
    updateLastActive,
  } = useStaffStore();

  const [activeKennel, setActiveKennel] = useState<StaffKennelContext | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to the user's kennel memberships and pending invitations
  useEffect(() => {
    if (!currentUser) {
      setActiveKennel(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to kennels the user has staff access to
    const unsubscribeKennels = subscribeToMyKennels(currentUser.uid);

    // Subscribe to pending invitations (by email)
    const unsubscribeInvitations = currentUser.email
      ? subscribeToPendingInvitations(currentUser.email)
      : () => {};

    // Initial loading is done after first snapshot
    const timeout = setTimeout(() => setLoading(false), 1000);

    return () => {
      unsubscribeKennels();
      unsubscribeInvitations();
      clearTimeout(timeout);
    };
  }, [currentUser, subscribeToMyKennels, subscribeToPendingInvitations]);

  // When kennels change, update loading state and restore active kennel from localStorage
  useEffect(() => {
    if (!currentUser) return;

    setLoading(false);

    // Try to restore active kennel from localStorage
    const savedKennelId = localStorage.getItem(ACTIVE_KENNEL_KEY);
    if (savedKennelId && myKennels.length > 0) {
      const savedKennel = myKennels.find((k) => k.breederId === savedKennelId);
      if (savedKennel) {
        setActiveKennel(savedKennel);
        // Update last active timestamp
        updateLastActive(currentUser.uid, savedKennelId);
      } else {
        // Saved kennel no longer valid, clear it
        localStorage.removeItem(ACTIVE_KENNEL_KEY);
        setActiveKennel(null);
      }
    }
  }, [currentUser, myKennels, updateLastActive]);

  // Switch to a different kennel
  const switchKennel = useCallback(
    async (breederId: string) => {
      if (!currentUser) return;

      const kennel = myKennels.find((k) => k.breederId === breederId);
      if (!kennel) {
        throw new Error('You do not have access to this kennel');
      }

      setActiveKennel(kennel);
      localStorage.setItem(ACTIVE_KENNEL_KEY, breederId);

      // Update last active timestamp
      await updateLastActive(currentUser.uid, breederId);
    },
    [currentUser, myKennels, updateLastActive]
  );

  // Exit staff mode (switch back to own kennel)
  const exitStaffMode = useCallback(() => {
    setActiveKennel(null);
    localStorage.removeItem(ACTIVE_KENNEL_KEY);
  }, []);

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (permission: keyof StaffPermissions): boolean => {
      // If no user, no permission
      if (!currentUser) return false;

      // If not in staff mode, user is owner and has all permissions
      if (!activeKennel) return true;

      // Check staff permissions
      return activeKennel.permissions[permission] === true;
    },
    [currentUser, activeKennel]
  );

  // Check if user has ALL specified permissions
  const hasAllPermissions = useCallback(
    (...permissions: (keyof StaffPermissions)[]): boolean => {
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  // Check if user has ANY of the specified permissions
  const hasAnyPermission = useCallback(
    (...permissions: (keyof StaffPermissions)[]): boolean => {
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  // Computed values
  const isStaff = !!activeKennel;
  const isOwner = !activeKennel;
  const effectiveUserId = activeKennel?.breederId || currentUser?.uid || '';
  const permissions = activeKennel?.permissions || null;

  const value: KennelContextType = {
    isStaff,
    isOwner,
    activeKennel,
    availableKennels: myKennels,
    permissions,
    effectiveUserId,
    switchKennel,
    exitStaffMode,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    loading,
  };

  return (
    <KennelContext.Provider value={value}>{children}</KennelContext.Provider>
  );
}
