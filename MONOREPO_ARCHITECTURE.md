# Monorepo Architecture Diagram

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Breeder Monorepo                          │
└─────────────────────────────────────────────────────────────┘
           │                              │
           │                              │
    ┌──────▼──────┐              ┌───────▼────────┐
    │    Apps     │              │   Packages     │
    └─────────────┘              └────────────────┘
           │                              │
    ┌──────┴──────┐              ┌───────┴────────┐
    │             │              │                 │
┌───▼────┐   ┌───▼────┐    ┌────▼─────┐    ┌────▼─────┐
│  Web   │   │ Mobile │    │  Types   │    │    UI    │
│  App   │   │  App   │    │          │    │          │
└────────┘   └────────┘    └──────────┘    └──────────┘
    │            │               │               │
    │            │               │               │
    └────────────┴───────────────┴───────────────┘
                      │
                 ┌────▼─────┐
                 │ Firebase │
                 └──────────┘
```

## Package Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│ Apps Layer (User-Facing Applications)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐              ┌──────────────────┐      │
│  │ @breeder/web   │              │ @breeder/mobile  │      │
│  │                │              │                  │      │
│  │ • Vite         │              │ • Expo/RN        │      │
│  │ • React Router │              │ • Expo Router    │      │
│  │ • Web UI       │              │ • Native UI      │      │
│  └────────┬───────┘              └────────┬─────────┘      │
│           │                               │                 │
│           └───────────┬───────────────────┘                 │
└───────────────────────┼─────────────────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
┌───▼─────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│             │  │             │  │                  │
│ @breeder/ui │  │@breeder/    │  │ @breeder/utils  │
│             │  │firebase     │  │                  │
│ • Button    │  │             │  │ • Formatters    │
│ • Card      │  │ • Auth      │  │ • Validators    │
│ • Dialog    │  │ • Stores    │  │ • Calculations  │
│ • Form      │  │ • Hooks     │  │                  │
└─────────────┘  └──────┬──────┘  └──────────────────┘
                        │
                 ┌──────▼──────┐
                 │ @breeder/   │
                 │ types       │
                 │             │
                 │ • Dog       │
                 │ • Litter    │
                 │ • Puppy     │
                 │ • Buyer     │
                 └─────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Foundation Layer (Core Business Logic & Types)              │
└─────────────────────────────────────────────────────────────┘
```

## Shared Package Contents

### @breeder/types
```typescript
// Core domain types
export interface Dog { ... }
export interface Litter { ... }
export interface Puppy { ... }
export interface Buyer { ... }
export interface HeatCycle { ... }

// Enums and unions
export type DogSex = 'male' | 'female'
export type BreedingStatus = 'active_breeder' | 'retired' | ...
```

### @breeder/firebase
```typescript
// Stores
export { useDogStore } from './stores/dogStore'
export { useHeatCycleStore } from './stores/heatCycleStore'

// Hooks
export { useAuth } from './hooks/useAuth'
export { useFirebaseUser } from './hooks/useFirebaseUser'

// Utils
export { db, auth, storage } from './config/firebase'
```

### @breeder/ui
```typescript
// shadcn/ui components
export { Button } from './components/button'
export { Card } from './components/card'
export { Dialog } from './components/dialog'

// Custom components
export { DogCard } from './components/dog-card'
export { PuppyCard } from './components/puppy-card'

// Hooks
export { useToast } from './hooks/use-toast'

// Utils
export { cn, formatCurrency } from './lib/utils'
```

### @breeder/utils
```typescript
// Formatting
export { formatCurrency, formatDate } from './formatters'

// Validation
export { validateEmail, validatePhone } from './validators'

// Calculations
export { calculateHeatCycle, calculateDueDate } from './calculations'
```

## Data Flow Example

### Web App - Viewing Dog Profile
```
User clicks dog
    │
    ▼
@breeder/web/DogProfile.tsx
    │
    ├─► imports { Dog } from '@breeder/types'
    ├─► imports { useDogStore } from '@breeder/firebase'
    ├─► imports { Card, Button } from '@breeder/ui'
    └─► imports { formatDate } from '@breeder/utils'
    │
    ▼
@breeder/firebase/useDogStore
    │
    ├─► Fetches from Firestore
    ├─► Returns Dog type
    └─► Updates Zustand store
    │
    ▼
Component renders with shared UI components
```

### Mobile App - Viewing Dog Profile
```
User taps dog
    │
    ▼
@breeder/mobile/screens/DogProfile.tsx
    │
    ├─► imports { Dog } from '@breeder/types'
    ├─► imports { useDogStore } from '@breeder/firebase'
    ├─► imports { formatDate } from '@breeder/utils'
    └─► Uses React Native components
    │
    ▼
@breeder/firebase/useDogStore (SAME STORE!)
    │
    └─► Shared business logic
    │
    ▼
Component renders with native UI
```

## Build Pipeline (Turborepo)

```
pnpm turbo build
    │
    ├─► Build @breeder/types       [Cached if unchanged]
    │   └─► TypeScript compilation
    │
    ├─► Build @breeder/utils       [Cached if unchanged]
    │   └─► TypeScript compilation
    │
    ├─► Build @breeder/ui          [Cached if unchanged]
    │   └─► TypeScript compilation
    │
    ├─► Build @breeder/firebase    [Cached if unchanged]
    │   └─► TypeScript compilation
    │
    ├─► Build @breeder/web         [Depends on packages above]
    │   └─► Vite build
    │
    └─► Build @breeder/mobile      [Depends on packages above]
        └─► Expo build
```

## Development Workflow

```
Developer makes change to @breeder/types/Dog.ts
    │
    ├─► Turborepo detects change
    │
    ├─► Rebuilds @breeder/types
    │
    ├─► Rebuilds dependent packages:
    │   ├─► @breeder/firebase (uses Dog type)
    │   └─► @breeder/ui (uses Dog type)
    │
    └─► Hot reloads both apps:
        ├─► @breeder/web (Vite HMR)
        └─► @breeder/mobile (Expo Fast Refresh)
```

## File Sharing Example

### Before (Single App)
```
breeder-app/
├── src/
│   ├── types/dog.ts          ← Only for web
│   ├── store/dogStore.ts     ← Only for web
│   └── components/DogCard.tsx ← Only for web
```

### After (Monorepo)
```
packages/
├── types/
│   └── src/dog.ts            ← Shared by web & mobile
├── firebase/
│   └── src/stores/dogStore.ts ← Shared by web & mobile
└── ui/
    └── src/DogCard.tsx       ← Web only

apps/
├── web/
│   └── uses all shared packages
└── mobile/
    ├── uses @breeder/types ✓
    ├── uses @breeder/firebase ✓
    └── has its own native UI components
```

## Key Advantages

1. **Type Safety Across Apps**
   - Change `Dog` type once
   - Both apps get the update
   - Compile-time errors if incompatible

2. **Shared Business Logic**
   - Heat cycle calculations
   - Price calculations
   - Validation rules
   - All consistent across platforms

3. **Faster Builds**
   - Turborepo caches unchanged packages
   - Only rebuilds what changed
   - Parallel builds

4. **Easy Testing**
   - Test packages independently
   - Mock packages for app tests
   - Share test utilities

5. **Future Flexibility**
   - Add customer portal as `apps/portal`
   - Extract packages to npm if needed
   - Easy to add new platforms

---

This architecture sets you up for scalable growth while maintaining code quality and consistency!
