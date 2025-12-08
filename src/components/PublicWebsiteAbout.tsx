import { WebsiteSettings } from '@/types/website';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { PublicWebsiteSEO } from '@/components/PublicWebsiteSEO';
import { getFontFamily } from '@/lib/websiteTheme';

interface PublicWebsiteAboutProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteAbout({ settings }: PublicWebsiteAboutProps) {
  return (
    <div className='min-h-screen flex flex-col'>
      <PublicWebsiteSEO settings={settings} page='about' />
      <PublicWebsiteHeader settings={settings} />

      <main className='flex-1'>
        {/* Header */}
        <section
          className='py-12 px-4 text-white bg-breeder-navy'
        >
          <div className='max-w-4xl mx-auto'>
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
                className='text-2xl font-bold mb-4 text-breeder-navy'
                style={{ fontFamily: getFontFamily(settings.theme.fontFamily) }}
              >
                {settings.kennelName || 'Our Kennel'}
              </h2>
              <p className='text-breeder-charcoal text-lg'>
                {settings.tagline}
              </p>
            </div>

            {/* About */}
            {settings.about && (
              <div>
                <h3
                  className='text-xl font-semibold mb-4 text-breeder-navy'
                  style={{
                    fontFamily: getFontFamily(settings.theme.fontFamily),
                  }}
                >
                  Our Story
                </h3>
                <div className='prose prose-sm max-w-none'>
                  {settings.about.split('\n').map((paragraph, i) => (
                    <p key={i} className='text-breeder-charcoal mb-4'>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Philosophy */}
            {settings.philosophy && (
              <div
                className='border-l-4 pl-6 border-breeder-blue'
              >
                <h3
                  className='text-xl font-semibold mb-4 text-breeder-navy'
                  style={{
                    fontFamily: getFontFamily(settings.theme.fontFamily),
                  }}
                >
                  Our Philosophy
                </h3>
                <div className='prose prose-sm max-w-none'>
                  {settings.philosophy.split('\n').map((paragraph, i) => (
                    <p key={i} className='text-breeder-charcoal mb-4'>
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
                  className='text-xl font-semibold mb-4 text-breeder-navy'
                  style={{
                    fontFamily: getFontFamily(settings.theme.fontFamily),
                  }}
                >
                  Our Experience
                </h3>
                <div className='prose prose-sm max-w-none'>
                  {settings.experience.split('\n').map((paragraph, i) => (
                    <p key={i} className='text-breeder-charcoal mb-4'>
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
                  className='text-xl font-semibold mb-4 text-breeder-navy'
                  style={{
                    fontFamily: getFontFamily(settings.theme.fontFamily),
                  }}
                >
                  Our Breeds
                </h3>
                <div className='space-y-2'>
                  <p className='font-medium text-breeder-navy'>{settings.primaryBreed}</p>
                  {settings.otherBreeds && settings.otherBreeds.length > 0 && (
                    <ul className='list-disc list-inside text-breeder-charcoal'>
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
              <Link to='?page=puppies'>
                <Button size='lg' className='bg-breeder-orange hover:bg-breeder-orange/90 text-white'>View Available Puppies</Button>
              </Link>
              <Link to='?page=contact'>
                <Button variant='outline' size='lg' className='border-breeder-navy text-breeder-navy hover:bg-breeder-navy hover:text-white'>
                  Get in Touch
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicWebsiteFooter settings={settings} />
    </div>
  );
}

