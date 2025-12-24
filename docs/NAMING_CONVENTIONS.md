# Expert Breeder - Naming Conventions

This document defines the official naming conventions for the Expert Breeder codebase. Following these conventions ensures consistency, maintainability, and reduces cognitive load when working across the application.

---

## Table of Contents
1. [TypeScript/JavaScript Conventions](#typescriptjavascript-conventions)
2. [Firestore Database Conventions](#firestore-database-conventions)
3. [React Component Conventions](#react-component-conventions)
4. [String Literal Types](#string-literal-types)
5. [File Naming](#file-naming)
6. [Migration Status](#migration-status)

---

## TypeScript/JavaScript Conventions

### Variables & Functions
**Use camelCase** for all variables and function names.

```typescript
✅ CORRECT:
const userId = 'abc123';
const kennelName = 'Golden Paws';
function calculateDueDate() { }
function getUserProfile() { }

❌ INCORRECT:
const user_id = 'abc123';        // snake_case
const UserName = 'John';          // PascalCase for non-class
function Calculate_Due_Date() { } // Mixed case
```

### Constants
**Use UPPER_SNAKE_CASE** for true constants (compile-time values).

```typescript
✅ CORRECT:
const MAX_LITTER_SIZE = 12;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PUPPY_MILESTONES = [...];

❌ INCORRECT:
const maxLitterSize = 12;   // camelCase for constant
const apiBaseUrl = '...';   // camelCase for constant
```

### Interfaces & Types
**Use PascalCase** for interface and type names.

```typescript
✅ CORRECT:
interface Dog { }
interface BreederProfile { }
type LitterStatus = 'planned' | 'pregnant' | 'born';

❌ INCORRECT:
interface dog { }              // lowercase
interface breeder_profile { }  // snake_case
type litterStatus = ...;       // camelCase
```

### Object Properties
**Use camelCase** for all object properties.

```typescript
✅ CORRECT:
interface Dog {
  dogId: string;
  kennelName: string;
  dateOfBirth: string;
  healthTests: HealthTest[];
}

❌ INCORRECT:
interface Dog {
  dog_id: string;        // snake_case
  DogId: string;         // PascalCase
  'date-of-birth': string; // kebab-case
}
```

---

## Firestore Database Conventions

### Collection Names
**Use camelCase** for multi-word collection names, **lowercase** for single words.

```typescript
✅ CORRECT:
collection(db, 'users')
collection(db, 'dogs')
collection(db, 'litters')
collection(db, 'connectionRequests')
collection(db, 'emailTemplates')
collection(db, 'scheduledEmails')
collection(db, 'breederProfiles')    // ← migrated from breeder_profiles
collection(db, 'heatCycles')         // ← migrated from heat_cycles
collection(db, 'studJobs')           // ← migrated from stud_jobs

❌ INCORRECT (Legacy - being migrated):
collection(db, 'breeder_profiles')   // snake_case - DEPRECATED
collection(db, 'heat_cycles')        // snake_case - DEPRECATED
collection(db, 'stud_jobs')          // snake_case - DEPRECATED
collection(db, 'customer_segments')  // snake_case - DEPRECATED
collection(db, 'breeding_records')   // snake_case - DEPRECATED
```

### Document Field Names
**Use camelCase** matching TypeScript interface properties.

```typescript
✅ CORRECT:
await setDoc(doc(db, 'dogs', id), {
  userId: currentUser.uid,
  kennelName: 'Golden Paws',
  dateOfBirth: '2024-01-15',
  healthTests: []
});

❌ INCORRECT:
await setDoc(doc(db, 'dogs', id), {
  user_id: currentUser.uid,      // snake_case
  kennel_name: 'Golden Paws',    // snake_case
  'date-of-birth': '2024-01-15'  // kebab-case
});
```

---

## React Component Conventions

### Component Names
**Use PascalCase** for all React component names (files and exports).

```typescript
✅ CORRECT:
// File: DogFormDialog.tsx
export function DogFormDialog() { }

// File: EmailSettingsDialog.tsx
export function EmailSettingsDialog() { }

❌ INCORRECT:
// File: dogFormDialog.tsx
export function dogFormDialog() { }  // camelCase

// File: dog-form-dialog.tsx
export function dog_form_dialog() { }  // kebab/snake case
```

### Hook Names
**Use camelCase** starting with "use" prefix.

```typescript
✅ CORRECT:
export const useDogStore = create<Store>(...);
export const useBreederStore = create<Store>(...);
export const useEmailTemplateStore = create<Store>(...);

❌ INCORRECT:
export const UseDogStore = ...;     // PascalCase
export const dogStore = ...;        // missing "use" prefix
export const use_dog_store = ...;   // snake_case
```

---

## String Literal Types

### Status Values & Enums
**Use kebab-case** (lowercase with hyphens) for all string literal union types.

This convention is:
- **URL-friendly**: Can be used directly in routes/query params
- **CSS-friendly**: Can be used as class names
- **Human-readable**: Easy to read and understand
- **Database-safe**: No encoding issues

```typescript
✅ CORRECT:
type ReminderType =
  | 'vaccination'
  | 'deworming'
  | 'vet-visit'        // kebab-case for multi-word
  | 'heat-expected'    // kebab-case for multi-word
  | 'due-date'         // kebab-case for multi-word
  | 'pickup'
  | 'registration'
  | 'custom';

type BreedingMethod =
  | 'natural'
  | 'ai'
  | 'surgical-ai';     // kebab-case for multi-word

type ContractType =
  | 'pet'
  | 'breeding-rights'  // kebab-case for multi-word
  | 'co-ownership';    // kebab-case for multi-word

type RegistrationStatus =
  | 'not-started'      // kebab-case for multi-word
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'issued';

type LitterStatus =
  | 'planned'
  | 'pregnant'
  | 'born'
  | 'weaning'
  | 'ready'
  | 'completed';

❌ INCORRECT (Legacy - being migrated):
type ReminderType =
  | 'vet_visit'        // snake_case - DEPRECATED
  | 'heat_expected'    // snake_case - DEPRECATED
  | 'due_date';        // snake_case - DEPRECATED

type BreedingMethod =
  | 'surgical_ai';     // snake_case - DEPRECATED

type ContractType =
  | 'breeding_rights'  // snake_case - DEPRECATED
  | 'co_ownership';    // snake_case - DEPRECATED
```

### Rationale: Why kebab-case for String Literals?

1. **URL Safety**: Can be used directly in routes
   ```typescript
   // Works perfectly:
   `/dogs/filter?status=not-started`

   // Requires encoding:
   `/dogs/filter?status=not_started` // looks weird
   ```

2. **CSS Class Names**: Can be used directly
   ```typescript
   // Works perfectly:
   className={`status-${status}`} // "status-not-started"

   // Requires transformation:
   className={`status-${status.replace('_', '-')}`}
   ```

3. **Human Readable**: More natural than underscores
   - ✅ `'heat-expected'` reads as "heat expected"
   - ❌ `'heat_expected'` looks like code, not data

4. **Industry Standard**: Used by HTML, CSS, and most web frameworks

---

## File Naming

### TypeScript/React Files
**Use PascalCase** for component files, **camelCase** for utility/library files.

```bash
✅ CORRECT:
src/components/DogFormDialog.tsx        # Component
src/components/EmailSettings.tsx        # Component
src/components/ErrorBoundary.tsx        # Component
src/lib/websiteTheme.ts                 # Utility
src/lib/emailIntegration.ts             # Utility
src/store/dogStoreFirebase.ts           # Store
src/types/dog.ts                        # Types

❌ INCORRECT:
src/components/dog-form-dialog.tsx      # kebab-case
src/components/email_settings.tsx       # snake_case
src/lib/WebsiteTheme.ts                 # PascalCase for utility
```

### Folders
**Use lowercase** for all folder names.

```bash
✅ CORRECT:
src/components/
src/pages/
src/lib/
src/store/
src/types/
src/pages/auth/

❌ INCORRECT:
src/Components/
src/Pages/
src/Lib/
```

---

## Migration Status

### ✅ Already Compliant
- [x] Object properties (camelCase)
- [x] Component names (PascalCase)
- [x] Hook names (use* + camelCase)
- [x] Most Firestore collections
- [x] Most file names

### 🚧 Currently Migrating

#### Firestore Collections (High Priority)
Status: **Ready for Migration**

Collections to rename:
```typescript
'breeder_profiles'   → 'breederProfiles'
'breeding_records'   → 'breedingRecords'
'heat_cycles'        → 'heatCycles'
'stud_jobs'          → 'studJobs'
'customer_segments'  → 'customerSegments'
```

**Migration Script**: See `scripts/migrateCollections.ts`

#### String Literal Types (Medium Priority)
Status: **Partially Complete**

Types to update:
```typescript
// In src/types/dog.ts
'vet_visit'          → 'vet-visit'
'heat_expected'      → 'heat-expected'
'due_date'           → 'due-date'
'surgical_ai'        → 'surgical-ai'
'breeding_rights'    → 'breeding-rights'
'co_ownership'       → 'co-ownership'
'not_started'        → 'not-started'
'co_owner'           → 'co-owner'
'litter_certificate' → 'litter-certificate'
```

**Migration Script**: See `scripts/migrateStringLiterals.ts`

---

## Enforcement

### ESLint Rules
The following ESLint rules enforce these conventions:

```json
{
  "@typescript-eslint/naming-convention": [
    "error",
    {
      "selector": "variable",
      "format": ["camelCase", "UPPER_CASE"]
    },
    {
      "selector": "function",
      "format": ["camelCase"]
    },
    {
      "selector": "typeLike",
      "format": ["PascalCase"]
    },
    {
      "selector": "property",
      "format": ["camelCase"]
    }
  ]
}
```

### Type Guards
Use helper types to enforce string literal conventions:

```typescript
// src/types/guards.ts
type KebabCase<T extends string> = T extends `${infer A}_${infer B}`
  ? never
  : T;

type ValidStatus = KebabCase<'not-started' | 'pending'>; // ✅ OK
type InvalidStatus = KebabCase<'not_started'>;            // ❌ Error
```

---

## Examples

### Complete Dog Interface Example
```typescript
export interface Dog {
  // IDs - camelCase
  id: string;
  userId: string;

  // Strings - camelCase
  name: string;
  breed: string;
  kennelName: string;

  // Dates - camelCase
  dateOfBirth: string;

  // Arrays - camelCase
  healthTests: HealthTest[];
  shotRecords: ShotRecord[];

  // Enums - kebab-case literals
  gender: 'male' | 'female';
  status: 'active' | 'inactive' | 'deceased';

  // Nested objects - camelCase properties
  registration: {
    registryName: string;
    registrationNumber: string;
    status: 'not-started' | 'pending' | 'approved';  // kebab-case
  };
}
```

### Complete Firestore Example
```typescript
import { collection, doc, setDoc, query, where } from 'firebase/firestore';

// Collection names - camelCase or lowercase
const dogsRef = collection(db, 'dogs');
const profilesRef = collection(db, 'breederProfiles');  // migrated
const cyclesRef = collection(db, 'heatCycles');         // migrated

// Document fields - camelCase
await setDoc(doc(dogsRef, dogId), {
  userId: currentUser.uid,
  kennelName: 'Golden Paws',
  dateOfBirth: '2024-01-15',
  status: 'active',  // kebab-case literal
  registration: {
    registryName: 'AKC',
    status: 'not-started'  // kebab-case literal
  }
});

// Queries - camelCase fields, kebab-case literals
const q = query(
  dogsRef,
  where('userId', '==', uid),
  where('status', '==', 'active')
);
```

---

## Questions?

If you're unsure about a naming convention:

1. Check this document first
2. Search for similar existing code
3. Ask in code review
4. When in doubt, use camelCase for code, kebab-case for data

---

**Last Updated**: December 2024
**Status**: Active - Migration in Progress
**Next Review**: After migration scripts complete
