import { WebsiteSettings } from '@breeder/types';
import { Link } from 'react-router-dom';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { PublicWebsiteSEO } from '@/components/PublicWebsiteSEO';
import { getFontFamily, getThemeColors } from '@/lib/websiteTheme';

interface PublicWebsiteAboutProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteAbout({ settings }: PublicWebsiteAboutProps) {
  const { primary, accent } = getThemeColors(settings);

  return (
    <div className='min-h-screen flex flex-col'>
      <PublicWebsiteSEO settings={settings} page='about' />
      <PublicWebsiteHeader settings={settings} />

      <main className='flex-1'>
        {/* Header */}
        <section className='py-12 px-4 text-white' style={{ backgroundColor: primary }}>
          <div className='max-w-4xl mx-auto'>
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
              About Us
            </h1>
          </div>
        </section>

        {/* Content */}
        <section className='py-16 px-4 bg-white'>
          <div className='max-w-4xl mx-auto space-y-8'>
            {/* Breeder Info */}
            <div>
              <h2
                className='text-2xl font-bold mb-4'
                style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
              >
                {settings.kennelName || 'Our Kennel'}
              </h2>
              <p className='text-stone-600 text-lg'>
                {settings.tagline}
              </p>
            </div>

            {/* About */}
            {settings.about && (
              <div>
                <h3
                  className='text-xl font-semibold mb-4'
                  style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
                >
                  Our Story
                </h3>
                <div className='prose prose-sm max-w-none'>
                  {settings.about.split('\n').map((paragraph, i) => (
                    <p key={i} className='text-stone-600 mb-4'>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Philosophy */}
            {settings.philosophy && (
              <div className='border-l-4 pl-6' style={{ borderColor: accent }}>
                <h3
                  className='text-xl font-semibold mb-4'
                  style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
                >
                  Our Philosophy
                </h3>
                <div className='prose prose-sm max-w-none'>
                  {settings.philosophy.split('\n').map((paragraph, i) => (
                    <p key={i} className='text-stone-600 mb-4'>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {settings.experience && (
              <div>
                <h3
                  className='text-xl font-semibold mb-4'
                  style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
                >
                  Our Experience
                </h3>
                <div className='prose prose-sm max-w-none'>
                  {settings.experience.split('\n').map((paragraph, i) => (
                    <p key={i} className='text-stone-600 mb-4'>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Breeds */}
            {settings.primaryBreed && (
              <div>
                <h3
                  className='text-xl font-semibold mb-4'
                  style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
                >
                  Our Breeds
                </h3>
                <div className='space-y-2'>
                  <p className='font-medium' style={{ color: primary }}>{settings.primaryBreed}</p>
                  {settings.otherBreeds && settings.otherBreeds.length > 0 && (
                    <ul className='list-disc list-inside text-stone-600'>
                      {settings.otherBreeds.map((breed, i) => (
                        <li key={i}>{breed}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className='flex gap-4 pt-8'>
              <Link
                to='?page=puppies'
                className='inline-flex items-center px-6 py-3 rounded-full text-white font-semibold transition hover:opacity-90'
                style={{ backgroundColor: accent }}
              >
                View Available Puppies
              </Link>
              <Link
                to='?page=contact'
                className='inline-flex items-center px-6 py-3 rounded-full border-2 font-semibold transition'
                style={{ borderColor: primary, color: primary }}
              >
                Get in Touch <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicWebsiteFooter settings={settings} />
    </div>
  );
}
