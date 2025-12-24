import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInMonths, differenceInYears } from 'date-fns'

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
