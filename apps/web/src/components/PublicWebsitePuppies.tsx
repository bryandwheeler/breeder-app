import { WebsiteSettings } from '@breeder/types';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ChevronLeft, Heart } from 'lucide-react';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { PublicWebsiteSEO } from '@/components/PublicWebsiteSEO';
import { getFontFamily, getThemeColors } from '@/lib/websiteTheme';
import { useState } from 'react';

interface PublicWebsitePuppiesProps {
  settings: WebsiteSettings;
}

export function PublicWebsitePuppies({ settings }: PublicWebsitePuppiesProps) {
  const { primary, secondary, accent } = getThemeColors(settings);
  const [favorites, setFavorites] = useState<string[]>([]);

  const puppies = settings.puppyListings || [];
  const availablePuppies = puppies.filter((p) => p.available && !p.reserved);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <PublicWebsiteSEO settings={settings} page='puppies' />
      <PublicWebsiteHeader settings={settings} />

      <main className='flex-1'>
        {/* Header */}
        <section className='py-12 px-4 text-white' style={{ backgroundColor: primary }}>
          <div className='max-w-6xl mx-auto'>
            <Link
              to='?page=home'
              className='inline-flex items-center mb-4 text-white/80 hover:text-white transition text-sm'
            >
              <ChevronLeft className='h-4 w-4 mr-1' />
              Back
            </Link>
            <h1
              className='text-4xl font-bold'
              style={{ fontFamily: getFontFamily(settings.theme.fontFamily) }}
            >
              Available Puppies
            </h1>
            <p className='text-lg opacity-90 mt-2'>
              {availablePuppies.length} puppies available
            </p>
          </div>
        </section>

        {/* Puppies Grid */}
        <section className='py-16 px-4' style={{ backgroundColor: '#faf8f5' }}>
          <div className='max-w-6xl mx-auto'>
            {availablePuppies.length === 0 ? (
              <div className='text-center py-12'>
                <p className='text-lg text-stone-500 mb-4'>
                  No puppies currently available
                </p>
                <Link
                  to='?page=contact'
                  className='inline-flex items-center px-6 py-3 rounded-full text-white font-semibold transition hover:opacity-90'
                  style={{ backgroundColor: accent }}
                >
                  Contact Us for More Information
                </Link>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {availablePuppies.map((puppy) => (
                  <Card
                    key={puppy.id}
                    className='overflow-hidden hover:shadow-lg transition border-stone-200 bg-white rounded-2xl'
                  >
                    {/* Puppy Photo */}
                    <div
                      className='h-64 bg-gradient-to-br flex items-center justify-center text-white relative group'
                      style={puppy.photos && puppy.photos.length > 0 ? {} : {
                        backgroundImage: `linear-gradient(135deg, ${secondary}, ${secondary}88)`,
                      }}
                    >
                      {puppy.photos && puppy.photos.length > 0 ? (
                        <img
                          src={puppy.photos[0]}
                          alt={puppy.name}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <span className='text-7xl'>🐾</span>
                      )}
                      <button
                        onClick={() => toggleFavorite(puppy.id)}
                        className='absolute top-3 right-3 p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition'
                      >
                        <Heart
                          className='h-5 w-5'
                          style={{
                            color: favorites.includes(puppy.id)
                              ? '#ef4444'
                              : '#9ca3af',
                            fill: favorites.includes(puppy.id)
                              ? '#ef4444'
                              : 'none',
                          }}
                        />
                      </button>
                    </div>

                    {/* Puppy Info */}
                    <div className='p-6'>
                      <div className='flex justify-between items-start mb-3'>
                        <div>
                          <h3
                            className='text-xl font-bold'
                            style={{
                              color: primary,
                              fontFamily: getFontFamily(settings.theme.fontFamily),
                            }}
                          >
                            {puppy.name}
                          </h3>
                          <p className='text-sm text-stone-500'>
                            {puppy.breed}
                          </p>
                        </div>
                        {puppy.featured && (
                          <span
                            className='text-xs font-semibold px-2.5 py-1 rounded-full text-white'
                            style={{ backgroundColor: accent }}
                          >
                            Featured
                          </span>
                        )}
                      </div>

                      <div className='space-y-2 mb-4'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-stone-500'>Gender</span>
                          <span className='font-medium capitalize' style={{ color: primary }}>
                            {puppy.gender}
                          </span>
                        </div>
                        {puppy.dateOfBirth && (
                          <div className='flex justify-between text-sm'>
                            <span className='text-stone-500'>
                              Date of Birth
                            </span>
                            <span className='font-medium' style={{ color: primary }}>
                              {new Date(puppy.dateOfBirth).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {puppy.description && (
                        <p className='text-sm text-stone-500 mb-4'>
                          {puppy.description}
                        </p>
                      )}

                      <div className='border-t border-stone-200 pt-4 flex justify-between items-center'>
                        <div>
                          <p className='text-xs text-stone-400'>Price</p>
                          <p className='text-2xl font-bold' style={{ color: accent }}>
                            ${puppy.price.toFixed(2)}
                          </p>
                        </div>
                        <Link
                          to='?page=contact'
                          className='inline-flex items-center px-5 py-2 rounded-full text-white text-sm font-semibold transition hover:opacity-90'
                          style={{ backgroundColor: accent }}
                        >
                          Inquire
                        </Link>
                      </div>
                    </div>
                  </Card>
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
