import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@breeder/firebase';

export interface KennelSearchResult {
  userId: string;
  kennelName: string;
  breederName: string;
  city?: string;
  state?: string;
  primaryBreed?: string;
}

/**
 * Search for kennels by kennel name
 * Returns kennels registered in the system
 */
export async function searchKennels(searchTerm: string, maxResults: number = 10): Promise<KennelSearchResult[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  const searchTermLower = searchTerm.toLowerCase();

  // Search by kennel name (case-insensitive)
  // Note: Firestore doesn't support case-insensitive queries natively,
  // so we'll fetch all profiles and filter client-side for now
  // For production, consider using Algolia or similar for better search
  const profilesRef = collection(db, 'breederProfiles');
  const snapshot = await getDocs(profilesRef);

  const results: KennelSearchResult[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const kennelName = data.kennelName?.toLowerCase() || '';
    const breederName = data.breederName?.toLowerCase() || '';

    // Match if search term is in kennel name or breeder name
    if (kennelName.includes(searchTermLower) || breederName.includes(searchTermLower)) {
      results.push({
        userId: data.userId,
        kennelName: data.kennelName || '',
        breederName: data.breederName || '',
        city: data.city,
        state: data.state,
        primaryBreed: data.primaryBreed,
      });
    }
  });

  // Sort by relevance (exact matches first, then partial matches)
  results.sort((a, b) => {
    const aKennelExact = a.kennelName.toLowerCase() === searchTermLower;
    const bKennelExact = b.kennelName.toLowerCase() === searchTermLower;

    if (aKennelExact && !bKennelExact) return -1;
    if (!aKennelExact && bKennelExact) return 1;

    return a.kennelName.localeCompare(b.kennelName);
  });

  return results.slice(0, maxResults);
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
 * Search for dogs by name, registration number, or kennel/breeder name
 */
export async function searchDogs(
  searchTerm: string,
  excludeUserId?: string,
  maxResults: number = 20
): Promise<DogSearchResult[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  const searchTermLower = searchTerm.toLowerCase();
  const searchTermUpper = searchTerm.toUpperCase();

  // Fetch all dogs (for client-side filtering)
  const dogsRef = collection(db, 'dogs');
  const dogsSnapshot = await getDocs(dogsRef);

  // Fetch all breeder profiles for owner info
  const profilesRef = collection(db, 'breederProfiles');
  const profilesSnapshot = await getDocs(profilesRef);

  // Create a map of userId to profile data
  const profileMap = new Map();
  profilesSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    profileMap.set(data.userId, {
      kennelName: data.kennelName || '',
      breederName: data.breederName || '',
    });
  });

  const results: DogSearchResult[] = [];

  dogsSnapshot.docs.forEach((doc) => {
    const dogData = doc.data();

    // Skip if this is the current user's dog
    if (excludeUserId && dogData.userId === excludeUserId) {
      return;
    }

    const dogName = (dogData.name || dogData.registeredName || '').toLowerCase();
    const regNumber = (dogData.registrationNumber || dogData.registration?.number || '').toUpperCase();
    const profile = profileMap.get(dogData.userId) || { kennelName: '', breederName: '' };
    const kennelName = profile.kennelName.toLowerCase();
    const breederName = profile.breederName.toLowerCase();

    // Match if search term is in dog name, registration number, kennel name, or breeder name
    const matchesDogName = dogName.includes(searchTermLower);
    const matchesRegNumber = regNumber.includes(searchTermUpper);
    const matchesKennel = kennelName.includes(searchTermLower);
    const matchesBreeder = breederName.includes(searchTermLower);

    if (matchesDogName || matchesRegNumber || matchesKennel || matchesBreeder) {
      results.push({
        dogId: doc.id,
        dogName: dogData.name || dogData.registeredName || 'Unknown',
        registrationNumber: regNumber || undefined,
        breed: dogData.breed,
        sex: dogData.sex,
        ownerId: dogData.userId,
        ownerKennel: profile.kennelName || 'Unknown Kennel',
        ownerBreederName: profile.breederName,
      });
    }
  });

  // Sort by relevance (exact matches first, then partial matches)
  results.sort((a, b) => {
    const aNameExact = a.dogName.toLowerCase() === searchTermLower;
    const bNameExact = b.dogName.toLowerCase() === searchTermLower;

    if (aNameExact && !bNameExact) return -1;
    if (!aNameExact && bNameExact) return 1;

    return a.dogName.localeCompare(b.dogName);
  });

  return results.slice(0, maxResults);
}

/**
 * Search for a specific dog by registration number across all breeders
 */
export async function searchDogByRegistration(
  registrationNumber: string,
  excludeUserId?: string
): Promise<{ dogId: string; dogName: string; ownerId: string; ownerKennel: string } | null> {
  if (!registrationNumber || registrationNumber.length < 3) {
    return null;
  }

  const dogsRef = collection(db, 'dogs');
  const q = query(
    dogsRef,
    where('registration.number', '==', registrationNumber.toUpperCase())
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  // Get the first matching dog (registration numbers should be unique)
  const dogDoc = snapshot.docs[0];
  const dogData = dogDoc.data();

  // Skip if this is the current user's dog
  if (excludeUserId && dogData.userId === excludeUserId) {
    return null;
  }

  // Get the owner's profile to get kennel name
  const profileDoc = await getDocs(
    query(collection(db, 'breederProfiles'), where('userId', '==', dogData.userId), limit(1))
  );

  const ownerKennel = profileDoc.empty ? 'Unknown Kennel' : profileDoc.docs[0].data().kennelName || 'Unknown Kennel';

  return {
    dogId: dogDoc.id,
    dogName: dogData.name || dogData.registeredName || 'Unknown',
    ownerId: dogData.userId,
    ownerKennel,
  };
}
