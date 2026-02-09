/**
 * Subdomain and custom domain routing utility
 * Detects if the user is accessing via a subdomain or custom domain
 * and resolves to a breeder ID
 */

import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@breeder/firebase';

// The main app domains (requests to these are NOT breeder subdomain routes)
// These show the main Expert Breeder app
const MAIN_APP_DOMAINS = [
  'app.expertbreeder.com',        // Production app
  'expert-breeder.web.app',       // Firebase default
  'expert-breeder.firebaseapp.com',
  'localhost',
  '127.0.0.1',
];

export interface SubdomainInfo {
  isSubdomain: boolean;
  subdomain: string | null;
  breederId: string | null;
}

/**
 * Get subdomain from current hostname
 * Returns null if this is the main app domain
 * Returns the subdomain name if it's a breeder website
 */
export function getSubdomainFromHost(): string | null {
  const hostname = window.location.hostname;

  // Check if this is the main app domain (app.expertbreeder.com, localhost, etc.)
  if (MAIN_APP_DOMAINS.some(domain =>
    hostname === domain ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1')
  )) {
    return null;
  }

  // Extract subdomain from expertbreeder.com
  // e.g., "happypaws.expertbreeder.com" -> "happypaws"
  // But NOT "app.expertbreeder.com" (already handled above)
  const match = hostname.match(/^([^.]+)\.expertbreeder\.com$/);
  if (match) {
    const subdomain = match[1].toLowerCase();
    // Double-check it's not the app subdomain
    if (subdomain === 'app') {
      return null;
    }
    return subdomain;
  }

  return null;
}

/**
 * Check if current hostname is a custom domain (not an expertbreeder.com subdomain)
 * Returns true for external domains like "azdoodlebliss.com"
 */
export function isCustomDomain(): boolean {
  const hostname = window.location.hostname;

  // Not a custom domain if it's a main app domain
  if (MAIN_APP_DOMAINS.some(domain =>
    hostname === domain ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1')
  )) {
    return false;
  }

  // Not a custom domain if it's an expertbreeder.com subdomain
  if (hostname.endsWith('.expertbreeder.com') || hostname === 'expertbreeder.com') {
    return false;
  }

  // Any other domain is a custom domain
  return true;
}

/**
 * Look up breeder ID by custom domain
 * Queries websiteSettings collection for a matching customDomain
 */
export async function resolveCustomDomainToBreeder(hostname: string): Promise<string | null> {
  try {
    const normalizedDomain = hostname.toLowerCase();
    const settingsRef = collection(db, 'websiteSettings');
    const q = query(
      settingsRef,
      where('domain.customDomain', '==', normalizedDomain),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    // The document ID is the user/breeder ID
    return snapshot.docs[0].id;
  } catch (error) {
    console.error('Error resolving custom domain:', error);
    return null;
  }
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
 * Check if current request is a subdomain/custom domain and resolve breeder
 */
export async function detectSubdomain(): Promise<SubdomainInfo> {
  const hostname = window.location.hostname;

  // First check for expertbreeder.com subdomains
  const subdomain = getSubdomainFromHost();
  if (subdomain) {
    const breederId = await resolveSubdomainToBreeder(subdomain);
    return {
      isSubdomain: true,
      subdomain,
      breederId,
    };
  }

  // Then check for custom domains (e.g., azdoodlebliss.com)
  if (isCustomDomain()) {
    const breederId = await resolveCustomDomainToBreeder(hostname);
    return {
      isSubdomain: true,
      subdomain: hostname,
      breederId,
    };
  }

  return { isSubdomain: false, subdomain: null, breederId: null };
}
