import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WebsiteSettings, BlogPost } from '@breeder/types';
import { useBlogStore } from '@breeder/firebase';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { getFontFamily, getThemeColors } from '@/lib/websiteTheme';
import { Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PublicWebsiteBlogProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteBlog({ settings }: PublicWebsiteBlogProps) {
  const { primary, secondary } = getThemeColors(settings);
  const { getPublishedPosts } = useBlogStore();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const publishedPosts = await getPublishedPosts(settings.userId);
        setPosts(publishedPosts);
      } catch (error) {
        console.error('Error loading blog posts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, [settings.userId, getPublishedPosts]);

  return (
    <div className='min-h-screen flex flex-col bg-white'>
      <PublicWebsiteHeader settings={settings} />

      <main className='flex-1'>
        {/* Header */}
        <section
          className='py-16 px-4 text-center text-white'
          style={{ backgroundColor: primary }}
        >
          <div className='max-w-4xl mx-auto'>
            <h1
              className='text-4xl font-bold mb-3'
              style={{
                fontFamily: getFontFamily(settings.theme.fontFamily),
              }}
            >
              Blog
            </h1>
            <p className='text-lg opacity-90'>
              News, tips, and updates from{' '}
              {settings.kennelName || 'our kennel'}
            </p>
          </div>
        </section>

        {/* Posts Grid */}
        <section className='py-12 px-4'>
          <div className='max-w-6xl mx-auto'>
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2 className='h-8 w-8 animate-spin' style={{ color: primary }} />
              </div>
            ) : posts.length === 0 ? (
              <div className='text-center py-16'>
                <p className='text-lg text-stone-500'>
                  No blog posts yet. Check back soon!
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`?page=blog&post=${post.slug}`}
                    className='group block'
                  >
                    <article className='rounded-2xl overflow-hidden border border-stone-200 hover:shadow-lg transition-shadow'>
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
                        />
                      ) : (
                        <div
                          className='w-full h-48 flex items-center justify-center'
                          style={{ backgroundColor: secondary }}
                        >
                          <span
                            className='text-4xl font-bold opacity-20'
                            style={{ color: primary }}
                          >
                            {post.title.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className='p-5'>
                        <h2
                          className='text-lg font-semibold mb-2 group-hover:opacity-80 transition line-clamp-2'
                          style={{ color: primary }}
                        >
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className='text-sm text-stone-600 line-clamp-3 mb-3'>
                            {post.excerpt}
                          </p>
                        )}
                        <div className='flex items-center gap-3 text-xs text-stone-400'>
                          {post.publishedAt && (
                            <span className='flex items-center gap-1'>
                              <Calendar className='h-3 w-3' />
                              {format(
                                new Date(post.publishedAt),
                                'MMM d, yyyy',
                              )}
                            </span>
                          )}
                          {post.tags.length > 0 && (
                            <span>{post.tags.slice(0, 2).join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicWebsiteFooter settings={settings} />
    </div>
  );
}
