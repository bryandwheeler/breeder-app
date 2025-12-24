export type TaskFrequency = 'once' | 'daily' | 'weekly';
export type TaskStatus = 'pending' | 'completed' | 'skipped';

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
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  skipped: number;
  completionRate: number;
}
