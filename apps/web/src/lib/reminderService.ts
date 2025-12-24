// Automated reminder service - checks for upcoming events and sends emails
import { Dog, Litter } from '@breeder/types';
import { sendPickupReminder, sendDepositReminder, isEmailConfigured } from './emailService';
import { addDays, isWithinInterval, startOfDay } from 'date-fns';

interface ReminderSettings {
  enabled: boolean;
  pickupReminderDays: number; // Days before pickup to send reminder
  depositReminderEnabled: boolean;
  heatCycleReminderDays: number; // Days before expected heat
  vaccinationReminderDays: number; // Days before vaccination due
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  pickupReminderDays: 7,
  depositReminderEnabled: true,
  heatCycleReminderDays: 14,
  vaccinationReminderDays: 7,
};

export function getReminderSettings(): ReminderSettings {
  const stored = localStorage.getItem('reminderSettings');
  return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
}

export function setReminderSettings(settings: Partial<ReminderSettings>): void {
  const current = getReminderSettings();
  localStorage.setItem('reminderSettings', JSON.stringify({ ...current, ...settings }));
}

// Track which reminders have been sent to avoid duplicates
function getSentReminders(): Set<string> {
  const stored = localStorage.getItem('sentReminders');
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

function markReminderSent(key: string): void {
  const sent = getSentReminders();
  sent.add(key);
  // Clean up old entries (keep last 500)
  const arr = Array.from(sent);
  if (arr.length > 500) {
    localStorage.setItem('sentReminders', JSON.stringify(arr.slice(-500)));
  } else {
    localStorage.setItem('sentReminders', JSON.stringify(arr));
  }
}

function wasReminderSent(key: string): boolean {
  return getSentReminders().has(key);
}

interface ReminderCheckResult {
  pickupReminders: number;
  depositReminders: number;
  errors: string[];
}

// Main function to check and send reminders
export async function checkAndSendReminders(
  litters: Litter[],
  dogs: Dog[],
  kennelName: string
): Promise<ReminderCheckResult> {
  const result: ReminderCheckResult = {
    pickupReminders: 0,
    depositReminders: 0,
    errors: [],
  };

  const settings = getReminderSettings();

  if (!settings.enabled || !isEmailConfigured()) {
    return result;
  }

  const today = startOfDay(new Date());

  for (const litter of litters) {
    const dam = dogs.find(d => d.id === litter.damId);
    if (!dam) continue;

    // Check pickup reminders
    if (litter.pickupReadyDate && settings.pickupReminderDays > 0) {
      const pickupDate = new Date(litter.pickupReadyDate);
      const reminderWindow = {
        start: addDays(today, settings.pickupReminderDays - 1),
        end: addDays(today, settings.pickupReminderDays + 1),
      };

      if (isWithinInterval(pickupDate, reminderWindow)) {
        // Send pickup reminders to buyers
        for (const buyer of litter.buyers || []) {
          if (!buyer.portalEnabled || buyer.status !== 'reserved') continue;

          const puppy = (litter.puppies || []).find(p => p.buyerId === buyer.id);
          if (!puppy) continue;

          const reminderKey = `pickup-${litter.id}-${buyer.id}-${litter.pickupReadyDate}`;
          if (wasReminderSent(reminderKey)) continue;

          try {
            const success = await sendPickupReminder(
              buyer,
              puppy,
              litter.pickupReadyDate,
              kennelName
            );
            if (success) {
              markReminderSent(reminderKey);
              result.pickupReminders++;
            }
          } catch (err) {
            result.errors.push(`Failed pickup reminder to ${buyer.email}`);
          }
        }
      }
    }

    // Check deposit reminders for reserved puppies without deposit
    if (settings.depositReminderEnabled) {
      for (const buyer of litter.buyers || []) {
        if (!buyer.portalEnabled || buyer.status !== 'reserved') continue;

        const puppy = (litter.puppies || []).find(p => p.buyerId === buyer.id);
        if (!puppy || puppy.depositPaid) continue;

        // Send deposit reminder once per week
        const weekKey = `deposit-${litter.id}-${buyer.id}-${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`;
        if (wasReminderSent(weekKey)) continue;

        try {
          const success = await sendDepositReminder(buyer, puppy, kennelName);
          if (success) {
            markReminderSent(weekKey);
            result.depositReminders++;
          }
        } catch (err) {
          result.errors.push(`Failed deposit reminder to ${buyer.email}`);
        }
      }
    }
  }

  return result;
}

// Get list of upcoming reminders (for display, not sending)
export interface UpcomingReminder {
  type: 'pickup' | 'deposit' | 'vaccination' | 'heat' | 'deworming';
  date: Date;
  title: string;
  description: string;
  dogName?: string;
  buyerName?: string;
  litterId?: string;
}

export function getUpcomingReminders(
  litters: Litter[],
  dogs: Dog[],
  daysAhead: number = 30
): UpcomingReminder[] {
  const reminders: UpcomingReminder[] = [];
  const today = startOfDay(new Date());
  const futureDate = addDays(today, daysAhead);

  // Pickup reminders
  for (const litter of litters) {
    if (!litter.pickupReadyDate) continue;
    const pickupDate = new Date(litter.pickupReadyDate);
    if (pickupDate >= today && pickupDate <= futureDate) {
      const dam = dogs.find(d => d.id === litter.damId);
      reminders.push({
        type: 'pickup',
        date: pickupDate,
        title: 'Puppies Ready for Pickup',
        description: litter.litterName || `${dam?.name}'s litter`,
        dogName: dam?.name,
        litterId: litter.id,
      });
    }
  }

  // Heat cycle reminders
  for (const dog of dogs) {
    if (dog.sex !== 'female') continue;
    const cycles = dog.heatCycles || [];
    if (cycles.length === 0) continue;

    const lastCycle = cycles.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0];
    const expectedHeat = addDays(new Date(lastCycle.startDate), 180);

    if (expectedHeat >= today && expectedHeat <= futureDate) {
      reminders.push({
        type: 'heat',
        date: expectedHeat,
        title: 'Expected Heat Cycle',
        description: `${dog.name} may come into heat`,
        dogName: dog.name,
      });
    }
  }

  // Vaccination due reminders
  for (const dog of dogs) {
    for (const shot of dog.shotRecords || []) {
      if (!shot.dueDate) continue;
      const dueDate = new Date(shot.dueDate);
      if (dueDate >= today && dueDate <= futureDate) {
        reminders.push({
          type: 'vaccination',
          date: dueDate,
          title: `${shot.vaccine} Due`,
          description: `Vaccination due for ${dog.name}`,
          dogName: dog.name,
        });
      }
    }
  }

  // Deworming reminders
  for (const dog of dogs) {
    for (const dw of dog.dewormings || []) {
      if (!dw.nextDueDate) continue;
      const dueDate = new Date(dw.nextDueDate);
      if (dueDate >= today && dueDate <= futureDate) {
        reminders.push({
          type: 'deworming',
          date: dueDate,
          title: 'Deworming Due',
          description: `${dw.product} due for ${dog.name}`,
          dogName: dog.name,
        });
      }
    }
  }

  // Sort by date
  return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
}
