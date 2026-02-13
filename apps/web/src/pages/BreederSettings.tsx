// Breeder profile and website settings
import { useState } from 'react';
import { useBreederStore, useAdminStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink, Save, Eye } from 'lucide-react';
import { BreederProfile } from '@breeder/types';
import { CareScheduleEditor } from '@/components/CareScheduleEditor';
import { Combobox } from '@/components/ui/combobox';
import { DOG_BREEDS } from '@/data/dogBreeds';
import { EmailSettings } from '@/components/EmailSettings';
import { EmailTemplatesManager } from '@/components/EmailTemplatesManager';
import { WorkflowManager } from '@/components/WorkflowManager';
import { ScheduledEmailsManager } from '@/components/ScheduledEmailsManager';
import { WaitlistFormBuilder } from '@/components/settings/WaitlistFormBuilder';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { StaffManagement } from '@/pages/StaffManagement';
import { SchedulingSettingsPanel } from '@/components/scheduling/SchedulingSettingsPanel';
import { TpwIntegrationSettings } from '@/components/settings/TpwIntegrationSettings';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    title: 'Profile',
    items: [
      { id: 'basic', label: 'Basic Info' },
      { id: 'contact', label: 'Contact & Social' },
      { id: 'about', label: 'About & Philosophy' },
    ],
  },
  {
    title: 'Breeding Program',
    items: [
      { id: 'health', label: 'Health & Testing' },
      { id: 'credentials', label: 'Credentials' },
      { id: 'care', label: 'Care Schedule' },
    ],
  },
  {
    title: 'Email & Messaging',
    items: [
      { id: 'email', label: 'Email Config' },
      { id: 'emailIntegration', label: 'Integration' },
      { id: 'emailTemplates', label: 'Templates' },
      { id: 'workflows', label: 'Workflows' },
      { id: 'scheduledEmails', label: 'Scheduled Emails' },
    ],
  },
  {
    title: 'Business Operations',
    items: [
      { id: 'waitlistForm', label: 'Waitlist Form' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'scheduling', label: 'Scheduling' },
      { id: 'staff', label: 'Staff' },
      { id: 'tpwIntegration', label: 'ThePuppyWag Sync' },
      { id: 'settings', label: 'General Settings' },
    ],
  },
];

