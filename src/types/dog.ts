export interface HealthTest {
  id: string;
  test: string;
  result: string;
  date: string;
}

export interface ShotRecord {
  id: string;
  vaccine: string;
  dateGiven: string;
  dueDate?: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  title: string;
  type: 'vaccination' | 'deworming' | 'vet_visit' | 'heat_expected' | 'due_date' | 'pickup' | 'registration' | 'custom';
  date: string;
  dogId?: string;
  litterId?: string;
  puppyId?: string; // For puppy-specific reminders like registration
  completed?: boolean;
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  unit: 'lbs' | 'kg';
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  startDate: string;
  endDate?: string;
  frequency: string;
  notes?: string;
}

export interface Deworming {
  id: string;
  product: string;
  date: string;
  weight: number;
  nextDueDate?: string;
  notes?: string;
}

export interface VetVisit {
  id: string;
  date: string;
  veterinarian: string;
  clinic?: string;
  reason: string;
  diagnosis?: string;
  treatment?: string;
  followUpDate?: string;
  cost?: number;
  notes?: string;
}

export interface HeatCycle {
  id: string;
  startDate: string;
  endDate?: string;
  intensity?: 'light' | 'normal' | 'heavy';
  bred?: boolean;
  breedingDates?: string[];
  sireId?: string;
  notes?: string;
}

export interface Buyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: 'waitlist' | 'approved' | 'reserved' | 'completed';
  dateAdded: string;
  preferredSex?: 'male' | 'female' | 'either';
  preferredColor?: string;
  // Portal access
  portalAccessCode?: string;
  portalEnabled?: boolean;
}

export interface PuppyUpdate {
  id: string;
  date: string;
  title: string;
  content: string;
  photos?: string[];
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  expectedWeek: number; // Week of age when milestone typically occurs
  completedDate?: string;
  notes?: string;
}

// Default puppy milestones template
export const DEFAULT_PUPPY_MILESTONES: Omit<Milestone, 'id' | 'completedDate' | 'notes'>[] = [
  { name: 'Eyes Open', description: 'Puppies begin to open their eyes', expectedWeek: 2 },
  { name: 'Ears Open', description: 'Puppies begin to hear sounds', expectedWeek: 2 },
  { name: 'First Steps', description: 'Puppies start walking', expectedWeek: 3 },
  { name: 'First Teeth', description: 'Baby teeth start coming in', expectedWeek: 3 },
  { name: 'Weaning Started', description: 'Introduction to solid food', expectedWeek: 4 },
  { name: 'First Deworming', description: 'First deworming treatment', expectedWeek: 2 },
  { name: 'Second Deworming', description: 'Second deworming treatment', expectedWeek: 4 },
  { name: 'Third Deworming', description: 'Third deworming treatment', expectedWeek: 6 },
  { name: 'First Vaccination', description: 'DHPP or similar vaccine', expectedWeek: 6 },
  { name: 'Fully Weaned', description: 'Eating solid food only', expectedWeek: 6 },
  { name: 'Vet Check', description: 'First veterinary examination', expectedWeek: 6 },
  { name: 'Microchipped', description: 'Microchip implanted', expectedWeek: 7 },
  { name: 'Second Vaccination', description: 'Booster vaccination', expectedWeek: 8 },
  { name: 'Ready for Home', description: 'Puppy ready for new family', expectedWeek: 8 },
];

// Registration Information
export interface Registration {
  registry: 'AKC' | 'CKC' | 'UKC' | 'FCI' | 'Other';
  registrationNumber?: string;
  registeredName?: string;
  registrationType: 'none' | 'limited' | 'full';
  status: 'not_started' | 'pending' | 'submitted' | 'approved' | 'issued';
  applicationDate?: string;
  submissionDate?: string;
  approvalDate?: string;
  registrationDeadline?: string; // Date by which registration must be completed
  documents?: RegistrationDocument[];
  notes?: string;
}

export interface RegistrationDocument {
  id: string;
  name: string;
  type: 'application' | 'certificate' | 'pedigree' | 'litter_certificate' | 'other';
  url: string;
  uploadDate: string;
  notes?: string;
}

