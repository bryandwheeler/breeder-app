# Turborepo Migration Plan

## Overview
Migrate the current single-app React breeder application to a Turborepo monorepo structure to support:
- **Web App**: Current breeder admin portal
- **Mobile App**: React Native/Expo app for on-the-go kennel management
- **Shared Packages**: Reusable code across apps

## Target Folder Structure

```
breeder-monorepo/
├── apps/
│   ├── web/                    # Current React web app (Vite)
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── mobile/                 # React Native/Expo mobile app
│       ├── src/
│       ├── app.json
│       └── package.json
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── dog.ts
│   │   │   ├── litter.ts
│   │   │   ├── buyer.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/    # shadcn/ui components
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   ├── firebase/               # Firebase client & business logic
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── stores/        # Zustand stores
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── utils/                  # Shared utilities
│   │   ├── src/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── calculations.ts
│   │   └── package.json
│   │
│   └── config/                 # Shared config (ESLint, TypeScript, etc.)
│       ├── eslint/
│       ├── typescript/
│       └── package.json
│
├── turbo.json                  # Turborepo configuration
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm workspaces config
└── README.md
```

## Migration Steps

### Phase 1: Setup Turborepo Foundation (1-2 hours)

1. **Install Turborepo globally**
   ```bash
   npm install -g turbo
   ```

2. **Create new monorepo structure**
   ```bash
   cd ..
   mkdir breeder-monorepo
   cd breeder-monorepo
   npx create-turbo@latest
   ```
   Or manually:
   ```bash
   pnpm init
   mkdir apps packages
   ```

3. **Configure root package.json**
   ```json
   {
     "name": "breeder-monorepo",
     "private": true,
     "workspaces": [
       "apps/*",
       "packages/*"
     ],
     "scripts": {
       "dev": "turbo run dev",
       "build": "turbo run build",
       "lint": "turbo run lint",
       "type-check": "turbo run type-check"
     },
     "devDependencies": {
       "turbo": "latest",
       "@types/node": "^20.0.0",
       "typescript": "^5.0.0"
     },
     "packageManager": "pnpm@8.0.0"
   }
   ```

4. **Create turbo.json**
   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "globalDependencies": ["**/.env.*local"],
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["dist/**", ".next/**", "build/**"]
       },
       "dev": {
         "cache": false,
         "persistent": true
       },
       "lint": {
         "dependsOn": ["^lint"]
       },
       "type-check": {
         "dependsOn": ["^type-check"]
       }
     }
   }
   ```

5. **Create pnpm-workspace.yaml**
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

### Phase 2: Extract Shared Packages (3-4 hours)

#### 2.1 Create @breeder/types package

1. **Create package structure**
   ```bash
   mkdir -p packages/types/src
   cd packages/types
   pnpm init
   ```

2. **Configure package.json**
   ```json
   {
     "name": "@breeder/types",
     "version": "0.0.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "exports": {
       ".": "./src/index.ts"
     },
     "scripts": {
       "type-check": "tsc --noEmit"
     },
     "devDependencies": {
       "typescript": "^5.0.0"
     }
   }
   ```

3. **Copy type definitions**
   - Copy from `breeder-app/src/types/dog.ts` → `packages/types/src/dog.ts`
   - Copy from `breeder-app/src/types/guards.ts` → `packages/types/src/guards.ts`
   - Create `packages/types/src/index.ts` that exports all types

#### 2.2 Create @breeder/ui package

1. **Create package structure**
   ```bash
   mkdir -p packages/ui/src
   ```

2. **Move shadcn/ui components**
   - Copy `breeder-app/src/components/ui/` → `packages/ui/src/components/`
   - Copy `breeder-app/src/lib/utils.ts` → `packages/ui/src/lib/`
   - Copy `breeder-app/src/hooks/` → `packages/ui/src/hooks/`

3. **Configure package.json**
   ```json
   {
     "name": "@breeder/ui",
     "version": "0.0.0",
     "private": true,
     "main": "./src/index.ts",
     "dependencies": {
       "@radix-ui/react-*": "latest",
       "class-variance-authority": "latest",
       "clsx": "latest",
       "tailwind-merge": "latest",
       "react": "^18.2.0"
     },
     "peerDependencies": {
       "react": "^18.2.0"
     }
   }
   ```

#### 2.3 Create @breeder/firebase package

1. **Create package structure**
   ```bash
   mkdir -p packages/firebase/src
   ```

2. **Move Firebase logic**
   - Copy `breeder-app/src/lib/firebase.ts` → `packages/firebase/src/config/`
   - Copy `breeder-app/src/store/` → `packages/firebase/src/stores/`
   - Copy `breeder-app/src/lib/subcollections/` → `packages/firebase/src/subcollections/`

3. **Configure package.json**
   ```json
   {
     "name": "@breeder/firebase",
     "version": "0.0.0",
     "private": true,
     "main": "./src/index.ts",
     "dependencies": {
       "@breeder/types": "workspace:*",
       "firebase": "^10.0.0",
       "zustand": "^4.4.0",
       "date-fns": "^2.30.0"
     }
   }
   ```

#### 2.4 Create @breeder/utils package

1. **Extract utility functions**
   - Move formatting functions (currency, dates)
   - Move calculation functions (heat cycle predictions, etc.)
   - Move validation functions

### Phase 3: Migrate Web App (2-3 hours)

1. **Move current app to apps/web**
   ```bash
   mv breeder-app apps/web
   ```

2. **Update imports in apps/web**
   ```typescript
   // Before:
   import { Dog, Litter } from '@/types/dog'
   import { Button } from '@/components/ui/button'
   import { useDogStore } from '@/store/dogStoreFirebase'

   // After:
   import { Dog, Litter } from '@breeder/types'
   import { Button } from '@breeder/ui'
   import { useDogStore } from '@breeder/firebase'
   ```

3. **Update package.json**
   ```json
   {
     "name": "@breeder/web",
     "dependencies": {
       "@breeder/types": "workspace:*",
       "@breeder/ui": "workspace:*",
       "@breeder/firebase": "workspace:*",
       "@breeder/utils": "workspace:*"
     }
   }
   ```

4. **Update vite.config.ts**
   - No major changes needed
   - Paths should resolve via pnpm workspaces

5. **Update tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@breeder/types": ["../../packages/types/src"],
         "@breeder/ui": ["../../packages/ui/src"],
         "@breeder/firebase": ["../../packages/firebase/src"],
         "@breeder/utils": ["../../packages/utils/src"]
       }
     }
   }
   ```

