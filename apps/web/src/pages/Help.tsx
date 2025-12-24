import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  BookOpen,
  Dog,
  Users,
  Calendar,
  Settings,
  FileText,
  HelpCircle,
  Video,
  MessageSquare,
  ChevronRight,
  Heart,
  ListOrdered,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTopic {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  content: string;
  tags: string[];
}

const helpTopics: HelpTopic[] = [
  // Getting Started
  {
    id: 'account-setup',
    title: 'Account Setup',
    category: 'Getting Started',
    icon: Settings,
    description: 'Create your account and configure your breeder profile',
    content: `
# Account Setup

## Creating Your Account
1. Click "Sign Up" on the login page
2. Enter your email address and create a secure password
3. Verify your email address (check spam folder if needed)
4. Log in with your credentials

## Setting Up Your Breeder Profile
1. Navigate to **Settings** from the sidebar
2. Fill in your kennel information:
   - Kennel name
   - Location (city, state)
   - Contact details (phone, email, website)
   - About/description of your breeding program
3. Upload your kennel logo
4. Add social media links (optional)
5. Click **Save** to update your profile

## Initial Configuration
- **Email Settings**: Configure EmailJS for automated reminders
- **Reminder Settings**: Set pickup and deposit reminder timing
- **Public Website**: Enable your public breeder website
    `,
    tags: ['setup', 'account', 'profile', 'getting started'],
  },
  {
    id: 'first-dog',
    title: 'Adding Your First Dog',
    category: 'Getting Started',
    icon: Dog,
    description: 'Learn how to add dogs to your breeding program',
    content: `
# Adding Your First Dog

## Step-by-Step Guide
1. Click the **"+ Add Dog"** button (top right or sidebar)
2. Fill in basic information:
   - Name
   - Breed (searchable dropdown with 280+ breeds)
   - Sex (Male/Female)
   - Date of Birth
   - Color and markings

## Additional Details (Optional)
3. **Photos**: Upload photos (drag-and-drop or click to browse)
4. **Registration**: Add AKC/CKC registration numbers
5. **Program Status**: 
   - Breeding Dog (active breeding program)
   - Guardian Home (dog lives with family)
   - External Stud (breeding services only)
   - Retired

## After Adding
- View your dog in the **Dogs** page
- Click on the dog to access their full profile
- Add health records, DNA profiles, and weight tracking
    `,
    tags: ['dogs', 'add', 'breeding', 'getting started'],
  },

  // Dog Management
  {
    id: 'dog-profiles',
    title: 'Dog Profiles',
    category: 'Dog Management',
    icon: Dog,
    description: 'Managing comprehensive dog information',
    content: `
# Dog Profiles

## Accessing Dog Profiles
- Click on any dog from the **Dogs** page
- View complete information in tabs:
  - **Overview**: Basic info, photos, registration
  - **Health**: Vaccinations, vet visits, DNA profiles
  - **Pedigree**: 4-generation family tree
  - **Litters**: All litters (if breeding dog)
  - **Heat Cycles**: Tracking and predictions (females only)

## Health Tracking
**Vaccinations**
- Record vaccination date, type, and vet
- Track vaccination schedules
- View vaccination history

**DNA Profiles**
- Store genetic testing results
- Coat colors and patterns
- Health markers
- Body features and traits

**Weight Tracking**
- Log weights over time
- View weight chart
- Monitor growth patterns

## Editing Dogs
1. Click **Edit** button on dog profile
2. Update any information
3. Add/remove photos
4. Save changes
    `,
    tags: ['dogs', 'profiles', 'health', 'dna', 'tracking'],
  },
  {
    id: 'heat-cycles',
    title: 'Heat Cycle Management',
    category: 'Dog Management',
    icon: Heart,
    description: 'Track heat cycles and predict breeding windows',
    content: `
# Heat Cycle Management

## Recording Heat Cycles
1. Navigate to a female dog's profile
2. Click **Heat Cycles** tab
3. Click **Add Heat Cycle**
4. Enter:
   - Start date
   - End date (optional)
   - Was bred? (Yes/No)
   - Breeding dates (if applicable)
   - Notes

## Heat Predictions
The system automatically predicts the next heat cycle based on:
- Previous cycle dates
- Average cycle length (default: 197 days)
- Individual dog's cycle pattern

**Dashboard View**
- See upcoming heats for all breeding females
- Days until next expected heat
- Heat prediction accuracy improves with more data

## Best Practices
- Record every heat cycle, even if not bred
- Note behavioral changes in notes
- Update immediately when heat starts
- Track breeding dates precisely
    `,
    tags: ['heat', 'cycle', 'breeding', 'females', 'predictions'],
  },

  // Litter Management
  {
    id: 'creating-litters',
    title: 'Creating Litters',
    category: 'Litter Management',
    icon: Dog,
    description: 'Set up and manage litters from breeding to placement',
    content: `
# Creating Litters

## Starting a New Litter
1. Go to **Litters** page
2. Click **"+ Add Litter"**
3. Select **Sire** (father) and **Dam** (mother)
4. Enter breeding date
5. Set expected due date (automatically calculated: breeding date + 63 days)
6. Create a litter name (e.g., "Summer 2024 Litter")

## Litter Status Options
- **Planned**: Breeding planned or recently occurred
- **Expected**: Pregnancy confirmed, awaiting birth
- **Born**: Puppies have been born
- **Weaned**: Puppies are weaned
- **Ready**: Puppies ready for new homes
- **Placed**: All puppies have been placed

## After Birth
1. Update status to "Born"
2. Enter actual date of birth
3. Add individual puppies (see "Adding Puppies")
4. Set pickup ready date

## Litter Information
- Litter photo
- Number of puppies
- Available puppies count
- Pickup ready date
- Notes and special information
    `,
    tags: ['litter', 'puppies', 'breeding', 'whelping'],
  },
  {
    id: 'puppy-management',
    title: 'Puppy Management',
    category: 'Litter Management',
    icon: Dog,
    description: 'Track individual puppies from birth to placement',
    content: `
# Puppy Management

## Adding Puppies
1. Open a litter's detail page
2. Click **Add Puppy**
3. Enter puppy information:
   - Name
   - Sex
   - Color
   - Markings
   - Birth weight (optional)

## Puppy Status
- **Available**: Ready for sale
- **Reserved**: Deposit received, awaiting pickup
- **Sold**: Payment complete, delivered
- **Kept**: Staying with breeder

## Tracking & Records
**Weight Tracking**
- Log weights regularly (daily/weekly)
- View weight chart showing growth curve
- Compare weights across littermates

**Health Records**
- Vaccinations with dates and types
- Deworming schedules
- Vet check-ups
- Microchip information

**Sales Information**
- Set individual prices
- Record deposits
- Link to buyer (customer record)
- Generate contracts

## Puppy Photos
- Upload multiple photos per puppy
- First photo is featured image
- Drag to reorder photos
- Photos appear on public litter pages
    `,
    tags: ['puppies', 'litter', 'tracking', 'sales', 'weight'],
  },
  {
    id: 'care-schedules',
    title: 'Care Schedules & Routines',
    category: 'Litter Management',
    icon: Calendar,
    description: 'Create templates and track daily litter care',
    content: `
# Care Schedules & Routines

## Creating Care Templates
1. Go to **Litters** → Select litter → **Care** tab
2. Click **Templates** to create reusable schedules
3. Add tasks with:
   - Task name
   - Frequency (daily, weekly, as needed)
   - Time of day
   - Notes/instructions

## Daily Routines
**Common Tasks**
- Feeding schedules
- Cleaning and sanitation
- Weight checks
- Socialization activities
- Potty training
- Play time
- Health checks

## Drag-and-Drop Organization
- Reorder tasks by dragging
- Group related tasks together
- Copy templates for future litters

## Milestones
Track developmental milestones:
- Eyes open (10-14 days)
- First steps (2-3 weeks)
- First solid food (3-4 weeks)
- First vaccinations (6-8 weeks)
- Socialization periods

## Templates for Future Use
Save your best schedules as templates:
- Name templates clearly
- Include detailed instructions
- Reuse for consistency across litters
    `,
    tags: ['care', 'schedules', 'routines', 'templates', 'litter'],
  },

  // Customer & CRM
  {
    id: 'customer-management',
    title: 'Customer Management',
    category: 'Customer & CRM',
    icon: Users,
    description: 'Track customers, interactions, and purchases',
    content: `
# Customer Management

## Adding Customers
1. Navigate to **Customers** page
2. Click **Add Customer**
3. Enter contact information:
   - Name
   - Email
   - Phone
   - Address

## Customer Types
- **Prospect**: Initial inquiry, not yet qualified
- **Waitlist**: On waitlist for future litter
- **Buyer**: Purchased or reserved a puppy
- **Past Buyer**: Previous customer

## Interaction Tracking
**Logging Interactions**
1. Open customer record
2. Click **Add Interaction**
3. Select type:
   - Phone call
   - Email
   - In-person meeting
   - Video call
   - Other
4. Add date, subject, and detailed notes

**Timeline View**
- See all interactions chronologically
- Track communication history
- Note follow-up actions

## Purchase History
- Link purchases to specific puppies
- Track payment amounts and dates
- Monitor payment status
- View total customer value

## Customer Segments
Create segments to group customers:
- By location
- By preferences
- By status
- Custom criteria
    `,
    tags: ['customers', 'crm', 'interactions', 'tracking', 'sales'],
  },

  // Inquiries & Waitlist
  {
    id: 'inquiry-management',
    title: 'Managing Inquiries',
    category: 'Inquiries & Leads',
    icon: MessageSquare,
    description: 'Track and respond to puppy inquiries',
    content: `
# Managing Inquiries

## Inquiry Sources
Inquiries come from:
- Your public website contact form
- Email (manually added)
- Phone calls (manually logged)
- Social media (manually added)

## Inquiry Status Workflow
1. **New**: Just received, needs initial response
2. **Contacted**: You've reached out to them
3. **Qualified**: Good fit for your program
4. **Waitlist**: Sent waitlist application
5. **Reserved**: Puppy reserved with deposit
6. **Completed**: Transaction complete
7. **Not Interested**: No longer pursuing

## Viewing Inquiry Details
- Contact information
- Preferred puppy characteristics
- Timeline for puppy
- Living situation
- Dog experience level
- Notes and observations

## Converting Inquiries
**To Waitlist**
1. Open inquiry details
2. Click **Send Waitlist Application**
3. System sends application link via email
4. Application appears in Waitlist when submitted

**To Customer**
1. Click **Convert to Customer**
2. Data transfers automatically
3. Original inquiry remains linked

## Best Practices
- Respond to new inquiries within 24 hours
- Update status after each interaction
- Add detailed notes about preferences
- Set reminders for follow-ups
    `,
    tags: ['inquiries', 'leads', 'prospects', 'conversion'],
  },
  {
    id: 'waitlist-management',
    title: 'Waitlist Management',
    category: 'Inquiries & Leads',
    icon: ListOrdered,
    description: 'Organize and prioritize your puppy waitlist',
    content: `
# Waitlist Management

## Waitlist Applications
**Public Form**
- Generate embed code for your website
- Applicants fill out detailed form
- Applications appear in your dashboard automatically

**Application Information**
- Contact details
- Living situation (home type, yard, other pets)
- Experience with dogs
- Preferred puppy characteristics:
  - Sex (male/female/no preference)
  - Colors
  - Timeline
- Additional questions and requirements

## Organizing Priority
**Drag-and-Drop Ordering**
1. Go to **Waitlist** page
2. Drag applicants up or down to reorder
3. Position numbers update automatically
4. Top of list = highest priority

## Application Status
- **Pending**: Under review
- **Approved**: Accepted to waitlist
- **Active**: Actively waiting for puppy
- **Inactive**: Temporarily paused
- **Archived**: Completed or withdrawn

## Matching to Litters
When litter is born:
1. Review waitlist by priority
2. Match preferences to available puppies
3. Contact applicants in order
4. Update status when matched

## Converting to Customers
- Click **Convert to Customer**
- All information transfers
- Maintain link to original application
- Move to customer management

## Embed on Your Website
1. Go to **Waitlist** page
2. Click **Embed Code**
3. Copy HTML/iframe code
4. Paste into your website
5. Customize styling as needed
    `,
    tags: ['waitlist', 'applications', 'priority', 'matching'],
  },

  // Calendar & Reminders
  {
    id: 'calendar-reminders',
    title: 'Calendar & Reminders',
    category: 'Scheduling',
    icon: Calendar,
    description: 'Track important dates and set up automated alerts',
    content: `
# Calendar & Reminders

## Calendar View
**What's on the Calendar**
- Heat cycles (past and predicted)
- Breeding dates
- Due dates (expected whelping)
- Birth dates
- Pickup dates
- Vet appointments
- Vaccination schedules

**Navigation**
- Month view
- Color-coded events
- Click events to view details
- Jump to specific months

## Automated Reminders
**Pickup Reminders**
- Set days before pickup to send alert
- Automatically emails buyers (if configured)
- Appears in Reminders dashboard

**Deposit Reminders**
- Alert when deposits are due
- Track payment deadlines

**Heat Cycle Predictions**
- Notifications for upcoming heats
- Based on cycle history

## Manual Reminders
**Creating Reminders**
1. Go to **Reminders** page
2. Click **Add Reminder**
3. Choose type:
   - Vaccination
   - Deworming
   - Vet Visit
   - Breeding
   - Other
4. Set date and description
5. Link to dog or litter (optional)

## Reminder Dashboard
**Organized Sections**
- **Overdue**: Past due reminders
- **Today**: Due today
- **Upcoming**: Next 30 days

**Managing Reminders**
- Mark complete when finished
- Edit or delete reminders
- Quick links to related dogs/litters

## Email Notifications
**Setup Required**
- Configure EmailJS in Settings
- Add service ID, template IDs, public key
- Test configuration
- Enable reminder emails in Reminder Settings
    `,
    tags: ['calendar', 'reminders', 'schedule', 'alerts', 'notifications'],
  },

  // Settings & Configuration
  {
    id: 'email-setup',
    title: 'Email Configuration',
    category: 'Settings',
    icon: Settings,
    description: 'Set up EmailJS for automated communications',
    content: `
# Email Configuration

## Why Email Setup?
Email integration enables:
- Automated pickup reminders
- Deposit reminders
- Inquiry notifications
- Waitlist application confirmations

## EmailJS Setup Process

### Step 1: Create EmailJS Account
1. Go to [emailjs.com](https://www.emailjs.com/)
2. Sign up for free account
3. Verify your email address

### Step 2: Create Email Service
1. In EmailJS dashboard, click **Add New Service**
2. Choose your email provider (Gmail, Outlook, etc.)
3. Connect your email account
4. Note your **Service ID**

### Step 3: Create Email Templates
1. Click **Email Templates** → **Create New Template**
2. Create templates for:
   - Pickup reminders
   - Deposit reminders
   - Custom communications
3. Note each **Template ID**

### Step 4: Get Public Key
1. Go to **Account** settings in EmailJS
2. Copy your **Public Key**

### Step 5: Configure in App
1. Go to **Settings** in breeder app
2. Click **Email Settings**
3. Enter:
   - Service ID
   - Template IDs
   - Public Key
4. Click **Test Configuration** to verify
5. Save settings

## Troubleshooting
- Check spam folder for test emails
- Verify all IDs are correct
- Ensure EmailJS account is active
- Check email service connection status
    `,
    tags: ['email', 'emailjs', 'settings', 'configuration', 'reminders'],
  },

  // Public Website
  {
    id: 'public-website',
    title: 'Public Website Features',
    category: 'Public Features',
    icon: Globe,
    description: 'Your auto-generated breeder website and litter pages',
    content: `
# Public Website Features

## Public Breeder Website
**Automatic Generation**
Your public website is automatically created from your profile:
- Custom URL: [yourkennel].expertbreeder.com (example)
- Kennel information and description
- Photo gallery
- Contact form
- About your breeding program

**Enabling Your Website**
1. Go to **Settings**
2. Toggle **Enable Public Website**
3. Share your unique URL

**What Appears Publicly**
- Kennel name and logo
- Location (city/state)
- Contact information you choose to share
- About/description
- Photos you've uploaded
- Current/upcoming litters (if enabled)

## Public Litter Pages
**Individual Litter URLs**
Each litter gets its own public page:
- Litter photos and information
- Available puppies with photos
- Puppy details (sex, colors, price)
- Status (available, reserved, sold)
- Contact/inquiry form

**Enabling Litter Pages**
1. Go to litter details
2. Toggle **Make Public**
3. Share the unique litter URL

## Contact Form Integration
**Inquiry Capture**
- Contact form embedded on public pages
- Inquiries automatically added to your dashboard
- Get email notifications (if configured)
- Respond directly from dashboard

## Privacy Controls
Choose what information is public:
- Full address vs. city/state only
- Phone number display
- Email address display
- Which litters are public
- Photo selections

## SEO & Sharing
- Share links on social media
- Include in email signatures
- Add to business cards
- Post in breed-specific groups
    `,
    tags: ['website', 'public', 'litters', 'sharing', 'privacy'],
  },

  // Advanced Features
  {
    id: 'pedigrees',
    title: 'Pedigree Trees',
    category: 'Advanced Features',
    icon: FileText,
    description: 'View and export 4-generation pedigrees',
    content: `
# Pedigree Trees

## Viewing Pedigrees
**Access Points**
- Dog profile → **Pedigree** tab
- **Pedigrees** page from sidebar
- Search for any dog

**Pedigree Display**
- 4 generations (great-great-grandparents)
- Interactive dog cards with photos
- Color-coded by sex:
  - Pink: Females
  - Blue: Males
  - Gray: Puppies
- Age displayed on each card
- Program status shown
- Curved connection lines

## Pedigree Information
Each card shows:
- Dog photo
- Name
- Age
- Program status (breeding, guardian, retired)
- Quick "View" button to full profile

## Unknown Ancestors
- Clearly marked "Unknown" cards
- Fill in as information becomes available
- Pedigree updates automatically

## Export Options
**PDF Generation**
1. View pedigree
2. Click **Export PDF**
3. Professional pedigree certificate
4. Include for puppy buyers
5. Use for registrations

## Building Complete Pedigrees
- Add sire and dam when creating dog profiles
- System automatically builds family tree
- Update historic dogs as you learn more
- Import pedigrees from other sources

## Uses for Pedigrees
- Show to prospective buyers
- Registration documentation
- Breeding decisions
- Health tracking (inherited conditions)
- Show achievements tracking
    `,
    tags: ['pedigree', 'family tree', 'ancestors', 'export'],
  },
  {
    id: 'contracts-signatures',
    title: 'Contracts & Digital Signatures',
    category: 'Advanced Features',
    icon: FileText,
    description: 'Generate contracts and collect digital signatures',
    content: `
# Contracts & Digital Signatures

## Creating Contracts
**From Puppy Record**
1. Navigate to puppy details
2. Click **Generate Contract**
3. Choose contract template
4. Review auto-populated information:
   - Breeder details (from your profile)
   - Buyer details (from customer record)
   - Puppy information
   - Sale price and payment terms

**From Customer Record**
1. Open customer profile
2. Click **Create Contract**
3. Select puppy
4. Continue with contract generation

## Contract Templates
**Included Sections**
- Parties (breeder and buyer)
- Puppy identification
- Purchase price and payment terms
- Health guarantees
- Registration information
- Breeding rights/restrictions
- Return policy
- Liability limitations
- Signatures

**Customization**
- Edit terms and conditions
- Add specific clauses
- Include health guarantees
- Specify breeding rights
- Co-ownership terms

## Digital Signatures
**Signature Collection**
1. Review contract with buyer
2. Click **Sign Contract**
3. Breeder signs first using signature pad
4. Buyer signs using signature pad
5. Both signatures embedded in document

**Signature Pad Features**
- Draw with mouse or touchscreen
- Clear and redo signatures
- Signatures are permanent once saved

## PDF Generation
After signing:
- PDF automatically generated
- Includes both signatures
- Timestamp of signing
- Download for your records
- Email copy to buyer

## Storage & Retrieval
- All signed contracts stored in customer records
- Access from puppy records
- Download anytime
- Print copies as needed

## Legal Considerations
- Digital signatures legally binding in most jurisdictions
- Keep copies for your records
- Consult attorney for specific terms
- Update templates as laws change
    `,
    tags: ['contracts', 'signatures', 'legal', 'pdf', 'sales'],
  },

  // Troubleshooting
  {
    id: 'common-issues',
    title: 'Common Issues & Solutions',
    category: 'Troubleshooting',
    icon: HelpCircle,
    description: 'Solutions to frequently encountered problems',
    content: `
# Common Issues & Solutions

## Login Problems
**Can't Log In**
- Verify email and password are correct
- Check Caps Lock is off
- Use "Forgot Password" to reset
- Check spam folder for reset email
- Clear browser cache and try again
- Try different browser

**Email Not Verified**
- Check spam/junk folder
- Click verification link in email
- Request new verification email

## Data Not Appearing
**Recent Changes Not Showing**
- Refresh the page (F5 or Ctrl+R)
- Check internet connection
- Log out and log back in
- Clear browser cache

**Missing Dogs or Litters**
- Check if filters are applied
- Verify you're logged into correct account
- Ensure data was saved (look for confirmation)

## Photo Upload Issues
**Photos Won't Upload**
- Check file size (max 5MB recommended)
- Use supported formats: JPG, PNG, WebP
- Check internet connection speed
- Try smaller/compressed images
- Try one photo at a time

**Photos Not Displaying**
- Wait for upload to complete
- Refresh the page
- Check browser console for errors

## Email Not Sending
**Reminders Not Arriving**
- Verify EmailJS configuration in Settings
- Test email configuration
- Check spam/junk folder
- Ensure service is active in EmailJS
- Verify template IDs are correct
- Check email service connection

**Inquiry Notifications Not Working**
- Enable email notifications in Settings
- Configure notification template in EmailJS
- Verify public key is correct

## Performance Issues
**App Running Slow**
- Clear browser cache
- Close unused browser tabs
- Check internet connection speed
- Try different browser
- Update browser to latest version

**Large Photo Files**
- Compress images before uploading
- Use JPG format for photos
- Resize images to reasonable dimensions
- Remove unnecessary metadata

## Pedigree Display Issues
**Lines Not Showing**
- Refresh the page
- Try different browser
- Clear cache
- Report issue if persists

**Missing Ancestors**
- Add sire/dam information to dog profiles
- Update historic dog records
- Pedigree builds automatically from relationships

## Data Sync Issues
**Changes Not Saving**
- Look for "Save" confirmation message
- Check internet connection
- Don't close window during save
- Try again if error occurs

## Browser Compatibility
**Recommended Browsers**
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)

**Not Recommended**
- Internet Explorer
- Outdated browser versions

## Getting Additional Help
If issue persists:
1. Take screenshot of error
2. Note steps to reproduce
3. Check browser console for errors
4. Contact support with details
    `,
    tags: ['troubleshooting', 'issues', 'problems', 'help', 'errors'],
  },
];