export interface Puppy {
  id: string;
  name?: string;
  tempName?: string;
  sex: 'male' | 'female';
  color: string;
  weight?: number;
  weightUnit?: 'lbs' | 'kg';
  collar?: string;
  microchip?: string;
  photos: string[];
  status: 'available' | 'reserved' | 'sold' | 'kept';
  buyerId?: string;
  reservationDate?: string;
  salePrice?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  finalPaymentDate?: string;
  pickupDate?: string;

  // Contract information
  contractType?: 'pet' | 'breeding_rights' | 'co_ownership';
  breedingRights?: BreedingRights;
  coOwnership?: CoOwnership;

  // Registration tracking
  registration?: Registration;

  healthTests: HealthTest[];
  shotRecords: ShotRecord[];
  weightHistory: WeightEntry[];
  updates?: PuppyUpdate[];
  milestones?: Milestone[];
  notes?: string;
}

// Breeding Rights Contract Details
export interface BreedingRights {
  restrictions?: string[]; // e.g., "Must obtain health clearances before breeding"
  requiredHealthTests?: string[]; // e.g., ["Hip Dysplasia", "Eye Clearance"]
  minimumBreedingAge?: number; // in months
  litterReturnAgreement?: boolean; // Breeder gets pick of litter
  pickOfLitter?: 'first' | 'second' | 'none';
  maxLitters?: number; // Maximum litters allowed
  spayNeuterByAge?: number; // Age in months when must be spayed/neutered after breeding
  requiresBreederApproval?: boolean; // Breeder must approve mate
  additionalTerms?: string;
}

// Co-Ownership Contract Details
export interface CoOwnership {
  coOwnerName: string;
  coOwnerEmail?: string;
  coOwnerPhone?: string;
  coOwnerAddress?: string;
  ownershipPercentage?: number; // Breeder's percentage (e.g., 50 for 50/50)
  primaryResidence: 'breeder' | 'co_owner'; // Where dog primarily lives

  // Breeding arrangements
  breedingRights: 'breeder' | 'co_owner' | 'shared';
  litterArrangement?: string; // e.g., "Breeder gets first pick, co-owner gets second pick"
  maxLitters?: number;

  // Show/competition arrangements
  showRights?: 'breeder' | 'co_owner' | 'shared';

  // Financial arrangements
  expenseSharing?: {
    veterinary?: number; // Percentage split (0-100)
    food?: number;
    showing?: number;
    breeding?: number;
    other?: number;
  };

  // Termination conditions
  buyoutOption?: boolean;
  buyoutAmount?: number;
  terminationAge?: number; // Age when co-ownership ends (in months)
  terminationConditions?: string;

  additionalTerms?: string;
}

export interface Expense {
  id: string;
  category: 'vet' | 'food' | 'supplies' | 'testing' | 'advertising' | 'other';
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

// Litter Registration (for bulk litter registration)
export interface LitterRegistration {
  registry: 'AKC' | 'CKC' | 'UKC' | 'FCI' | 'Other';
  litterNumber?: string; // Litter registration number from registry
  applicationDate?: string;
  submissionDate?: string;
  approvalDate?: string;
  status: 'not_started' | 'pending' | 'submitted' | 'approved' | 'issued';
  documents?: RegistrationDocument[];
  notes?: string;
}

export interface Litter {
  id: string;
  litterName?: string;
  damId: string;
  sireId: string;
  dateOfBirth: string;
  expectedDateOfBirth?: string;
  status: 'planned' | 'pregnant' | 'born' | 'weaning' | 'ready' | 'completed';
  puppies: Puppy[];
  buyers: Buyer[];
  announceDate?: string;
  pickupReadyDate?: string;
  litterNotes?: string;
  pricing?: {
    petPrice?: number;
    breedingPrice?: number;
    showPrice?: number;
  };
  expenses?: Expense[];
  milestones?: Milestone[];
  careTasks?: CareTask[];

