import { WebsiteSettings } from '@/types/website';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ChevronRight, Heart, Award, Shield } from 'lucide-react';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { PublicWebsiteSEO } from '@/components/PublicWebsiteSEO';
import { getFontFamily } from '@/lib/websiteTheme';

interface PublicWebsiteHomeProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteHome({ settings }: PublicWebsiteHomeProps) {
  const featuredPuppies = (settings.puppyListings || [])
    .filter((p) => p.featured)
    .slice(0, 3);

  return (
    <div className='min-h-screen flex flex-col'>
      <PublicWebsiteSEO settings={settings} page='home' />
      <PublicWebsiteHeader settings={settings} />

      <main className='flex-1'>
        {/* Hero Section */}
        <section
          className='py-20 px-4 text-center text-white bg-breeder-navy'
          style={{
            backgroundImage: settings.mainImageUrl
              ? `linear-gradient(rgba(11, 46, 78, 0.85), rgba(11, 46, 78, 0.85)), url('${settings.mainImageUrl}')`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='max-w-4xl mx-auto'>
            <h1
              className='text-5xl font-bold mb-4'
              style={{ fontFamily: getFontFamily(settings.theme.fontFamily) }}
            >
              {settings.kennelName || 'Welcome'}
            </h1>
            <p className='text-xl opacity-90 mb-8'>{settings.tagline}</p>
            <Link to={`?page=puppies`}>
              <Button
                size='lg'
                className='text-white bg-breeder-orange hover:bg-breeder-orange/90'
              >
                View Available Puppies <ChevronRight className='ml-2 h-4 w-4' />
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Puppies */}
        {featuredPuppies.length > 0 && (
          <section className='py-16 px-4 bg-breeder-powder-blue'>
            <div className='max-w-6xl mx-auto'>
              <h2
                className='text-3xl font-bold text-center mb-12 text-breeder-navy'
                style={{ fontFamily: getFontFamily(settings.theme.fontFamily) }}
              >
                Featured Puppies
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {featuredPuppies.map((puppy) => (
                  <Card
                    key={puppy.id}
                    className='overflow-hidden hover:shadow-lg transition border-breeder-gray'
                  >
                    <div
                      className='h-48 bg-gradient-to-br flex items-center justify-center text-white'
                      style={{
                        backgroundImage: `linear-gradient(135deg, #4DB3E6, #A9DBF4)`,
                      }}
                    >
                      <span className='text-6xl'>🐾</span>
                    </div>
                    <div className='p-4'>
                      <h3 className='font-semibold text-lg mb-1 text-breeder-navy'>
                        {puppy.name}
                      </h3>
                      <p className='text-sm text-breeder-charcoal mb-3'>
                        {puppy.breed}
                      </p>
                      <div className='flex justify-between items-center'>
                        <span className='text-lg font-bold text-breeder-orange'>
                          ${puppy.price.toFixed(2)}
                        </span>
                        <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                          Available
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className='text-center mt-8'>
                <Link to={`?page=puppies`}>
                  <Button variant='outline' size='lg' className='border-breeder-navy text-breeder-navy hover:bg-breeder-navy hover:text-white'>
                    View All Puppies
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* About Preview */}
        {settings.about && (
          <section className='py-16 px-4 bg-white'>
            <div className='max-w-4xl mx-auto'>
              <h2
                className='text-3xl font-bold mb-6 text-breeder-navy'
                style={{ fontFamily: getFontFamily(settings.theme.fontFamily) }}
              >
                About Us
              </h2>
              <p className='text-lg text-breeder-charcoal mb-6 line-clamp-3'>
                {settings.about}
              </p>
              <Link to={`?page=about`}>
                <Button variant='outline' className='border-breeder-navy text-breeder-navy hover:bg-breeder-navy hover:text-white'>
                  Learn More <ChevronRight className='ml-2 h-4 w-4' />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        <section className='py-16 px-4 bg-breeder-powder-blue'>
          <div className='max-w-6xl mx-auto'>
            <h2
              className='text-3xl font-bold text-center mb-12 text-breeder-navy'
              style={{ fontFamily: getFontFamily(settings.theme.fontFamily) }}
            >
              Why Choose Us
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='text-center'>
                <Award
                  className='h-12 w-12 mx-auto mb-4 text-breeder-blue'
                />
                <h3 className='font-semibold text-lg mb-2 text-breeder-navy'>Quality Breeding</h3>
                <p className='text-breeder-charcoal'>
                  Committed to breeding healthy, well-socialized puppies
                </p>
              </div>

              <div className='text-center'>
                <Shield
                  className='h-12 w-12 mx-auto mb-4 text-breeder-blue'
                />
                <h3 className='font-semibold text-lg mb-2 text-breeder-navy'>
                  Health Guaranteed
                </h3>
                <p className='text-breeder-charcoal'>
                  All puppies come with health guarantees and certifications
                </p>
              </div>

              <div className='text-center'>
                <Heart
                  className='h-12 w-12 mx-auto mb-4 text-breeder-blue'
                />
                <h3 className='font-semibold text-lg mb-2 text-breeder-navy'>Lifetime Support</h3>
                <p className='text-breeder-charcoal'>
                  We provide ongoing support and guidance to all our families
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicWebsiteFooter settings={settings} />
    </div>
  );
}

