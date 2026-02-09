// Firestore-powered scheduling & booking store
import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc,
  setDoc,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  SchedulingSettings,
  Booking,
  BookingStatus,
  AppointmentType,
  WeeklyAvailability,
  DayOfWeek,
  DEFAULT_WEEKLY_AVAILABILITY,
  DEFAULT_APPOINTMENT_TYPES,
  DAYS_OF_WEEK,
} from '@breeder/types';

type Store = {
  settings: SchedulingSettings | null;
  bookings: Booking[];
  loading: boolean;
  bookingsLoading: boolean;

  // Settings methods
  loadSettings: (breederId: string) => Promise<SchedulingSettings | null>;
  saveSettings: (updates: Partial<SchedulingSettings>) => Promise<void>;

  // Booking methods
  createBooking: (data: Omit<Booking, 'id' | 'bookedAt'>) => Promise<string>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  cancelBooking: (id: string, reason?: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;

  // Slot computation
  getAvailableSlots: (
    breederId: string,
    appointmentTypeId: string,
    startDate: Date,
    endDate: Date
  ) => Promise<{ date: string; slots: string[] }[]>;

  // Subscriptions
  subscribeToSettings: (targetUid?: string) => () => void;
  subscribeToBookings: (targetUid?: string) => () => void;
};

export const useSchedulingStore = create<Store>()((set, get) => ({
  settings: null,
  bookings: [],
  loading: false,
  bookingsLoading: false,

  loadSettings: async (breederId: string) => {
    const settingsRef = doc(db, 'schedulingSettings', breederId);
    const snapshot = await getDoc(settingsRef);
    if (snapshot.exists()) {
      return { ...snapshot.data() } as SchedulingSettings;
    }
    return null;
  },

  saveSettings: async (updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to save settings');

    const settingsRef = doc(db, 'schedulingSettings', user.uid);
    const snapshot = await getDoc(settingsRef);

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (snapshot.exists()) {
      await updateDoc(settingsRef, {
        ...filteredUpdates,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(settingsRef, {
        userId: user.uid,
        weeklyAvailability: DEFAULT_WEEKLY_AVAILABILITY,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        appointmentTypes: DEFAULT_APPOINTMENT_TYPES,
        minAdvanceBooking: 24,
        maxAdvanceBooking: 30,
        slotInterval: 30,
        bookingPageEnabled: false,
        bookingPageTitle: '',
        bookingPageDescription: '',
        confirmationMessage: 'Your appointment has been booked! We will send you a confirmation email shortly.',
        googleCalendarEnabled: false,
        googleCalendarId: '',
        ...filteredUpdates,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },

  createBooking: async (data) => {
    const newBooking = {
      ...data,
      bookedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'bookings'), newBooking);
    return docRef.id;
  },

  updateBooking: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update bookings');

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    const bookingRef = doc(db, 'bookings', id);
    await updateDoc(bookingRef, {
      ...filteredUpdates,
      updatedAt: new Date().toISOString(),
    });
  },

  cancelBooking: async (id, reason) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to cancel bookings');

    const bookingRef = doc(db, 'bookings', id);
    await updateDoc(bookingRef, {
      status: 'cancelled' as BookingStatus,
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || '',
      updatedAt: new Date().toISOString(),
    });
  },

  deleteBooking: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete bookings');

    const bookingRef = doc(db, 'bookings', id);
    await deleteDoc(bookingRef);
  },

  getAvailableSlots: async (breederId, appointmentTypeId, startDate, endDate) => {
    // Load settings
    const settingsRef = doc(db, 'schedulingSettings', breederId);
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) return [];

    const settings = settingsSnap.data() as SchedulingSettings;
    const appointmentType = settings.appointmentTypes.find(
      (t) => t.id === appointmentTypeId
    );
    if (!appointmentType || !appointmentType.enabled) return [];

    // Get existing bookings in range
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('breederId', '==', breederId),
      where('status', 'in', ['pending', 'confirmed'])
    );
    const bookingsSnap = await getDocs(bookingsQuery);
    const existingBookings = bookingsSnap.docs.map((d) => d.data() as Booking);

    const result: { date: string; slots: string[] }[] = [];
    const now = new Date();
    const minTime = new Date(now.getTime() + settings.minAdvanceBooking * 60 * 60 * 1000);

    // Iterate each day in range
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const dayIndex = (current.getDay() + 6) % 7; // Convert to Monday=0
      const dayName = DAYS_OF_WEEK[dayIndex];
      const dayAvailability = settings.weeklyAvailability[dayName];

      if (dayAvailability && dayAvailability.length > 0) {
        const dateStr = current.toISOString().split('T')[0];
        const daySlots: string[] = [];

        for (const timeRange of dayAvailability) {
          const [startH, startM] = timeRange.start.split(':').map(Number);
          const [endH, endM] = timeRange.end.split(':').map(Number);

          let slotTime = new Date(current);
          slotTime.setHours(startH, startM, 0, 0);

          const rangeEnd = new Date(current);
          rangeEnd.setHours(endH, endM, 0, 0);

          while (slotTime < rangeEnd) {
            const slotEnd = new Date(
              slotTime.getTime() + appointmentType.duration * 60 * 1000
            );

            // Check if slot end exceeds range
            if (slotEnd > rangeEnd) break;

            // Check if slot is in the future (respecting minAdvanceBooking)
            if (slotTime > minTime) {
              // Check for conflicts with existing bookings
              const slotStartISO = slotTime.toISOString();
              const slotEndISO = slotEnd.toISOString();

              const hasConflict = existingBookings.some((booking) => {
                const bStart = new Date(booking.startTime);
                const bEnd = new Date(booking.endTime);
                // Add buffer
                const bufferedStart = new Date(
                  bStart.getTime() - (appointmentType.bufferBefore || 0) * 60 * 1000
                );
                const bufferedEnd = new Date(
                  bEnd.getTime() + (appointmentType.bufferAfter || 0) * 60 * 1000
                );
                return slotTime < bufferedEnd && slotEnd > bufferedStart;
              });

              if (!hasConflict) {
                daySlots.push(
                  slotTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                );
              }
            }

            // Advance by slot interval
            slotTime = new Date(
              slotTime.getTime() + settings.slotInterval * 60 * 1000
            );
          }
        }

        if (daySlots.length > 0) {
          result.push({ date: dateStr, slots: daySlots });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return result;
  },

  subscribeToSettings: (targetUid) => {
    const uid = targetUid || auth.currentUser?.uid;
    if (!uid) return () => {};

    set({ loading: true });

    const settingsRef = doc(db, 'schedulingSettings', uid);
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          set({ settings: snapshot.data() as SchedulingSettings, loading: false });
        } else {
          set({ settings: null, loading: false });
        }
      },
      (error) => {
        console.error('Error subscribing to scheduling settings:', error);
        set({ loading: false });
      }
    );

    return unsubscribe;
  },

  subscribeToBookings: (targetUid) => {
    const uid = targetUid || auth.currentUser?.uid;
    if (!uid) return () => {};

    set({ bookingsLoading: true });

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('breederId', '==', uid)
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const bookings: Booking[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as Booking));

        // Sort by startTime descending (newest first)
        bookings.sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );

        set({ bookings, bookingsLoading: false });
      },
      (error) => {
        console.error('Error subscribing to bookings:', error);
        set({ bookingsLoading: false });
      }
    );

    return unsubscribe;
  },
}));
