# Breeder App Monorepo

This is a Turborepo monorepo for the Breeder App, set up to share code between web and mobile applications.

## Structure

\`\`\`
breeder-app/
├── apps/
│   └── web/              # React web application (Vite)
├── packages/
│   ├── types/            # Shared TypeScript type definitions
│   ├── firebase/         # Firebase configuration and Zustand stores
│   └── ui/               # Shared UI components (work in progress)
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── package.json          # Root package.json
\`\`\`

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm dev

# Build all packages and apps
pnpm build
\`\`\`

## Packages

- **@breeder/types**: Shared TypeScript type definitions
- **@breeder/firebase**: Firebase config and Zustand stores  
- **@breeder/ui**: Shared UI components (work in progress)

## Apps

- **@breeder/web**: React web application (Vite + React 19 + Tailwind CSS 4)

See [MONOREPO_ARCHITECTURE.md](./MONOREPO_ARCHITECTURE.md) and [TURBOREPO_MIGRATION_PLAN.md](./TURBOREPO_MIGRATION_PLAN.md) for more details.
