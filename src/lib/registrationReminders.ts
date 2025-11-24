import { Puppy, Litter, Reminder } from '@/types/dog';
import { addDays, format, parseISO, differenceInDays } from 'date-fns';

/**
 * Generate registration deadline reminders for puppies
 */
export function generateRegistrationReminders(
  litter: Litter,
  puppies: Puppy[]
): Reminder[] {
  const reminders: Reminder[] = [];

  puppies.forEach((puppy) => {
    const reg = puppy.registration;

    // Skip if no registration or no deadline set
    if (!reg || !reg.registrationDeadline || reg.registrationType === 'none') {
      return;
    }

    // Skip if registration is already issued
    if (reg.status === 'issued') {
      return;
    }

    const deadline = parseISO(reg.registrationDeadline);
    const puppyName = puppy.name || puppy.tempName || 'Unknown Puppy';

    // Create reminder 30 days before deadline
    const reminder30Days: Reminder = {
      id: `reg-30d-${puppy.id}`,
      title: `Registration Due Soon - ${puppyName}`,
      type: 'registration',
      date: format(addDays(deadline, -30), 'yyyy-MM-dd'),
      litterId: litter.id,
      puppyId: puppy.id,
      completed: false,
      notes: `${reg.registry} ${reg.registrationType} registration for ${puppyName} is due in 30 days. Current status: ${reg.status}`,
    };

    // Create reminder 7 days before deadline
    const reminder7Days: Reminder = {
      id: `reg-7d-${puppy.id}`,
      title: `URGENT: Registration Due in 7 Days - ${puppyName}`,
      type: 'registration',
      date: format(addDays(deadline, -7), 'yyyy-MM-dd'),
      litterId: litter.id,
      puppyId: puppy.id,
      completed: false,
      notes: `${reg.registry} ${reg.registrationType} registration for ${puppyName} is due in 7 days! Current status: ${reg.status}`,
    };

    // Create reminder on deadline day
    const reminderDeadline: Reminder = {
      id: `reg-deadline-${puppy.id}`,
      title: `DEADLINE TODAY: Registration Due - ${puppyName}`,
      type: 'registration',
      date: format(deadline, 'yyyy-MM-dd'),
      litterId: litter.id,
      puppyId: puppy.id,
      completed: false,
      notes: `TODAY is the deadline for ${reg.registry} ${reg.registrationType} registration for ${puppyName}! Current status: ${reg.status}`,
    };

    // Only add reminders that haven't passed yet
    const today = new Date();

    if (addDays(deadline, -30) >= today) {
      reminders.push(reminder30Days);
    }

    if (addDays(deadline, -7) >= today) {
      reminders.push(reminder7Days);
    }

    if (deadline >= today) {
      reminders.push(reminderDeadline);
    }
  });

  return reminders;
}

/**
 * Check for overdue registrations
 */
export function getOverdueRegistrations(puppies: Puppy[]): Puppy[] {
  const today = new Date();

  return puppies.filter((puppy) => {
    const reg = puppy.registration;

    if (!reg || !reg.registrationDeadline || reg.registrationType === 'none') {
      return false;
    }

    // Skip if already issued
    if (reg.status === 'issued') {
      return false;
    }

    const deadline = parseISO(reg.registrationDeadline);
    return deadline < today;
  });
}

/**
 * Get registrations due within specified days
 */
export function getUpcomingRegistrations(
  puppies: Puppy[],
  daysAhead: number = 30
): Array<{ puppy: Puppy; daysUntilDeadline: number }> {
  const today = new Date();

  return puppies
    .filter((puppy) => {
      const reg = puppy.registration;

      if (!reg || !reg.registrationDeadline || reg.registrationType === 'none') {
        return false;
      }

      // Skip if already issued
      if (reg.status === 'issued') {
        return false;
      }

      const deadline = parseISO(reg.registrationDeadline);
      const daysUntil = differenceInDays(deadline, today);

      return daysUntil >= 0 && daysUntil <= daysAhead;
    })
    .map((puppy) => ({
      puppy,
      daysUntilDeadline: differenceInDays(
        parseISO(puppy.registration!.registrationDeadline!),
        today
      ),
    }))
    .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
}

/**
 * Generate automatic registration reminder when deadline is set
 */
export function createRegistrationDeadlineReminder(
  puppy: Puppy,
  litterId: string
): Reminder | null {
  const reg = puppy.registration;

  if (!reg || !reg.registrationDeadline || reg.registrationType === 'none') {
    return null;
  }

  const deadline = parseISO(reg.registrationDeadline);
  const puppyName = puppy.name || puppy.tempName || 'Unknown Puppy';

  // Create a single reminder 7 days before deadline
  return {
    id: crypto.randomUUID(),
    title: `Registration Deadline - ${puppyName}`,
    type: 'registration',
    date: format(addDays(deadline, -7), 'yyyy-MM-dd'),
    litterId,
    puppyId: puppy.id,
    completed: false,
    notes: `${reg.registry} ${reg.registrationType} registration for ${puppyName} is due on ${format(deadline, 'MMM d, yyyy')}. Status: ${reg.status}`,
  };
}

/**
 * Get registration status summary for a litter
 */
export function getRegistrationSummary(puppies: Puppy[]) {
  const total = puppies.length;
  const withRegistration = puppies.filter(
    (p) => p.registration && p.registration.registrationType !== 'none'
  ).length;

  const statusCounts = {
    not_started: 0,
    pending: 0,
    submitted: 0,
    approved: 0,
    issued: 0,
  };

  puppies.forEach((puppy) => {
    const status = puppy.registration?.status || 'not_started';
    if (status in statusCounts) {
      statusCounts[status as keyof typeof statusCounts]++;
    }
  });

  const overdue = getOverdueRegistrations(puppies);
  const upcoming = getUpcomingRegistrations(puppies, 30);

  return {
    total,
    withRegistration,
    statusCounts,
    overdueCount: overdue.length,
    upcomingCount: upcoming.length,
    completionRate: withRegistration > 0 ? (statusCounts.issued / withRegistration) * 100 : 0,
  };
}
