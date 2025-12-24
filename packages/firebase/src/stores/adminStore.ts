import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, AppSettings, AdminStats } from '@breeder/types';
import {
  logRoleChange,
  logUserActivation,
  logUserDeactivation,
  logSettingsUpdate,
  logImpersonationStart,
  logImpersonationEnd,
} from '../utils/auditLog';

interface AdminState {
  users: UserProfile[];
  appSettings: AppSettings | null;
  adminStats: AdminStats | null;
  impersonatedUserId: string | null;
  loading: boolean;

  // Actions
  subscribeToUsers: () => () => void;
  subscribeToAppSettings: () => () => void;
  checkIsAdmin: (uid: string) => Promise<boolean>;
  updateUserRole: (uid: string, role: 'user' | 'admin') => Promise<void>;
  toggleUserActive: (uid: string, isActive: boolean) => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setImpersonatedUser: (uid: string | null) => void;
  getAdminStats: () => Promise<AdminStats>;
  createUserProfile: (
    uid: string,
    email: string,
    displayName: string
  ) => Promise<void>;
  syncAllUserCounts: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  appSettings: null,
  adminStats: null,
  impersonatedUserId: null,
  loading: false,

  checkIsAdmin: async (uid: string) => {
    try {
      // Wait a bit for auth state to propagate to Firestore
      await new Promise((resolve) => setTimeout(resolve, 500));

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        console.error('User document does not exist:', uid);
        return false;
      }

      const userData = userDoc.data();
      return userData?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  subscribeToUsers: () => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users: UserProfile[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            email: data.email || '',
            displayName: data.displayName || 'Unknown',
            photoURL: data.photoURL,
            createdAt: data.createdAt || new Date().toISOString(),
            lastLogin: data.lastLogin,
            role: data.role || 'user',
            isActive: data.isActive !== false,
            kennelName: data.kennelName,
            totalDogs: data.totalDogs || 0,
            totalLitters: data.totalLitters || 0,
          };
        });
        set({ users });
      },
      (error) => {
        console.error('Error subscribing to users:', error);
      }
    );

    return unsubscribe;
  },

  subscribeToAppSettings: () => {
    const docRef = doc(db, 'admin', 'settings');

    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          set({ appSettings: snapshot.data() as AppSettings });
        } else {
          // Create default settings if they don't exist
          const defaultSettings: AppSettings = {
            maintenanceMode: false,
            allowSignups: true,
            maxDogsPerUser: 100,
            maxLittersPerUser: 50,
            featuresEnabled: {
              connections: true,
              waitlist: true,
              publicPages: true,
              emailNotifications: true,
            },
            globalRegistries: ['AKC', 'CKC', 'UKC'],
          };
          await setDoc(docRef, defaultSettings);
          set({ appSettings: defaultSettings });
        }
      },
      (error) => {
        console.error('Error subscribing to app settings:', error);
      }
    );

    return unsubscribe;
  },

  updateUserRole: async (uid: string, role: 'user' | 'admin') => {
    try {
      const users = get().users;
      const targetUser = users.find((u) => u.uid === uid);
      const oldRole = targetUser?.role || 'user';

      await updateDoc(doc(db, 'users', uid), { role });

      // Log the role change (assumes admin user is calling this)
      if (targetUser) {
        // You'll need to pass the admin user info when calling this function
        // For now, we'll log it generically
        await logRoleChange(
          'admin',
          'admin@system',
          'System Admin',
          uid,
          targetUser.email,
          targetUser.displayName,
          oldRole,
          role
        );
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  toggleUserActive: async (uid: string, isActive: boolean) => {
    try {
      const users = get().users;
      const targetUser = users.find((u) => u.uid === uid);

      await updateDoc(doc(db, 'users', uid), { isActive });

      // Log the activation/deactivation
      if (targetUser) {
        if (isActive) {
          await logUserActivation(
            'admin',
            'admin@system',
            'System Admin',
            uid,
            targetUser.email,
            targetUser.displayName
          );
        } else {
          await logUserDeactivation(
            'admin',
            'admin@system',
            'System Admin',
            uid,
            targetUser.email,
            targetUser.displayName
          );
        }
      }
    } catch (error) {
      console.error('Error toggling user active status:', error);
      throw error;
    }
  },

  updateAppSettings: async (settings: Partial<AppSettings>) => {
    try {
      const docRef = doc(db, 'admin', 'settings');
      await updateDoc(docRef, settings as Record<string, unknown>);

      // Log the settings update
      await logSettingsUpdate(
        'admin',
        'admin@system',
        'System Admin',
        settings as Record<string, unknown>
      );
    } catch (error) {
      console.error('Error updating app settings:', error);
      throw error;
    }
  },

  setImpersonatedUser: (uid: string | null) => {
    const users = get().users;
    const previousUid = get().impersonatedUserId;

    set({ impersonatedUserId: uid });
    if (uid) {
      localStorage.setItem('impersonatedUserId', uid);
      const targetUser = users.find((u) => u.uid === uid);
      if (targetUser) {
        logImpersonationStart(
          'admin',
          'admin@system',
          'System Admin',
          uid,
          targetUser.email,
          targetUser.displayName
        );
      }
    } else {
      localStorage.removeItem('impersonatedUserId');
      if (previousUid) {
        const targetUser = users.find((u) => u.uid === previousUid);
        if (targetUser) {
          logImpersonationEnd(
            'admin',
            'admin@system',
            'System Admin',
            previousUid,
            targetUser.email,
            targetUser.displayName
          );
        }
      }
    }
  },

  getAdminStats: async () => {
    try {
      const users = get().users;
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Count new users this month
      const newUsersThisMonth = users.filter((user) => {
        const createdAt = new Date(user.createdAt);
        return createdAt >= firstDayOfMonth;
      }).length;

      // Count active users
      const activeUsers = users.filter((user) => user.isActive).length;

      // Use aggregated counts from user profiles instead of querying subcollections
      // This avoids permission issues with reading other users' dogs/litters
      const totalDogs = users.reduce(
        (sum, user) => sum + (user.totalDogs || 0),
        0
      );
      const totalLitters = users.reduce(
        (sum, user) => sum + (user.totalLitters || 0),
        0
      );

      const stats: AdminStats = {
        totalUsers: users.length,
        activeUsers,
        totalDogs,
        totalLitters,
        newUsersThisMonth,
      };

      set({ adminStats: stats });
      return stats;
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  },

  createUserProfile: async (
    uid: string,
    email: string,
    displayName: string
  ) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', uid), {
          email,
          displayName,
          createdAt: new Date().toISOString(),
          role: 'user',
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  syncAllUserCounts: async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));

      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;

        try {
          // Count non-deceased dogs (filter in code to avoid index requirement)
          const dogsSnap = await getDocs(
            query(collection(db, 'dogs'), where('userId', '==', uid))
          );
          const totalDogs = dogsSnap.docs.filter(
            (doc) => !doc.data().isDeceased
          ).length;

          // Count litters
          const littersSnap = await getDocs(
            query(collection(db, 'litters'), where('userId', '==', uid))
          );
          const totalLitters = littersSnap.size;

          // Update user profile
          await updateDoc(doc(db, 'users', uid), {
            totalDogs,
            totalLitters,
          });
        } catch (userError) {
          // Log but continue with other users
          console.warn(`Could not sync counts for user ${uid}:`, userError);
        }
      }
    } catch (error) {
      console.error('Error syncing user counts:', error);
      throw error;
    }
  },
}));