  // Litter-level registration
  litterRegistration?: LitterRegistration;
}

// Guardian Home Information
export interface GuardianHome {
  guardianName: string;
  email?: string;
  phone?: string;
  address?: string;
  contractDate: string;
  contractDocument?: string; // URL to stored contract
  littersAllowed: number; // Total litters allowed per contract
  littersCompleted: number; // Litters completed so far
  notes?: string;
}

export interface Dog {
  id: string;
  name: string;
  registeredName?: string;
  callName?: string;
  kennelName?: string;
  breederName?: string;
  microchip?: string;
  breed: string;
  sex: 'male' | 'female';
  dateOfBirth: string;
  color: string;
  sireId?: string;
  damId?: string;
  isDeceased?: boolean;
  dateOfDeath?: string;
  photos: string[];
  healthTests: HealthTest[];
  shotRecords: ShotRecord[];
  reminders: Reminder[];
  weightHistory: WeightEntry[];
  medications: Medication[];
  dewormings: Deworming[];
  vetVisits: VetVisit[];
  heatCycles?: HeatCycle[];
  dnaProfile?: DnaProfile;

  // Registration tracking
  registration?: Registration;

  // Breeder Program Status
  programStatus?: 'owned' | 'guardian' | 'external_stud' | 'co-owned';
  guardianHome?: GuardianHome;

  notes?: string;
}

// DNA Testing Results (Embark, Wisdom Panel, etc.)
export interface DnaProfile {
  provider?: string; // Embark, Wisdom Panel, etc.
  testDate?: string;
  profileId?: string; // Provider's ID/reference number

  // Breed composition
  breedComposition?: {
    breed: string;
    percentage: number;
  }[];

  // Coat Color Loci
  coatColor?: {
    E?: string; // Extension (e/e = recessive red)
    K?: string; // Dominant Black (KB/KB, KB/ky, ky/ky)
    A?: string; // Agouti (ay/ay, aw/aw, at/at, a/a)
    B?: string; // Brown (B/B, B/b, b/b)
    D?: string; // Dilution (D/D, D/d, d/d)
    Em?: string; // Melanistic Mask
    S?: string; // Spotting/Piebald
    M?: string; // Merle (M/m, m/m)
    H?: string; // Harlequin
    T?: string; // Ticking
  };

  // Coat Type & Texture Loci
  coatType?: {
    L?: string; // Coat Length (L/L = short, l/l = long)
    R?: string; // Curl/Wave (R/R = curl)
    I?: string; // Furnishings/Wire (I/I = wire)
    SD?: string; // Shedding
    IC?: string; // Improper Coat
  };

  // Body Features
  bodyFeatures?: {
    tailLength?: string; // Natural Bobtail
    earType?: string; // Ear set/type
    muzzleLength?: string;
    legLength?: string;
    bodySize?: string;
    backType?: string;
  };

  // Genetic Health Conditions (Common across breeds)
  healthConditions?: Record<string, 'clear' | 'carrier' | 'at_risk' | 'not_tested'>;

  // Performance & Behavior Traits
  performanceTraits?: {
    athleticism?: string;
    appetite?: string;
    biddability?: string;
    boldness?: string;
    calmness?: string;
    dogSociability?: string;
    humanSociability?: string;
    predatoryBehavior?: string;
    wanderlust?: string;
  };

  // Blood Type & Other Medical
  medical?: {
    bloodType?: string; // DEA 1.1, etc.
    mdr1?: 'normal' | 'carrier' | 'affected' | 'not_tested'; // Drug sensitivity
    dmGenotype?: string; // Degenerative Myelopathy
  };

  // Coefficient of Inbreeding
  coi?: number;

