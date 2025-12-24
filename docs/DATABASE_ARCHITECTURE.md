# Database Architecture for Scale
## Optimized for 10,000 Breeders & 500,000 Dogs/Puppies

---

## Current State Analysis

### Current Structure
```
users/
  {uid}/
    - profile data
    - totalDogs, totalLitters counters

dogs/
  {dogId}/
    - all dog data (nested objects)
    - userId (index)
    - photos[] (URLs)
    - healthTests[], shotRecords[], etc.

litters/
  {litterId}/
    - all litter data
    - puppies[] (nested array)
    - buyers[] (nested array)
    - expenses[] (nested array)
    - userId (index)
    - damId, sireId

heat_cycles/
  {cycleId}/
    - dogId, userId (indexes)

breeding_records/
  {recordId}/
    - dogId, heatCycleId, userId (indexes)

stud_jobs/
  {jobId}/
    - studId, userId (indexes)

inquiries/
  {inquiryId}/
    - userId (index)

waitlist_entries/
  {entryId}/
    - userId (index)

customers/
  {customerId}/
    - userId (index)
    - nested purchases[], interactions[]
```

### Current Problems at Scale

1. **Nested Arrays Kill Performance**
   - `litter.puppies[]` - Each litter can have 12+ puppies with full data
   - `dog.healthTests[]`, `dog.shotRecords[]`, `dog.vetVisits[]`
   - Firestore reads entire document even for single puppy update
   - Can't query/filter puppies across litters efficiently
   - Document size limits (1MB per document)

2. **No Efficient Cross-Breeder Queries**
   - Can't search all dogs globally (requires composite indexes per field)
   - Kennel search requires full collection scan
   - Pedigree lookups are inefficient

3. **N+1 Query Problems**
   - Loading litter requires separate queries for dam, sire
   - Loading pedigree requires recursive queries
   - Calendar events require loading all dogs + litters + heat cycles

4. **Missing Composite Indexes**
   - `userId + sex` for filtering male/female dogs
   - `userId + breed` for breed-specific queries
   - `userId + status` for litter filtering
   - `breed + public + healthTests` for global search

5. **Inefficient Data Duplication**
   - External sire info duplicated in litter, breeding record
   - Dog name/breed duplicated everywhere referenced
   - No denormalization strategy

---

## Optimized Architecture

### 1. Core Collections (Top-Level)

#### users
```typescript
users/{uid}
{
  // Profile
  email: string
  displayName: string
  kennelName?: string
  breederName?: string

  // Metadata
  createdAt: timestamp
  lastActive: timestamp

  // Counters (for dashboard)
  stats: {
    activeDogs: number
    activeLitters: number
    plannedLitters: number
    soldPuppies: number
  }

  // Subscription
  tier: 'free' | 'starter' | 'professional' | 'enterprise'
  tierExpiry?: timestamp

  // Search optimization
  kennelNameLower: string // For case-insensitive search
  searchTokens: string[]  // For partial matching
}

// Indexes:
// - kennelNameLower
// - searchTokens (array-contains)
```

#### dogs
```typescript
dogs/{dogId}
{
  // Ownership
  userId: string
  isPublic: boolean  // For global search

  // Basic Info (denormalized for search)
  name: string
  nameLower: string
  registeredName?: string
  breed: string
  sex: 'male' | 'female'
  dateOfBirth: timestamp
  color: string

  // Registration (denormalized)
  primaryRegistry?: string
  primaryRegNumber?: string

  // Photos (max 5 URLs for main doc, rest in subcollection)
  primaryPhoto?: string
  photoUrls: string[] // Max 5

  // Pedigree (IDs only)
  sireId?: string
  damId?: string
  externalSireRef?: {
    dogId: string
    userId: string
    kennelName: string
  }

  // Flags
  isDeceased: boolean
  isBreeding: boolean  // Active in breeding program
  isStud: boolean      // Available for stud

  // Search optimization
  searchTokens: string[]

  // Metadata
  createdAt: timestamp
  updatedAt: timestamp

  // Stats (denormalized for perf)
  offspring: {
    count: number
    male: number
    female: number
  }

  // DON'T include nested arrays here:
  // - healthTests -> subcollection
  // - shotRecords -> subcollection
  // - vetVisits -> subcollection
  // - weightHistory -> subcollection
  // - medications -> subcollection
  // - reminders -> subcollection
}

// Composite Indexes (critical):
// - userId + sex
// - userId + breed
// - userId + isDeceased
// - isPublic + breed (for global search)
// - isPublic + breed + sex
// - isPublic + sex + isStud
// - searchTokens (array-contains) + isPublic
```

