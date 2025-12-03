// Public breeder homepage
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBreederStore } from '@/store/breederStore';
import { useDogStore } from '@/store/dogStoreFirebase';
import { BreederProfile, Dog, Litter, Testimonial } from '@/types/dog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Star,
  Heart,
  Award,
  Shield,
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export function PublicHome() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<BreederProfile | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [litters, setLitters] = useState<Litter[]>([]);
  const [loading, setLoading] = useState(true);
  const getPublicProfile = useBreederStore((state) => state.getPublicProfile);
  const getPublicTestimonials = useBreederStore(
    (state) => state.getPublicTestimonials
  );

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load breeder profile
        const profileData = await getPublicProfile(userId);
        setProfile(profileData);

        // Load testimonials
        const testimonialData = await getPublicTestimonials(userId);
        setTestimonials(testimonialData.filter((t) => t.featured).slice(0, 3));

        // Load dogs
        const dogsQuery = query(
          collection(db, 'dogs'),
          where('userId', '==', userId),
          where('isDeceased', '!=', true)
        );
        const dogsSnapshot = await getDocs(dogsQuery);
        const dogsData = dogsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Dog[];
        setDogs(dogsData);

        // Load litters
        const littersQuery = query(
          collection(db, 'litters'),
          where('userId', '==', userId)
        );
        const littersSnapshot = await getDocs(littersQuery);
        const littersData = littersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Litter[];
        setLitters(littersData);
      } catch (error) {
        console.error('Error loading public page:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, getPublicProfile, getPublicTestimonials]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-lg'>Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Breeder Not Found</h1>
          <p className='text-muted-foreground'>
            This breeder profile does not exist.
          </p>
        </div>
      </div>
    );
  }

  const availableLitters = litters.filter(
    (l) => l.status === 'born' || l.status === 'ready' || l.status === 'weaning'
  );

  return (
    <div className='min-h-screen bg-background'>
      {/* Hero Section */}
      <div className='relative'>
        {profile.coverPhoto && (
          <div
            className='h-96 bg-cover bg-center'
            style={{ backgroundImage: `url(${profile.coverPhoto})` }}
          >
            <div className='absolute inset-0 bg-black/40' />
          </div>
        )}
        {!profile.coverPhoto && (
          <div className='h-96 bg-gradient-to-br from-primary/20 to-secondary/20'>
            <div className='absolute inset-0 bg-black/10' />
          </div>
        )}

        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='text-center text-white px-4'>
            {profile.logo && (
              <img
                src={profile.logo}
                alt={profile.kennelName || profile.breederName}
                className='h-24 w-auto mx-auto mb-4 rounded-lg shadow-lg'
              />
            )}
            <h1 className='text-5xl font-bold mb-2'>
              {profile.kennelName || profile.breederName}
            </h1>
            {profile.tagline && (
              <p className='text-xl text-white/90'>{profile.tagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Column */}
          <div className='lg:col-span-2 space-y-12'>
            {/* About Section */}
            <section>
              <h2 className='text-3xl font-bold mb-6'>About Us</h2>
              <div className='prose prose-lg max-w-none'>
                <p className='text-lg leading-relaxed whitespace-pre-wrap'>
                  {profile.about}
                </p>
              </div>

              {profile.philosophy && (
                <div className='mt-8'>
                  <h3 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
                    <Heart className='h-6 w-6 text-primary' />
                    Our Philosophy
                  </h3>
                  <p className='text-muted-foreground leading-relaxed whitespace-pre-wrap'>
                    {profile.philosophy}
                  </p>
                </div>
              )}

              {profile.experience && (
                <div className='mt-8'>
                  <h3 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
                    <Award className='h-6 w-6 text-primary' />
                    Experience
                  </h3>
                  <p className='text-muted-foreground leading-relaxed whitespace-pre-wrap'>
                    {profile.experience}
                  </p>
                </div>
              )}
            </section>

            {/* Health Testing */}
            {profile.healthTestingDescription && (
              <section>
                <h2 className='text-3xl font-bold mb-6 flex items-center gap-2'>
                  <Shield className='h-8 w-8 text-primary' />
                  Health Testing Commitment
                </h2>
                <Card className='p-6'>
                  <p className='text-muted-foreground leading-relaxed whitespace-pre-wrap'>
                    {profile.healthTestingDescription}
                  </p>
                  {profile.healthGuarantee && (
                    <div className='mt-6 p-4 bg-primary/10 rounded-lg'>
                      <h4 className='font-semibold mb-2'>Health Guarantee</h4>
                      <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                        {profile.healthGuarantee}
                      </p>
                    </div>
                  )}
                </Card>
              </section>
            )}

            {/* Available Litters */}
            {availableLitters.length > 0 && (
              <section>
                <h2 className='text-3xl font-bold mb-6'>Available Puppies</h2>
                <div className='grid gap-6'>
                  {availableLitters.map((litter) => {
                    const dam = dogs.find((d) => d.id === litter.damId);
                    const sire = dogs.find((d) => d.id === litter.sireId);
                    const availablePuppies = litter.puppies.filter(
                      (p) => p.status === 'available'
                    );

                    return (
                      <Card key={litter.id} className='p-6'>
                        <div className='flex flex-col md:flex-row gap-6'>
                          <div className='flex-1'>
                            <h3 className='text-xl font-bold mb-2'>
                              {litter.litterName ||
                                `${dam?.name} x ${sire?.name}`}
                            </h3>
                            <p className='text-muted-foreground mb-4'>
                              Born: {litter.dateOfBirth} •{' '}
                              {availablePuppies.length}{' '}
                              {availablePuppies.length === 1
                                ? 'puppy'
                                : 'puppies'}{' '}
                              available
                            </p>
                            <div className='flex gap-4'>
                              <Link to={`/public/${userId}/${litter.id}`}>
                                <Button>View Litter</Button>
                              </Link>
                            </div>
                          </div>
                          {litter.puppies[0]?.photos[0] && (
                            <img
                              src={litter.puppies[0].photos[0]}
                              alt='Puppy'
                              className='w-full md:w-48 h-48 object-cover rounded-lg'
                            />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <section>
                <h2 className='text-3xl font-bold mb-6'>
                  What Our Families Say
                </h2>
                <div className='grid gap-6'>
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id} className='p-6'>
                      <div className='flex items-start gap-4'>
                        <div className='flex-1'>
                          {testimonial.rating && (
                            <div className='flex gap-1 mb-2'>
                              {Array.from({ length: testimonial.rating }).map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    className='h-5 w-5 fill-yellow-400 text-yellow-400'
                                  />
                                )
                              )}
                            </div>
                          )}
                          <p className='text-muted-foreground mb-4'>
                            {testimonial.comment}
                          </p>
                          <div className='text-sm font-semibold'>
                            {testimonial.customerName}
                            {testimonial.customerLocation &&
                              `, ${testimonial.customerLocation}`}
                          </div>
                          {testimonial.puppyName && (
                            <div className='text-sm text-muted-foreground'>
                              Puppy: {testimonial.puppyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Facility Photos */}
            {profile.facilityPhotos && profile.facilityPhotos.length > 0 && (
              <section>
                <h2 className='text-3xl font-bold mb-6'>Our Facility</h2>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                  {profile.facilityPhotos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Facility ${index + 1}`}
                      className='w-full h-48 object-cover rounded-lg'
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Contact Card */}
            <Card className='p-6'>
              <h3 className='text-xl font-bold mb-4'>Contact Information</h3>
              <div className='space-y-4'>
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className='flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors'
                  >
                    <Mail className='h-5 w-5' />
                    <span>{profile.email}</span>
                  </a>
                )}
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className='flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors'
                  >
                    <Phone className='h-5 w-5' />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile.city && profile.state && (
                  <div className='flex items-center gap-3 text-muted-foreground'>
                    <MapPin className='h-5 w-5' />
                    <span>
                      {profile.city}, {profile.state}
                    </span>
                  </div>
                )}
              </div>

              {profile.acceptingInquiries && (
                <Link to={`/contact/${userId}`} className='block mt-6'>
                  <Button className='w-full'>Send Inquiry</Button>
                </Link>
              )}
            </Card>

            {/* Social Media */}
            {(profile.facebook ||
              profile.instagram ||
              profile.twitter ||
              profile.youtube) && (
              <Card className='p-6'>
                <h3 className='text-xl font-bold mb-4'>Follow Us</h3>
                <div className='flex flex-wrap gap-3'>
                  {profile.facebook && (
                    <a
                      href={profile.facebook}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors'
                    >
                      <Facebook className='h-6 w-6 text-primary' />
                    </a>
                  )}
                  {profile.instagram && (
                    <a
                      href={profile.instagram}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors'
                    >
                      <Instagram className='h-6 w-6 text-primary' />
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={profile.twitter}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors'
                    >
                      <Twitter className='h-6 w-6 text-primary' />
                    </a>
                  )}
                  {profile.youtube && (
                    <a
                      href={profile.youtube}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors'
                    >
                      <Youtube className='h-6 w-6 text-primary' />
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Credentials */}
            {(profile.akc ||
              (profile.otherOrganizations &&
                profile.otherOrganizations.length > 0)) && (
              <Card className='p-6'>
                <h3 className='text-xl font-bold mb-4'>Credentials</h3>
                <div className='space-y-2 text-sm'>
                  {profile.akc && <div>• {profile.akc}</div>}
                  {profile.otherOrganizations?.map((org, index) => (
                    <div key={index}>• {org}</div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