  // Additional data
  notes?: string;
}

// Common genetic health conditions tested by Embark/Wisdom Panel
export const COMMON_HEALTH_CONDITIONS = [
  // Orthopedic
  'Hip Dysplasia',
  'Elbow Dysplasia',
  'Degenerative Myelopathy (DM)',
  'Exercise-Induced Collapse (EIC)',

  // Eye Conditions
  'Progressive Retinal Atrophy (PRA)',
  'Collie Eye Anomaly (CEA)',
  'Primary Lens Luxation (PLL)',
  'Glaucoma',
  'Cataracts',

  // Cardiac
  'Dilated Cardiomyopathy (DCM)',
  'Arrhythmogenic Right Ventricular Cardiomyopathy',

  // Neurological
  'Centronuclear Myopathy',
  'Neonatal Encephalopathy',
  'Cerebellar Ataxia',
  'Epilepsy',

  // Blood/Immune
  'Von Willebrand Disease Type I',
  'Von Willebrand Disease Type II',
  'Von Willebrand Disease Type III',
  'Hemophilia A',
  'Pyruvate Kinase Deficiency',

  // Kidney/Urinary
  'Hyperuricosuria (HUU)',
  'Cystinuria',
  'Polycystic Kidney Disease',

  // Metabolic
  'Glycogen Storage Disease',
  'Copper Toxicosis',

  // Other
  'Multi-Drug Resistance (MDR1)',
  'Ichthyosis',
  'Ectodermal Dysplasia',
  'Chondrodysplasia',
];

export type NewDog = Omit<Dog, 'id'>;

// Care task templates for litter management
export interface CareTask {
  id: string;
  name: string;
  description?: string;
  weekDue: number; // Week of litter age when task is due
  completed?: boolean;
  completedDate?: string;
  notes?: string;
}

// Daily Routine Task
export interface DailyRoutineTask {
  id: string;
  name: string;
  description?: string;
  timeOfDay: 'morning' | 'evening' | 'both';
  weekStart: number; // Week to start this routine
  weekEnd?: number; // Week to end this routine (optional, continues indefinitely if not set)
  order: number; // Order within the time of day
}

export const DEFAULT_CARE_TEMPLATES: Omit<CareTask, 'id' | 'completed' | 'completedDate' | 'notes'>[] = [
  // Week 1
  { name: 'Weigh puppies', description: 'Record birth weights', weekDue: 0 },
  { name: 'Check umbilical cords', description: 'Ensure cords are drying properly', weekDue: 0 },
  { name: 'Monitor nursing', description: 'Ensure all puppies are nursing well', weekDue: 0 },
  // Week 2
  { name: 'First deworming', description: 'Pyrantel pamoate', weekDue: 2 },
  { name: 'Trim nails', description: 'First nail trim', weekDue: 2 },
  { name: 'Weekly weigh-in', description: 'Track growth', weekDue: 2 },
  // Week 3
  { name: 'Begin socialization', description: 'Gentle handling, new sounds', weekDue: 3 },
  { name: 'Weekly weigh-in', description: 'Track growth', weekDue: 3 },
  // Week 4
  { name: 'Second deworming', description: 'Pyrantel pamoate', weekDue: 4 },
  { name: 'Introduce gruel', description: 'Start weaning process', weekDue: 4 },
  { name: 'Trim nails', description: 'Second nail trim', weekDue: 4 },
  // Week 5
  { name: 'Increase solid food', description: 'Reduce nursing dependence', weekDue: 5 },
  { name: 'Weekly weigh-in', description: 'Track growth', weekDue: 5 },
  // Week 6
  { name: 'Third deworming', description: 'Pyrantel pamoate', weekDue: 6 },
  { name: 'First vaccination', description: 'DHPP vaccine', weekDue: 6 },
  { name: 'Vet health check', description: 'First vet exam', weekDue: 6 },
  { name: 'Trim nails', description: 'Third nail trim', weekDue: 6 },
  // Week 7
  { name: 'Microchipping', description: 'Implant microchips', weekDue: 7 },
  { name: 'Individual photos', description: 'Update buyer photos', weekDue: 7 },
  // Week 8
  { name: 'Second vaccination', description: 'DHPP booster', weekDue: 8 },
  { name: 'Final vet check', description: 'Health certificates', weekDue: 8 },
  { name: 'Prepare puppy packets', description: 'Contracts, records, food samples', weekDue: 8 },
  { name: 'Trim nails', description: 'Pre-pickup nail trim', weekDue: 8 },
];

export const DEFAULT_DAILY_ROUTINES: Omit<DailyRoutineTask, 'id'>[] = [
  // Morning routines
  { name: 'Check mom and puppies', description: 'Visual health check', timeOfDay: 'morning', weekStart: 0, order: 1 },
  { name: 'Clean whelping area', description: 'Remove soiled bedding, sanitize', timeOfDay: 'morning', weekStart: 0, order: 2 },
  { name: 'Weigh puppies', description: 'Daily weight tracking', timeOfDay: 'morning', weekStart: 0, weekEnd: 2, order: 3 },
  { name: 'Feed mom', description: 'High-quality puppy food', timeOfDay: 'morning', weekStart: 0, order: 4 },
  { name: 'Feed puppies', description: 'Puppy gruel/kibble', timeOfDay: 'morning', weekStart: 4, order: 5 },
  { name: 'Socialization time', description: 'Handling, sounds, new experiences', timeOfDay: 'morning', weekStart: 3, order: 6 },

  // Evening routines
  { name: 'Check mom and puppies', description: 'Visual health check', timeOfDay: 'evening', weekStart: 0, order: 1 },
  { name: 'Clean whelping area', description: 'Remove soiled bedding, freshen water', timeOfDay: 'evening', weekStart: 0, order: 2 },
  { name: 'Feed mom', description: 'High-quality puppy food', timeOfDay: 'evening', weekStart: 0, order: 3 },
  { name: 'Feed puppies', description: 'Puppy gruel/kibble', timeOfDay: 'evening', weekStart: 4, order: 4 },
  { name: 'Play and enrichment', description: 'Age-appropriate toys and activities', timeOfDay: 'evening', weekStart: 3, order: 5 },
];

// Breeder Profile for public website
export interface BreederProfile {
  id: string;
  userId: string;
  breederName: string;
  kennelName?: string;
  tagline?: string;
  about: string;
  philosophy?: string;
  experience?: string;