#### dogs/{dogId}/health_tests/{testId}
```typescript
{
  test: string
  result: string
  date: timestamp
  certNumber?: string
  createdAt: timestamp
}
```

#### dogs/{dogId}/shot_records/{shotId}
```typescript
{
  vaccine: string
  dateGiven: timestamp
  dueDate?: timestamp
  veterinarian?: string
  createdAt: timestamp
}
```

#### dogs/{dogId}/vet_visits/{visitId}
```typescript
{
  date: timestamp
  veterinarian: string
  reason: string
  diagnosis?: string
  treatment?: string
  cost?: number
  attachments?: string[] // Storage URLs
  createdAt: timestamp
}
```

#### dogs/{dogId}/weight_history/{entryId}
```typescript
{
  date: timestamp
  weight: number
  unit: 'lbs' | 'kg'
  notes?: string
}
```

#### litters
```typescript
litters/{litterId}
{
  // Ownership
  userId: string

  // Parents (denormalized for queries)
  damId: string
  damName: string  // Denormalized
  sireId?: string
  sireName?: string // Denormalized
  externalSireRef?: {
    name: string
    regNumber?: string
    kennelName?: string
  }

  // Basic Info
  litterName: string
  breed: string  // Denormalized from dam

  // Dates
  dateOfBirth?: timestamp
  expectedDateOfBirth?: timestamp
  pickupReadyDate?: timestamp

  // Status
  status: 'planned' | 'pregnant' | 'born' | 'weaning' | 'ready' | 'completed'

  // Counts (denormalized)
  puppyCount: number
  maleCount: number
  femaleCount: number
  availableCount: number
  reservedCount: number
  soldCount: number

  // Metadata
  createdAt: timestamp
  updatedAt: timestamp

  // DON'T include:
  // - puppies[] -> subcollection
  // - buyers[] -> separate buyers collection with litterId
  // - expenses[] -> subcollection
}

// Composite Indexes:
// - userId + status
// - userId + dateOfBirth (desc)
// - damId + dateOfBirth (desc)
// - sireId + dateOfBirth (desc)
```

#### litters/{litterId}/puppies/{puppyId}
```typescript
{
  // Ownership (inherited but denormalized)
  userId: string  // Owner of litter
  litterId: string // Parent litter

  // Basic Info
  name?: string
  tempName?: string
  sex: 'male' | 'female'
  color: string
  collar?: string
  microchip?: string

  // Photos
  primaryPhoto?: string
  photoUrls: string[] // Max 5

  // Status
  status: 'available' | 'reserved' | 'sold' | 'kept'
  buyerId?: string
  reservationDate?: timestamp
  pickupDate?: timestamp

  // Pricing
  salePrice?: number
  depositAmount?: number
  depositPaid: boolean

  // Registration
  registrations?: [{
    registry: string
    regNumber?: string
    status: string
  }]

  // Metadata
  createdAt: timestamp
  updatedAt: timestamp

  // Subcollections:
  // - weight_history
  // - shot_records
  // - milestones
}

// Composite Indexes:
// - litterId + status
// - litterId + sex
// - userId + status (for cross-litter queries)
// - buyerId
```

