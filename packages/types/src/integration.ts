// =====================================================================
// ThePuppyWag.com Integration Types
// =====================================================================

/** Per-breeder integration settings stored in tpwIntegrations/{userId} */
export interface TpwIntegrationSettings {
  enabled: boolean;
  apiKeyHash: string;
  apiKeyPrefix: string;
  apiKeyCreatedAt: string;

  // Data sharing toggles
  sharePuppies: boolean;
  shareBreederProfile: boolean;
  sharePhotos: boolean;
  sharePricing: boolean;

  // Outgoing webhook config
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEnabled: boolean;

  createdAt: string;
  updatedAt: string;
}

/** Puppy listing shape returned by the API */
export interface TpwPuppyListing {
  id: string;
  litterId?: string;
  breederId: string;
  name: string;
  breed: string;
  sex: 'male' | 'female';
  color?: string;
  dateOfBirth?: string;
  status: 'available' | 'reserved';
  price?: number;
  photos: string[];
  description?: string;
  updatedAt: string;
}

/** Breeder profile shape returned by the API */
export interface TpwBreederProfile {
  id: string;
  breederName: string;
  kennelName?: string;
  primaryBreed: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  profileImage?: string;
  updatedAt: string;
}

/** Standard API response envelope */
export interface TpwApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  error?: string;
}

/** Webhook event types */
export type TpwWebhookEventType =
  | 'puppy.created'
  | 'puppy.updated'
  | 'puppy.status_changed'
  | 'puppy.removed'
  | 'breeder.profile_updated';

/** Outgoing webhook payload */
export interface TpwWebhookPayload {
  event: TpwWebhookEventType;
  timestamp: string;
  breederId: string;
  data: TpwPuppyListing | TpwBreederProfile | { id: string; breederId: string };
}

/** Webhook delivery log record stored in tpwWebhookDeliveries/{deliveryId} */
export interface TpwWebhookDelivery {
  id?: string;
  breederId: string;
  event: TpwWebhookEventType;
  webhookUrl: string;
  payload: TpwWebhookPayload;
  status: 'pending' | 'delivered' | 'failed';
  httpStatus?: number;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  error?: string;
  createdAt: string;
  deliveredAt?: string;
}
