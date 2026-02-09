// Appointment scheduling types

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  start: string; // "09:00" format
  end: string;   // "17:00" format
}

export type WeeklyAvailability = Record<DayOfWeek, TimeSlot[]>;

export interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  bufferBefore: number; // minutes
  bufferAfter: number; // minutes
  color: string;
  enabled: boolean;
  order: number;
}

export interface SchedulingSettings {
  userId: string;
  weeklyAvailability: WeeklyAvailability;
  timezone: string;
  appointmentTypes: AppointmentType[];
  minAdvanceBooking: number; // hours
  maxAdvanceBooking: number; // days
  slotInterval: 15 | 30 | 60; // minutes
  bookingPageEnabled: boolean;
  bookingPageTitle: string;
  bookingPageDescription: string;
  confirmationMessage: string;
  googleCalendarEnabled: boolean;
  googleCalendarId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
  id: string;
  breederId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  contactId?: string;
  appointmentTypeId: string;
  appointmentTypeName: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  duration: number;  // minutes
  status: BookingStatus;
  notes?: string;
  internalNotes?: string;
  googleEventId?: string;
  bookedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export const DEFAULT_WEEKLY_AVAILABILITY: WeeklyAvailability = {
  monday: [{ start: '09:00', end: '17:00' }],
  tuesday: [{ start: '09:00', end: '17:00' }],
  wednesday: [{ start: '09:00', end: '17:00' }],
  thursday: [{ start: '09:00', end: '17:00' }],
  friday: [{ start: '09:00', end: '17:00' }],
  saturday: [],
  sunday: [],
};

export const DEFAULT_APPOINTMENT_TYPES: AppointmentType[] = [
  {
    id: 'puppy-visit',
    name: 'Puppy Visit',
    description: 'Visit to meet and interact with available puppies',
    duration: 60,
    bufferBefore: 0,
    bufferAfter: 15,
    color: '#3b82f6',
    enabled: true,
    order: 0,
  },
  {
    id: 'pickup',
    name: 'Pickup Appointment',
    description: 'Scheduled pickup for your new puppy',
    duration: 30,
    bufferBefore: 0,
    bufferAfter: 15,
    color: '#10b981',
    enabled: true,
    order: 1,
  },
  {
    id: 'consultation',
    name: 'General Consultation',
    description: 'General consultation about breeding or our kennel',
    duration: 30,
    bufferBefore: 0,
    bufferAfter: 0,
    color: '#8b5cf6',
    enabled: true,
    order: 2,
  },
];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];