#### litters/{litterId}/expenses/{expenseId}
```typescript
{
  category: string
  description: string
  amount: number
  date: timestamp
  createdAt: timestamp
}
```

#### heat_cycles
```typescript
heat_cycles/{cycleId}
{
  dogId: string
  userId: string
  startDate: timestamp
  endDate?: timestamp
  intensity?: string
  notes?: string
  createdAt: timestamp
  updatedAt: timestamp
}

// Composite Indexes:
// - dogId + startDate (desc)
// - userId + startDate (desc)
```

#### breeding_records
```typescript
breeding_records/{recordId}
{
  dogId: string  // Female
  heatCycleId: string
  userId: string

  // Stud Info (denormalized)
  studId?: string
  studName: string
  studKennelName?: string

  // Breeding Details
  breedingDate: timestamp
  method: 'natural' | 'ai' | 'surgical_ai'
  aiDetails?: string

  // Linked Litter
  litterId?: string  // Created after breeding

  notes?: string
  createdAt: timestamp
  updatedAt: timestamp
}

// Composite Indexes:
// - dogId + breedingDate (desc)
// - heatCycleId
// - studId + breedingDate (desc)
// - userId + breedingDate (desc)
```

---

### 2. Global Search Collections

#### dog_search_index
```typescript
dog_search_index/{dogId}
{
  // Ownership
  userId: string
  kennelName: string

  // Dog Info
  name: string
  registeredName?: string
  breed: string
  sex: 'male' | 'female'
  color: string

  // Registration
  primaryRegistry?: string
  primaryRegNumber?: string

  // Status
  isStud: boolean
  isDeceased: boolean
  dateOfBirth: timestamp

  // Photo
  primaryPhoto?: string

  // Search tokens
  searchTokens: string[]  // [name, reg#, kennel, etc]

  // Metadata
  lastUpdated: timestamp
}

// Composite Indexes:
// - breed + sex + isStud
// - breed + isDeceased
// - searchTokens (array-contains) + breed
// - primaryRegNumber
```

**Update Strategy**:
- Cloud Function trigger on `dogs/{dogId}` write
- Updates search index automatically
- Only public dogs indexed

#### kennel_directory
```typescript
kennel_directory/{userId}
{
  kennelName: string
  breederName: string

  // Location
  city?: string
  state?: string
  country?: string

  // Breeds
  breeds: string[]

  // Stats
  activeDogs: number
  activeLitters: number
  yearsExperience?: number

  // Contact (if public)
  email?: string
  website?: string

  // Search
  searchTokens: string[]

  // Photo
  logo?: string

  // Verification
  verified: boolean
  verificationDate?: timestamp

  lastUpdated: timestamp
}

// Composite Indexes:
// - breeds (array-contains) + state
// - state + verified
// - searchTokens (array-contains)
```

---

### 3. Relational Linking Collections

#### pedigree_links
```typescript
pedigree_links/{linkId}
{
  childId: string
  childName: string
  parentId: string
  parentName: string
  parentUserId: string
  parentKennel?: string
  relationship: 'sire' | 'dam'

  // Search optimization
  generation: number  // 1=parent, 2=grandparent, etc

  createdAt: timestamp
}

// Composite Indexes:
// - childId + generation
// - parentId + relationship
```

**Purpose**: Fast pedigree queries without recursive lookups

**Population Strategy**:
- Cloud Function on dog create/update
- Builds links automatically
- Enables efficient pedigree tree queries

---

### 4. Aggregation Collections (for analytics)

#### breeder_analytics/{userId}/monthly/{month}
```typescript
{
  // Period
  year: number
  month: number

  // Dogs
  dogsAdded: number
  dogsRetired: number
  totalActiveDogs: number

  // Litters
  littersPlanned: number
  littersBorn: number
  littersCompleted: number

  // Puppies
  puppiesBorn: number
  puppiesSold: number
  puppiesReserved: number

  // Revenue
  totalRevenue: number
  avgPuppyPrice: number
  totalExpenses: number

  // Updated by cloud functions
  lastUpdated: timestamp
}
```

