/**
 * Type guards and helper types for enforcing naming conventions
 *
 * These utilities help catch naming convention violations at compile time
 * rather than at runtime.
 */

/**
 * Ensures a string type uses kebab-case (no underscores)
 * Used for status enums and other string literal types
 *
 * @example
 * type GoodStatus = KebabCase<'not-started'>; // ✅ OK
 * type BadStatus = KebabCase<'not_started'>;  // ❌ Type error
 */
export type KebabCase<T extends string> = T extends `${infer _A}_${infer _B}`
  ? never  // Reject any string containing underscore
  : T;

/**
 * Ensures a string type uses camelCase (no underscores, no hyphens)
 * Used for object property names
 *
 * @example
 * type GoodProp = CamelCase<'userId'>; // ✅ OK
 * type BadProp = CamelCase<'user_id'>; // ❌ Type error
 */
export type CamelCase<T extends string> = T extends `${infer _A}_${infer _B}`
  ? never  // Reject underscores
  : T extends `${infer _A}-${infer _B}`
  ? never  // Reject hyphens
  : T;

/**
 * Validates that all values in a union type use kebab-case
 *
 * @example
 * type ValidStatuses = ValidateKebabCase<'pending' | 'not-started'>; // ✅ OK
 * type InvalidStatuses = ValidateKebabCase<'pending' | 'not_started'>; // ❌ Error
 */
export type ValidateKebabCase<T extends string> = {
  [K in T]: KebabCase<K>;
}[T];

/**
 * Validates that all keys in an object use camelCase
 *
 * @example
 * type ValidObj = ValidateCamelCaseKeys<{ userId: string }>; // ✅ OK
 * type InvalidObj = ValidateCamelCaseKeys<{ user_id: string }>; // ❌ Error
 */
export type ValidateCamelCaseKeys<T extends Record<string, any>> = {
  [K in keyof T]: K extends string ? CamelCase<K> : K;
};

/**
 * Standard status types using kebab-case
 * These replace the old snake_case versions
 */
export type StandardStatus =
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'not-started'
  | 'in-progress';

export type RegistrationStatus =
  | 'not-started'
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'issued';

export type LitterStatus =
  | 'planned'
  | 'pregnant'
  | 'born'
  | 'weaning'
  | 'ready'
  | 'completed';

export type PuppyStatus =
  | 'available'
  | 'reserved'
  | 'sold'
  | 'kept';

export type ReminderType =
  | 'vaccination'
  | 'deworming'
  | 'vet-visit'
  | 'heat-expected'
  | 'due-date'
  | 'pickup'
  | 'registration'
  | 'custom';

export type BreedingMethod =
  | 'natural'
  | 'ai'
  | 'surgical-ai';

export type ContractType =
  | 'pet'
  | 'breeding-rights'
  | 'co-ownership';

export type PrimaryResidence =
  | 'breeder'
  | 'co-owner';

export type BreedingRightsOwner =
  | 'breeder'
  | 'co-owner'
  | 'shared';

export type CertificateType =
  | 'individual'
  | 'litter-certificate';

/**
 * Helper to convert legacy snake_case values to kebab-case
 * Use this during migration period
 *
 * @example
 * const status = migrateLegacyStatus('not_started'); // Returns 'not-started'
 */
export function migrateLegacyStatus(legacyStatus: string): string {
  const migrationMap: Record<string, string> = {
    'vet_visit': 'vet-visit',
    'heat_expected': 'heat-expected',
    'due_date': 'due-date',
    'surgical_ai': 'surgical-ai',
    'breeding_rights': 'breeding-rights',
    'co_ownership': 'co-ownership',
    'not_started': 'not-started',
    'co_owner': 'co-owner',
    'litter_certificate': 'litter-certificate',
    'in_progress': 'in-progress',
  };

  return migrationMap[legacyStatus] || legacyStatus;
}

/**
 * Type guard to check if a value is a valid kebab-case status
 */
export function isKebabCase(value: string): boolean {
  return !value.includes('_') && value === value.toLowerCase();
}

/**
 * Type guard to check if a value is camelCase
 */
export function isCamelCase(value: string): boolean {
  return (
    !value.includes('_') &&
    !value.includes('-') &&
    value.charAt(0) === value.charAt(0).toLowerCase()
  );
}

/**
 * Validates Firestore collection names
 * Collection names should be camelCase or lowercase
 */
export type ValidCollectionName<T extends string> = T extends `${infer _A}_${infer _B}`
  ? never  // Reject snake_case
  : T;

/**
 * Standard Firestore collection names
 * These replace the old snake_case versions
 */
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  DOGS: 'dogs',
  LITTERS: 'litters',
  BREEDER_PROFILES: 'breederProfiles',     // migrated from breeder_profiles
  BREEDING_RECORDS: 'breedingRecords',     // migrated from breeding_records
  HEAT_CYCLES: 'heatCycles',               // migrated from heat_cycles
  STUD_JOBS: 'studJobs',                   // migrated from stud_jobs
  CUSTOMER_SEGMENTS: 'customerSegments',   // migrated from customer_segments
  CONNECTION_REQUESTS: 'connectionRequests',
  EMAIL_TEMPLATES: 'emailTemplates',
  SCHEDULED_EMAILS: 'scheduledEmails',
  WORKFLOW_LOGS: 'workflowExecutionLogs',
  LITTER_TASKS: 'litterTasks',
  TESTIMONIALS: 'testimonials',
  NOTIFICATIONS: 'notifications',
  REFERRALS: 'referrals',
  CUSTOMERS: 'customers',
  INQUIRIES: 'inquiries',
  WAITLIST: 'waitlist',
  WORKFLOWS: 'workflows',
} as const;

/**
 * Type-safe collection name getter
 * Prevents typos and ensures consistency
 */
export type CollectionName = typeof FIRESTORE_COLLECTIONS[keyof typeof FIRESTORE_COLLECTIONS];

/**
 * Helper to get legacy collection name during migration
 */
export function getLegacyCollectionName(standardName: CollectionName): string {
  const legacyMap: Record<string, string> = {
    'breederProfiles': 'breeder_profiles',
    'breedingRecords': 'breeding_records',
    'heatCycles': 'heat_cycles',
    'studJobs': 'stud_jobs',
    'customerSegments': 'customer_segments',
  };

  return legacyMap[standardName] || standardName;
}
