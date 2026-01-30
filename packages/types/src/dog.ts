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
  type:
    | 'vaccination'
    | 'deworming'
    | 'vet_visit'
    | 'heat_expected'
    | 'due_date'
    | 'pickup'
    | 'registration'
    | 'custom';
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

export interface VetVisitAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document' | 'email' | 'other';
  url: string;
  uploadDate: string;
  size?: number;
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
  attachments?: VetVisitAttachment[];
}

export interface HeatCycle {
  id: string;
  dogId: string;
  userId: string;
  startDate: string;
  endDate?: string;
  intensity?: 'light' | 'normal' | 'heavy';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BreedingRecord {
  id: string;
  dogId: string; // Female dog
  heatCycleId: string; // Link to heat cycle
  userId: string;
  studId?: string; // Male dog ID if from own kennel
  studName: string; // External stud name or registered name
  breedingDate: string; // ISO date string
  method: 'natural' | 'ai' | 'surgical_ai';
  aiDetails?: string; // If AI, details about semen source
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Individual breeding attempt/date within a stud job
 * A typical stud job has 2-3 breeding dates
 */
export interface StudJobBreeding {
  id: string;
  date: string; // ISO date string
  time?: string; // Time of breeding (e.g., "9:00 AM")
  method: 'natural' | 'ai' | 'surgical_ai';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  aiDetails?: string;
  successful?: boolean; // Did the tie/insemination happen successfully
  duration?: number; // Duration in minutes (for natural breeding ties)
  heatDay?: number; // What day of heat the dam is in
  progesteroneTest?: boolean; // Whether a progesterone test was done
  progesteroneResult?: string; // The result of the progesterone test (e.g., "5.2 ng/ml")
  notes?: string;
}

export interface StudJobAddOn {
  id: string;
  service: string;
  cost: number;
  paid: boolean;
  notes?: string;
}

/**
 * Stud Job tracking
 * Links to breeder/client contact via contactId
 */
export interface StudJob {
  id: string;
  studId: string; // Male dog ID from own kennel
  userId: string; // Owner of the stud
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

  // Female dog info
  femaleDogName: string;
  femaleDogId?: string; // If the female owner uses the app

  /** Primary reference to breeder's Contact record in customers collection */
  contactId: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Breeder name - now stored in Contact record.
   */
  breederName?: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Breeder user ID - now tracked via Contact record.
   */
  breederUserId?: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Breeder email - now stored in Contact record.
   */
  breederEmail?: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Breeder phone - now stored in Contact record.
   */
  breederPhone?: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId instead.
   * Will be removed in v2.0.0 (target: March 2026).
   */
  customerId?: string;

  // Dates
  scheduledDate?: string; // ISO date string for initial/first breeding

  // Multiple breedings
  breedings: StudJobBreeding[]; // Track all breeding dates

  // Litter tracking
  litterId?: string; // Link to litter if created
  puppyCount?: number;

  // Financial
  studFee?: number; // Base stud fee
  studFeePaid?: boolean;
  additionalBreedingFee?: number; // Cost per additional breeding
  additionalBreedingsPaid?: boolean;
  pickOfLitter?: boolean;
  isRebreed?: boolean; // Indicates if this is a rebreed (typically at reduced/no cost)
  rebreedOriginalJobId?: string; // Reference to original stud job if this is a rebreed
  addOns?: StudJobAddOn[]; // Additional services

  // Contract
  contract?: StudServiceContract;

  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Stud Service Contract
export interface StudServiceContract {
  id: string;
  templateId?: string; // If created from a template
  status: 'draft' | 'sent' | 'signed' | 'completed' | 'cancelled';

  // Contract sections with editable content
  sections: ContractSection[];

  // Signatures
  breederSignature?: ContractSignature;
  clientSignature?: ContractSignature;

  // Dates
  createdDate: string;
  sentDate?: string;
  signedDate?: string;
  expiryDate?: string;

  // PDF generation
  pdfUrl?: string; // URL to generated PDF
  lastGeneratedAt?: string;
}

// Contract section that can be edited
export interface ContractSection {
  id: string;
  title: string;
  content: string; // Markdown or HTML content
  order: number;
  editable: boolean; // Whether breeder can edit this section
  required: boolean; // Whether this section must be included
}

// Digital signature
export interface ContractSignature {
  name: string;
  email: string;
  signedAt: string;
  ipAddress?: string;
  signature?: string; // Base64 encoded signature image or typed name
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
export const DEFAULT_PUPPY_MILESTONES: Omit<
  Milestone,
  'id' | 'completedDate' | 'notes'
>[] = [
  {
    name: 'Eyes Open',
    description: 'Puppies begin to open their eyes',
    expectedWeek: 2,
  },
  {
    name: 'Ears Open',
    description: 'Puppies begin to hear sounds',
    expectedWeek: 2,
  },
  {
    name: 'First Steps',
    description: 'Puppies start walking',
    expectedWeek: 3,
  },
  {
    name: 'First Teeth',
    description: 'Baby teeth start coming in',
    expectedWeek: 3,
  },
  {
    name: 'Weaning Started',
    description: 'Introduction to solid food',
    expectedWeek: 4,
  },
  {
    name: 'First Deworming',
    description: 'First deworming treatment',
    expectedWeek: 2,
  },
  {
    name: 'Second Deworming',
    description: 'Second deworming treatment',
    expectedWeek: 4,
  },
  {
    name: 'Third Deworming',
    description: 'Third deworming treatment',
    expectedWeek: 6,
  },
  {
    name: 'First Vaccination',
    description: 'DHPP or similar vaccine',
    expectedWeek: 6,
  },
  {
    name: 'Fully Weaned',
    description: 'Eating solid food only',
    expectedWeek: 6,
  },
  {
    name: 'Vet Check',
    description: 'First veterinary examination',
    expectedWeek: 6,
  },
  { name: 'Microchipped', description: 'Microchip implanted', expectedWeek: 7 },
  {
    name: 'Second Vaccination',
    description: 'Booster vaccination',
    expectedWeek: 8,
  },
  {
    name: 'Ready for Home',
    description: 'Puppy ready for new family',
    expectedWeek: 8,
  },
];

// Registration Information
export interface Registration {
  registry: string; // e.g., 'AKC', 'CKC', 'UKC', 'FCI', or custom registry name
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
  type:
    | 'application'
    | 'certificate'
    | 'pedigree'
    | 'litter_certificate'
    | 'other';
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
  status: 'available' | 'reserved' | 'sold' | 'kept' | 'unavailable' | 'pending';
  isDeceased?: boolean;
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

  // Uploaded contract documents
  contractDocument?: ContractDocument;
  healthGuaranteeDocument?: ContractDocument;

  // Registration tracking (multiple registries supported)
  registrations?: Registration[];

  healthTests: HealthTest[];
  shotRecords: ShotRecord[];
  weightHistory: WeightEntry[];
  updates?: PuppyUpdate[];
  milestones?: Milestone[];
  notes?: string;
}

// Uploaded Contract Document
export interface ContractDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url: string;
  uploadDate: string;
  size?: number;
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
  registry: string; // e.g., 'AKC', 'CKC', 'UKC', 'FCI', or custom registry name
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
  // External sire (when sire is from another kennel)
  externalSire?: ExternalParent;
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
  dailyTasks?: DailyRoutineTask[]; // Daily routine tasks for this litter
  dailyTaskCompletions?: DailyTaskCompletion[]; // Tracks which daily tasks have been completed on which dates

  // Litter-level registration
  litterRegistration?: LitterRegistration;

  // Owner/Revenue Split (for guardian homes, co-owned dogs, etc.)
  ownerInfo?: {
    ownerName?: string; // Name of the owner (if different from breeder)
    ownerContact?: string; // Contact info for owner
    revenueSplitType?: 'percentage' | 'fixed_amount'; // How revenue is split
    ownerPercentage?: number; // Percentage that goes to owner (0-100)
    ownerFixedAmount?: number; // Fixed dollar amount per puppy that goes to owner
    breederPercentage?: number; // Percentage that goes to breeder (0-100)
    breederFixedAmount?: number; // Fixed dollar amount per puppy that goes to breeder
    notes?: string; // Any notes about the split arrangement
  };
}

/**
 * Guardian Home Information
 * Links a dog to a guardian contact via contactId
 */
export interface GuardianHome {
  /** Primary reference to Contact record in customers collection */
  contactId: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Guardian's name - now stored in Contact record.
   */
  guardianName?: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Guardian's email - now stored in Contact record.
   */
  email?: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Guardian's phone - now stored in Contact record.
   */
  phone?: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Guardian's address - now stored in Contact record.
   */
  address?: string;

  // Contract-specific data (kept here - specific to guardian arrangement)
  contractDate: string;
  contractDocument?: string; // URL to stored contract

  // For dams: contract based on number of litters
  littersAllowed?: number; // Total litters allowed per contract
  littersCompleted?: number; // Litters completed so far

  // For studs: contract based on age/date expiry
  contractExpiryDate?: string; // Date the contract expires (ISO string)
  contractExpiryAge?: number; // Age in years when contract expires

  notes?: string;
}

/**
 * External parent info (from another kennel)
 * Links to breeder contact via contactId
 */
export interface ExternalParent {
  /** Dog name */
  name: string;
  registrationNumber?: string;
  breed?: string;

  /** Reference to breeder's Contact record in customers collection */
  contactId?: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Kennel name - now stored in Contact record.
   */
  kennelName?: string;

  /**
   * @deprecated Since v1.0.0 - Use contactId to reference Contact record instead.
   * Will be removed in v2.0.0 (target: March 2026).
   * Breeder name - now stored in Contact record.
   */
  breederName?: string;

  // Connection request tracking
  connectionRequestId?: string; // ID of the connection request
  connectionStatus?: 'pending' | 'approved' | 'declined' | 'cancelled'; // Status of the connection request
  connectedDogId?: string; // ID of the linked/connected dog (when approved)
  ownerId?: string; // User ID of the dog's owner (for requesting connection)
  dogId?: string; // Original dog ID in owner's collection
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
  breedGeneration?: string; // For breeds with generations (e.g., F1, F1B, F2BB for doodles)
  sex: 'male' | 'female';
  dateOfBirth: string;
  color: string;
  sireId?: string;
  damId?: string;
  // External parents (when sire/dam is from another kennel)
  externalSire?: ExternalParent;
  externalDam?: ExternalParent;
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
  dnaProfile?: DnaProfile;

  // Registration tracking (multiple registries supported)
  registrations?: Registration[];

  // Breeder Program Status
  programStatus?:
    | 'owned'
    | 'guardian'
    | 'external_stud'
    | 'co-owned'
    | 'retired';
  guardianHome?: GuardianHome;

  // Breeding Program Status (lifecycle tracking)
  breedingStatus?:
    | 'future-stud' // Young male, not ready for breeding yet
    | 'future-dam' // Young female, not ready for breeding yet
    | 'active-stud' // Actively breeding male
    | 'active-dam' // Actively breeding female
    | 'retired' // Retired from breeding program
    | 'pet' // Pet quality, not for breeding
    | 'guardian'; // In guardian home
  healthTestsPending?: boolean; // True if health tests required before breeding
  agePending?: boolean; // True if dog is too young for breeding
  spayedNeutered?: boolean; // True if dog has been spayed/neutered
  spayNeuterDate?: string; // Date of spay/neuter procedure
  spayNeuterNotes?: string; // Notes about spay/neuter (clinic, reason, etc.)

  // Connected/Linked Dog (from another kennel)
  isConnectedDog?: boolean; // True if this is a linked dog from another breeder
  connectionRequestId?: string; // Link to the connection request
  originalDogId?: string; // Firebase document ID of the original dog in owner's collection
  originalOwnerId?: string; // User ID of the actual owner
  originalOwnerKennel?: string; // Kennel name of actual owner
  sharingPreferences?: DogSharingPreferences; // What data is shared
  lastSyncDate?: string; // When data was last synced from owner

  // Forecast Management
  skippedHeatDates?: string[]; // Array of ISO date strings for heat cycles to skip in forecast

  // Market/Sale Information
  marketStatus?: 'available' | 'reserved' | 'sold' | 'not_for_sale';
  salePrice?: number;

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
  healthConditions?: Record<
    string,
    'clear' | 'carrier' | 'at_risk' | 'not_tested'
  >;

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

// Daily Routine Task (template)
export interface DailyRoutineTask {
  id: string;
  name: string;
  description?: string;
  timeOfDay: 'morning' | 'midday' | 'evening' | 'both';
  weekStart: number; // Week to start this routine
  weekEnd?: number; // Week to end this routine (optional, continues indefinitely if not set)
  order: number; // Order within the time of day
}

// Daily Task Completion (tracks completion of a daily task on a specific date)
export interface DailyTaskCompletion {
  taskId: string; // Reference to the DailyRoutineTask id
  date: string; // ISO date string (YYYY-MM-DD)
  timeOfDay: 'morning' | 'midday' | 'evening';
  completed: boolean;
  completedAt?: string; // ISO datetime when completed
  notes?: string;
}

export const DEFAULT_CARE_TEMPLATES: Omit<
  CareTask,
  'id' | 'completed' | 'completedDate' | 'notes'
>[] = [
  // Week 1
  { name: 'Weigh puppies', description: 'Record birth weights', weekDue: 0 },
  {
    name: 'Check umbilical cords',
    description: 'Ensure cords are drying properly',
    weekDue: 0,
  },
  {
    name: 'Monitor nursing',
    description: 'Ensure all puppies are nursing well',
    weekDue: 0,
  },
  // Week 2
  { name: 'First deworming', description: 'Pyrantel pamoate', weekDue: 2 },
  { name: 'Trim nails', description: 'First nail trim', weekDue: 2 },
  { name: 'Weekly weigh-in', description: 'Track growth', weekDue: 2 },
  // Week 3
  {
    name: 'Begin socialization',
    description: 'Gentle handling, new sounds',
    weekDue: 3,
  },
  { name: 'Weekly weigh-in', description: 'Track growth', weekDue: 3 },
  // Week 4
  { name: 'Second deworming', description: 'Pyrantel pamoate', weekDue: 4 },
  { name: 'Introduce gruel', description: 'Start weaning process', weekDue: 4 },
  { name: 'Trim nails', description: 'Second nail trim', weekDue: 4 },
  // Week 5
  {
    name: 'Increase solid food',
    description: 'Reduce nursing dependence',
    weekDue: 5,
  },
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
  {
    name: 'Prepare puppy packets',
    description: 'Contracts, records, food samples',
    weekDue: 8,
  },
  { name: 'Trim nails', description: 'Pre-pickup nail trim', weekDue: 8 },
];

export const DEFAULT_DAILY_ROUTINES: Omit<DailyRoutineTask, 'id'>[] = [
  // Morning routines
  {
    name: 'Check mom and puppies',
    description: 'Visual health check',
    timeOfDay: 'morning',
    weekStart: 0,
    order: 1,
  },
  {
    name: 'Clean whelping area',
    description: 'Remove soiled bedding, sanitize',
    timeOfDay: 'morning',
    weekStart: 0,
    order: 2,
  },
  {
    name: 'Weigh puppies',
    description: 'Daily weight tracking',
    timeOfDay: 'morning',
    weekStart: 0,
    weekEnd: 2,
    order: 3,
  },
  {
    name: 'Feed mom',
    description: 'High-quality puppy food',
    timeOfDay: 'morning',
    weekStart: 0,
    order: 4,
  },
  {
    name: 'Feed puppies',
    description: 'Puppy gruel/kibble',
    timeOfDay: 'morning',
    weekStart: 4,
    order: 5,
  },
  {
    name: 'Socialization time',
    description: 'Handling, sounds, new experiences',
    timeOfDay: 'morning',
    weekStart: 3,
    order: 6,
  },

  // Evening routines
  {
    name: 'Check mom and puppies',
    description: 'Visual health check',
    timeOfDay: 'evening',
    weekStart: 0,
    order: 1,
  },
  {
    name: 'Clean whelping area',
    description: 'Remove soiled bedding, freshen water',
    timeOfDay: 'evening',
    weekStart: 0,
    order: 2,
  },
  {
    name: 'Feed mom',
    description: 'High-quality puppy food',
    timeOfDay: 'evening',
    weekStart: 0,
    order: 3,
  },
  {
    name: 'Feed puppies',
    description: 'Puppy gruel/kibble',
    timeOfDay: 'evening',
    weekStart: 4,
    order: 4,
  },
  {
    name: 'Play and enrichment',
    description: 'Age-appropriate toys and activities',
    timeOfDay: 'evening',
    weekStart: 3,
    order: 5,
  },
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
  customRegistries?: string[]; // Custom dog registries added by the breeder

  // Health Testing Commitment
  healthTestingDescription?: string;
  healthGuarantee?: string;

  // Programs
  guardianProgramAvailable?: boolean;
  guardianProgramDescription?: string;

  // Settings
  acceptingInquiries?: boolean;
  showPricing?: boolean;

  // EmailJS Configuration
  emailjsPublicKey?: string;
  emailjsServiceId?: string;
  emailjsWaitlistTemplateId?: string;
  emailjsInquiryNotificationTemplateId?: string; // Breeder notification for new inquiries
  emailjsWaitlistNotificationTemplateId?: string; // Breeder notification for new waitlist apps
  emailjsConnectionRequestTemplateId?: string; // Notification for dog connection requests
  notificationEmail?: string; // Email to receive notifications (defaults to profile email)
  enableInquiryNotifications?: boolean; // Toggle inquiry notifications
  enableWaitlistNotifications?: boolean; // Toggle waitlist notifications
  enableConnectionRequestNotifications?: boolean; // Toggle connection request notifications

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

// Activity Log for tracking customer interactions
export interface ActivityLog {
  timestamp: string;
  action: string;
  details?: string;
  performedBy?: string; // user ID or 'system'
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
  status:
    | 'new'
    | 'contacted'
    | 'qualified'
    | 'waitlist'
    | 'reserved'
    | 'completed'
    | 'not_interested';
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
  waitlistEmailSent?: string; // Timestamp when waitlist link was sent

  // Activity history
  activityLog?: ActivityLog[];

  createdAt?: string;
  updatedAt?: string;
}

// Master Waitlist Entry
export interface WaitlistEntry {
  id: string;
  userId: string; // Breeder's user ID
  inquiryId?: string; // Link to the original inquiry if came from inquiry
  contactId?: string; // Link to Customer/Contact record in CRM

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
  status:
    | 'pending'
    | 'approved'
    | 'active'
    | 'matched'
    | 'reserved'
    | 'completed'
    | 'withdrawn'
    | 'declined';

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
  assignedPuppyName?: string; // Cached name for display

  // Communication
  notes?: string; // Breeder's internal notes
  lastContactDate?: string;
  communicationLog?: CommunicationNote[];

  // Activity history
  activityLog?: ActivityLog[];

  // References
  vetReference?: string;
  personalReferences?: string[];

  // Source tracking
  source?: 'website' | 'manual' | 'import'; // How the entry was created

  createdAt?: string;
  submittedAt?: string; // When the customer submitted the application
  formSubmittedDate?: string; // When form was submitted (for entries created manually then later filled via form)
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
export type ContactRole =
  | 'prospect'
  | 'customer'
  | 'stud_job_customer'
  | 'vet'
  | 'breeder'
  | 'groomer'
  | 'boarding'
  | 'trainer'
  | 'transport'
  | 'walker'
  | 'owner'
  | 'guardian';

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
  type:
    | 'prospect'
    | 'waitlist'
    | 'buyer'
    | 'past_buyer'
    | 'guardian'
    | 'stud_client' // Client who uses your stud services
    | 'referral_source';
  status: 'active' | 'inactive' | 'archived';

  // Contact roles (one contact can play multiple roles, e.g. buyer + guardian + vet)
  contactRoles?: ContactRole[];

  // Tags & Segmentation
  tags?: string[]; // e.g., "VIP", "repeat buyer", "influencer", "vet", etc.
  source?:
    | 'website'
    | 'referral'
    | 'social_media'
    | 'event'
    | 'advertising'
    | 'other';
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

  // Instagram Messaging Integration
  instagramSenderId?: string; // Instagram-scoped user ID (IGSID) for DM integration
  instagramUsername?: string; // Actual Instagram handle
  instagramProfilePicture?: string;

  // Messaging & Conversations
  conversationIds?: string[]; // References to Conversation records from messaging system
  lastMessageAt?: string; // Last time we received or sent a message
  unreadMessageCount?: number; // Count of unread messages across all channels

  // Notes & History
  notes?: string;
  interactions?: Interaction[];

  // Related Records
  waitlistEntryId?: string;
  inquiryIds?: string[];
  litterIds?: string[]; // Litters they purchased from
  studJobIds?: string[]; // Stud jobs for stud clients

  // Journey Tracking (for customer analytics)
  stage?: CustomerStage;
  inquiryDate?: string;
  applicationDate?: string;
  approvalDate?: string;
  depositDate?: string;
  depositAmount?: number;
  contractDate?: string;
  pickupDate?: string;
  assignedPuppyId?: string;
  preferredBreed?: string;
  referralSource?: string; // Name/description of referral source

  createdAt?: string;
  updatedAt?: string;
}

// Customer journey stage
export type CustomerStage =
  | 'inquiry'
  | 'application'
  | 'approved'
  | 'deposit'
  | 'contract'
  | 'pickup'
  | 'archived';

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
  type:
    | 'email'
    | 'phone'
    | 'text'
    | 'instagram_dm'
    | 'facebook_msg'
    | 'tiktok_msg'
    | 'meeting'
    | 'video_call'
    | 'visit'
    | 'other';
  subject: string;
  notes?: string;
  content?: string; // Full message content (for emails, messages)
  direction?: 'inbound' | 'outbound'; // Direction of communication
  outcome?: string;
  followUpDate?: string;
  followUpCompleted?: boolean;
  attachments?: string[]; // URLs to files

  // Email-specific fields
  externalId?: string; // ID from external platform (Gmail message ID, etc)
  threadId?: string; // For grouping related messages
  fromEmail?: string;
  toEmail?: string;
  ccEmail?: string[];
  bccEmail?: string[];
  htmlContent?: string; // HTML version of email

  // Integration metadata
  source?: 'manual' | 'gmail' | 'outlook' | 'twilio' | 'meta' | 'other';
  syncedAt?: string; // When it was synced from external source
}

// Unified Activity Item for timeline display
export interface ActivityItem {
  id: string;
  type:
    | 'interaction'
    | 'email'
    | 'instagram_dm'
    | 'facebook_msg'
    | 'sms'
    | 'note'
    | 'purchase'
    | 'status_change';
  timestamp: string;
  direction?: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  preview?: string; // Truncated content for list view
  metadata?: {
    conversationId?: string;
    messageId?: string;
    interactionId?: string;
    purchaseId?: string;
    interactionType?: Interaction['type'];
  };
  source: 'manual' | 'email' | 'instagram' | 'facebook' | 'sms' | 'system';
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

// Dog Connection Request - for linking dogs from other kennels
export interface DogConnectionRequest {
  id: string;
  requesterId: string; // User ID of breeder making the request
  requesterKennelName: string;
  ownerId: string; // User ID of dog owner
  ownerKennelName: string;
  dogId: string; // The dog being requested to connect
  dogName: string;
  dogRegistrationNumber?: string;

  // Request details
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  requestDate: string;
  responseDate?: string;
  message?: string; // Message from requester
  responseMessage?: string; // Message from owner when responding

  // Connection purpose
  purpose: 'sire' | 'dam' | 'offspring' | 'relative' | 'reference';
  purposeDetails?: string; // e.g., "Used as sire for my litter #123"

  // Data sharing preferences (set by owner when approving)
  sharingPreferences?: DogSharingPreferences;

  // Linked dog in requester's system (created after approval)
  linkedDogId?: string; // The connected/linked dog ID in requester's system

  createdAt?: string;
  updatedAt?: string;
}

// What data the dog owner wants to share
export interface DogSharingPreferences {
  // Basic Info
  shareBasicInfo: boolean; // name, breed, sex, color
  shareRegistration: boolean; // registration number, registry
  sharePhoto: boolean;
  shareDateOfBirth: boolean;

  // Pedigree
  sharePedigree: boolean;

  // Health & Testing
  shareHealthTests: boolean;
  shareHealthRecords: boolean;
  shareVaccinations: boolean;
  shareDnaProfile: boolean;

  // Titles & Achievements
  shareTitles: boolean;
  shareShows: boolean;

  // Breeding Info
  shareBreedingHistory: boolean; // litters produced
  shareBreedingRights: boolean; // whether dog is breeding quality

  // Contact
  shareOwnerContact: boolean; // breeder's contact info
}

// In-app notification system
export interface Notification {
  id: string;
  userId: string; // Who receives the notification
  type:
    | 'connection_request'
    | 'connection_approved'
    | 'connection_declined'
    | 'inquiry'
    | 'waitlist'
    | 'reminder'
    | 'system';
  title: string;
  message: string;
  read: boolean;

  // Related entity
  relatedId?: string; // ID of related entity (e.g., connection request ID)
  relatedType?:
    | 'dog_connection'
    | 'inquiry'
    | 'waitlist'
    | 'reminder'
    | 'litter';

  // Action button
  actionLabel?: string; // e.g., "View Request", "Respond"
  actionUrl?: string; // Where to navigate when clicked

  createdAt: string;
  readAt?: string;
}
