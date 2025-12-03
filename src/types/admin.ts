// Admin and user management types

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastLogin?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  // Breeder info
  kennelName?: string;
  totalDogs?: number;
  totalLitters?: number;
}

export interface AppSettings {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  allowSignups: boolean;
  maxDogsPerUser: number;
  maxLittersPerUser: number;
  featuresEnabled: {
    connections: boolean;
    waitlist: boolean;
    publicPages: boolean;
    emailNotifications: boolean;
  };
  globalRegistries?: string[]; // Admin-managed list of available registries
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDogs: number;
  totalLitters: number;
  newUsersThisMonth: number;
}
