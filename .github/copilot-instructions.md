# Copilot Instructions for Breeder Management App

Welcome to the Breeder Management App codebase! This document provides essential guidelines for AI coding agents to be productive and aligned with the project's architecture, workflows, and conventions.

## Project Overview

The Breeder Management App is a comprehensive dog breeding management application built with React, TypeScript, Vite, and Firebase. It includes features like dog and litter management, customer CRM, health tracking, and more. The app uses Firebase for backend services (Authentication, Firestore, Storage) and Zustand for state management.

### Key Directories

- **`src/components/`**: Reusable React components (e.g., dialogs, forms, charts).
- **`src/pages/`**: Page-level components for routing.
- **`src/lib/`**: Utility functions and Firebase configuration.
- **`src/store/`**: Zustand-based state management.
- **`src/types/`**: TypeScript type definitions.
- **`src/data/`**: Static data (e.g., dog breeds).

## Development Workflows

### Local Development

- Start the development server:

  ```bash
  npm run dev
  ```

  This runs the app at `http://localhost:5173` using the development Firebase project.

- Build for development:

  ```bash
  npm run build:dev
  ```

- Build for production:
  ```bash
  npm run build:prod
  ```

### Firebase Deployment

- Deploy to development:

  ```bash
  npm run deploy:dev
  ```

  Deploys to `https://expert-breeder-dev.web.app`.

- Deploy to production:
  ```bash
  npm run deploy:prod
  ```
  Deploys to `https://expert-breeder.web.app`.

### Data Migration

- Migrate data between Firebase projects:
  ```bash
  npm run migrate
  ```
  Ensure `serviceAccountKey-dev.json` and `serviceAccountKey-prod.json` are correctly configured in the `scripts/` directory.

## Project-Specific Conventions

- **State Management**: Use Zustand for global state. Store files are located in `src/store/`.
- **Styling**: Tailwind CSS is the primary styling framework. Follow utility-first principles.
- **Component Structure**: Place reusable components in `src/components/`. Use `ui/` for low-level UI components.
- **TypeScript**: Strict typing is enforced. Define shared types in `src/types/`.
- **Firebase Integration**: Use `src/lib/firebase.ts` for Firebase configuration and utilities.

## External Dependencies

- **Firebase**: Authentication, Firestore, and Storage.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Prebuilt UI components.
- **Recharts**: Charting library for data visualization.
- **jsPDF**: PDF generation.

## Examples of Common Patterns

### Dialog Components

Dialog components (e.g., `AddCustomerDialog.tsx`, `DeleteDogDialog.tsx`) follow a consistent pattern:

- Use `useState` or Zustand for state management.
- Include form validation using `react-hook-form`.
- Example:

  ```tsx
  import { useForm } from 'react-hook-form';

  const AddCustomerDialog = () => {
    const { register, handleSubmit } = useForm();

    const onSubmit = (data) => {
      console.log(data);
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register('name')} placeholder='Customer Name' />
        <button type='submit'>Add</button>
      </form>
    );
  };
  ```

### Firebase Utilities

Firebase utilities are centralized in `src/lib/firebase.ts`. Always import from this file to ensure consistent configuration.

### Zustand Store

State management uses Zustand. Example:

```tsx
import create from 'zustand';

const useStore = create((set) => ({
  dogs: [],
  addDog: (dog) => set((state) => ({ dogs: [...state.dogs, dog] })),
}));

export default useStore;
```

## Notes for AI Agents

- **Environment Variables**: Never hardcode Firebase credentials. Use `.env` files.
- **Testing**: Write unit tests for utilities and components. Use Jest and React Testing Library.
- **Error Handling**: Ensure all Firebase calls handle errors gracefully.

For further details, refer to the [README.md](../README.md) and other documentation files in the repository.
