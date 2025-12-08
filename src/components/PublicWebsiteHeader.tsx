import { WebsiteSettings } from '@/types/website';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { getFontFamilyClass, getLogoUrl, getBusinessName, getThemeColors } from '@/lib/websiteTheme';

interface PublicWebsiteHeaderProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteHeader({ settings }: PublicWebsiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { primary: primaryColor } = getThemeColors(settings);
  const headerStyle = settings.theme.headerStyle || 'full';
  const fontClass = getFontFamilyClass(settings.theme.fontFamily);
  const logoUrl = getLogoUrl(settings);

  const menuItems = settings.menuItems || [
    { label: 'Home', page: 'home' },
    { label: 'About Us', page: 'about' },
    { label: 'Available Puppies', page: 'puppies' },
    { label: 'Contact', page: 'contact' },
  ];

  if (headerStyle === 'minimal') {
    return (
      <header
        className={`py-4 px-4 border-b bg-breeder-white ${fontClass}`}
        style={{ borderColor: '#E6EAF0' }}
      >
        <div className='max-w-6xl mx-auto flex items-center justify-between'>
          <Link to='?page=home' className='flex items-center gap-3'>
            <img
              src={logoUrl}
              alt='Expert Breeder Logo'
              className='h-12 w-auto object-contain'
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {!settings.logoUrl && (
              <span className='font-bold text-lg text-breeder-navy'>
                {getBusinessName(settings)}
              </span>
            )}
          </Link>
          <nav className='hidden md:flex gap-6'>
            {menuItems.map((item) => (
              <Link
                key={item.page}
                to={`?page=${item.page}`}
                className='text-sm hover:text-breeder-orange transition text-breeder-navy'
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='md:hidden text-breeder-navy'
          >
            <Menu className='h-5 w-5' />
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className='md:hidden mt-4 flex flex-col gap-2'>
            {menuItems.map((item) => (
              <Link
                key={item.page}
                to={`?page=${item.page}`}
                className='text-sm py-2 hover:text-breeder-orange transition text-breeder-navy'
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    );
  }

  // Centered Header Style
  if (headerStyle === 'centered') {
    return (
      <header className={`py-6 px-4 border-b bg-white ${fontClass}`}>
        <div className='max-w-6xl mx-auto text-center'>
          <Link to='?page=home' className='inline-block mb-4'>
            <img
              src={logoUrl}
              alt='Expert Breeder Logo'
              className='h-20 w-auto mx-auto mb-2 object-contain'
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {!settings.logoUrl && (
              <span
                className='block font-bold text-xl'
                style={{ color: primaryColor }}
              >
                {getBusinessName(settings)}
              </span>
            )}
          </Link>
          <nav className='flex justify-center gap-6 flex-wrap'>
            {menuItems.map((item) => (
              <Link
                key={item.page}
                to={`?page=${item.page}`}
                className='text-sm hover:opacity-70 transition'
                style={{ color: primaryColor }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    );
  }

  // Split Header Style
  if (headerStyle === 'split') {
    return (
      <header
        className={`py-4 px-4 bg-white border-b ${fontClass}`}
        style={{ borderColor: primaryColor }}
      >
        <div className='max-w-6xl mx-auto flex items-center justify-between'>
          <Link to='?page=home' className='flex items-center gap-3'>
            <img
              src={logoUrl}
              alt='Expert Breeder Logo'
              className='h-12 w-auto object-contain'
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {!settings.logoUrl && (
              <span className='font-bold text-xl' style={{ color: primaryColor }}>
                {getBusinessName(settings)}
              </span>
            )}
          </Link>
          <nav className='hidden md:flex gap-8 items-center'>
            {menuItems.slice(0, 2).map((item) => (
              <Link
                key={item.page}
                to={`?page=${item.page}`}
                className='text-sm font-medium hover:opacity-70 transition'
                style={{ color: primaryColor }}
              >
                {item.label}
              </Link>
            ))}
            <div className='h-8 w-px bg-gray-300'></div>
            {menuItems.slice(2).map((item) => (
              <Link
                key={item.page}
                to={`?page=${item.page}`}
                className='text-sm font-medium hover:opacity-70 transition'
                style={{ color: primaryColor }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    );
  }

  // Overlay Header Style
  if (headerStyle === 'overlay') {
    return (
      <header className={`absolute top-0 left-0 right-0 z-50 ${fontClass}`}>
        <div className='bg-gradient-to-b from-black/50 to-transparent'>
          <div className='max-w-6xl mx-auto px-4 py-4 flex items-center justify-between'>
            <Link to='?page=home' className='flex items-center gap-3'>
              <img
                src={logoUrl}
                alt='Expert Breeder Logo'
                className='h-12 w-auto object-contain drop-shadow-lg'
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {!settings.logoUrl && (
                <span className='font-bold text-xl text-white drop-shadow-lg'>
                  {getBusinessName(settings)}
                </span>
              )}
            </Link>
            <nav className='hidden md:flex gap-6'>
              {menuItems.map((item) => (
                <Link
                  key={item.page}
                  to={`?page=${item.page}`}
                  className='text-sm font-medium text-white hover:opacity-70 transition drop-shadow'
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`text-white bg-breeder-navy ${fontClass}`}
    >
      {headerStyle === 'banner' && (
        <div className='bg-opacity-90 py-8 text-center'>
          <img
            src={logoUrl}
            alt='Expert Breeder Logo'
            className='h-20 w-auto mx-auto mb-4 object-contain'
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {!settings.logoUrl && (
            <>
              <h1 className='text-4xl font-bold mb-2'>
                {getBusinessName(settings)}
              </h1>
              <p className='text-lg opacity-90'>{settings.tagline}</p>
            </>
          )}
        </div>
      )}

      <nav className='py-4 px-4 border-t border-white/20'>
        <div className='max-w-6xl mx-auto flex items-center justify-between'>
          {headerStyle === 'full' && (
            <Link to='?page=home' className='flex items-center gap-3'>
              <img
                src={logoUrl}
                alt='Expert Breeder Logo'
                className='h-10 w-auto object-contain'
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {!settings.logoUrl && (
                <span className='font-bold text-lg'>
                  {getBusinessName(settings)}
                </span>
              )}
            </Link>
          )}

          <div className='hidden md:flex gap-6 ml-auto'>
            {menuItems.map((item) => (
              <Link
                key={item.page}
                to={`?page=${item.page}`}
                className='text-sm hover:text-breeder-orange transition'
              >
                {item.label}
              </Link>
            ))}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='md:hidden ml-auto'
          >
            <Menu className='h-5 w-5' />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className='md:hidden mt-4 flex flex-col gap-2 pb-4'>
            {menuItems.map((item) => (
              <Link
                key={item.page}
                to={`?page=${item.page}`}
                className='text-sm py-2 hover:text-breeder-orange transition'
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
