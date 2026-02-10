import { WebsiteSettings } from '@breeder/types';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Award, Shield } from 'lucide-react';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { PublicWebsiteSEO } from '@/components/PublicWebsiteSEO';
import { getFontFamily, getThemeColors } from '@/lib/websiteTheme';

interface PublicWebsiteHomeProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteHome({ settings }: PublicWebsiteHomeProps) {
  const { primary, secondary, accent } = getThemeColors(settings);
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
          className='py-20 px-4 text-center text-white'
          style={{
            backgroundColor: primary,
            backgroundImage: settings.mainImageUrl
              ? `linear-gradient(${primary}${Math.round((settings.heroOverlayOpacity ?? 85) * 2.55).toString(16).padStart(2, '0')}, ${primary}${Math.round((settings.heroOverlayOpacity ?? 85) * 2.55).toString(16).padStart(2, '0')}), url('${settings.mainImageUrl}')`
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
            <Link
              to='?page=puppies'
              className='inline-flex items-center px-8 py-3 rounded-full text-white font-semibold transition hover:opacity-90'
              style={{ backgroundColor: accent }}
            >
              View Available Puppies <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </div>
        </section>

        {/* Featured Puppies */}
        {featuredPuppies.length > 0 && (
          <section className='py-16 px-4' style={{ backgroundColor: '#faf8f5' }}>
            <div className='max-w-6xl mx-auto'>
              <h2
                className='text-3xl font-bold text-center mb-12'
                style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
              >
                Featured Puppies
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {featuredPuppies.map((puppy) => (
                  <Card
                    key={puppy.id}
                    className='overflow-hidden hover:shadow-lg transition border-stone-200 rounded-2xl'
                  >
                    <div
                      className='h-48 bg-gradient-to-br flex items-center justify-center text-white'
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
                        <span className='text-6xl'>🐾</span>
                      )}
                    </div>
                    <div className='p-4'>
                      <h3 className='font-semibold text-lg mb-1' style={{ color: primary }}>
                        {puppy.name}
                      </h3>
                      <p className='text-sm text-stone-500 mb-3'>
                        {puppy.breed}
                      </p>
                      <div className='flex justify-between items-center'>
                        <span className='text-lg font-bold' style={{ color: accent }}>
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
                <Link
                  to='?page=puppies'
                  className='inline-flex items-center px-6 py-3 rounded-full border-2 font-semibold transition'
                  style={{ borderColor: primary, color: primary }}
                >
                  View All Puppies
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
                className='text-3xl font-bold mb-6'
                style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
              >
                About Us
              </h2>
              <p className='text-lg text-stone-500 mb-6 line-clamp-3'>
                {settings.about}
              </p>
              <Link
                to='?page=about'
                className='inline-flex items-center px-6 py-3 rounded-full border-2 font-semibold transition'
                style={{ borderColor: primary, color: primary }}
              >
                Learn More <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        <section className='py-16 px-4' style={{ backgroundColor: '#f5f0eb' }}>
          <div className='max-w-6xl mx-auto'>
            <h2
              className='text-3xl font-bold text-center mb-12'
              style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
            >
              Why Choose Us
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='text-center bg-white rounded-2xl p-8 shadow-sm'>
                <div
                  className='w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4'
                  style={{ backgroundColor: accent + '20' }}
                >
                  <Award className='h-7 w-7' style={{ color: accent }} />
                </div>
                <h3 className='font-semibold text-lg mb-2' style={{ color: primary }}>
                  Quality Breeding
                </h3>
                <p className='text-stone-500'>
                  Committed to breeding healthy, well-socialized puppies
                </p>
              </div>

              <div className='text-center bg-white rounded-2xl p-8 shadow-sm'>
                <div
                  className='w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4'
                  style={{ backgroundColor: accent + '20' }}
                >
                  <Shield className='h-7 w-7' style={{ color: accent }} />
                </div>
                <h3 className='font-semibold text-lg mb-2' style={{ color: primary }}>
                  Health Guaranteed
                </h3>
                <p className='text-stone-500'>
                  All puppies come with health guarantees and certifications
                </p>
              </div>

              <div className='text-center bg-white rounded-2xl p-8 shadow-sm'>
                <div
                  className='w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4'
                  style={{ backgroundColor: accent + '20' }}
                >
                  <Heart className='h-7 w-7' style={{ color: accent }} />
                </div>
                <h3 className='font-semibold text-lg mb-2' style={{ color: primary }}>
                  Lifetime Support
                </h3>
                <p className='text-stone-500'>
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
