import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateAge(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth);
  const now = new Date();

  const years = differenceInYears(now, dob);
  const months = differenceInMonths(now, dob) % 12;

  if (years === 0) {
    return months === 1 ? '1 month' : `${months} months`;
  } else if (months === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  } else {
    const yearText = years === 1 ? '1 year' : `${years} years`;
    const monthText = months === 1 ? '1 month' : `${months} months`;
    return `${yearText}, ${monthText}`;
  }
}

export function calculateAgeWeeksAndDays(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const totalDays = differenceInDays(now, dob);

  if (totalDays < 0) return '';

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  const weekText = weeks === 1 ? '1 week' : `${weeks} weeks`;
  const dayText = days === 1 ? '1 day' : `${days} days`;

  return `${weekText}, ${dayText} old`;
}
