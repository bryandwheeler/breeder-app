// Re-export Firebase config
export * from './config/firebase';

// Re-export utility functions
export * from './utils/contactHelpers';

// Re-export migrations
export * from './migrations/migrateToContacts';

// Re-export all stores
export * from './stores/adminStore';
export * from './stores/breederStore';
export * from './stores/careTemplateStore';
export * from './stores/connectionStore';
export * from './stores/crmStore';
// Note: dogStore.ts is local-only, dogStoreFirebase.ts is the Firebase version
export * from './stores/dogStoreFirebase';
export * from './stores/emailStore';
export * from './stores/emailTemplateStore';
export * from './stores/forumStore';
export * from './stores/heatCycleStore';
export * from './stores/newsletterStore';
export * from './stores/scheduledEmailStore';
// export * from './stores/studJobStore'; // TODO: Fix actualDate property errors
export * from './stores/taskStore';
export * from './stores/waitlistStore';
export * from './stores/websiteStore';
export * from './stores/evaluationStore';
export * from './stores/breederSocialStore';
export * from './stores/ticketStore';
// export * from './stores/workflowStore'; // TODO: Fix complex type errors and missing dependencies

// Re-export subcollection utilities
export * from './utils/subcollections/puppyEvaluationSubcollections';
