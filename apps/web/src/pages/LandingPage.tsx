import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dog,
  Heart,
  Globe,
  Users,
  FileText,
  Mail,
  Calendar,
  MessageSquare,
  GitBranch,
  ChevronRight,
} from 'lucide-react';

const features = [
  {
    icon: Dog,
    title: 'Dog & Puppy Management',
    description:
      'Track your dogs, puppies, litters, and pedigrees all in one place. Manage profiles, photos, and lineage records effortlessly.',
  },
  {
    icon: Heart,
    title: 'Health Records',
    description:
      'Maintain comprehensive health records, vaccinations, vet visits, and genetic testing results for every animal.',
  },
  {
    icon: Globe,
    title: 'Website Builder',
    description:
      'Create a professional public website for your kennel in minutes. Showcase available puppies and your breeding program.',
  },
  {
    icon: Users,
    title: 'Customer & Waitlist CRM',
    description:
      'Manage inquiries, waitlists, and customer relationships. Keep track of every interaction from first contact to placement.',
  },
  {
    icon: FileText,
    title: 'Contracts & E-Signatures',
    description:
      'Generate puppy contracts and collect legally binding electronic signatures — no printing or scanning required.',
  },
  {
    icon: Mail,
    title: 'Email & Marketing',
    description:
      'Send newsletters, manage subscriber lists, and build automated email sequences to stay connected with your community.',
  },
];

const secondaryFeatures = [
  {
    icon: GitBranch,
    title: 'Breeding Planner',
    description:
      'Plan future breedings, forecast litters, and track heat cycles with intelligent scheduling tools.',
  },
  {
    icon: Calendar,
    title: 'Booking & Scheduling',
    description:
      'Let clients book visits and appointments online. Manage your calendar and send automatic confirmations.',
  },
  {
    icon: MessageSquare,
    title: 'Breeder Community',
    description:
      'Connect with fellow breeders, share knowledge, and participate in community forums and discussions.',
  },
];

export function LandingPage() {
  return (
    <div className='min-h-screen flex flex-col'>
      {/* Navigation */}
      <nav className='sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-breeder-gray'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16'>
          <img
            src='/expert-breeder-logo.webp'
            alt='Expert Breeder'
            className='h-10 w-auto'
          />
          <div className='flex items-center gap-3'>
            <Link to='/login'>
              <Button variant='ghost'>Log In</Button>
            </Link>
            <Link to='/signup'>
              <Button className='bg-breeder-orange hover:bg-breeder-orange/90 text-white'>
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='bg-breeder-navy text-white py-20 sm:py-28 px-4 text-center'>
          <div className='max-w-4xl mx-auto'>
            <img
              src='/expert-breeder-logo.webp'
              alt='Expert Breeder'
              className='h-20 sm:h-24 w-auto mx-auto mb-8 brightness-0 invert'
            />
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold mb-6'>
              The All-in-One Platform for Professional Breeders
            </h1>
            <p className='text-lg sm:text-xl opacity-90 mb-10 max-w-2xl mx-auto'>
              Manage your entire breeding program from a single dashboard — dogs, health records,
              customers, contracts, websites, and more.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link to='/signup'>
                <Button
                  size='lg'
                  className='bg-breeder-orange hover:bg-breeder-orange/90 text-white text-lg px-8 py-6'
                >
                  Get Started Free
                  <ChevronRight className='ml-2 h-5 w-5' />
                </Button>
              </Link>
              <a href='#features'>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6'
                >
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Primary Features */}
        <section id='features' className='bg-breeder-powder-blue py-16 sm:py-20 px-4'>
          <div className='max-w-6xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-bold text-center mb-4 text-breeder-navy'>
              Everything You Need to Run Your Breeding Program
            </h2>
            <p className='text-center text-breeder-charcoal mb-12 max-w-2xl mx-auto'>
              From record keeping to customer management, Expert Breeder gives you the tools to
              run a professional, organized breeding operation.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className='bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow'
                >
                  <feature.icon className='h-12 w-12 text-breeder-blue mb-4' />
                  <h3 className='text-lg font-semibold text-breeder-navy mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-breeder-charcoal text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Secondary Features */}
        <section className='bg-white py-16 sm:py-20 px-4'>
          <div className='max-w-6xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-bold text-center mb-12 text-breeder-navy'>
              And So Much More
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {secondaryFeatures.map((feature) => (
                <div key={feature.title} className='text-center'>
                  <div className='inline-flex items-center justify-center h-16 w-16 rounded-full bg-breeder-powder-blue mb-4'>
                    <feature.icon className='h-8 w-8 text-breeder-navy' />
                  </div>
                  <h3 className='text-lg font-semibold text-breeder-navy mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-breeder-charcoal text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className='bg-breeder-navy text-white py-16 sm:py-20 px-4 text-center'>
          <div className='max-w-3xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4'>
              Ready to Streamline Your Breeding Program?
            </h2>
            <p className='text-lg opacity-90 mb-8'>
              Join Expert Breeder today — it's free to get started.
            </p>
            <Link to='/signup'>
              <Button
                size='lg'
                className='bg-breeder-orange hover:bg-breeder-orange/90 text-white text-lg px-8 py-6'
              >
                Create Your Free Account
                <ChevronRight className='ml-2 h-5 w-5' />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='bg-breeder-navy text-white border-t border-white/10 py-8 px-4'>
        <div className='max-w-6xl mx-auto text-center text-sm'>
          <p className='opacity-75'>
            &copy; {new Date().getFullYear()} Expert Breeder. All rights reserved.
          </p>
          <p className='mt-2 text-xs opacity-60'>
            <Link to='/privacy' className='hover:underline'>
              Privacy Policy
            </Link>
            {' · '}
            <Link to='/terms' className='hover:underline'>
              Terms of Service
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
