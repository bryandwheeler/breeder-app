export type TaskFrequency = 'once' | 'daily' | 'weekly';
export type TaskStatus = 'pending' | 'completed' | 'skipped';
export type TaskType = 'weekly' | 'daily'; // Weekly milestones vs daily routines

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  dayOrWeek: number; // Day number (0-21) or week number (1-12)
  frequency: TaskFrequency;
  category: 'health' | 'training' | 'care' | 'vaccination' | 'general';
  isActive: boolean;
  sortOrder: number;
}

export interface DefaultTaskTemplate extends TaskTemplate {
  // Global defaults managed by admin
  createdBy: 'system' | string; // 'system' or admin user ID
  updatedAt: string;
}

export interface BreederTaskTemplate extends TaskTemplate {
  // Breeder's customized templates
  breederId: string;
  basedOnDefaultId?: string; // Reference to default template if customized
  updatedAt: string;
}

export interface LitterTask {
  id: string;
  litterId: string;
  breederId: string;
  templateId: string;
  title: string;
  description: string;
  dueDate: string; // ISO date string
  dayOrWeek: number;
  frequency: TaskFrequency;
  category: 'health' | 'training' | 'care' | 'vaccination' | 'general';
  status: TaskStatus;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
  taskType?: TaskType; // 'weekly' for milestones, 'daily' for routines
  timeOfDay?: 'morning' | 'midday' | 'evening'; // For daily tasks only
  // Appointment scheduling data (for tasks like vet visits)
  requiresScheduling?: boolean; // If true, task requires appointment scheduling
  appointment?: {
    date?: string; // ISO date string for scheduled appointment
    time?: string; // Time of appointment (e.g., "2:30 PM")
    vetContactId?: string; // Reference to vet contact in CRM
    vetName?: string; // Vet name (denormalized for display)
    vetClinic?: string; // Clinic name
    vetPhone?: string; // Vet phone number
    confirmationNumber?: string; // Appointment confirmation number
  };
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  skipped: number;
  completionRate: number;
}