const categories = [
  'All Topics',
  'Getting Started',
  'Dog Management',
  'Litter Management',
  'Customer & CRM',
  'Inquiries & Leads',
  'Scheduling',
  'Settings',
  'Public Features',
  'Advanced Features',
  'Troubleshooting',
];

export function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);

  const filteredTopics = helpTopics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'All Topics' || topic.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('# ')) {
        return (
          <h1 key={i} className='text-3xl font-bold mt-8 mb-4'>
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className='text-2xl font-semibold mt-6 mb-3'>
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className='text-xl font-semibold mt-4 mb-2'>
            {line.substring(4)}
          </h3>
        );
      }

      // Bold
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className='font-semibold mt-3 mb-1'>
            {line.substring(2, line.length - 2)}
          </p>
        );
      }

      // Lists
      if (line.match(/^\d+\./)) {
        return (
          <li key={i} className='ml-6 mb-1'>
            {line.substring(line.indexOf('.') + 1).trim()}
          </li>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className='ml-6 mb-1 list-disc'>
            {line.substring(2)}
          </li>
        );
      }

      // Regular paragraphs
      if (line.trim()) {
        return (
          <p key={i} className='mb-2 text-muted-foreground'>
            {line}
          </p>
        );
      }

      return <br key={i} />;
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Help Center</h1>
          <p className='text-muted-foreground mt-2'>
            Find answers and learn how to use the Breeder Management App
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <a href='/HELP_OUTLINE.md' target='_blank'>
              <BookOpen className='h-4 w-4 mr-2' />
              Full Documentation
            </a>
          </Button>
          <Button variant='outline'>
            <Video className='h-4 w-4 mr-2' />
            Video Tutorials
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Sidebar */}
        <div className='lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Search Help</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search topics...'
                  className='pl-9'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className='space-y-1'>
                <p className='text-sm font-medium mb-2'>Categories</p>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedTopic(null);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className='mt-4'>
            <CardHeader>
              <CardTitle className='text-lg'>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Button variant='ghost' className='w-full justify-start' asChild>
                <a href='mailto:support@example.com'>
                  <MessageSquare className='h-4 w-4 mr-2' />
                  Contact Support
                </a>
              </Button>
              <Button variant='ghost' className='w-full justify-start'>
                <Video className='h-4 w-4 mr-2' />
                Video Library
              </Button>
              <Button variant='ghost' className='w-full justify-start'>
                <FileText className='h-4 w-4 mr-2' />
                PDF Guides
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className='lg:col-span-2'>
          {selectedTopic ? (
            <Card>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex items-start gap-3'>
                    <div className='p-2 bg-primary/10 rounded-lg'>
                      <selectedTopic.icon className='h-6 w-6 text-primary' />
                    </div>
                    <div>
                      <CardTitle>{selectedTopic.title}</CardTitle>
                      <Badge variant='secondary' className='mt-2'>
                        {selectedTopic.category}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setSelectedTopic(null)}
                  >
                    Back to Topics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='prose prose-sm max-w-none'>
                  {renderContent(selectedTopic.content)}
                </div>

                <div className='mt-8 pt-6 border-t'>
                  <p className='text-sm text-muted-foreground mb-2'>Tags:</p>
                  <div className='flex flex-wrap gap-2'>
                    {selectedTopic.tags.map((tag) => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>
                  {selectedCategory === 'All Topics'
                    ? 'All Help Topics'
                    : selectedCategory}
                </h2>
                <p className='text-sm text-muted-foreground'>
                  {filteredTopics.length} topic
                  {filteredTopics.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className='grid gap-4'>
                {filteredTopics.map((topic) => (
                  <Card
                    key={topic.id}
                    className='cursor-pointer hover:shadow-md transition-shadow'
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-start gap-3'>
                        <div className='p-2 bg-primary/10 rounded-lg flex-shrink-0'>
                          <topic.icon className='h-5 w-5 text-primary' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-2'>
                            <h3 className='font-semibold'>{topic.title}</h3>
                            <ChevronRight className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                          </div>
                          <p className='text-sm text-muted-foreground mt-1'>
                            {topic.description}
                          </p>
                          <div className='flex items-center gap-2 mt-2'>
                            <Badge variant='secondary' className='text-xs'>
                              {topic.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredTopics.length === 0 && (
                  <Card>
                    <CardContent className='p-12 text-center'>
                      <HelpCircle className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                      <h3 className='text-lg font-semibold mb-2'>
                        No topics found
                      </h3>
                      <p className='text-muted-foreground'>
                        Try adjusting your search or browse different categories
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
