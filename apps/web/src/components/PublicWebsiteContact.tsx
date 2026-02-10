import { WebsiteSettings } from '@breeder/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, MapPin, Clock, ExternalLink } from 'lucide-react';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { PublicWebsiteSEO } from '@/components/PublicWebsiteSEO';
import { getFontFamily, getThemeColors } from '@/lib/websiteTheme';
import { useState } from 'react';

interface PublicWebsiteContactProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteContact({ settings }: PublicWebsiteContactProps) {
  const { primary, accent } = getThemeColors(settings);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send this data to the breeder
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <PublicWebsiteSEO settings={settings} page='contact' />
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
              Contact Us
            </h1>
            <p className='text-lg opacity-90 mt-2'>
              We'd love to hear from you. Get in touch today!
            </p>
          </div>
        </section>

        {/* Content */}
        <section className='py-16 px-4 bg-white'>
          <div className='max-w-4xl mx-auto'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
              {/* Contact Form */}
              <div>
                <h2
                  className='text-2xl font-bold mb-6'
                  style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
                >
                  Send us a Message
                </h2>

                {submitted ? (
                  <Card className='p-6 bg-green-50 border-green-200 text-center'>
                    <p className='text-green-800 font-medium'>
                      Thank you for your message! We'll get back to you soon.
                    </p>
                  </Card>
                ) : (
                  <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                      <Label htmlFor='name'>Name *</Label>
                      <Input
                        id='name'
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder='Your name'
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor='email'>Email *</Label>
                      <Input
                        id='email'
                        type='email'
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder='your@email.com'
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor='phone'>Phone</Label>
                      <Input
                        id='phone'
                        type='tel'
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder='(555) 123-4567'
                      />
                    </div>

                    <div>
                      <Label htmlFor='subject'>Subject</Label>
                      <Input
                        id='subject'
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        placeholder='What is this about?'
                      />
                    </div>

                    <div>
                      <Label htmlFor='message'>Message *</Label>
                      <Textarea
                        id='message'
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder='Tell us more...'
                        rows={5}
                        required
                      />
                    </div>

                    <button
                      type='submit'
                      className='w-full py-3 rounded-full text-white font-semibold transition hover:opacity-90'
                      style={{ backgroundColor: accent }}
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <h2
                  className='text-2xl font-bold mb-6'
                  style={{ color: primary, fontFamily: getFontFamily(settings.theme.fontFamily) }}
                >
                  Contact Information
                </h2>

                <div className='space-y-6'>
                  {settings.email && (
                    <Card className='p-4 border-stone-200 rounded-2xl'>
                      <div className='flex items-start gap-4'>
                        <div
                          className='w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0'
                          style={{ backgroundColor: accent + '20' }}
                        >
                          <Mail className='h-5 w-5' style={{ color: accent }} />
                        </div>
                        <div>
                          <p className='font-semibold mb-1' style={{ color: primary }}>Email</p>
                          <a
                            href={`mailto:${settings.email}`}
                            className='hover:underline'
                            style={{ color: accent }}
                          >
                            {settings.email}
                          </a>
                        </div>
                      </div>
                    </Card>
                  )}

                  {settings.phone && (
                    <Card className='p-4 border-stone-200 rounded-2xl'>
                      <div className='flex items-start gap-4'>
                        <div
                          className='w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0'
                          style={{ backgroundColor: accent + '20' }}
                        >
                          <Phone className='h-5 w-5' style={{ color: accent }} />
                        </div>
                        <div>
                          <p className='font-semibold mb-1' style={{ color: primary }}>Phone</p>
                          <a
                            href={`tel:${settings.phone}`}
                            className='hover:underline'
                            style={{ color: accent }}
                          >
                            {settings.phone}
                          </a>
                        </div>
                      </div>
                    </Card>
                  )}

                  {(settings.city || settings.state) && (
                    <Card className='p-4 border-stone-200 rounded-2xl'>
                      <div className='flex items-start gap-4'>
                        <div
                          className='w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0'
                          style={{ backgroundColor: accent + '20' }}
                        >
                          <MapPin className='h-5 w-5' style={{ color: accent }} />
                        </div>
                        <div>
                          <p className='font-semibold mb-1' style={{ color: primary }}>Location</p>
                          <p className='text-stone-600'>
                            {[settings.city, settings.state, settings.zipCode]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Hours of Operation */}
                  {settings.hoursEnabled && settings.hours && (
                    <Card className='p-4 border-stone-200 rounded-2xl'>
                      <div className='flex items-start gap-4'>
                        <div
                          className='w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0'
                          style={{ backgroundColor: accent + '20' }}
                        >
                          <Clock className='h-5 w-5' style={{ color: accent }} />
                        </div>
                        <div className='flex-1'>
                          <p className='font-semibold mb-2' style={{ color: primary }}>Hours</p>
                          <div className='space-y-1'>
                            {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => {
                              const d = settings.hours![day];
                              return (
                                <div key={day} className='flex justify-between text-sm'>
                                  <span className='text-stone-500 capitalize'>{day}</span>
                                  <span className='text-stone-600'>
                                    {d.enabled ? `${d.open} – ${d.close}` : 'Closed'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Business Listings */}
                  {(settings.googleBusinessUrl || settings.yelpUrl) && (
                    <Card className='p-4 border-stone-200 rounded-2xl'>
                      <p className='font-semibold mb-3' style={{ color: primary }}>Find Us On</p>
                      <div className='space-y-2'>
                        {settings.googleBusinessUrl && (
                          <a
                            href={settings.googleBusinessUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-2 text-sm hover:underline'
                            style={{ color: accent }}
                          >
                            <ExternalLink className='h-4 w-4' />
                            Google Business
                          </a>
                        )}
                        {settings.yelpUrl && (
                          <a
                            href={settings.yelpUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-2 text-sm hover:underline'
                            style={{ color: accent }}
                          >
                            <ExternalLink className='h-4 w-4' />
                            Yelp
                          </a>
                        )}
                      </div>
                    </Card>
                  )}

                  <Card className='p-4 border-stone-200 rounded-2xl' style={{ backgroundColor: '#faf8f5' }}>
                    <p className='font-semibold mb-3' style={{ color: primary }}>Response Time</p>
                    <p className='text-stone-600'>
                      We typically respond within 24 hours during business days.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicWebsiteFooter settings={settings} />
    </div>
  );
}
