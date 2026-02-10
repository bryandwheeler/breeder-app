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
  ArrowRight,
  CheckCircle2,
  PawPrint,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: Dog,
    title: 'Dog & Puppy Management',
    description:
      'Track your dogs, puppies, litters, and pedigrees all in one place. Manage profiles, photos, and lineage records effortlessly.',
    color: 'bg-rose-50 text-rose-400',
  },
  {
    icon: Heart,
    title: 'Health Records',
    description:
      'Maintain comprehensive health records, vaccinations, vet visits, and genetic testing results for every animal.',
    color: 'bg-pink-50 text-pink-400',
  },
  {
    icon: Globe,
    title: 'Website Builder',
    description:
      'Create a professional public website for your kennel in minutes. Showcase available puppies and your breeding program.',
    color: 'bg-violet-50 text-violet-400',
  },
  {
    icon: Users,
    title: 'Customer & Waitlist CRM',
    description:
      'Manage inquiries, waitlists, and customer relationships. Keep track of every interaction from first contact to placement.',
    color: 'bg-amber-50 text-amber-500',
  },
  {
    icon: FileText,
    title: 'Contracts & E-Signatures',
    description:
      'Generate puppy contracts and collect legally binding electronic signatures — no printing or scanning required.',
    color: 'bg-emerald-50 text-emerald-400',
  },
  {
    icon: Mail,
    title: 'Email & Marketing',
    description:
      'Send newsletters, manage subscriber lists, and build automated email sequences to stay connected with your community.',
    color: 'bg-sky-50 text-sky-400',
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
    <div className='min-h-screen flex flex-col' style={{ backgroundColor: '#faf8f5' }}>
      {/* Navigation */}
      <nav className='sticky top-0 z-50 backdrop-blur-md border-b border-stone-200/60' style={{ backgroundColor: 'rgba(250, 248, 245, 0.95)' }}>
        <div className='max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 flex items-center justify-between h-16'>
          <img
            src='/expert-breeder-logo.webp'
            alt='Expert Breeder'
            className='h-9 w-auto'
          />
          <div className='flex items-center gap-4'>
            <Link
              to='/login'
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-stone-600 hover:text-rose-500 transition-colors'
            >
              Log In
            </Link>
            <Link
              to='/signup'
              className='inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-full text-white transition-all shadow-sm hover:shadow-md'
              style={{ backgroundColor: '#c45a6e' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='relative overflow-hidden py-20 sm:py-28 lg:py-36 px-5'>
          {/* Soft decorative shapes */}
          <div className='absolute top-10 right-0 w-[500px] h-[500px] rounded-full opacity-30' style={{ backgroundColor: '#f9e4e8' }} />
          <div className='absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-20' style={{ backgroundColor: '#e8d5c4' }} />
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-10' style={{ backgroundColor: '#d4bfb0' }} />

          <div className='relative max-w-3xl mx-auto text-center'>
            <div className='inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border border-stone-200 bg-white/70 backdrop-blur-sm'>
              <PawPrint className='h-3.5 w-3.5 text-rose-400' />
              <span className='text-stone-500 text-xs font-medium tracking-wide uppercase'>Built for breeders who care</span>
            </div>

            <h1 className='text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-stone-800 mb-6 leading-[1.15] tracking-tight'>
              The thoughtful way to manage your{' '}
              <span className='italic' style={{ color: '#c45a6e' }}>breeding program</span>
            </h1>

            <p className='text-lg sm:text-xl text-stone-500 mb-12 max-w-xl mx-auto leading-relaxed'>
              Health records, pedigrees, customer relationships, contracts, and your own kennel website — all from one beautifully simple dashboard.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center mb-10'>
              <Link
                to='/signup'
                className='inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-full text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5'
                style={{ backgroundColor: '#c45a6e' }}
              >
                Start Free Today
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
              <a
                href='#features'
                className='inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-full border border-stone-300 text-stone-600 bg-white hover:bg-stone-50 transition-all'
              >
                See Features
              </a>
            </div>

            <div className='flex flex-wrap gap-6 justify-center'>
              {highlights.map((text) => (
                <div key={text} className='flex items-center gap-1.5 text-stone-400 text-sm'>
                  <CheckCircle2 className='h-3.5 w-3.5 text-emerald-400' />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className='border-y border-stone-200/60 py-8 px-5' style={{ backgroundColor: '#f5f0eb' }}>
          <div className='max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-10 sm:gap-16 text-center'>
            <div>
              <div className='text-xl font-semibold text-stone-700'>All-in-One</div>
              <div className='text-xs text-stone-400 mt-0.5'>Breeding Platform</div>
            </div>
            <div className='hidden sm:block w-px h-8 bg-stone-300/50' />
            <div>
              <div className='text-xl font-semibold text-stone-700'>Unlimited</div>
              <div className='text-xs text-stone-400 mt-0.5'>Dogs & Records</div>
            </div>
            <div className='hidden sm:block w-px h-8 bg-stone-300/50' />
            <div>
              <div className='text-xl font-semibold text-stone-700'>Free</div>
              <div className='text-xs text-stone-400 mt-0.5'>To Get Started</div>
            </div>
            <div className='hidden sm:block w-px h-8 bg-stone-300/50' />
            <div>
              <div className='text-xl font-semibold text-stone-700'>Secure</div>
              <div className='text-xs text-stone-400 mt-0.5'>Cloud Storage</div>
            </div>
          </div>
        </section>

        {/* Primary Features */}
        <section id='features' className='py-20 sm:py-28 px-5'>
          <div className='max-w-5xl mx-auto'>
            <div className='text-center mb-16'>
              <div className='flex items-center justify-center gap-2 mb-4'>
                <Sparkles className='h-4 w-4 text-rose-400' />
                <span className='text-xs font-medium tracking-widest uppercase' style={{ color: '#c45a6e' }}>Features</span>
              </div>
              <h2 className='text-3xl sm:text-4xl font-bold text-stone-800 mb-4 tracking-tight'>
                Everything you need, nothing you don't
              </h2>
              <p className='text-stone-500 max-w-lg mx-auto'>
                Purpose-built tools for breeders who want to stay organized, professional, and connected with their families.
              </p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className='group bg-white rounded-2xl p-6 border border-stone-100 hover:border-stone-200 shadow-sm hover:shadow-md transition-all duration-300'
                >
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${feature.color} mb-4`}>
                    <feature.icon className='h-5 w-5' />
                  </div>
                  <h3 className='text-base font-semibold text-stone-800 mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-stone-500 text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Secondary Features */}
        <section className='py-20 sm:py-28 px-5' style={{ backgroundColor: '#f5f0eb' }}>
          <div className='max-w-5xl mx-auto'>
            <div className='text-center mb-16'>
              <span className='text-xs font-medium tracking-widest uppercase text-stone-400'>And more</span>
              <h2 className='text-3xl sm:text-4xl font-bold text-stone-800 mt-3 tracking-tight'>
                Built around the way you work
              </h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {secondaryFeatures.map((feature) => (
                <div key={feature.title} className='bg-white rounded-2xl p-8 text-center border border-stone-100 shadow-sm'>
                  <div className='inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-50 mb-5'>
                    <feature.icon className='h-6 w-6 text-rose-400' />
                  </div>
                  <h3 className='text-base font-semibold text-stone-800 mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-stone-500 text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className='py-20 sm:py-28 px-5'>
          <div className='max-w-2xl mx-auto text-center'>
            <PawPrint className='h-8 w-8 mx-auto mb-6 text-rose-300' />
            <h2 className='text-3xl sm:text-4xl font-bold text-stone-800 mb-4 tracking-tight'>
              Ready to simplify your breeding program?
            </h2>
            <p className='text-lg text-stone-500 mb-10 max-w-md mx-auto'>
              Join breeders who trust Expert Breeder to keep their programs running smoothly. Free to get started.
            </p>
            <Link
              to='/signup'
              className='inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-full text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5'
              style={{ backgroundColor: '#c45a6e' }}
            >
              Create Your Free Account
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='border-t border-stone-200/60 py-10 px-5' style={{ backgroundColor: '#f5f0eb' }}>
        <div className='max-w-5xl mx-auto text-center'>
          <img
            src='/expert-breeder-logo.webp'
            alt='Expert Breeder'
            className='h-8 w-auto mx-auto mb-4 opacity-60'
          />
          <p className='text-stone-400 text-sm'>
            &copy; {new Date().getFullYear()} Expert Breeder. All rights reserved.
          </p>
          <div className='mt-3 flex items-center justify-center gap-4 text-xs text-stone-400'>
            <Link to='/privacy' className='hover:text-stone-600 transition-colors'>
              Privacy Policy
            </Link>
            <span className='text-stone-300'>|</span>
            <Link to='/terms' className='hover:text-stone-600 transition-colors'>
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
