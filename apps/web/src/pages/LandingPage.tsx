import { Link } from 'react-router-dom';
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
  CheckCircle2,
  Shield,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Dog,
    title: 'Dog & Puppy Management',
    description:
      'Track your dogs, puppies, litters, and pedigrees all in one place. Manage profiles, photos, and lineage records effortlessly.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Heart,
    title: 'Health Records',
    description:
      'Maintain comprehensive health records, vaccinations, vet visits, and genetic testing results for every animal.',
    color: 'bg-red-100 text-red-600',
  },
  {
    icon: Globe,
    title: 'Website Builder',
    description:
      'Create a professional public website for your kennel in minutes. Showcase available puppies and your breeding program.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Users,
    title: 'Customer & Waitlist CRM',
    description:
      'Manage inquiries, waitlists, and customer relationships. Keep track of every interaction from first contact to placement.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: FileText,
    title: 'Contracts & E-Signatures',
    description:
      'Generate puppy contracts and collect legally binding electronic signatures — no printing or scanning required.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Mail,
    title: 'Email & Marketing',
    description:
      'Send newsletters, manage subscriber lists, and build automated email sequences to stay connected with your community.',
    color: 'bg-sky-100 text-sky-600',
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

const highlights = [
  'Free to get started',
  'No credit card required',
  'Set up in minutes',
];

export function LandingPage() {
  return (
    <div className='min-h-screen flex flex-col bg-white'>
      {/* Navigation */}
      <nav className='sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16'>
          <img
            src='/expert-breeder-logo.webp'
            alt='Expert Breeder'
            className='h-10 w-auto'
          />
          <div className='flex items-center gap-3'>
            <Link
              to='/login'
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-breeder-navy hover:text-breeder-orange transition-colors'
            >
              Log In
            </Link>
            <Link
              to='/signup'
              className='inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg bg-breeder-orange text-white hover:bg-breeder-orange/90 transition-colors shadow-sm'
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='relative overflow-hidden'>
          {/* Gradient background */}
          <div className='absolute inset-0 bg-gradient-to-br from-breeder-navy via-breeder-navy to-[#0d3a62]' />
          {/* Decorative circles */}
          <div className='absolute top-0 right-0 w-[600px] h-[600px] bg-breeder-blue/10 rounded-full -translate-y-1/2 translate-x-1/3' />
          <div className='absolute bottom-0 left-0 w-[400px] h-[400px] bg-breeder-orange/10 rounded-full translate-y-1/2 -translate-x-1/3' />

          <div className='relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-32 text-center'>
            <div className='inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8 border border-white/20'>
              <Zap className='h-4 w-4 text-breeder-orange' />
              <span className='text-white/90 text-sm font-medium'>The #1 platform for professional breeders</span>
            </div>

            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight'>
              Manage Your Entire Breeding{' '}
              <span className='text-breeder-orange'>Program</span>{' '}
              From One Dashboard
            </h1>

            <p className='text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed'>
              Dogs, health records, customers, contracts, websites, email marketing — everything you need to run a professional, organized kennel.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center mb-8'>
              <Link
                to='/signup'
                className='inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-breeder-orange text-white hover:bg-breeder-orange/90 transition-all shadow-lg shadow-breeder-orange/30 hover:shadow-xl hover:shadow-breeder-orange/40 hover:-translate-y-0.5'
              >
                Get Started Free
                <ChevronRight className='ml-2 h-5 w-5' />
              </Link>
              <a
                href='#features'
                className='inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all'
              >
                Learn More
              </a>
            </div>

            <div className='flex flex-wrap gap-6 justify-center'>
              {highlights.map((text) => (
                <div key={text} className='flex items-center gap-2 text-white/70 text-sm'>
                  <CheckCircle2 className='h-4 w-4 text-green-400' />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof bar */}
        <section className='bg-gray-50 border-b border-gray-100 py-6 px-4'>
          <div className='max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-center'>
            <div>
              <div className='text-2xl font-bold text-breeder-navy'>All-in-One</div>
              <div className='text-sm text-gray-500'>Breeding Platform</div>
            </div>
            <div className='hidden sm:block w-px h-10 bg-gray-200' />
            <div>
              <div className='text-2xl font-bold text-breeder-navy'>Unlimited</div>
              <div className='text-sm text-gray-500'>Dogs & Records</div>
            </div>
            <div className='hidden sm:block w-px h-10 bg-gray-200' />
            <div>
              <div className='text-2xl font-bold text-breeder-navy'>Free</div>
              <div className='text-sm text-gray-500'>To Get Started</div>
            </div>
            <div className='hidden sm:block w-px h-10 bg-gray-200' />
            <div>
              <div className='flex items-center justify-center gap-1'>
                <Shield className='h-5 w-5 text-green-500' />
                <span className='text-2xl font-bold text-breeder-navy'>Secure</span>
              </div>
              <div className='text-sm text-gray-500'>Cloud Storage</div>
            </div>
          </div>
        </section>

        {/* Primary Features */}
        <section id='features' className='py-16 sm:py-24 px-4'>
          <div className='max-w-6xl mx-auto'>
            <div className='text-center mb-16'>
              <span className='inline-block text-breeder-orange font-semibold text-sm uppercase tracking-wider mb-3'>Features</span>
              <h2 className='text-3xl sm:text-4xl font-bold text-breeder-navy mb-4'>
                Everything You Need to Run Your Breeding Program
              </h2>
              <p className='text-gray-600 max-w-2xl mx-auto text-lg'>
                From record keeping to customer management, Expert Breeder gives you the tools to run a professional operation.
              </p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className='group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-breeder-blue/30 transition-all duration-300 hover:-translate-y-1'
                >
                  <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${feature.color} mb-4`}>
                    <feature.icon className='h-6 w-6' />
                  </div>
                  <h3 className='text-lg font-semibold text-breeder-navy mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-gray-600 text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Secondary Features */}
        <section className='bg-gradient-to-b from-breeder-powder-blue/50 to-breeder-powder-blue py-16 sm:py-24 px-4'>
          <div className='max-w-6xl mx-auto'>
            <div className='text-center mb-16'>
              <span className='inline-block text-breeder-blue font-semibold text-sm uppercase tracking-wider mb-3'>And More</span>
              <h2 className='text-3xl sm:text-4xl font-bold text-breeder-navy mb-4'>
                Built for the Way Breeders Work
              </h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {secondaryFeatures.map((feature) => (
                <div key={feature.title} className='bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-white shadow-sm'>
                  <div className='inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-breeder-navy/5 mb-5'>
                    <feature.icon className='h-8 w-8 text-breeder-navy' />
                  </div>
                  <h3 className='text-lg font-semibold text-breeder-navy mb-3'>
                    {feature.title}
                  </h3>
                  <p className='text-gray-600 text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className='relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-breeder-navy via-breeder-navy to-[#0d3a62]' />
          <div className='absolute top-0 left-1/2 w-[800px] h-[800px] bg-breeder-orange/5 rounded-full -translate-x-1/2 -translate-y-1/2' />

          <div className='relative max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center'>
            <h2 className='text-3xl sm:text-4xl font-bold text-white mb-4'>
              Ready to Streamline Your Breeding Program?
            </h2>
            <p className='text-lg text-white/80 mb-10'>
              Join Expert Breeder today — it's free to get started. No credit card required.
            </p>
            <Link
              to='/signup'
              className='inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-breeder-orange text-white hover:bg-breeder-orange/90 transition-all shadow-lg shadow-breeder-orange/30 hover:shadow-xl hover:shadow-breeder-orange/40 hover:-translate-y-0.5'
            >
              Create Your Free Account
              <ChevronRight className='ml-2 h-5 w-5' />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='bg-breeder-navy border-t border-white/10 py-8 px-4'>
        <div className='max-w-6xl mx-auto text-center text-sm'>
          <p className='text-white/60'>
            &copy; {new Date().getFullYear()} Expert Breeder. All rights reserved.
          </p>
          <p className='mt-2 text-xs text-white/40'>
            <Link to='/privacy' className='hover:text-white/70 transition-colors'>
              Privacy Policy
            </Link>
            {' · '}
            <Link to='/terms' className='hover:text-white/70 transition-colors'>
              Terms of Service
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
