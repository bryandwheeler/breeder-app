import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ForumCategory } from '@breeder/types';
import {
  MessageCircle,
  Heart,
  GraduationCap,
  Baby,
  Briefcase,
  Utensils,
  Megaphone,
  Dog,
  LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  MessageCircle,
  Heart,
  GraduationCap,
  Baby,
  Briefcase,
  Utensils,
  Megaphone,
  Dog,
};

interface CategoryCardProps {
  category: ForumCategory;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const IconComponent = iconMap[category.icon || 'MessageCircle'] || MessageCircle;

  return (
    <Link to={`/forum/category/${category.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">{category.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {category.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="font-normal">
                  {category.threadCount} {category.threadCount === 1 ? 'thread' : 'threads'}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
                </Badge>
              </div>
              {category.lastActivityAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last activity{' '}
                  {formatDistanceToNow(new Date(category.lastActivityAt), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
