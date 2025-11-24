# Breeder Management App

A comprehensive dog breeding management application built with React, TypeScript, Vite, and Firebase.

## Features

- 🐕 Dog and litter management
- 📊 Puppy tracking with weight charts
- 👥 Customer/buyer CRM
- 📝 Waitlist management
- 📄 Contract generation and signing
- 🏆 Registration tracking (AKC/CKC)
- 💉 Health tracking and DNA profiles
- 📅 Care schedule templates with drag-and-drop
- ⏰ Daily routines for litter care
- 💰 Expense tracking
- 🌐 Public breeder website
- 📱 Public litter pages
- 🗓️ Calendar with reminders
- ✉️ Email integration
- 📑 PDF export and data export
- 🏠 Guardian home program
- 🔐 Breeding rights and co-ownership
- 🐾 280+ dog breeds autocomplete

## Environment Setup

This project uses separate Firebase projects for development and production environments.

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase Projects

You need TWO Firebase projects:
- **Production**: `expert-breeder` (already set up)
- **Development**: `expert-breeder-dev` (create this)

#### Create Development Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → Name it `expert-breeder-dev`
3. Enable **Authentication** (Email/Password)
4. Enable **Firestore Database** (Start in test mode)
5. Enable **Storage** (Start in test mode)

### 3. Get Firebase Configurations

For each project (production and development):

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" → Web app
3. Copy the `firebaseConfig` values

### 4. Create Environment Files

Copy `.env.example` to create your environment files:

**For Development** (`.env.development`):
```env
VITE_FIREBASE_API_KEY=your-dev-api-key
VITE_FIREBASE_AUTH_DOMAIN=expert-breeder-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=expert-breeder-dev
VITE_FIREBASE_STORAGE_BUCKET=expert-breeder-dev.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-dev-sender-id
VITE_FIREBASE_APP_ID=your-dev-app-id
```

**For Production** (`.env.production`):
```env
VITE_FIREBASE_API_KEY=your-prod-api-key
VITE_FIREBASE_AUTH_DOMAIN=expert-breeder.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=expert-breeder
VITE_FIREBASE_STORAGE_BUCKET=expert-breeder.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-prod-sender-id
VITE_FIREBASE_APP_ID=your-prod-app-id
```

⚠️ **Important**: Never commit `.env.development` or `.env.production` to Git!

## Development

### Local Development (uses `.env.development`)

```bash
npm run dev
```

This runs the app at `http://localhost:5173` and connects to your **development** Firebase project.

### Build for Development

```bash
npm run build:dev
```

### Build for Production

```bash
npm run build:prod
```

## Deployment

### Deploy to Development

```bash
npm run deploy:dev
```

This deploys to: `https://expert-breeder-dev.web.app`

### Deploy to Production

```bash
npm run deploy:prod
```

This deploys to: `https://expert-breeder.web.app`

### Manual Firebase Commands

```bash
# Switch to development project
firebase use development

# Switch to production project
firebase use production

# Deploy current build
firebase deploy --only hosting
```

## Project Structure

```
breeder-app/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── lib/             # Utilities and Firebase config
│   ├── store/           # Zustand state management
│   ├── types/           # TypeScript types
│   └── data/            # Static data (dog breeds, etc.)
├── .env.development     # Dev Firebase config (not in Git)
├── .env.production      # Prod Firebase config (not in Git)
├── .env.example         # Template for environment files
└── firebase.json        # Firebase hosting config
```

## Tech Stack

- **React 19.2** with TypeScript
- **Vite** - Build tool
- **Firebase** - Backend (Auth, Firestore, Storage)
- **Zustand** - State management
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Recharts** - Charts and graphs
- **jsPDF** - PDF generation

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
