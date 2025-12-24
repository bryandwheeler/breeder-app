import { WebsiteSettings } from '@breeder/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ChevronLeft, Heart } from 'lucide-react';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { PublicWebsiteSEO } from '@/components/PublicWebsiteSEO';
import { getFontFamily } from '@/lib/websiteTheme';
import { useState } from 'react';

interface PublicWebsitePuppiesProps {
  settings: WebsiteSettings;
}

export function PublicWebsitePuppies({ settings }: PublicWebsitePuppiesProps) {
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
        <section
          className='py-12 px-4 text-white bg-breeder-navy'
        >
          <div className='max-w-6xl mx-auto'>
            <Link to='?page=home' className='inline-block mb-4'>
              <Button variant='ghost' className='text-white hover:bg-white/20'>
                <ChevronLeft className='h-4 w-4 mr-2' />
                Back
              </Button>
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
        <section className='py-16 px-4 bg-breeder-powder-blue'>
          <div className='max-w-6xl mx-auto'>
            {availablePuppies.length === 0 ? (
              <div className='text-center py-12'>
                <p className='text-lg text-breeder-charcoal mb-4'>
                  No puppies currently available
                </p>
                <Link to='?page=contact'>
                  <Button className='bg-breeder-orange hover:bg-breeder-orange/90 text-white'>Contact Us for More Information</Button>
                </Link>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {availablePuppies.map((puppy) => (
                  <Card
                    key={puppy.id}
                    className='overflow-hidden hover:shadow-lg transition border-breeder-gray bg-white'
                  >
                    {/* Image Placeholder */}
                    <div
                      className='h-64 bg-gradient-to-br flex items-center justify-center text-white relative group'
                      style={{
                        backgroundImage: `linear-gradient(135deg, #4DB3E6, #A9DBF4)`,
                      }}
                    >
                      <span className='text-7xl'>🐾</span>
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
                            className='text-xl font-bold text-breeder-navy'
                            style={{
                              fontFamily: getFontFamily(
                                settings.theme.fontFamily
                              ),
                            }}
                          >
                            {puppy.name}
                          </h3>
                          <p className='text-sm text-breeder-charcoal'>
                            {puppy.breed}
                          </p>
                        </div>
                        {puppy.featured && (
                          <Badge
                            variant='default'
                            className='bg-breeder-orange text-white'
                          >
                            Featured
                          </Badge>
                        )}
                      </div>

                      <div className='space-y-2 mb-4'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-breeder-charcoal'>Gender</span>
                          <span className='font-medium capitalize text-breeder-navy'>
                            {puppy.gender}
                          </span>
                        </div>
                        {puppy.dateOfBirth && (
                          <div className='flex justify-between text-sm'>
                            <span className='text-breeder-charcoal'>
                              Date of Birth
                            </span>
                            <span className='font-medium text-breeder-navy'>
                              {new Date(puppy.dateOfBirth).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {puppy.description && (
                        <p className='text-sm text-breeder-charcoal mb-4'>
                          {puppy.description}
                        </p>
                      )}

                      <div className='border-t border-breeder-gray pt-4 flex justify-between items-center'>
                        <div>
                          <p className='text-xs text-breeder-charcoal'>Price</p>
                          <p className='text-2xl font-bold text-breeder-orange'>
                            ${puppy.price.toFixed(2)}
                          </p>
                        </div>
                        <Link to='?page=contact'>
                          <Button size='sm' className='bg-breeder-blue hover:bg-breeder-blue/90 text-white'>Inquire</Button>
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