---

### 5. Optimized Query Patterns

#### Common Query 1: User's Female Dogs
```typescript
// Before (scan all dogs, filter in code)
const allDogs = await getDocs(query(collection(db, 'dogs'), where('userId', '==', uid)));
const females = allDogs.filter(d => d.sex === 'female');

// After (composite index)
const females = await getDocs(query(
  collection(db, 'dogs'),
  where('userId', '==', uid),
  where('sex', '==', 'female'),
  where('isDeceased', '==', false)
));
```

#### Common Query 2: Global Stud Search
```typescript
// Before (impossible without full scan)

// After
const studs = await getDocs(query(
  collection(db, 'dog_search_index'),
  where('breed', '==', 'Golden Retriever'),
  where('sex', '==', 'male'),
  where('isStud', '==', true),
  orderBy('dateOfBirth', 'desc'),
  limit(20)
));
```

#### Common Query 3: Litter with Puppies
```typescript
// Before (puppies nested in litter doc)
const litterDoc = await getDoc(doc(db, 'litters', litterId));
const puppies = litterDoc.data().puppies; // All loaded

// After (only load what you need)
const litterDoc = await getDoc(doc(db, 'litters', litterId));
const puppiesQuery = query(
  collection(db, `litters/${litterId}/puppies`),
  where('status', '==', 'available')
);
const availablePuppies = await getDocs(puppiesQuery);
```

#### Common Query 4: Calendar Events
```typescript
// Before (load all dogs + litters, filter in code)
const allDogs = await getDocs(...);
const allLitters = await getDocs(...);
const allHeatCycles = await getDocs(...);
// Then filter/compute in JavaScript

// After (targeted queries with date ranges)
const upcomingHeats = await getDocs(query(
  collection(db, 'heat_cycles'),
  where('userId', '==', uid),
  where('startDate', '>=', startDate),
  where('startDate', '<=', endDate)
));

const upcomingLitters = await getDocs(query(
  collection(db, 'litters'),
  where('userId', '==', uid),
  where('expectedDateOfBirth', '>=', startDate),
  where('expectedDateOfBirth', '<=', endDate)
));
```

#### Common Query 5: Puppy Search Across All Litters
```typescript
// Before (impossible - puppies nested)

// After
const goldPuppies = await getDocs(query(
  collectionGroup(db, 'puppies'),
  where('userId', '==', uid),
  where('color', '==', 'gold'),
  where('status', '==', 'available')
));
```

---

## Migration Strategy

### Phase 1: Add Subcollections (Non-Breaking)
1. Create subcollections for health_tests, shot_records, etc.
2. Cloud Functions populate subcollections from nested arrays
3. Update app to read from subcollections (fallback to nested)
4. Test thoroughly

### Phase 2: Denormalization & Indexes
1. Add denormalized fields (damName, sireName, etc.)
2. Create composite indexes
3. Cloud Functions maintain denormalized data
4. Update queries to use new fields

### Phase 3: Search Indexes
1. Create dog_search_index collection
2. Cloud Functions populate from dogs collection
3. Update search to use index
4. Build kennel directory

