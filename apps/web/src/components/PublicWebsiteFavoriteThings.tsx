import { useEffect, useState } from 'react';
import { WebsiteSettings, FavoriteThing } from '@breeder/types';
import { useFavoriteThingsStore } from '@breeder/firebase';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { getFontFamily, getThemeColors } from '@/lib/websiteTheme';
import { Loader2, ExternalLink, Heart } from 'lucide-react';

interface PublicWebsiteFavoriteThingsProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteFavoriteThings({
  settings,
}: PublicWebsiteFavoriteThingsProps) {
  const { primary, secondary, accent } = getThemeColors(settings);
  const { getPublicItems } = useFavoriteThingsStore();
  const [items, setItems] = useState<FavoriteThing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const result = await getPublicItems(settings.userId);
        setItems(result);
      } catch (error) {
        console.error('Error loading favorite things:', error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [settings.userId, getPublicItems]);

  // Group by category
  const grouped = items.reduce<Record<string, FavoriteThing[]>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

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
              Our Favorite Things
            </h1>
            <p className='text-lg opacity-90'>
              Products and supplies we love and recommend
            </p>
          </div>
        </section>

        {/* Items */}
        <section className='py-12 px-4'>
          <div className='max-w-6xl mx-auto'>
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2
                  className='h-8 w-8 animate-spin'
                  style={{ color: primary }}
                />
              </div>
            ) : items.length === 0 ? (
              <div className='text-center py-16'>
                <p className='text-lg text-stone-500'>
                  No recommendations yet. Check back soon!
                </p>
              </div>
            ) : (
              <div className='space-y-12'>
                {Object.entries(grouped).map(([category, categoryItems]) => (
                  <div key={category}>
                    <div className='flex items-center gap-3 mb-6'>
                      <Heart
                        className='h-5 w-5'
                        style={{ color: accent }}
                      />
                      <h2
                        className='text-2xl font-bold'
                        style={{
                          color: primary,
                          fontFamily: getFontFamily(
                            settings.theme.fontFamily,
                          ),
                        }}
                      >
                        {category}
                      </h2>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className='rounded-2xl overflow-hidden border border-stone-200 hover:shadow-lg transition-shadow'
                        >
                          {item.image ? (
                            <div className='h-48 overflow-hidden'>
                              <img
                                src={item.image}
                                alt={item.name}
                                className='w-full h-full object-cover'
                              />
                            </div>
                          ) : (
                            <div
                              className='h-48 flex items-center justify-center'
                              style={{ backgroundColor: secondary }}
                            >
                              <Heart
                                className='h-12 w-12 opacity-20'
                                style={{ color: primary }}
                              />
                            </div>
                          )}
                          <div className='p-5'>
                            <h3
                              className='text-lg font-semibold mb-2'
                              style={{ color: primary }}
                            >
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className='text-sm text-stone-600 mb-4 line-clamp-3'>
                                {item.description}
                              </p>
                            )}
                            {item.link && (
                              <a
                                href={item.link}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition hover:opacity-90'
                                style={{ backgroundColor: accent }}
                              >
                                Shop Now
                                <ExternalLink className='h-3.5 w-3.5' />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