### Phase 4: Create Mobile App Scaffold (2-3 hours)

1. **Create Expo app**
   ```bash
   cd apps
   npx create-expo-app mobile --template tabs
   ```

2. **Install dependencies**
   ```bash
   cd mobile
   pnpm add @breeder/types @breeder/firebase @breeder/utils
   pnpm add expo-router react-native-reanimated
   ```

3. **Configure package.json**
   ```json
   {
     "name": "@breeder/mobile",
     "version": "1.0.0",
     "scripts": {
       "dev": "expo start",
       "android": "expo start --android",
       "ios": "expo start --ios",
       "web": "expo start --web"
     },
     "dependencies": {
       "@breeder/types": "workspace:*",
       "@breeder/firebase": "workspace:*",
       "@breeder/utils": "workspace:*",
       "expo": "~50.0.0",
       "react-native": "0.73.0"
     }
   }
   ```

4. **Create basic screens**
   ```
   apps/mobile/
   ├── app/
   │   ├── (tabs)/
   │   │   ├── index.tsx        # Dashboard
   │   │   ├── dogs.tsx         # Dog List
   │   │   └── litters.tsx      # Litter List
   │   └── _layout.tsx
   ```

### Phase 5: Testing & Validation (1-2 hours)

1. **Run type checking**
   ```bash
   pnpm turbo type-check
   ```

2. **Test builds**
   ```bash
   pnpm turbo build
   ```

3. **Test development mode**
   ```bash
   pnpm turbo dev
   ```

4. **Verify mobile app**
   ```bash
   cd apps/mobile
   pnpm dev
   ```

## Benefits of This Structure

### Immediate Benefits
- ✅ Code reuse between web and mobile
- ✅ Single source of truth for types
- ✅ Consistent business logic
- ✅ Faster builds with Turborepo caching
- ✅ Better organization

### Future Benefits
- ✅ Easy to add new apps (customer portal, etc.)
- ✅ Can extract packages to npm if needed
- ✅ Independent versioning per package
- ✅ Clear boundaries between concerns
- ✅ Easier testing and maintenance

## Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 1-2 hours | Setup Turborepo foundation |
| Phase 2 | 3-4 hours | Extract shared packages |
| Phase 3 | 2-3 hours | Migrate web app |
| Phase 4 | 2-3 hours | Create mobile scaffold |
| Phase 5 | 1-2 hours | Testing & validation |
| **Total** | **9-14 hours** | Complete migration |

## Rollback Plan

If migration fails, we can:
1. Keep the original `breeder-app` folder as backup
2. Git branches for each phase
3. Can run old and new side-by-side during testing

## Next Steps

1. ✅ Review this plan
2. Create a new branch: `git checkout -b feat/turborepo-migration`
3. Start with Phase 1 (Turborepo setup)
4. Commit after each phase
5. Test thoroughly before merging

## Questions to Consider

- **Mobile Features**: What features should mobile have initially?
  - View dogs/litters?
  - Quick puppy updates?
  - Photo uploads?
  - Health record access?

- **UI Library**: For mobile, should we:
  - Use React Native Paper?
  - Use NativeBase?
  - Custom components?

- **Authentication**:
  - Reuse Firebase Auth (recommended)
  - Share auth state via @breeder/firebase package

---

**Ready to start?** Let me know and I can begin implementing Phase 1!
