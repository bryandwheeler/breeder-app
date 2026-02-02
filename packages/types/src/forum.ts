// Forum Types for Breeder Community

export type ForumCategoryType =
  | 'general'
  | 'breed-specific'
  | 'health'
  | 'training'
  | 'nutrition'
  | 'business'
  | 'whelping'
  | 'puppy-care'
  | 'marketing'
  | 'announcements';

export type ThreadStatus = 'open' | 'closed' | 'pinned' | 'archived';
export type PostStatus = 'active' | 'edited' | 'deleted';

// Forum Category
export interface ForumCategory {
  id: string;
  name: string;
  slug: string; // URL-friendly name (e.g., "breed-specific")
  description: string;
  type: ForumCategoryType;
  icon?: string; // Lucide icon name
  color?: string; // Theme color for category
  sortOrder: number;
  threadCount: number;
  postCount: number;
  lastActivityAt?: string; // ISO timestamp
  lastThreadId?: string;
  lastThreadTitle?: string;
  lastPostAuthorId?: string;
  lastPostAuthorName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Forum Thread
export interface ForumThread {
  id: string;
  categoryId: string;
  categoryName?: string; // Cached for display
  categorySlug?: string; // Cached for URLs

  // Author Info
  authorId: string; // userId of breeder
  authorName: string; // Cached kennel/breeder name
  authorKennel?: string; // Kennel name
  authorProfilePhoto?: string;

  // Thread Content
  title: string;
  content: string; // First post content

  // Status & Moderation
  status: ThreadStatus;
  isPinned: boolean;
  isLocked: boolean; // No new replies allowed

  // Tags for filtering
  tags?: string[];
  breedTags?: string[]; // Specific breeds discussed

  // Attachments
  attachments?: ForumAttachment[];

  // Stats
  viewCount: number;
  replyCount: number;
  likeCount: number;

  // Last Activity
  lastReplyAt?: string;
  lastReplyAuthorId?: string;
  lastReplyAuthorName?: string;

  // Tracking
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
}

// Forum Post (Reply)
export interface ForumPost {
  id: string;
  threadId: string;
  categoryId: string;

  // Author Info
  authorId: string;
  authorName: string;
  authorKennel?: string;
  authorProfilePhoto?: string;

  // Content
  content: string;

  // Attachments
  attachments?: ForumAttachment[];

  // Reply Threading (for nested replies)
  parentPostId?: string; // If replying to another post
  replyDepth: number; // 0 = direct reply, 1+ = nested

  // Status
  status: PostStatus;

  // Engagement
  likeCount: number;
  likedBy?: string[]; // User IDs who liked this post

  // Tracking
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  deletedAt?: string;
  deletedBy?: string; // Who deleted (author or admin)
}

// Forum Attachment (for images)
export interface ForumAttachment {
  id: string;
  url: string;
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // bytes
  width?: number;
  height?: number;
  uploadedAt: string;
}

// User's Forum Profile (extends breeder profile)
export interface ForumUserProfile {
  userId: string;
  breederName: string;
  kennelName?: string;
  profilePhoto?: string;
  breed?: string; // Primary breed
  location?: string; // City, State
  memberSince: string; // When they joined the forum

  // Stats
  threadCount: number;
  postCount: number;
  likeCount: number; // Likes received

  // Settings
  emailNotifications?: boolean;

  lastActiveAt: string;
}

// Search/Filter options
export interface ForumFilter {
  categoryId?: string;
  authorId?: string;
  tags?: string[];
  breedTags?: string[];
  searchQuery?: string;
  status?: ThreadStatus;
  sortBy: 'recent' | 'popular' | 'replies' | 'views';
  dateRange?: {
    start: string;
    end: string;
  };
}

// Default categories to seed
export const DEFAULT_FORUM_CATEGORIES: Omit<ForumCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'General Discussion',
    slug: 'general',
    description: 'General breeder chat and introductions',
    type: 'general',
    icon: 'MessageCircle',
    sortOrder: 1,
    threadCount: 0,
    postCount: 0,
    isActive: true,
  },
  {
    name: 'Breed Specific',
    slug: 'breed-specific',
    description: 'Discussions about specific dog breeds',
    type: 'breed-specific',
    icon: 'Dog',
    sortOrder: 2,
    threadCount: 0,
    postCount: 0,
    isActive: true,
  },
  {
    name: 'Health & Genetics',
    slug: 'health',
    description: 'Health testing, genetic conditions, and veterinary topics',
    type: 'health',
    icon: 'Heart',
    sortOrder: 3,
    threadCount: 0,
    postCount: 0,
    isActive: true,
  },
  {
    name: 'Training & Behavior',
    slug: 'training',
    description: 'Puppy training, socialization, and behavior tips',
    type: 'training',
    icon: 'GraduationCap',
    sortOrder: 4,
    threadCount: 0,
    postCount: 0,
    isActive: true,
  },
  {
    name: 'Whelping & Puppy Care',
    slug: 'whelping',
    description: 'Birth, neonatal care, and early puppy development',
    type: 'whelping',
    icon: 'Baby',
    sortOrder: 5,
    threadCount: 0,
    postCount: 0,
    isActive: true,
  },
  {
    name: 'Business & Marketing',
    slug: 'business',
    description: 'Running a breeding program, websites, and social media',
    type: 'business',
    icon: 'Briefcase',
    sortOrder: 6,
    threadCount: 0,
    postCount: 0,
    isActive: true,
  },
  {
    name: 'Nutrition',
    slug: 'nutrition',
    description: 'Diet, feeding schedules, and supplements',
    type: 'nutrition',
    icon: 'Utensils',
    sortOrder: 7,
    threadCount: 0,
    postCount: 0,
    isActive: true,
  },
  {
    name: 'Announcements',
    slug: 'announcements',
    description: 'Important community announcements',
    type: 'announcements',
    icon: 'Megaphone',
    sortOrder: 0,
    threadCount: 0,
    postCount: 0,
    isActive: true,
  },
];
