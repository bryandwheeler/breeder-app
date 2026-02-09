import { WebsiteSettings } from '@breeder/types';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
} from 'lucide-react';

interface PublicWebsiteFooterProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteFooter({ settings }: PublicWebsiteFooterProps) {
  return (
    <footer
      className='text-white py-12 px-4 mt-16 bg-breeder-navy'
    >
      <div className='max-w-6xl mx-auto'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
          {/* About */}
          <div>
            <h3 className='font-bold text-lg mb-3'>
              {settings.kennelName || 'Breeder'}
            </h3>
            <p className='text-sm opacity-90 line-clamp-3'>
              {settings.tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='font-bold mb-3'>Quick Links</h3>
            <ul className='space-y-2 text-sm'>
              <li>
                <a
                  href='?page=home'
                  className='hover:underline opacity-90 hover:opacity-100'
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href='?page=about'
                  className='hover:underline opacity-90 hover:opacity-100'
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href='?page=puppies'
                  className='hover:underline opacity-90 hover:opacity-100'
                >
                  Available Puppies
                </a>
              </li>
              <li>
                <a
                  href='?page=contact'
                  className='hover:underline opacity-90 hover:opacity-100'
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className='font-bold mb-3'>Contact</h3>
            <ul className='space-y-2 text-sm'>
              {settings.email && (
                <li className='flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  <a
                    href={`mailto:${settings.email}`}
                    className='hover:underline'
                  >
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.phone && (
                <li className='flex items-center gap-2'>
                  <Phone className='h-4 w-4' />
                  <a href={`tel:${settings.phone}`} className='hover:underline'>
                    {settings.phone}
                  </a>
                </li>
              )}
              {(settings.city || settings.state) && (
                <li className='text-xs opacity-75'>
                  {[settings.city, settings.state, settings.zipCode]
                    .filter(Boolean)
                    .join(', ')}
                </li>
              )}
            </ul>
          </div>

          {/* Social Media */}
          {(settings.facebook ||
            settings.instagram ||
            settings.twitter ||
            settings.youtube) && (
            <div>
              <h3 className='font-bold mb-3'>Follow Us</h3>
              <div className='flex gap-4'>
                {settings.facebook && (
                  <a
                    href={settings.facebook}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:opacity-70 transition'
                  >
                    <Facebook className='h-5 w-5' />
                  </a>
                )}
                {settings.instagram && (
                  <a
                    href={settings.instagram}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:opacity-70 transition'
                  >
                    <Instagram className='h-5 w-5' />
                  </a>
                )}
                {settings.twitter && (
                  <a
                    href={settings.twitter}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:opacity-70 transition'
                  >
                    <Twitter className='h-5 w-5' />
                  </a>
                )}
                {settings.youtube && (
                  <a
                    href={settings.youtube}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:opacity-70 transition'
                  >
                    <Youtube className='h-5 w-5' />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div
          className='border-t pt-6 text-center text-sm opacity-75'
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <p>
            © {new Date().getFullYear()} {settings.kennelName || 'Breeder'}. All
            rights reserved.
          </p>
          <p className='mt-2 text-xs'>
            Powered by Expert Breeder Management
            {' · '}
            <a href='/privacy' className='hover:underline'>Privacy Policy</a>
            {' · '}
            <a href='/terms' className='hover:underline'>Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
