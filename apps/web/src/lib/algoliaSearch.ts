import { algoliasearch } from 'algoliasearch';

const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;

// Lazily initialize client only when Algolia is configured
let _client: ReturnType<typeof algoliasearch> | null = null;
function getClient() {
  if (!_client) {
    if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) {
      return null;
    }
    _client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
  }
  return _client;
}

export interface KennelSearchResult {
  userId: string;
  kennelName: string;
  breederName: string;
  city?: string;
  state?: string;
  primaryBreed?: string;
}

export interface DogSearchResult {
  dogId: string;
  dogName: string;
  registrationNumber?: string;
  breed?: string;
  sex?: string;
  ownerId: string;
  ownerKennel: string;
  ownerBreederName?: string;
}

/**
 * Search for kennels by kennel name or breeder name via Algolia.
 * Falls back to empty results if Algolia is not configured.
 */
export async function searchKennels(
  searchTerm: string,
  maxResults: number = 10
): Promise<KennelSearchResult[]> {
  if (!searchTerm || searchTerm.length < 2) return [];

  const client = getClient();
  if (!client) {
    console.warn('Algolia not configured — searchKennels returning empty results');
    return [];
  }

  const { hits } = await client.searchSingleIndex({
    indexName: 'breeder_profiles',
    searchParams: { query: searchTerm, hitsPerPage: maxResults },
  });

  return hits.map((hit: Record<string, unknown>) => ({
    userId: (hit.userId as string) || (hit.objectID as string),
    kennelName: (hit.kennelName as string) || '',
    breederName: (hit.breederName as string) || '',
    city: hit.city as string | undefined,
    state: hit.state as string | undefined,
    primaryBreed: hit.primaryBreed as string | undefined,
  }));
}

/**
 * Search for dogs by name, registration number, or kennel/breeder name via Algolia.
 * Drop-in replacement for kennelSearch.searchDogs — same signature and return type.
 */
export async function searchDogs(
  searchTerm: string,
  excludeUserId?: string,
  maxResults: number = 20
): Promise<DogSearchResult[]> {
  if (!searchTerm || searchTerm.length < 2) return [];

  const client = getClient();
  if (!client) {
    console.warn('Algolia not configured — searchDogs returning empty results');
    return [];
  }

  const filters = excludeUserId ? `NOT userId:"${excludeUserId}"` : '';

  const { hits } = await client.searchSingleIndex({
    indexName: 'dogs',
    searchParams: { query: searchTerm, hitsPerPage: maxResults, filters },
  });

  return hits.map((hit: Record<string, unknown>) => ({
    dogId: hit.objectID as string,
    dogName: (hit.name as string) || (hit.registeredName as string) || 'Unknown',
    registrationNumber: (hit.registrationNumber as string) || undefined,
    breed: hit.breed as string | undefined,
    sex: hit.sex as string | undefined,
    ownerId: (hit.userId as string) || '',
    ownerKennel: (hit.kennelName as string) || (hit.breederName as string) || 'Unknown Kennel',
    ownerBreederName: hit.breederName as string | undefined,
  }));
}

/**
 * Search for a specific dog by registration number across all breeders.
 */
export async function searchDogByRegistration(
  registrationNumber: string,
  excludeUserId?: string
): Promise<{ dogId: string; dogName: string; ownerId: string; ownerKennel: string } | null> {
  if (!registrationNumber || registrationNumber.length < 3) return null;

  const client = getClient();
  if (!client) {
    console.warn('Algolia not configured — searchDogByRegistration returning null');
    return null;
  }

  const filters = excludeUserId ? `NOT userId:"${excludeUserId}"` : '';

  const { hits } = await client.searchSingleIndex({
    indexName: 'dogs',
    searchParams: {
      query: registrationNumber,
      hitsPerPage: 1,
      filters,
      restrictSearchableAttributes: ['registrationNumber'],
    },
  });

  if (hits.length === 0) return null;

  const hit = hits[0] as Record<string, unknown>;
  return {
    dogId: hit.objectID as string,
    dogName: (hit.name as string) || (hit.registeredName as string) || 'Unknown',
    ownerId: (hit.userId as string) || '',
    ownerKennel: (hit.kennelName as string) || 'Unknown Kennel',
  };
}

export interface ContactSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  contactRoles: string[];
  type: string;
  status: string;
}

/**
 * Search contacts (customers) via Algolia.
 * Searches across name, email, and phone in a single query.
 */
export async function searchContacts(
  searchTerm: string,
  userId: string,
  maxResults: number = 10
): Promise<ContactSearchResult[]> {
  if (!searchTerm?.trim()) return [];

  const client = getClient();
  if (!client) {
    console.warn('Algolia not configured — searchContacts returning empty results');
    return [];
  }

  const { hits } = await client.searchSingleIndex({
    indexName: 'customers',
    searchParams: {
      query: searchTerm,
      hitsPerPage: maxResults,
      filters: `userId:"${userId}"`,
    },
  });

  return hits.map((hit: Record<string, unknown>) => ({
    id: hit.objectID as string,
    name: (hit.name as string) || '',
    email: (hit.email as string) || '',
    phone: (hit.phone as string) || '',
    contactRoles: (hit.contactRoles as string[]) || [],
    type: (hit.type as string) || '',
    status: (hit.status as string) || '',
  }));
}
