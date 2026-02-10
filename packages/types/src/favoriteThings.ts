export interface FavoriteThing {
  id: string;
  userId: string;
  name: string;
  description: string;
  link: string;
  image?: string;
  category: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
