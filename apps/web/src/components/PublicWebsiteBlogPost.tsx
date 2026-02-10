import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WebsiteSettings, BlogPost } from '@breeder/types';
import { useBlogStore } from '@breeder/firebase';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { getFontFamily, getThemeColors } from '@/lib/websiteTheme';
import { Loader2, ArrowLeft, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface PublicWebsiteBlogPostProps {
  settings: WebsiteSettings;
  slug: string;
}

export function PublicWebsiteBlogPost({
  settings,
  slug,
}: PublicWebsiteBlogPostProps) {
  const { primary } = getThemeColors(settings);
  const { getPostBySlug } = useBlogStore();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        const result = await getPostBySlug(settings.userId, slug);
        setPost(result);
      } catch (error) {
        console.error('Error loading blog post:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [settings.userId, slug, getPostBySlug]);

  return (
    <div className='min-h-screen flex flex-col bg-white'>
      <PublicWebsiteHeader settings={settings} />

      <main className='flex-1'>
        {loading ? (
          <div className='flex items-center justify-center py-24'>
            <Loader2
              className='h-8 w-8 animate-spin'
              style={{ color: primary }}
            />
          </div>
        ) : !post ? (
          <div className='text-center py-24'>
            <p className='text-lg text-stone-500 mb-4'>Post not found</p>
            <Link
              to='?page=blog'
              className='inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition'
              style={{ color: primary }}
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Blog
            </Link>
          </div>
        ) : (
          <article>
            {/* Featured Image */}
            {post.featuredImage && (
              <div className='w-full max-h-96 overflow-hidden'>
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className='w-full h-full object-cover'
                />
              </div>
            )}

            {/* Post Content */}
            <div className='max-w-3xl mx-auto px-4 py-10'>
              <Link
                to='?page=blog'
                className='inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-80 transition'
                style={{ color: primary }}
              >
                <ArrowLeft className='h-4 w-4' />
                Back to Blog
              </Link>

              <h1
                className='text-3xl md:text-4xl font-bold mb-4'
                style={{
                  fontFamily: getFontFamily(settings.theme.fontFamily),
                  color: primary,
                }}
              >
                {post.title}
              </h1>

              <div className='flex flex-wrap items-center gap-4 text-sm text-stone-500 mb-8 pb-8 border-b border-stone-200'>
                {post.publishedAt && (
                  <span className='flex items-center gap-1.5'>
                    <Calendar className='h-4 w-4' />
                    {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                  </span>
                )}
                {post.tags.length > 0 && (
                  <span className='flex items-center gap-1.5'>
                    <Tag className='h-4 w-4' />
                    {post.tags.join(', ')}
                  </span>
                )}
              </div>

              <div
                className='prose prose-stone max-w-none prose-headings:font-bold prose-a:underline'
                style={
                  {
                    '--tw-prose-links': primary,
                  } as React.CSSProperties
                }
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </article>
        )}
      </main>

      <PublicWebsiteFooter settings={settings} />
    </div>
  );
}
