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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, AppSettings, AdminStats } from '@/types/admin';

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
  createUserProfile: (uid: string, email: string, displayName: string) => Promise<void>;
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
      await new Promise(resolve => setTimeout(resolve, 500));

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        console.error('User document does not exist:', uid);
        return false;
      }

      const userData = userDoc.data();
      console.log('User data for admin check:', userData);
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
      await updateDoc(doc(db, 'users', uid), { role });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  toggleUserActive: async (uid: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isActive });
    } catch (error) {
      console.error('Error toggling user active status:', error);
      throw error;
    }
  },

  updateAppSettings: async (settings: Partial<AppSettings>) => {
    try {
      const docRef = doc(db, 'admin', 'settings');
      await updateDoc(docRef, settings);
    } catch (error) {
      console.error('Error updating app settings:', error);
      throw error;
    }
  },

  setImpersonatedUser: (uid: string | null) => {
    set({ impersonatedUserId: uid });
    if (uid) {
      localStorage.setItem('impersonatedUserId', uid);
    } else {
      localStorage.removeItem('impersonatedUserId');
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
      const totalDogs = users.reduce((sum, user) => sum + (user.totalDogs || 0), 0);
      const totalLitters = users.reduce((sum, user) => sum + (user.totalLitters || 0), 0);

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

  createUserProfile: async (uid: string, email: string, displayName: string) => {
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
}));