### Phase 4: Remove Nested Arrays (Breaking)
1. Confirm subcollections working
2. Remove nested arrays from new documents
3. Cleanup old documents with migration script

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Users
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId);
    }

    // Dogs
    match /dogs/{dogId} {
      allow read: if isSignedIn() &&
        (resource.data.userId == request.auth.uid || resource.data.isPublic == true);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;

      // Subcollections inherit parent permissions
      match /{subcollection}/{docId} {
        allow read, write: if isSignedIn() && get(/databases/$(database)/documents/dogs/$(dogId)).data.userId == request.auth.uid;
      }
    }

    // Litters
    match /litters/{litterId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;

      // Puppies subcollection
      match /puppies/{puppyId} {
        allow read: if isSignedIn() && get(/databases/$(database)/documents/litters/$(litterId)).data.userId == request.auth.uid;
        allow write: if isSignedIn() && get(/databases/$(database)/documents/litters/$(litterId)).data.userId == request.auth.uid;
      }

      // Expenses subcollection
      match /expenses/{expenseId} {
        allow read, write: if isSignedIn() && get(/databases/$(database)/documents/litters/$(litterId)).data.userId == request.auth.uid;
      }
    }

    // Search indexes (read-only for users)
    match /dog_search_index/{dogId} {
      allow read: if isSignedIn();
      allow write: if false; // Only Cloud Functions
    }

    match /kennel_directory/{userId} {
      allow read: if isSignedIn();
      allow write: if false; // Only Cloud Functions
    }
  }
}
```

---

## Cloud Functions for Data Consistency

### 1. Update Dog Search Index
```typescript
export const updateDogSearchIndex = functions.firestore
  .document('dogs/{dogId}')
  .onWrite(async (change, context) => {
    const dogId = context.params.dogId;

    // Deletion
    if (!change.after.exists) {
      await admin.firestore().doc(`dog_search_index/${dogId}`).delete();
      return;
    }

    const dog = change.after.data();

    // Only index public dogs
    if (!dog.isPublic) {
      await admin.firestore().doc(`dog_search_index/${dogId}`).delete();
      return;
    }

    // Create search tokens
    const tokens = [
      ...dog.name.toLowerCase().split(' '),
      ...(dog.registeredName || '').toLowerCase().split(' '),
      dog.primaryRegNumber?.toLowerCase(),
      dog.breed.toLowerCase()
    ].filter(Boolean);

    await admin.firestore().doc(`dog_search_index/${dogId}`).set({
      userId: dog.userId,
      kennelName: dog.kennelName || '',
      name: dog.name,
      registeredName: dog.registeredName,
      breed: dog.breed,
      sex: dog.sex,
      color: dog.color,
      primaryRegistry: dog.primaryRegistry,
      primaryRegNumber: dog.primaryRegNumber,
      isStud: dog.isStud || false,
      isDeceased: dog.isDeceased || false,
      dateOfBirth: dog.dateOfBirth,
      primaryPhoto: dog.primaryPhoto,
      searchTokens: tokens,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  });
```

### 2. Update Litter Counts
```typescript
export const updateLitterCounts = functions.firestore
  .document('litters/{litterId}/puppies/{puppyId}')
  .onWrite(async (change, context) => {
    const litterId = context.params.litterId;
    const litterRef = admin.firestore().doc(`litters/${litterId}`);

    // Recalculate counts
    const puppiesSnapshot = await admin.firestore()
      .collection(`litters/${litterId}/puppies`)
      .get();

    const counts = {
      puppyCount: puppiesSnapshot.size,
      maleCount: 0,
      femaleCount: 0,
      availableCount: 0,
      reservedCount: 0,
      soldCount: 0
    };

    puppiesSnapshot.docs.forEach(doc => {
      const puppy = doc.data();
      if (puppy.sex === 'male') counts.maleCount++;
      if (puppy.sex === 'female') counts.femaleCount++;

      switch (puppy.status) {
        case 'available': counts.availableCount++; break;
        case 'reserved': counts.reservedCount++; break;
        case 'sold': counts.soldCount++; break;
      }
    });

    await litterRef.update(counts);
  });
```

### 3. Update User Stats
```typescript
export const updateUserStats = functions.firestore
  .document('dogs/{dogId}')
  .onWrite(async (change, context) => {
    const userId = change.after.exists ? change.after.data().userId : change.before.data().userId;

    const dogsSnapshot = await admin.firestore()
      .collection('dogs')
      .where('userId', '==', userId)
      .where('isDeceased', '==', false)
      .get();

    const littersSnapshot = await admin.firestore()
      .collection('litters')
      .where('userId', '==', userId)
      .where('status', 'in', ['planned', 'pregnant', 'born', 'weaning', 'ready'])
      .get();

    await admin.firestore().doc(`users/${userId}`).update({
      'stats.activeDogs': dogsSnapshot.size,
      'stats.activeLitters': littersSnapshot.size
    });
  });
```

---

## Cost Optimization

### Read Optimization
1. **Pagination**: Always limit queries (20-50 results)
2. **Caching**: Use React Query or SWR for client-side caching
3. **Lazy Loading**: Load subcollections only when needed
4. **Denormalization**: Trade storage for read cost
5. **Aggregations**: Pre-compute stats in Cloud Functions

### Write Optimization
1. **Batch Writes**: Group related updates
2. **Debouncing**: Avoid rapid successive writes
3. **Selective Updates**: Only update changed fields
4. **Async Operations**: Use Cloud Functions for non-critical updates

### Storage Optimization
1. **Photo Compression**: Compress images before upload
2. **Thumbnails**: Generate multiple sizes (Cloud Function)
3. **CDN**: Use Firebase Storage CDN
4. **Cleanup**: Delete orphaned files (Cloud Function)

---

## Performance Targets

### At 10,000 Breeders / 500,000 Dogs

| Operation | Target | Strategy |
|-----------|--------|----------|
| User Dashboard Load | < 500ms | Denormalized stats, indexed queries |
| Dog List (50 dogs) | < 300ms | Composite index, pagination |
| Litter Detail | < 400ms | Subcollections, lazy load puppies |
| Global Search | < 800ms | Dedicated search index |
| Calendar Load | < 600ms | Date-range queries, parallel fetches |
| Puppy Create | < 200ms | Batch write, async index update |

### Query Limits
- Never scan full collections
- Always use indexes
- Limit results to 20-100
- Use cursor pagination for large sets

---

## Monitoring & Alerting

### Metrics to Track
1. **Read/Write Counts** - Daily totals per collection
2. **Query Performance** - 95th percentile latency
3. **Document Size** - Alert if approaching 1MB
4. **Index Usage** - Identify missing indexes
5. **Function Errors** - Track failed Cloud Functions
6. **Storage Usage** - Monitor growth rate

### Alerts
- > 1M reads/day = Review denormalization strategy
- > 10 errors/hour in Cloud Functions
- Document size > 900KB
- Query latency > 2s

---

## Summary: Key Changes for Scale

### 1. ✅ Move Nested Arrays to Subcollections
- `dog.healthTests[]` → `dogs/{id}/health_tests/{testId}`
- `dog.shotRecords[]` → `dogs/{id}/shot_records/{shotId}`
- `litter.puppies[]` → `litters/{id}/puppies/{puppyId}`
- `litter.expenses[]` → `litters/{id}/expenses/{expenseId}`

### 2. ✅ Add Composite Indexes
- `userId + sex + isDeceased`
- `userId + breed`
- `userId + status`
- `breed + sex + isStud + isPublic`

### 3. ✅ Create Search Indexes
- `dog_search_index` for global dog search
- `kennel_directory` for breeder search
- Search tokens for partial matching

### 4. ✅ Denormalize Key Data
- Dog/puppy counts on litters
- Dam/sire names on litters
- Parent info on breeding records
- User stats on user profile

### 5. ✅ Use Cloud Functions
- Auto-update search indexes
- Maintain denormalized counts
- Generate analytics
- Image processing

### 6. ✅ Implement Pagination
- Cursor-based for large lists
- Never load > 100 documents
- Virtual scrolling in UI

---

This architecture will scale efficiently to millions of documents while keeping costs reasonable and maintaining sub-second query performance.