  // Contact Information
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;

  // Social Media
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;

  // Breeds
  primaryBreed: string;
  otherBreeds?: string[];

  // Photos
  logo?: string;
  coverPhoto?: string;
  facilityPhotos?: string[];

  // Credentials
  akc?: string; // AKC Breeder of Merit, etc.
  otherOrganizations?: string[];
  certifications?: string[];

  // Health Testing Commitment
  healthTestingDescription?: string;
  healthGuarantee?: string;

  // Programs
  guardianProgramAvailable?: boolean;
  guardianProgramDescription?: string;

  // Settings
  acceptingInquiries?: boolean;
  showPricing?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

// Testimonial
export interface Testimonial {
  id: string;
  userId: string;
  customerName: string;
  customerLocation?: string;
  puppyName?: string;
  purchaseDate?: string;
  rating?: number; // 1-5
  comment: string;
  photos?: string[];
  featured?: boolean;
  approved?: boolean;
  createdAt?: string;
}

// Inquiry/Lead
export interface Inquiry {
  id: string;
  userId: string; // Breeder's user ID
  name: string;
  email: string;
  phone?: string;

  // Preferences
  preferredBreed?: string;
  preferredSex?: 'male' | 'female' | 'either';
  preferredColor?: string;
  timeline?: string; // "immediate", "3-6 months", "6-12 months", "1+ year"

  // Status
  status: 'new' | 'contacted' | 'qualified' | 'waitlist' | 'reserved' | 'completed' | 'not_interested';
  priority?: 'low' | 'medium' | 'high';

  // Communication
  message: string;
  notes?: string; // Breeder's internal notes

  // Source
  source?: 'website' | 'referral' | 'social_media' | 'other';
  referredBy?: string;

  // Follow-up
  lastContactDate?: string;
  nextFollowUpDate?: string;

  createdAt?: string;
  updatedAt?: string;
}

// Master Waitlist Entry
export interface WaitlistEntry {
  id: string;
  userId: string; // Breeder's user ID

  // Customer Information
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Application Details
  applicationDate: string;
  status: 'pending' | 'approved' | 'active' | 'matched' | 'reserved' | 'completed' | 'withdrawn' | 'declined';

  // Preferences
  preferredBreed?: string;
  preferredSex?: 'male' | 'female' | 'either';
  preferredColors?: string[]; // Multiple color preferences
  preferredSize?: 'small' | 'medium' | 'large' | 'any';
  timeline?: string; // When they want a puppy

