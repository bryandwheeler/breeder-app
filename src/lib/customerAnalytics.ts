/**
 * Customer Analytics & Journey Tracking
 *
 * This module provides utilities for tracking customer journeys and calculating
 * customer lifetime value (CLV) metrics.
 */

import { Customer, CustomerStage } from '@/types/dog';
import { Litter, Puppy } from '@/types/dog';

export interface JourneyStage {
  stage: CustomerStage;
  label: string;
  date?: string;
  status: 'completed' | 'current' | 'pending';
  icon: string;
  color: string;
}

export interface CustomerJourney {
  customerId: string;
  customerName: string;
  stages: JourneyStage[];
  currentStage: CustomerStage;
  durationDays: number;
  completionPercentage: number;
  timeline: JourneyEvent[];
}

export interface JourneyEvent {
  date: string;
  type: 'inquiry' | 'application' | 'deposit' | 'contract' | 'pickup' | 'followup' | 'referral';
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface CustomerLifetimeValue {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  purchaseCount: number;
  averageOrderValue: number;
  referralCount: number;
  referralRevenue: number;
  totalValue: number; // Revenue + referral value
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  lifetimeInDays: number;
  customerType: 'new' | 'repeat' | 'vip' | 'advocate';
  predictions: {
    likelyToRepurchase: boolean;
    predictedLTV: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface CustomerSegment {
  name: string;
  count: number;
  totalRevenue: number;
  averageValue: number;
  color: string;
}

/**
 * Get the journey stages for a customer
 */
export function getCustomerJourney(customer: Customer): CustomerJourney {
  const stages: JourneyStage[] = [
    {
      stage: 'inquiry',
      label: 'Initial Inquiry',
      date: customer.inquiryDate,
      status: customer.inquiryDate ? 'completed' : 'current',
      icon: 'MessageSquare',
      color: 'blue',
    },
    {
      stage: 'application',
      label: 'Application Submitted',
      date: customer.applicationDate,
      status: customer.applicationDate ? 'completed' : customer.stage === 'application' ? 'current' : 'pending',
      icon: 'FileText',
      color: 'purple',
    },
    {
      stage: 'approved',
      label: 'Approved',
      date: customer.approvalDate,
      status: customer.approvalDate ? 'completed' : customer.stage === 'approved' ? 'current' : 'pending',
      icon: 'CheckCircle',
      color: 'green',
    },
    {
      stage: 'deposit',
      label: 'Deposit Received',
      date: customer.depositDate,
      status: customer.depositDate ? 'completed' : customer.stage === 'deposit' ? 'current' : 'pending',
      icon: 'DollarSign',
      color: 'emerald',
    },
    {
      stage: 'contract',
      label: 'Contract Signed',
      date: customer.contractDate,
      status: customer.contractDate ? 'completed' : customer.stage === 'contract' ? 'current' : 'pending',
      icon: 'FileSignature',
      color: 'indigo',
    },
    {
      stage: 'pickup',
      label: 'Puppy Pickup',
      date: customer.pickupDate,
      status: customer.pickupDate ? 'completed' : customer.stage === 'pickup' ? 'current' : 'pending',
      icon: 'Heart',
      color: 'pink',
    },
  ];

  // Build timeline of events
  const timeline: JourneyEvent[] = [];

  if (customer.inquiryDate) {
    timeline.push({
      date: customer.inquiryDate,
      type: 'inquiry',
      title: 'Initial Inquiry',
      description: `Customer expressed interest${customer.preferredBreed ? ` in ${customer.preferredBreed}` : ''}`,
    });
  }

  if (customer.applicationDate) {
    timeline.push({
      date: customer.applicationDate,
      type: 'application',
      title: 'Application Submitted',
      description: 'Customer completed and submitted application',
    });
  }

  if (customer.depositDate && customer.depositAmount) {
    timeline.push({
      date: customer.depositDate,
      type: 'deposit',
      title: 'Deposit Received',
      description: `Received $${customer.depositAmount} deposit`,
      metadata: { amount: customer.depositAmount },
    });
  }

  if (customer.contractDate) {
    timeline.push({
      date: customer.contractDate,
      type: 'contract',
      title: 'Contract Signed',
      description: 'Purchase contract signed',
    });
  }

  if (customer.pickupDate) {
    timeline.push({
      date: customer.pickupDate,
      type: 'pickup',
      title: 'Puppy Pickup',
      description: customer.assignedPuppyId ? 'Customer picked up their puppy' : 'Pickup completed',
    });
  }

  // Sort timeline by date
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate duration
  const firstDate = timeline[0]?.date ? new Date(timeline[0].date) : new Date();
  const lastDate = timeline[timeline.length - 1]?.date
    ? new Date(timeline[timeline.length - 1].date)
    : new Date();
  const durationDays = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate completion percentage
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const completionPercentage = (completedStages / stages.length) * 100;

  return {
    customerId: customer.id,
    customerName: customer.name,
    stages,
    currentStage: customer.stage,
    durationDays,
    completionPercentage,
    timeline,
  };
}

/**
 * Calculate Customer Lifetime Value
 */
export function calculateCustomerLTV(
  customer: Customer,
  allCustomers: Customer[],
  allPurchases: Array<{ customerId: string; amount: number; date: string }>
): CustomerLifetimeValue {
  // Get all purchases for this customer
  const customerPurchases = allPurchases.filter(p => p.customerId === customer.id);

  // Calculate direct revenue
  const totalRevenue = customerPurchases.reduce((sum, p) => sum + p.amount, 0);
  const purchaseCount = customerPurchases.length;
  const averageOrderValue = purchaseCount > 0 ? totalRevenue / purchaseCount : 0;

  // Find referrals (customers who were referred by this customer)
  const referrals = allCustomers.filter(c => c.referredBy === customer.id || c.referralSource === customer.name);
  const referralCount = referrals.length;

  // Calculate referral revenue
  const referralRevenue = referrals.reduce((sum, referral) => {
    const referralPurchases = allPurchases.filter(p => p.customerId === referral.id);
    return sum + referralPurchases.reduce((pSum, p) => pSum + p.amount, 0);
  }, 0);

  // Total value includes direct revenue and referral revenue
  const totalValue = totalRevenue + referralRevenue;

  // Get purchase dates
  const purchaseDates = customerPurchases.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime());
  const firstPurchaseDate = purchaseDates[0]?.toISOString() || customer.inquiryDate || new Date().toISOString();
  const lastPurchaseDate = purchaseDates[purchaseDates.length - 1]?.toISOString() || firstPurchaseDate;

  // Calculate lifetime in days
  const lifetimeInDays = Math.floor(
    (new Date(lastPurchaseDate).getTime() - new Date(firstPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine customer type
  let customerType: 'new' | 'repeat' | 'vip' | 'advocate' = 'new';
  if (referralCount >= 3) {
    customerType = 'advocate';
  } else if (totalValue > 10000 || purchaseCount >= 3) {
    customerType = 'vip';
  } else if (purchaseCount > 1) {
    customerType = 'repeat';
  }

  // Predictions
  const likelyToRepurchase = purchaseCount > 1 || referralCount > 0;
  const predictedLTV = totalValue + (likelyToRepurchase ? averageOrderValue * 0.5 : 0);

  // Risk level (of losing the customer)
  const daysSinceLastPurchase = Math.floor(
    (new Date().getTime() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (daysSinceLastPurchase > 730) { // 2 years
    riskLevel = 'high';
  } else if (daysSinceLastPurchase > 365) { // 1 year
    riskLevel = 'medium';
  }

  return {
    customerId: customer.id,
    customerName: customer.name,
    totalRevenue,
    purchaseCount,
    averageOrderValue,
    referralCount,
    referralRevenue,
    totalValue,
    firstPurchaseDate,
    lastPurchaseDate,
    lifetimeInDays,
    customerType,
    predictions: {
      likelyToRepurchase,
      predictedLTV,
      riskLevel,
    },
  };
}

/**
 * Segment customers by value
 */
export function segmentCustomers(customers: CustomerLifetimeValue[]): CustomerSegment[] {
  const segments: CustomerSegment[] = [
    {
      name: 'VIP Customers',
      count: 0,
      totalRevenue: 0,
      averageValue: 0,
      color: 'purple',
    },
    {
      name: 'Repeat Buyers',
      count: 0,
      totalRevenue: 0,
      averageValue: 0,
      color: 'blue',
    },
    {
      name: 'Advocates (Referrers)',
      count: 0,
      totalRevenue: 0,
      averageValue: 0,
      color: 'green',
    },
    {
      name: 'New Customers',
      count: 0,
      totalRevenue: 0,
      averageValue: 0,
      color: 'gray',
    },
  ];

  customers.forEach(customer => {
    const segment = segments.find(s => {
      if (customer.customerType === 'vip' && s.name === 'VIP Customers') return true;
      if (customer.customerType === 'repeat' && s.name === 'Repeat Buyers') return true;
      if (customer.customerType === 'advocate' && s.name === 'Advocates (Referrers)') return true;
      if (customer.customerType === 'new' && s.name === 'New Customers') return true;
      return false;
    });

    if (segment) {
      segment.count++;
      segment.totalRevenue += customer.totalValue;
    }
  });

  // Calculate averages
  segments.forEach(segment => {
    segment.averageValue = segment.count > 0 ? segment.totalRevenue / segment.count : 0;
  });

  return segments;
}

/**
 * Calculate conversion rates for each stage
 */
export interface ConversionMetrics {
  stage: string;
  total: number;
  converted: number;
  conversionRate: number;
  averageDaysToConvert: number;
}

export function calculateConversionMetrics(customers: Customer[]): ConversionMetrics[] {
  const stages = [
    { key: 'inquiry', next: 'application', label: 'Inquiry → Application' },
    { key: 'application', next: 'approved', label: 'Application → Approved' },
    { key: 'approved', next: 'deposit', label: 'Approved → Deposit' },
    { key: 'deposit', next: 'contract', label: 'Deposit → Contract' },
    { key: 'contract', next: 'pickup', label: 'Contract → Pickup' },
  ];

  return stages.map(({ key, next, label }) => {
    const atStage = customers.filter(c => {
      // Has reached this stage
      if (key === 'inquiry') return !!c.inquiryDate;
      if (key === 'application') return !!c.applicationDate;
      if (key === 'approved') return !!c.approvalDate;
      if (key === 'deposit') return !!c.depositDate;
      if (key === 'contract') return !!c.contractDate;
      return false;
    });

    const converted = customers.filter(c => {
      // Has reached the next stage
      if (next === 'application') return !!c.applicationDate;
      if (next === 'approved') return !!c.approvalDate;
      if (next === 'deposit') return !!c.depositDate;
      if (next === 'contract') return !!c.contractDate;
      if (next === 'pickup') return !!c.pickupDate;
      return false;
    });

    const conversionRate = atStage.length > 0 ? (converted.length / atStage.length) * 100 : 0;

    // Calculate average days to convert
    const daysToConvert = converted
      .map(c => {
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (key === 'inquiry') startDate = c.inquiryDate;
        if (key === 'application') startDate = c.applicationDate;
        if (key === 'approved') startDate = c.approvalDate;
        if (key === 'deposit') startDate = c.depositDate;
        if (key === 'contract') startDate = c.contractDate;

        if (next === 'application') endDate = c.applicationDate;
        if (next === 'approved') endDate = c.approvalDate;
        if (next === 'deposit') endDate = c.depositDate;
        if (next === 'contract') endDate = c.contractDate;
        if (next === 'pickup') endDate = c.pickupDate;

        if (startDate && endDate) {
          return Math.floor(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
          );
        }
        return 0;
      })
      .filter(days => days > 0);

    const averageDaysToConvert = daysToConvert.length > 0
      ? daysToConvert.reduce((sum, days) => sum + days, 0) / daysToConvert.length
      : 0;

    return {
      stage: label,
      total: atStage.length,
      converted: converted.length,
      conversionRate,
      averageDaysToConvert,
    };
  });
}

/**
 * Get top referrers
 */
export interface TopReferrer {
  customerId: string;
  customerName: string;
  referralCount: number;
  referralRevenue: number;
  conversionRate: number;
}

export function getTopReferrers(
  customers: Customer[],
  purchases: Array<{ customerId: string; amount: number }>
): TopReferrer[] {
  const referrerMap = new Map<string, TopReferrer>();

  customers.forEach(customer => {
    if (customer.referredBy) {
      const referrer = customers.find(c => c.id === customer.referredBy);
      if (referrer) {
        if (!referrerMap.has(referrer.id)) {
          referrerMap.set(referrer.id, {
            customerId: referrer.id,
            customerName: referrer.name,
            referralCount: 0,
            referralRevenue: 0,
            conversionRate: 0,
          });
        }

        const referrerData = referrerMap.get(referrer.id)!;
        referrerData.referralCount++;

        // Add revenue from this referral
        const referralPurchases = purchases.filter(p => p.customerId === customer.id);
        referrerData.referralRevenue += referralPurchases.reduce((sum, p) => sum + p.amount, 0);
      }
    }
  });

  // Convert to array and calculate conversion rates
  const topReferrers = Array.from(referrerMap.values()).map(referrer => {
    const referrals = customers.filter(c => c.referredBy === referrer.customerId);
    const completedPurchases = referrals.filter(c => c.pickupDate).length;
    referrer.conversionRate = referrals.length > 0 ? (completedPurchases / referrals.length) * 100 : 0;
    return referrer;
  });

  // Sort by referral count
  return topReferrers.sort((a, b) => b.referralCount - a.referralCount);
}
