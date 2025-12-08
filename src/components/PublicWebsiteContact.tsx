import { WebsiteSettings } from '@/types/website';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, MapPin } from 'lucide-react';
import { PublicWebsiteHeader } from '@/components/PublicWebsiteHeader';
import { PublicWebsiteFooter } from '@/components/PublicWebsiteFooter';
import { PublicWebsiteSEO } from '@/components/PublicWebsiteSEO';
import { getFontFamily } from '@/lib/websiteTheme';
import { useState } from 'react';

interface PublicWebsiteContactProps {
  settings: WebsiteSettings;
}

export function PublicWebsiteContact({ settings }: PublicWebsiteContactProps) {
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
                  className='text-2xl font-bold mb-6 text-breeder-navy'
                  style={{
                    fontFamily: getFontFamily(settings.theme.fontFamily),
                  }}
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

                    <Button type='submit' className='w-full bg-breeder-orange hover:bg-breeder-orange/90 text-white' size='lg'>
                      Send Message
                    </Button>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <h2
                  className='text-2xl font-bold mb-6 text-breeder-navy'
                  style={{
                    fontFamily: getFontFamily(settings.theme.fontFamily),
                  }}
                >
                  Contact Information
                </h2>

                <div className='space-y-6'>
                  {settings.email && (
                    <Card className='p-4 border-breeder-gray'>
                      <div className='flex items-start gap-4'>
                        <Mail
                          className='h-6 w-6 flex-shrink-0 mt-1 text-breeder-blue'
                        />
                        <div>
                          <p className='font-semibold mb-1 text-breeder-navy'>Email</p>
                          <a
                            href={`mailto:${settings.email}`}
                            className='text-breeder-orange hover:underline'
                          >
                            {settings.email}
                          </a>
                        </div>
                      </div>
                    </Card>
                  )}

                  {settings.phone && (
                    <Card className='p-4 border-breeder-gray'>
                      <div className='flex items-start gap-4'>
                        <Phone
                          className='h-6 w-6 flex-shrink-0 mt-1 text-breeder-blue'
                        />
                        <div>
                          <p className='font-semibold mb-1 text-breeder-navy'>Phone</p>
                          <a
                            href={`tel:${settings.phone}`}
                            className='text-breeder-orange hover:underline'
                          >
                            {settings.phone}
                          </a>
                        </div>
                      </div>
                    </Card>
                  )}

                  {(settings.city || settings.state) && (
                    <Card className='p-4 border-breeder-gray'>
                      <div className='flex items-start gap-4'>
                        <MapPin
                          className='h-6 w-6 flex-shrink-0 mt-1 text-breeder-blue'
                        />
                        <div>
                          <p className='font-semibold mb-1 text-breeder-navy'>Location</p>
                          <p className='text-breeder-charcoal'>
                            {[settings.city, settings.state, settings.zipCode]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Social Links - can be added later */}
                  <Card className='p-4 border-breeder-gray bg-breeder-powder-blue'>
                    <p className='font-semibold mb-3 text-breeder-navy'>Response Time</p>
                    <p className='text-breeder-charcoal'>
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

