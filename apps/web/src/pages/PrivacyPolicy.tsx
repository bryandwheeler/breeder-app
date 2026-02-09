import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className='min-h-screen bg-background py-12 px-4'>
      <div className='mx-auto max-w-3xl prose prose-sm dark:prose-invert'>
        <Link
          to='/'
          className='text-sm text-muted-foreground hover:underline no-underline mb-8 block'
        >
          &larr; Back to home
        </Link>

        <h1 className='text-3xl font-bold mb-2'>Privacy Policy</h1>
        <p className='text-muted-foreground mb-8'>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <section className='space-y-4 mb-8'>
          <p>
            Expert Breeder ("we," "us," or "our") operates the Expert Breeder
            platform, including web applications and related services
            (collectively, the "Service"). This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use
            our Service.
          </p>
          <p>
            By using the Service, you agree to the collection and use of
            information in accordance with this policy.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>1. Information We Collect</h2>

          <h3 className='text-lg font-medium'>Personal Information</h3>
          <p>When you create an account or use our Service, we may collect:</p>
          <ul className='list-disc pl-6 space-y-1'>
            <li>Name and email address</li>
            <li>Phone number (if provided)</li>
            <li>Business name and address</li>
            <li>Profile photos</li>
            <li>Payment and billing information (processed securely through Stripe)</li>
          </ul>

          <h3 className='text-lg font-medium'>Breeder & Animal Data</h3>
          <p>
            As part of the Service, breeders may store information about their
            animals, litters, health records, breeding records, and related
            documentation. This data is owned by the breeder and used solely to
            provide the Service.
          </p>

          <h3 className='text-lg font-medium'>Automatically Collected Information</h3>
          <p>When you access the Service, we may automatically collect:</p>
          <ul className='list-disc pl-6 space-y-1'>
            <li>Device type and browser information</li>
            <li>IP address and approximate location</li>
            <li>Pages visited and features used</li>
            <li>Date and time of access</li>
          </ul>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className='list-disc pl-6 space-y-1'>
            <li>Provide, maintain, and improve the Service</li>
            <li>Process transactions and manage subscriptions</li>
            <li>Send transactional emails (account verification, password resets, booking confirmations)</li>
            <li>Provide customer support</li>
            <li>Generate public-facing breeder websites on your behalf</li>
            <li>Facilitate communication between breeders and prospective buyers</li>
            <li>Monitor and analyze usage trends to improve the Service</li>
            <li>Detect, prevent, and address technical issues or abuse</li>
          </ul>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>3. How We Share Your Information</h2>
          <p>We do not sell your personal information. We may share information in the following circumstances:</p>
          <ul className='list-disc pl-6 space-y-1'>
            <li>
              <strong>Public Websites:</strong> If you create a public breeder
              website through the Service, the information you choose to display
              (kennel name, contact info, available puppies, photos) will be
              publicly accessible.
            </li>
            <li>
              <strong>Service Providers:</strong> We use third-party services
              such as Firebase (hosting and database), Stripe (payments),
              SendGrid (email delivery), and SignNow (contracts). These
              providers only access data necessary to perform their services.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose information
              if required to do so by law, or if we believe such action is
              necessary to comply with legal obligations, protect our rights, or
              ensure the safety of users.
            </li>
            <li>
              <strong>Staff Members:</strong> Breeders may grant staff members
              access to portions of their account data through the staff
              management features.
            </li>
          </ul>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>4. Data Storage & Security</h2>
          <p>
            Your data is stored using Google Firebase infrastructure, which
            provides encryption at rest and in transit. We implement appropriate
            technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or
            destruction.
          </p>
          <p>
            While we strive to protect your information, no method of
            transmission over the Internet or electronic storage is 100% secure.
            We cannot guarantee absolute security.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>5. Cookies & Tracking</h2>
          <p>
            We use cookies and similar technologies to maintain your session,
            remember your preferences, and understand how you use the Service.
            These are essential for the Service to function properly.
          </p>
          <p>
            We do not use third-party advertising cookies. Analytics data is
            used solely to improve the Service.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>6. Third-Party Authentication</h2>
          <p>
            You may sign in using Google or Facebook. When you do, we receive
            basic profile information (name, email, profile picture) from these
            providers. We do not access your contacts, posts, or other social
            media data.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className='list-disc pl-6 space-y-1'>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent for optional data processing</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us through the
            in-app support system or by email.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>8. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is
            active or as needed to provide you the Service. If you delete your
            account, we will delete or anonymize your personal data within 30
            days, except where we are required to retain it for legal or
            legitimate business purposes.
          </p>
          <p>
            Breeder animal records and related data will be deleted upon account
            deletion unless otherwise requested.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>9. Children's Privacy</h2>
          <p>
            The Service is not directed to individuals under the age of 18. We
            do not knowingly collect personal information from children. If we
            become aware that we have collected data from a child without
            parental consent, we will take steps to delete that information.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new policy on this page
            and updating the "Last updated" date. Your continued use of the
            Service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us
            through the in-app support system or submit a support ticket from
            your account settings.
          </p>
        </section>
      </div>
    </div>
  );
}
