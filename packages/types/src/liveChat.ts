// Live Chat Types
// Tawk.to integration for live chat and chatbot support

// ============================================================================
// Tawk.to Configuration
// ============================================================================

// Business hours schedule for a single day
export interface BusinessHoursDay {
  enabled: boolean;
  open: string; // HH:MM format (e.g., "09:00")
  close: string; // HH:MM format (e.g., "17:00")
}

// Full week schedule
export type BusinessHoursSchedule = {
  sunday: BusinessHoursDay;
  monday: BusinessHoursDay;
  tuesday: BusinessHoursDay;
  wednesday: BusinessHoursDay;
  thursday: BusinessHoursDay;
  friday: BusinessHoursDay;
  saturday: BusinessHoursDay;
};

// Main Tawk.to configuration
export interface TawkToConfig {
  enabled: boolean;
  propertyId: string; // Tawk.to property ID
  widgetId: string; // Tawk.to widget ID

  // Display settings
  showOnAllPages: boolean;
  excludedPaths?: string[]; // Paths where widget should be hidden (e.g., ['/admin', '/login'])

  // User info
  passUserInfo: boolean; // Whether to pass logged-in user info to Tawk

  // Business hours (optional)
  businessHoursEnabled?: boolean;
  timezone?: string; // e.g., "America/New_York"
  businessHours?: BusinessHoursSchedule;
  offlineMessage?: string; // Message shown when outside business hours

  // Widget customization
  widgetColor?: string; // Hex color for widget
  widgetPosition?: 'left' | 'right'; // Widget position on screen
}

// Default business hours (9-5 weekdays)
export const DEFAULT_BUSINESS_HOURS: BusinessHoursSchedule = {
  sunday: { enabled: false, open: '09:00', close: '17:00' },
  monday: { enabled: true, open: '09:00', close: '17:00' },
  tuesday: { enabled: true, open: '09:00', close: '17:00' },
  wednesday: { enabled: true, open: '09:00', close: '17:00' },
  thursday: { enabled: true, open: '09:00', close: '17:00' },
  friday: { enabled: true, open: '09:00', close: '17:00' },
  saturday: { enabled: false, open: '09:00', close: '17:00' },
};

// Default Tawk.to configuration
export const DEFAULT_TAWKTO_CONFIG: TawkToConfig = {
  enabled: false,
  propertyId: '',
  widgetId: '',
  showOnAllPages: true,
  excludedPaths: ['/admin'],
  passUserInfo: true,
  businessHoursEnabled: false,
  widgetPosition: 'right',
};

// ============================================================================
// Chatbot FAQ Responses
// ============================================================================

// FAQ category for organization
export type FAQCategory =
  | 'getting_started'
  | 'account'
  | 'dogs'
  | 'litters'
  | 'customers'
  | 'billing'
  | 'technical'
  | 'other';

// FAQ category labels
export const FAQ_CATEGORY_LABELS: Record<FAQCategory, string> = {
  getting_started: 'Getting Started',
  account: 'Account',
  dogs: 'Dogs & Breeding',
  litters: 'Litters & Puppies',
  customers: 'Customers & Waitlist',
  billing: 'Billing & Subscription',
  technical: 'Technical Issues',
  other: 'Other',
};

// Chatbot FAQ response
export interface ChatbotResponse {
  id: string;
  keywords: string[]; // Trigger keywords (e.g., ["password", "reset", "forgot"])
  question: string; // Question to display (e.g., "How do I reset my password?")
  answer: string; // Answer text (supports markdown)
  category: FAQCategory;
  order: number; // Display order within category
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Live Chat Settings in AppSettings
// ============================================================================

export interface LiveChatSettings {
  tawkTo?: TawkToConfig;
  faqResponses?: ChatbotResponse[];
}

// Default live chat settings
export const DEFAULT_LIVE_CHAT_SETTINGS: LiveChatSettings = {
  tawkTo: DEFAULT_TAWKTO_CONFIG,
  faqResponses: [],
};

// ============================================================================
// Tawk.to API Types (for visitor tracking)
// ============================================================================

// Visitor info to pass to Tawk.to
export interface TawkToVisitor {
  name?: string;
  email?: string;
  hash?: string; // HMAC hash for secure mode
}

// Tawk.to custom attributes
export interface TawkToAttributes {
  userId?: string;
  userType?: string;
  kennelName?: string;
  subscriptionTier?: string;
  [key: string]: string | undefined;
}

// Tawk.to API interface (available on window.Tawk_API)
export interface TawkToAPI {
  visitor?: TawkToVisitor;
  onLoad?: () => void;
  onStatusChange?: (status: string) => void;
  onChatMaximized?: () => void;
  onChatMinimized?: () => void;
  onChatStarted?: () => void;
  onChatEnded?: () => void;
  setAttributes?: (attributes: TawkToAttributes, callback?: (error?: Error) => void) => void;
  addEvent?: (name: string, data?: Record<string, unknown>, callback?: (error?: Error) => void) => void;
  addTags?: (tags: string[], callback?: (error?: Error) => void) => void;
  removeTags?: (tags: string[], callback?: (error?: Error) => void) => void;
  maximize?: () => void;
  minimize?: () => void;
  toggle?: () => void;
  popup?: () => void;
  getWindowType?: () => 'inline' | 'embed';
  showWidget?: () => void;
  hideWidget?: () => void;
  toggleVisibility?: () => void;
  getStatus?: () => 'online' | 'away' | 'offline';
  isChatMaximized?: () => boolean;
  isChatMinimized?: () => boolean;
  isChatHidden?: () => boolean;
  isChatOngoing?: () => boolean;
  isVisitorEngaged?: () => boolean;
  endChat?: () => void;
}

// Extend Window interface for Tawk.to
declare global {
  interface Window {
    Tawk_API?: TawkToAPI;
    Tawk_LoadStart?: Date;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

// Check if currently within business hours
export function isWithinBusinessHours(
  config: TawkToConfig,
  now: Date = new Date()
): boolean {
  if (!config.businessHoursEnabled || !config.businessHours) {
    return true; // If not configured, always available
  }

  const days: (keyof BusinessHoursSchedule)[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  const dayName = days[now.getDay()];
  const daySchedule = config.businessHours[dayName];

  if (!daySchedule.enabled) {
    return false;
  }

  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
}

// Find matching FAQ response by keywords
export function findMatchingFAQ(
  query: string,
  responses: ChatbotResponse[]
): ChatbotResponse | null {
  const queryLower = query.toLowerCase();

  const activeResponses = responses.filter((r) => r.isActive);

  // Find response where any keyword matches
  for (const response of activeResponses) {
    for (const keyword of response.keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        return response;
      }
    }
  }

  return null;
}