export function BreederSettings() {
  const { currentUser } = useAuth();
  const impersonatedUserId = useAdminStore((s) => s.impersonatedUserId);
  const { profile, createProfile, updateProfile, loading } = useBreederStore();
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState<Partial<BreederProfile>>(
    () =>
      profile || {
        breederName: '',
        kennelName: '',
        tagline: '',
        about: '',
        philosophy: '',
        experience: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        website: '',
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        primaryBreed: '',
        otherBreeds: [],
        akc: '',
        otherOrganizations: [],
        customRegistries: [],
        healthTestingDescription: '',
        healthGuarantee: '',
        guardianProgramAvailable: false,
        guardianProgramDescription: '',
        acceptingInquiries: true,
        showPricing: false,
        emailjsPublicKey: '',
        emailjsServiceId: '',
        emailjsWaitlistTemplateId: '',
        emailjsInquiryNotificationTemplateId: '',
        emailjsWaitlistNotificationTemplateId: '',
        notificationEmail: '',
        enableInquiryNotifications: true,
        enableWaitlistNotifications: true,
      }
  );

  const handleSave = async () => {
    try {
      if (profile) {
        await updateProfile(formData);
      } else {
        const targetUid = impersonatedUserId || currentUser?.uid;
        await createProfile(
          formData as Omit<
            BreederProfile,
            'id' | 'userId' | 'createdAt' | 'updatedAt'
          >,
          targetUid
        );
      }
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const publicUrl = currentUser
    ? `${window.location.origin}/home/${impersonatedUserId || currentUser.uid}`
    : '';

  const activeLabel = navGroups
    .flatMap((g) => g.items)
    .find((item) => item.id === activeSection)?.label || 'Basic Info';

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold'>Breeder Settings</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>
            Manage your public breeder profile and website
          </p>
        </div>
        <div className='flex gap-2 sm:gap-3'>
          {profile && (
            <a href={publicUrl} target='_blank' rel='noopener noreferrer' className='flex-1 sm:flex-none'>
              <Button variant='outline' className='w-full sm:w-auto'>
                <Eye className='h-4 w-4 mr-2' />
                <span className='hidden sm:inline'>View Public Site</span>
                <span className='sm:hidden'>View Site</span>
              </Button>
            </a>
          )}
          <Button onClick={handleSave} disabled={loading} className='flex-1 sm:flex-none'>
            <Save className='h-4 w-4 mr-2' />
            Save
          </Button>
        </div>
      </div>

      {publicUrl && (
        <Card className='p-4 bg-primary/5'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
            <div className='flex items-center gap-2'>
              <ExternalLink className='h-4 w-4 text-primary flex-shrink-0' />
              <span className='text-sm font-medium'>Your Public URL:</span>
            </div>
            <a
              href={publicUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm text-primary hover:underline break-all'
            >
              {publicUrl}
            </a>
          </div>
        </Card>
      )}

      {/* Mobile section selector */}
      <div className='lg:hidden'>
        <Select value={activeSection} onValueChange={setActiveSection}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select section'>{activeLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {navGroups.map((group) => (
              <SelectGroup key={group.title}>
                <SelectLabel>{group.title}</SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex gap-6'>
        {/* Desktop sidebar */}
        <nav className='hidden lg:block w-52 flex-shrink-0'>
          <div className='sticky top-20 space-y-6'>
            {navGroups.map((group) => (
              <div key={group.title}>
                <h3 className='px-3 mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  {group.title}
                </h3>
                <div className='space-y-0.5'>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
                        activeSection === item.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Content area */}
        <div className='flex-1 min-w-0 max-w-3xl'>
          {/* Basic Info */}
          {activeSection === 'basic' && (
            <Card className='p-6 space-y-6'>
              <div>
                <Label htmlFor='breederName'>Breeder Name *</Label>
                <Input
                  id='breederName'
                  value={formData.breederName}
                  onChange={(e) =>
                    setFormData({ ...formData, breederName: e.target.value })
                  }
                  placeholder='Your full name'
                />
              </div>

              <div>
                <Label htmlFor='kennelName'>Kennel Name</Label>
                <Input
                  id='kennelName'
                  value={formData.kennelName}
                  onChange={(e) =>
                    setFormData({ ...formData, kennelName: e.target.value })
                  }
                  placeholder='e.g., Expert Breeder Kennel'
                />
              </div>

              <div>
                <Label htmlFor='tagline'>Tagline</Label>
                <Input
                  id='tagline'
                  value={formData.tagline}
                  onChange={(e) =>
                    setFormData({ ...formData, tagline: e.target.value })
                  }
                  placeholder='A short, catchy tagline for your program'
                />
              </div>

              <div>
                <Label htmlFor='primaryBreed'>Primary Breed *</Label>
                <Combobox
                  options={DOG_BREEDS.map((breed) => ({
                    value: breed,
                    label: breed,
                  }))}
                  value={formData.primaryBreed}
                  onValueChange={(value) =>
                    setFormData({ ...formData, primaryBreed: value })
                  }
                  placeholder='Select a breed...'
                  searchPlaceholder='Search breeds...'
                  emptyText='No breeds found.'
                />
              </div>
            </Card>
          )}

          {/* Contact & Social */}
          {activeSection === 'contact' && (
            <Card className='p-6 space-y-6'>
              <h3 className='text-lg font-semibold'>Contact Information</h3>

              <div>
                <Label htmlFor='email'>Email Address *</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder='your@email.com'
                />
              </div>

              <div>
                <Label htmlFor='phone'>Phone Number</Label>
                <Input
                  id='phone'
                  value={formData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    let formatted = digits;
                    if (digits.length > 6) {
                      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                    } else if (digits.length > 3) {
                      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                    } else if (digits.length > 0) {
                      formatted = `(${digits}`;
                    }
                    setFormData({ ...formData, phone: formatted });
                  }}
                  placeholder='(555) 123-4567'
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='city'>City</Label>
                  <Input
                    id='city'
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='state'>State</Label>
                  <Input
                    id='state'
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>
              </div>

              <h3 className='text-lg font-semibold mt-8'>Social Media</h3>

              <div>
                <Label htmlFor='facebook'>Facebook</Label>
                <Input
                  id='facebook'
                  value={formData.facebook}
                  onChange={(e) =>
                    setFormData({ ...formData, facebook: e.target.value })
                  }
                  placeholder='https://facebook.com/yourpage'
                />
              </div>

              <div>
                <Label htmlFor='instagram'>Instagram</Label>
                <Input
                  id='instagram'
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram: e.target.value })
                  }
                  placeholder='https://instagram.com/yourpage'
                />
              </div>

              <div>
                <Label htmlFor='twitter'>Twitter/X</Label>
                <Input
                  id='twitter'
                  value={formData.twitter}
                  onChange={(e) =>
                    setFormData({ ...formData, twitter: e.target.value })
                  }
                  placeholder='https://twitter.com/yourpage'
                />
              </div>

              <div>
                <Label htmlFor='youtube'>YouTube</Label>
                <Input
                  id='youtube'
                  value={formData.youtube}
                  onChange={(e) =>
                    setFormData({ ...formData, youtube: e.target.value })
                  }
                  placeholder='https://youtube.com/@yourchannel'
                />
              </div>
            </Card>
          )}

          {/* About & Philosophy */}
          {activeSection === 'about' && (
            <Card className='p-6 space-y-6'>
              <div>
                <Label htmlFor='about'>About Us *</Label>
                <Textarea
                  id='about'
                  rows={6}
                  value={formData.about}
                  onChange={(e) =>
                    setFormData({ ...formData, about: e.target.value })
                  }
                  placeholder='Tell visitors about your breeding program, your passion for dogs, and what makes you different...'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  This is the first thing visitors will see. Make it compelling!
                </p>
              </div>

              <div>
                <Label htmlFor='philosophy'>Breeding Philosophy</Label>
                <Textarea
                  id='philosophy'
                  rows={4}
                  value={formData.philosophy}
                  onChange={(e) =>
                    setFormData({ ...formData, philosophy: e.target.value })
                  }
                  placeholder='Describe your breeding philosophy, ethics, and what you prioritize...'
                />
              </div>

              <div>
                <Label htmlFor='experience'>Experience</Label>
                <Textarea
                  id='experience'
                  rows={4}
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                  placeholder="How long have you been breeding? What's your background and expertise?"
                />
              </div>

              <div>
                <Label>Guardian Program</Label>
                <div className='flex items-center gap-2 mb-2'>
                  <Switch
                    checked={formData.guardianProgramAvailable || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        guardianProgramAvailable: checked,
                      })
                    }
                  />
                  <span className='text-sm'>
                    We offer a Guardian Home program
                  </span>
                </div>
                {formData.guardianProgramAvailable && (
                  <Textarea
                    rows={3}
                    value={formData.guardianProgramDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guardianProgramDescription: e.target.value,
                      })
                    }
                    placeholder='Describe your Guardian Home program...'
                  />
                )}
              </div>
            </Card>
          )}

          {/* Health Testing */}
          {activeSection === 'health' && (
            <Card className='p-6 space-y-6'>
              <div>
                <Label htmlFor='healthTesting'>Health Testing Commitment</Label>
                <Textarea
                  id='healthTesting'
                  rows={6}
                  value={formData.healthTestingDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      healthTestingDescription: e.target.value,
                    })
                  }
                  placeholder="Describe what health testing you perform on your dogs, why it's important, and your commitment to breeding healthy dogs..."
                />
              </div>

              <div>
                <Label htmlFor='healthGuarantee'>Health Guarantee</Label>
                <Textarea
                  id='healthGuarantee'
                  rows={4}
                  value={formData.healthGuarantee}
                  onChange={(e) =>
                    setFormData({ ...formData, healthGuarantee: e.target.value })
                  }
                  placeholder='Describe your health guarantee policy...'
                />
              </div>
            </Card>
          )}

          {/* Credentials */}
          {activeSection === 'credentials' && (
            <Card className='p-6 space-y-6'>
              <div>
                <Label htmlFor='akc'>AKC Status</Label>
                <Input
                  id='akc'
                  value={formData.akc}
                  onChange={(e) =>
                    setFormData({ ...formData, akc: e.target.value })
                  }
                  placeholder='e.g., AKC Breeder of Merit'
                />
              </div>

              <div>
                <Label>Other Organizations & Certifications</Label>
                <p className='text-sm text-muted-foreground mb-2'>
                  List any breed clubs, certifications, or memberships (one per
                  line)
                </p>
                <Textarea
                  rows={4}
                  value={formData.otherOrganizations?.join('\n') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      otherOrganizations: e.target.value
                        .split('\n')
                        .filter((s) => s.trim()),
                    })
                  }
                  placeholder='Golden Retriever Club of America&#10;Good Dog Member&#10;OFA Health Certified'
                />
              </div>

              <div>
                <Label>Custom Dog Registries</Label>
                <p className='text-sm text-muted-foreground mb-2'>
                  Add custom or regional registries not in the global list (one
                  per line). These will be available when registering your dogs.
                </p>
                <Textarea
                  rows={4}
                  value={formData.customRegistries?.join('\n') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customRegistries: e.target.value
                        .split('\n')
                        .filter((s) => s.trim()),
                    })
                  }
                  placeholder='Continental Kennel Club&#10;International All Breed Canine Association&#10;State-specific Registry'
                />
              </div>
            </Card>
          )}

          {/* Care Schedule */}
          {activeSection === 'care' && (
            <Card className='p-6'>
              <CareScheduleEditor />
            </Card>
          )}

          {/* Waitlist Form Builder */}
          {activeSection === 'waitlistForm' && (
            <WaitlistFormBuilder />
          )}

          {/* Email Integration */}
          {activeSection === 'emailIntegration' && (
            <EmailSettings />
          )}

          {/* Email Templates */}
          {activeSection === 'emailTemplates' && (
            <EmailTemplatesManager />
          )}

          {/* Workflows */}
          {activeSection === 'workflows' && (
            <WorkflowManager />
          )}

          {/* Scheduled Emails */}
          {activeSection === 'scheduledEmails' && (
            <ScheduledEmailsManager />
          )}

          {/* Email Configuration */}
          {activeSection === 'email' && (
            <Card className='p-6 space-y-6'>
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>EmailJS Configuration</h3>
                <p className='text-sm text-muted-foreground'>
                  Configure your EmailJS account to send automated emails to
                  customers.
                  <a
                    href='https://www.emailjs.com/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline ml-1'
                  >
                    Sign up for free at EmailJS.com
                  </a>
                </p>
              </div>

              <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
                <h4 className='font-medium text-sm'>Setup Instructions:</h4>
                <ol className='list-decimal list-inside space-y-2 text-sm text-muted-foreground'>
                  <li>
                    Sign up for a free account at{' '}
                    <a
                      href='https://www.emailjs.com/'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary hover:underline'
                    >
                      emailjs.com
                    </a>
                  </li>
                  <li>Create an Email Service (Gmail, Outlook, etc.)</li>
                  <li>Create a new Email Template</li>
                  <li className='font-semibold text-foreground'>
                    <strong>IMPORTANT:</strong> In the template settings, set the
                    "To Email" field to:{' '}
                    <code className='bg-background px-1 rounded ml-1'>{`{{to_email}}`}</code>
                    <p className='font-normal text-muted-foreground mt-1 ml-6'>
                      This tells EmailJS to use the dynamic email address we
                      provide
                    </p>
                  </li>
                  <li>
                    In your template content, use these variables:
                    <ul className='list-disc list-inside ml-6 mt-1'>
                      <li>
                        <code className='bg-muted px-1 rounded'>{`{{to_name}}`}</code>{' '}
                        - Recipient's name
                      </li>
                      <li>
                        <code className='bg-muted px-1 rounded'>{`{{waitlist_url}}`}</code>{' '}
                        - Waitlist application URL
                      </li>
                      <li>
                        <code className='bg-muted px-1 rounded'>{`{{from_name}}`}</code>{' '}
                        - Your breeding program name
                      </li>
                    </ul>
                  </li>
                  <li>Copy your Public Key, Service ID, and Template ID below</li>
                </ol>
              </div>

              <div>
                <Label htmlFor='emailjsPublicKey'>EmailJS Public Key</Label>
                <Input
                  id='emailjsPublicKey'
                  value={formData.emailjsPublicKey || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, emailjsPublicKey: e.target.value })
                  }
                  placeholder='Your EmailJS Public Key'
                  type='password'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Found in your EmailJS Account page
                </p>
              </div>

              <div>
                <Label htmlFor='emailjsServiceId'>EmailJS Service ID</Label>
                <Input
                  id='emailjsServiceId'
                  value={formData.emailjsServiceId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, emailjsServiceId: e.target.value })
                  }
                  placeholder='service_xxxxxxx'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Found in your Email Services page
                </p>
              </div>

              <div>
                <Label htmlFor='emailjsWaitlistTemplateId'>
                  Waitlist Email Template ID
                </Label>
                <Input
                  id='emailjsWaitlistTemplateId'
                  value={formData.emailjsWaitlistTemplateId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emailjsWaitlistTemplateId: e.target.value,
                    })
                  }
                  placeholder='template_xxxxxxx'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Template ID for sending waitlist links to customers
                </p>
              </div>

              <div className='border-t pt-6 space-y-4'>
                <h4 className='font-medium text-sm'>
                  Notification Templates (Receive Alerts)
                </h4>
                <p className='text-xs text-muted-foreground'>
                  These templates notify YOU when customers submit forms. Create
                  separate templates for each notification type.
                </p>

                <div>
                  <Label htmlFor='emailjsInquiryNotificationTemplateId'>
                    Inquiry Notification Template ID
                  </Label>
                  <Input
                    id='emailjsInquiryNotificationTemplateId'
                    value={formData.emailjsInquiryNotificationTemplateId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emailjsInquiryNotificationTemplateId: e.target.value,
                      })
                    }
                    placeholder='template_xxxxxxx'
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    Notifies you when someone submits a contact inquiry
                  </p>
                  <details className='mt-2 text-xs'>
                    <summary className='cursor-pointer text-primary'>
                      Template variables available
                    </summary>
                    <ul className='list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground'>
                      <li>
                        <code className='bg-muted px-1'>{`{{customer_name}}`}</code>{' '}
                        - Customer's name
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{customer_email}}`}</code>{' '}
                        - Customer's email
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{customer_phone}}`}</code>{' '}
                        - Customer's phone
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{preferred_sex}}`}</code>{' '}
                        - Preferred puppy sex
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{preferred_color}}`}</code>{' '}
                        - Preferred color
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{timeline}}`}</code> -
                        Customer's timeline
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{message}}`}</code> -
                        Customer's message
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{submitted_date}}`}</code>{' '}
                        - Submission timestamp
                      </li>
                    </ul>
                  </details>
                </div>

                <div>
                  <Label htmlFor='emailjsWaitlistNotificationTemplateId'>
                    Waitlist Notification Template ID
                  </Label>
                  <Input
                    id='emailjsWaitlistNotificationTemplateId'
                    value={formData.emailjsWaitlistNotificationTemplateId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emailjsWaitlistNotificationTemplateId: e.target.value,
                      })
                    }
                    placeholder='template_xxxxxxx'
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    Notifies you when someone submits a waitlist application
                  </p>
                  <details className='mt-2 text-xs'>
                    <summary className='cursor-pointer text-primary'>
                      Template variables available
                    </summary>
                    <ul className='list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground'>
                      <li>
                        <code className='bg-muted px-1'>{`{{customer_name}}`}</code>{' '}
                        - Customer's name
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{customer_email}}`}</code>{' '}
                        - Customer's email
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{customer_phone}}`}</code>{' '}
                        - Customer's phone
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{customer_address}}`}</code>{' '}
                        - Full address
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{household_type}}`}</code>{' '}
                        - House/Apartment/etc
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{has_children}}`}</code>{' '}
                        - Yes/No
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{children_ages}}`}</code>{' '}
                        - Ages of children
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{experience}}`}</code>{' '}
                        - Dog experience
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{lifestyle}}`}</code> -
                        Lifestyle description
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{reason}}`}</code> -
                        Reason for wanting a dog
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{submitted_date}}`}</code>{' '}
                        - Submission timestamp
                      </li>
                    </ul>
                  </details>
                </div>

                <div>
                  <Label htmlFor='emailjsConnectionRequestTemplateId'>
                    Connection Request Notification Template ID
                  </Label>
                  <Input
                    id='emailjsConnectionRequestTemplateId'
                    value={formData.emailjsConnectionRequestTemplateId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emailjsConnectionRequestTemplateId: e.target.value,
                      })
                    }
                    placeholder='template_xxxxxxx'
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    Notifies you when another breeder requests to connect with
                    your dog
                  </p>
                  <details className='mt-2 text-xs'>
                    <summary className='cursor-pointer text-primary'>
                      Template variables available
                    </summary>
                    <ul className='list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground'>
                      <li>
                        <code className='bg-muted px-1'>{`{{to_name}}`}</code> -
                        Your kennel name
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{requester_name}}`}</code>{' '}
                        - Requesting kennel's name
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{dog_name}}`}</code> -
                        Name of your dog
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{dog_registration}}`}</code>{' '}
                        - Dog's registration number
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{purpose}}`}</code> -
                        Purpose (Sire, Dam, etc.)
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{purpose_details}}`}</code>{' '}
                        - Additional purpose details
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{message}}`}</code> -
                        Requester's message
                      </li>
                      <li>
                        <code className='bg-muted px-1'>{`{{connections_url}}`}</code>{' '}
                        - Link to Connections page
                      </li>
                    </ul>
                  </details>
                </div>

                <div>
                  <Label htmlFor='notificationEmail'>
                    Notification Email Address
                  </Label>
                  <Input
                    id='notificationEmail'
                    type='email'
                    value={formData.notificationEmail || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationEmail: e.target.value,
                      })
                    }
                    placeholder={formData.email || 'your@email.com'}
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    Leave blank to use your profile email address (
                    {formData.email || 'not set'})
                  </p>
                </div>
              </div>

              {formData.emailjsPublicKey &&
                formData.emailjsServiceId &&
                formData.emailjsWaitlistTemplateId && (
                  <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                    <p className='text-sm text-green-700 font-medium'>
                      ✓ EmailJS is configured! You can now send automated waitlist
                      emails from the Inquiries page.
                    </p>
                  </div>
                )}
            </Card>
          )}

          {/* Platform Notification Preferences */}
          {activeSection === 'notifications' && (
            <NotificationPreferences />
          )}

          {/* Scheduling */}
          {activeSection === 'scheduling' && (
            <SchedulingSettingsPanel />
          )}

          {/* Staff Management */}
          {activeSection === 'staff' && (
            <StaffManagement />
          )}

          {/* ThePuppyWag Integration */}
          {activeSection === 'tpwIntegration' && (
            <TpwIntegrationSettings />
          )}

          {/* General Settings */}
          {activeSection === 'settings' && (
            <Card className='p-6 space-y-6'>
              <div>
                <h3 className='text-lg font-semibold mb-4'>Website Settings</h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>Accept Inquiries</div>
                      <div className='text-sm text-muted-foreground'>
                        Allow visitors to submit contact inquiries through your
                        website
                      </div>
                    </div>
                    <Switch
                      checked={formData.acceptingInquiries || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, acceptingInquiries: checked })
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>Show Pricing</div>
                      <div className='text-sm text-muted-foreground'>
                        Display puppy pricing on public litter pages
                      </div>
                    </div>
                    <Switch
                      checked={formData.showPricing || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, showPricing: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className='border-t pt-6'>
                <h3 className='text-lg font-semibold mb-4'>
                  Email Notifications
                </h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>Inquiry Notifications</div>
                      <div className='text-sm text-muted-foreground'>
                        Receive email alerts when customers submit contact
                        inquiries
                      </div>
                    </div>
                    <Switch
                      checked={formData.enableInquiryNotifications !== false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          enableInquiryNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>Waitlist Notifications</div>
                      <div className='text-sm text-muted-foreground'>
                        Receive email alerts when customers submit waitlist
                        applications
                      </div>
                    </div>
                    <Switch
                      checked={formData.enableWaitlistNotifications !== false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          enableWaitlistNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>
                        Connection Request Notifications
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Receive email alerts when breeders request to connect with
                        your dogs
                      </div>
                    </div>
                    <Switch
                      checked={
                        formData.enableConnectionRequestNotifications !== false
                      }
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          enableConnectionRequestNotifications: checked,
                        })
                      }
                    />
                  </div>

                  {(!formData.emailjsInquiryNotificationTemplateId ||
                    !formData.emailjsWaitlistNotificationTemplateId ||
                    !formData.emailjsConnectionRequestTemplateId) && (
                    <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm'>
                      <p className='text-amber-800 font-medium mb-1'>
                        ⚠️ Notification templates not configured
                      </p>
                      <p className='text-amber-700'>
                        To receive email notifications, configure your
                        notification templates in the Email Config section.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          <div className='flex justify-center sm:justify-end mt-6'>
            <Button onClick={handleSave} disabled={loading} size='lg' className='w-full sm:w-auto'>
              <Save className='h-4 w-4 mr-2' />
              Save All Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
