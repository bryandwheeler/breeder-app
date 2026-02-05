/**
 * Subdomain routing utility
 * Detects if the user is accessing via a subdomain and resolves to a breeder ID
 */

import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@breeder/firebase';

// The main domain (requests to this domain are NOT subdomain routes)
const MAIN_DOMAINS = [
  'expertbreeder.com',
  'www.expertbreeder.com',
  'expert-breeder.web.app',
  'expert-breeder.firebaseapp.com',
  'localhost',
];

export interface SubdomainInfo {
  isSubdomain: boolean;
  subdomain: string | null;
  breederId: string | null;
}

/**
 * Get subdomain from current hostname
 */
export function getSubdomainFromHost(): string | null {
  const hostname = window.location.hostname;

  // Check if this is the main domain
  if (MAIN_DOMAINS.some(domain => hostname === domain || hostname.endsWith('localhost'))) {
    return null;
  }

  // Extract subdomain from expertbreeder.com
  // e.g., "happypaws.expertbreeder.com" -> "happypaws"
  const match = hostname.match(/^([^.]+)\.expertbreeder\.com$/);
  if (match) {
    return match[1].toLowerCase();
  }

  return null;
}

/**
 * Look up breeder ID by subdomain
 */
export async function resolveSubdomainToBreeder(subdomain: string): Promise<string | null> {
  try {
    const domainsRef = collection(db, 'domains');
    const q = query(
      domainsRef,
      where('subdomain', '==', subdomain.toLowerCase()),
      where('status', '==', 'active'),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data().userId;
  } catch (error) {
    console.error('Error resolving subdomain:', error);
    return null;
  }
}

/**
 * Check if current request is a subdomain and resolve breeder
 */
export async function detectSubdomain(): Promise<SubdomainInfo> {
  const subdomain = getSubdomainFromHost();

  if (!subdomain) {
    return { isSubdomain: false, subdomain: null, breederId: null };
  }

  const breederId = await resolveSubdomainToBreeder(subdomain);

  return {
    isSubdomain: true,
    subdomain,
    breederId,
  };
}
