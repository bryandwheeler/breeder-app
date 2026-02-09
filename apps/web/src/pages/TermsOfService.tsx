import { Link } from 'react-router-dom';

export function TermsOfService() {
  return (
    <div className='min-h-screen bg-background py-12 px-4'>
      <div className='mx-auto max-w-3xl prose prose-sm dark:prose-invert'>
        <Link
          to='/'
          className='text-sm text-muted-foreground hover:underline no-underline mb-8 block'
        >
          &larr; Back to home
        </Link>

        <h1 className='text-3xl font-bold mb-2'>Terms of Service</h1>
        <p className='text-muted-foreground mb-8'>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <section className='space-y-4 mb-8'>
          <p>
            Welcome to Expert Breeder. These Terms of Service ("Terms") govern
            your access to and use of the Expert Breeder platform, including
            web applications, websites generated through the platform, and
            related services (collectively, the "Service"). By creating an
            account or using the Service, you agree to be bound by these Terms.
          </p>
          <p>
            If you do not agree to these Terms, you may not use the Service.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>1. Account Registration</h2>
          <p>
            To use the Service, you must create an account using a valid email
            address or through a supported authentication provider (Google or
            Facebook). You are responsible for:
          </p>
          <ul className='list-disc pl-6 space-y-1'>
            <li>Providing accurate and complete registration information</li>
            <li>Maintaining the security of your account credentials</li>
            <li>All activity that occurs under your account</li>
            <li>Notifying us immediately of any unauthorized use of your account</li>
          </ul>
          <p>
            You must be at least 18 years old to create an account and use the
            Service.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>2. Use of the Service</h2>
          <p>
            Expert Breeder provides tools for animal breeders to manage their
            breeding programs, including record keeping, website creation,
            customer management, and communication tools. You agree to use the
            Service only for its intended purpose and in compliance with all
            applicable laws.
          </p>

          <h3 className='text-lg font-medium'>Acceptable Use</h3>
          <p>You agree not to:</p>
          <ul className='list-disc pl-6 space-y-1'>
            <li>Use the Service for any unlawful purpose</li>
            <li>Upload content that is harmful, threatening, abusive, defamatory, or otherwise objectionable</li>
            <li>Impersonate any person or entity</li>
            <li>Attempt to gain unauthorized access to other users' accounts or data</li>
            <li>Interfere with or disrupt the Service or servers connected to the Service</li>
            <li>Use automated tools (bots, scrapers) to access the Service without our written permission</li>
            <li>Use the Service to promote animal cruelty or violate animal welfare laws</li>
          </ul>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>3. Subscriptions & Payments</h2>
          <p>
            The Service offers free and paid subscription tiers. Paid
            subscriptions are billed through Stripe and may be monthly or
            annual.
          </p>
          <ul className='list-disc pl-6 space-y-1'>
            <li>
              <strong>Billing:</strong> Subscriptions renew automatically at
              the end of each billing period unless cancelled before the renewal
              date.
            </li>
            <li>
              <strong>Cancellation:</strong> You may cancel your subscription
              at any time through your account settings. Access to paid features
              will continue until the end of the current billing period.
            </li>
            <li>
              <strong>Refunds:</strong> Subscription fees are generally
              non-refundable. Refund requests for exceptional circumstances will
              be considered on a case-by-case basis.
            </li>
            <li>
              <strong>Price Changes:</strong> We may change subscription prices
              with 30 days' advance notice. Continued use of the Service after
              a price change constitutes acceptance of the new pricing.
            </li>
          </ul>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>4. Your Content</h2>
          <p>
            You retain ownership of all content you upload to the Service,
            including photos, text, animal records, health data, and documents
            ("Your Content").
          </p>
          <p>
            By using the Service, you grant us a limited, non-exclusive license
            to store, display, and transmit Your Content solely for the purpose
            of providing the Service to you. This includes displaying content on
            public-facing breeder websites you create through the platform.
          </p>
          <p>
            You are solely responsible for Your Content and represent that you
            have the right to upload and share it. We do not endorse or verify
            the accuracy of any content uploaded by users.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>5. Public Websites</h2>
          <p>
            The Service allows you to create public-facing websites for your
            breeding program. You are responsible for all content displayed on
            your public website, including ensuring it complies with applicable
            laws and does not infringe on third-party rights.
          </p>
          <p>
            We reserve the right to remove or disable any public website that
            violates these Terms or that we determine, in our sole discretion,
            is harmful or inappropriate.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>6. Staff Access</h2>
          <p>
            The Service allows you to grant staff members access to portions of
            your account. You are responsible for managing staff permissions and
            for any actions taken by staff members under your account. We are
            not liable for any data loss, unauthorized changes, or other issues
            arising from staff access.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>7. Contracts & E-Signatures</h2>
          <p>
            The Service provides tools for creating and sending contracts for
            electronic signature through third-party providers. While we
            facilitate the process, we are not a party to any contract between
            you and your buyers. You are responsible for ensuring your contracts
            comply with applicable laws in your jurisdiction.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>8. Intellectual Property</h2>
          <p>
            The Service, including its design, features, code, and branding, is
            owned by Expert Breeder and protected by intellectual property laws.
            You may not copy, modify, distribute, or reverse engineer any part
            of the Service without our written permission.
          </p>
          <p>
            "Expert Breeder" and associated logos are trademarks of Expert
            Breeder. You may not use our trademarks without prior written
            consent.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>9. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" and "as available" without
            warranties of any kind, either express or implied. We do not warrant
            that the Service will be uninterrupted, error-free, or secure.
          </p>
          <p>
            We do not provide veterinary, legal, or financial advice. Any
            breeding recommendations, health record tools, or other features are
            provided for informational purposes only and should not be
            considered professional advice.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Expert Breeder shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, including but not limited to loss of profits,
            data, or business opportunities, arising from your use of or
            inability to use the Service.
          </p>
          <p>
            Our total liability for any claim arising from the Service shall not
            exceed the amount you paid us in the twelve (12) months preceding
            the claim.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Expert Breeder, its
            officers, directors, employees, and agents from any claims,
            liabilities, damages, losses, or expenses arising from your use of
            the Service, your violation of these Terms, or your violation of
            any rights of a third party.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>12. Termination</h2>
          <p>
            We may suspend or terminate your account at any time if you violate
            these Terms, engage in abusive behavior, or for any other reason at
            our sole discretion with reasonable notice.
          </p>
          <p>
            You may delete your account at any time. Upon termination, your
            right to use the Service will cease and your data will be handled
            in accordance with our Privacy Policy.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>13. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of
            material changes by posting the updated Terms on this page and
            updating the "Last updated" date. Your continued use of the Service
            after changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>14. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of the State of Arizona, without regard to its conflict of
            law provisions.
          </p>
        </section>

        <section className='space-y-4 mb-8'>
          <h2 className='text-xl font-semibold'>15. Contact Us</h2>
          <p>
            If you have questions about these Terms of Service, please contact
            us through the in-app support system or submit a support ticket from
            your account settings.
          </p>
        </section>
      </div>
    </div>
  );
}