  // Questionnaire
  homeOwnership?: 'own' | 'rent';
  hasYard?: boolean;
  yardFenced?: boolean;
  otherPets?: string; // Description of other pets
  children?: boolean;
  childrenAges?: string;
  experience?: string; // Dog ownership experience
  lifestyle?: string; // Active, moderate, relaxed
  reason?: string; // Why they want a dog

  // Waitlist Management
  position?: number; // Position in waitlist (1 = first)
  priority?: 'standard' | 'priority' | 'vip';

  // Deposit
  depositRequired: boolean;
  depositAmount?: number;
  depositPaid?: boolean;
  depositDate?: string;
  depositMethod?: string; // Check, PayPal, Venmo, etc.
  depositRefundable?: boolean;

  // Assignment
  assignedLitterId?: string; // Which litter they're assigned to
  assignedPuppyId?: string; // Which puppy they selected/were assigned

  // Communication
  notes?: string; // Breeder's internal notes
  lastContactDate?: string;
  communicationLog?: CommunicationNote[];

  // References
  vetReference?: string;
  personalReferences?: string[];

  createdAt?: string;
  updatedAt?: string;
}

export interface CommunicationNote {
  id: string;
  date: string;
  type: 'email' | 'phone' | 'text' | 'meeting' | 'other';
  summary: string;
  details?: string;
}

// CRM - Customer Relationship Management
export interface Customer {
  id: string;
  userId: string; // Breeder's user ID

  // Basic Information
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  // Customer Type & Status
  type: 'prospect' | 'waitlist' | 'buyer' | 'past_buyer' | 'guardian' | 'referral_source';
  status: 'active' | 'inactive' | 'archived';

  // Tags & Segmentation
  tags?: string[]; // e.g., "VIP", "repeat buyer", "influencer", "vet", etc.
  source?: 'website' | 'referral' | 'social_media' | 'event' | 'advertising' | 'other';
  referredBy?: string; // Customer ID who referred them

  // Purchase History
  purchases?: Purchase[];
  totalPurchases?: number;
  totalRevenue?: number;
  lifetimeValue?: number;

  // Communication Preferences
  preferredContact?: 'email' | 'phone' | 'text';
  emailOptIn?: boolean;
  smsOptIn?: boolean;

  // Important Dates
  firstContactDate?: string;
  lastContactDate?: string;
  lastPurchaseDate?: string;
  birthday?: string;
  anniversary?: string; // Anniversary of first puppy

  // Social Media
  facebook?: string;
  instagram?: string;

  // Notes & History
  notes?: string;
  interactions?: Interaction[];

  // Related Records
  waitlistEntryId?: string;
  inquiryIds?: string[];
  litterIds?: string[]; // Litters they purchased from

  createdAt?: string;
  updatedAt?: string;
}

export interface Purchase {
  id: string;
  litterId: string;
  puppyId: string;
  puppyName?: string;
  purchaseDate: string;
  amount: number;
  depositAmount?: number;
  type: 'pet' | 'breeding' | 'show';
  status: 'reserved' | 'paid' | 'completed';
}

export interface Interaction {
  id: string;
  date: string;
  type: 'email' | 'phone' | 'text' | 'meeting' | 'video_call' | 'visit' | 'other';
  subject: string;
  notes?: string;
  outcome?: string;
  followUpDate?: string;
  followUpCompleted?: boolean;
  attachments?: string[]; // URLs to files
}

// Customer Segment for filtering/reporting
export interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  filters: {
    types?: Customer['type'][];
    tags?: string[];
    minPurchases?: number;
    minLifetimeValue?: number;
    hasActivePuppy?: boolean;
    lastContactDaysAgo?: number; // e.g., not contacted in 30 days
  };
}

// Referral tracking
export interface Referral {
  id: string;
  userId: string;
  referrerId: string; // Customer who made the referral
  referredId: string; // Customer who was referred
  status: 'pending' | 'converted' | 'expired';
  referralDate: string;
  conversionDate?: string;
  reward?: string; // What the referrer received
  notes?: string;
}
