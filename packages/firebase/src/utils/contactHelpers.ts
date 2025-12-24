import type { Customer, GuardianHome, ExternalParent, StudJob } from '@breeder/types';

/**
 * Contact information returned by helper functions
 */
export interface ContactInfo {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Breeder information for external parents
 */
export interface BreederInfo {
  id?: string;
  name: string;
  kennelName?: string;
  email?: string;
  phone?: string;
}

/**
 * Flag to track if deprecation warnings have been shown (to avoid console spam)
 * Only shown once per session in development mode
 */
const deprecationWarningsShown = {
  guardian: false,
  externalBreeder: false,
  studJob: false,
};

/**
 * Log a deprecation warning in development mode (only once per type)
 */
function logDeprecationWarning(type: keyof typeof deprecationWarningsShown, entityInfo: string): void {
  if (process.env.NODE_ENV === 'development' && !deprecationWarningsShown[type]) {
    console.warn(
      `[DEPRECATED] Using legacy ${type} data for "${entityInfo}". ` +
      `Please run the contact migration to update to the new contactId system. ` +
      `Legacy fields will be removed in v2.0.0 (target: March 2026).`
    );
    deprecationWarningsShown[type] = true;
  }
}

/**
 * Get contact information for a guardian home.
 * Tries contactId reference first, falls back to legacy embedded data.
 *
 * @param guardian - GuardianHome object with contactId or legacy fields
 * @param contacts - Array of Customer/Contact records
 * @returns Contact information or null if not found
 */
export function getGuardianContactInfo(
  guardian: GuardianHome | undefined,
  contacts: Customer[]
): ContactInfo | null {
  if (!guardian) return null;

  // Try contactId reference first (new system)
  if (guardian.contactId) {
    const contact = contacts.find((c) => c.id === guardian.contactId);
    if (contact) {
      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
      };
    }
  }

  // Fallback to legacy embedded data
  if (guardian.guardianName) {
    logDeprecationWarning('guardian', guardian.guardianName);
    return {
      name: guardian.guardianName,
      email: guardian.email,
      phone: guardian.phone,
      address: guardian.address,
    };
  }

  return null;
}

/**
 * Get breeder information for an external parent.
 * Tries contactId reference first, falls back to legacy embedded data.
 *
 * @param external - ExternalParent object with contactId or legacy fields
 * @param contacts - Array of Customer/Contact records
 * @returns Breeder information or null if not found
 */
export function getExternalBreederInfo(
  external: ExternalParent | undefined,
  contacts: Customer[]
): BreederInfo | null {
  if (!external) return null;

  // Try contactId reference first (new system)
  if (external.contactId) {
    const contact = contacts.find((c) => c.id === external.contactId);
    if (contact) {
      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      };
    }
  }

  // Fallback to legacy embedded data
  if (external.breederName || external.kennelName) {
    logDeprecationWarning('externalBreeder', external.breederName || external.kennelName || 'Unknown');
    return {
      name: external.breederName || external.kennelName || 'Unknown Breeder',
      kennelName: external.kennelName,
    };
  }

  return null;
}

/**
 * Get breeder contact information for a stud job.
 * Tries contactId reference first, falls back to legacy fields.
 *
 * @param studJob - StudJob object with contactId or legacy breeder fields
 * @param contacts - Array of Customer/Contact records
 * @returns Contact information or null if not found
 */
export function getStudJobBreederInfo(
  studJob: StudJob | undefined,
  contacts: Customer[]
): ContactInfo | null {
  if (!studJob) return null;

  // Try contactId reference first (new system)
  if (studJob.contactId) {
    const contact = contacts.find((c) => c.id === studJob.contactId);
    if (contact) {
      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
      };
    }
  }

  // Fallback to legacy embedded data
  if (studJob.breederName) {
    logDeprecationWarning('studJob', studJob.breederName);
    return {
      name: studJob.breederName,
      email: studJob.breederEmail,
      phone: studJob.breederPhone,
    };
  }

  return null;
}

/**
 * Check if a guardian home has contact information available.
 * Useful for conditional rendering.
 */
export function hasGuardianContact(
  guardian: GuardianHome | undefined,
  contacts: Customer[]
): boolean {
  return getGuardianContactInfo(guardian, contacts) !== null;
}

/**
 * Check if an external parent has breeder information available.
 * Useful for conditional rendering.
 */
export function hasExternalBreeder(
  external: ExternalParent | undefined,
  contacts: Customer[]
): boolean {
  return getExternalBreederInfo(external, contacts) !== null;
}

/**
 * Check if a stud job has breeder contact information available.
 * Useful for conditional rendering.
 */
export function hasStudJobBreeder(
  studJob: StudJob | undefined,
  contacts: Customer[]
): boolean {
  return getStudJobBreederInfo(studJob, contacts) !== null;
}
