// Email service using EmailJS (free tier: 200 emails/month)
// To set up: Create account at emailjs.com, get service ID, template ID, and public key

import { Puppy, Buyer, Litter, Dog, PuppyUpdate } from '@breeder/types';

interface EmailConfig {
  serviceId: string;
  publicKey: string;
}

// Templates for different email types
const TEMPLATE_IDS = {
  PUPPY_UPDATE: 'puppy_update',
  RESERVATION_CONFIRMATION: 'reservation_confirm',
  PICKUP_REMINDER: 'pickup_reminder',
  DEPOSIT_REMINDER: 'deposit_reminder',
};

// Store config in localStorage (user can set this in settings)
export function getEmailConfig(): EmailConfig | null {
  const config = localStorage.getItem('emailConfig');
  return config ? JSON.parse(config) : null;
}

export function setEmailConfig(config: EmailConfig): void {
  localStorage.setItem('emailConfig', JSON.stringify(config));
}

export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  return !!(config?.serviceId && config?.publicKey);
}

// Generic email sender using EmailJS
async function sendEmail(templateId: string, templateParams: Record<string, string>): Promise<boolean> {
  const config = getEmailConfig();
  if (!config) {
    console.warn('Email not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: templateId,
        user_id: config.publicKey,
        template_params: templateParams,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

// Email templates
export async function sendPuppyUpdateEmail(
  buyer: Buyer,
  puppy: Puppy,
  update: PuppyUpdate,
  kennelName: string
): Promise<boolean> {
  return sendEmail(TEMPLATE_IDS.PUPPY_UPDATE, {
    to_email: buyer.email,
    to_name: buyer.name,
    puppy_name: puppy.name || puppy.tempName || 'Your Puppy',
    update_title: update.title,
    update_content: update.content,
    update_date: new Date(update.date).toLocaleDateString(),
    kennel_name: kennelName,
  });
}

export async function sendReservationConfirmation(
  buyer: Buyer,
  puppy: Puppy,
  litter: Litter,
  dam: Dog,
  sire: Dog,
  kennelName: string
): Promise<boolean> {
  return sendEmail(TEMPLATE_IDS.RESERVATION_CONFIRMATION, {
    to_email: buyer.email,
    to_name: buyer.name,
    puppy_name: puppy.name || puppy.tempName || 'Your Puppy',
    puppy_color: puppy.color,
    puppy_sex: puppy.sex === 'male' ? 'Male' : 'Female',
    dam_name: dam.name,
    sire_name: sire.name,
    litter_dob: new Date(litter.dateOfBirth).toLocaleDateString(),
    pickup_date: litter.pickupReadyDate
      ? new Date(litter.pickupReadyDate).toLocaleDateString()
      : 'To be determined',
    sale_price: puppy.salePrice?.toLocaleString() || 'Contact breeder',
    deposit_amount: puppy.depositAmount?.toLocaleString() || '0',
    kennel_name: kennelName,
  });
}

export async function sendPickupReminder(
  buyer: Buyer,
  puppy: Puppy,
  pickupDate: string,
  kennelName: string
): Promise<boolean> {
  return sendEmail(TEMPLATE_IDS.PICKUP_REMINDER, {
    to_email: buyer.email,
    to_name: buyer.name,
    puppy_name: puppy.name || puppy.tempName || 'Your Puppy',
    pickup_date: new Date(pickupDate).toLocaleDateString(),
    balance_due: puppy.salePrice && puppy.depositAmount
      ? (puppy.salePrice - (puppy.depositPaid ? puppy.depositAmount : 0)).toLocaleString()
      : '0',
    kennel_name: kennelName,
  });
}

export async function sendDepositReminder(
  buyer: Buyer,
  puppy: Puppy,
  kennelName: string
): Promise<boolean> {
  return sendEmail(TEMPLATE_IDS.DEPOSIT_REMINDER, {
    to_email: buyer.email,
    to_name: buyer.name,
    puppy_name: puppy.name || puppy.tempName || 'Your Puppy',
    deposit_amount: puppy.depositAmount?.toLocaleString() || '0',
    kennel_name: kennelName,
  });
}

// Batch email to all buyers with portal access
export async function sendBulkPuppyUpdate(
  buyers: Buyer[],
  puppies: Puppy[],
  update: PuppyUpdate,
  kennelName: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const buyer of buyers) {
    if (!buyer.portalEnabled) continue;

    const puppy = puppies.find(p => p.buyerId === buyer.id);
    if (!puppy) continue;

    const success = await sendPuppyUpdateEmail(buyer, puppy, update, kennelName);
    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
}
