// Blog post types for breeder websites

export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  userId: string;
  title: string;
  slug: string;
  content: string; // HTML string
  excerpt: string;
  featuredImage?: string;
  tags: string[];
  status: BlogPostStatus;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
