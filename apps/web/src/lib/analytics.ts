import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import {
  AnalyticsDashboard,
  UserEngagementMetrics,
  RevenueMetrics,
  ContentMetrics,
  CohortData,
  UserProfile,
  SubscriptionTier,
} from '@breeder/types';

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get the first day of the month for a given date
 */
function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Calculate user engagement metrics
 */
async function calculateUserEngagement(
  users: UserProfile[]
): Promise<UserEngagementMetrics> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const activeUsers7Days = users.filter((user) => {
    if (!user.lastLogin) return false;
    const lastLogin = new Date(user.lastLogin);
    return lastLogin >= sevenDaysAgo;
  }).length;

  const activeUsers30Days = users.filter((user) => {
    if (!user.lastLogin) return false;
    const lastLogin = new Date(user.lastLogin);
    return lastLogin >= thirtyDaysAgo;
  }).length;

  const activeUsers90Days = users.filter((user) => {
    if (!user.lastLogin) return false;
    const lastLogin = new Date(user.lastLogin);
    return lastLogin >= ninetyDaysAgo;
  }).length;

  const usersWithDogs = users.filter(
    (user) => (user.totalDogs || 0) > 0
  ).length;
  const activationRate =
    users.length > 0 ? (usersWithDogs / users.length) * 100 : 0;

  return {
    activeUsers7Days,
    activeUsers30Days,
    activeUsers90Days,
    totalUsers: users.length,
    activationRate: Math.round(activationRate * 10) / 10,
    averageSessionsPerUser: 0, // Would need session tracking to calculate
  };
}

/**
 * Calculate revenue metrics
 */
async function calculateRevenueMetrics(
  users: UserProfile[],
  tierPrices: Record<SubscriptionTier, { monthly: number; yearly: number }>
): Promise<RevenueMetrics> {
  const freeUsers = users.filter(
    (u) => !u.subscriptionTier || u.subscriptionTier === 'free'
  ).length;
  const builderUsers = users.filter(
    (u) => u.subscriptionTier === 'builder'
  ).length;
  const proUsers = users.filter((u) => u.subscriptionTier === 'pro').length;

  const now = new Date();
  const trialUsers = users.filter((u) => {
    if (!u.trialEndDate) return false;
    const trialEnd = new Date(u.trialEndDate);
    return trialEnd > now;
  }).length;

  // Calculate MRR (assuming monthly pricing for simplicity)
  const mrr =
    builderUsers * tierPrices.builder.monthly +
    proUsers * tierPrices.pro.monthly;
  const arr = mrr * 12;

  const totalSubscribers = builderUsers + proUsers;

  // Calculate churn rate (need historical data - simplified here)
  const churnRate = 0; // Would need to track cancellations over time

  // Calculate conversion rate (free to paid)
  const conversionRate =
    freeUsers + totalSubscribers > 0
      ? (totalSubscribers / (freeUsers + totalSubscribers)) * 100
      : 0;

  const averageRevenuePerUser = users.length > 0 ? mrr / users.length : 0;

  // Simplified lifetime value calculation
  const lifetimeValue = averageRevenuePerUser * 24; // Assume 24 month avg lifetime

  return {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(arr * 100) / 100,
    totalSubscribers,
    freeUsers,
    builderUsers,
    proUsers,
    trialUsers,
    churnRate: Math.round(churnRate * 10) / 10,
    conversionRate: Math.round(conversionRate * 10) / 10,
    averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
    lifetimeValue: Math.round(lifetimeValue * 100) / 100,
  };
}

/**
 * Calculate content metrics
 */
async function calculateContentMetrics(
  users: UserProfile[]
): Promise<ContentMetrics> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Aggregate from user profiles
  const totalDogs = users.reduce((sum, user) => sum + (user.totalDogs || 0), 0);
  const totalLitters = users.reduce(
    (sum, user) => sum + (user.totalLitters || 0),
    0
  );

  let dogsAddedThisWeek = 0;
  let littersAddedThisWeek = 0;
  let totalPuppies = 0;
  let totalCustomers = 0;
  const breedCounts: Record<string, number> = {};

  try {
    // Get dogs added this week
    const dogsSnapshot = await getDocs(
      query(
        collection(db, 'dogs'),
        where('createdAt', '>=', oneWeekAgo.toISOString())
      )
    );
    dogsAddedThisWeek = dogsSnapshot.size;

    // Get litters added this week
    const littersSnapshot = await getDocs(
      query(
        collection(db, 'litters'),
        where('createdAt', '>=', oneWeekAgo.toISOString())
      )
    );
    littersAddedThisWeek = littersSnapshot.size;

    // Get all dogs for breed analysis
    const allDogsSnapshot = await getDocs(collection(db, 'dogs'));
    allDogsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const breed = data.breed || 'Unknown';
      breedCounts[breed] = (breedCounts[breed] || 0) + 1;
    });

    // Get total puppies from litters
    const allLittersSnapshot = await getDocs(collection(db, 'litters'));
    allLittersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.puppies && Array.isArray(data.puppies)) {
        totalPuppies += data.puppies.length;
      }
    });

    // Get total customers
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    totalCustomers = customersSnapshot.size;
  } catch (error) {
    // Gracefully handle permission errors - use profile data only
    console.warn(
      'Could not fetch detailed analytics data (permissions):',
      error
    );
  }

  const popularBreeds = Object.entries(breedCounts)
    .map(([breed, count]) => ({ breed, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get registration types (simplified - would need to query registrations)
  const registrationTypes: Array<{ registry: string; count: number }> = [];

  const averageDogsPerUser = users.length > 0 ? totalDogs / users.length : 0;
  const averageLittersPerUser =
    users.length > 0 ? totalLitters / users.length : 0;

  return {
    totalDogs,
    totalLitters,
    totalPuppies,
    totalCustomers,
    dogsAddedThisWeek,
    littersAddedThisWeek,
    averageDogsPerUser: Math.round(averageDogsPerUser * 10) / 10,
    averageLittersPerUser: Math.round(averageLittersPerUser * 10) / 10,
    popularBreeds,
    registrationTypes,
  };
}

/**
 * Calculate cohort retention data
 */
async function calculateCohortData(
  users: UserProfile[]
): Promise<CohortData[]> {
  const cohortMap = new Map<string, CohortData>();
  const now = new Date();

  users.forEach((user) => {
    const createdAt = new Date(user.createdAt);
    const cohortMonth = `${createdAt.getFullYear()}-${String(
      createdAt.getMonth() + 1
    ).padStart(2, '0')}`;

    if (!cohortMap.has(cohortMonth)) {
      cohortMap.set(cohortMonth, {
        month: cohortMonth,
        newUsers: 0,
        retained30Days: 0,
        retained60Days: 0,
        retained90Days: 0,
        retentionRate30: 0,
        retentionRate60: 0,
        retentionRate90: 0,
      });
    }

    const cohort = cohortMap.get(cohortMonth)!;
    cohort.newUsers++;

    // Check retention based on last login
    if (user.lastLogin) {
      const lastLogin = new Date(user.lastLogin);
      const daysSinceCreation = daysBetween(createdAt, now);
      const daysSinceLogin = daysBetween(lastLogin, now);

      if (daysSinceCreation >= 30 && daysSinceLogin <= 30) {
        cohort.retained30Days++;
      }
      if (daysSinceCreation >= 60 && daysSinceLogin <= 60) {
        cohort.retained60Days++;
      }
      if (daysSinceCreation >= 90 && daysSinceLogin <= 90) {
        cohort.retained90Days++;
      }
    }
  });

  // Calculate retention rates
  const cohorts = Array.from(cohortMap.values());
  cohorts.forEach((cohort) => {
    if (cohort.newUsers > 0) {
      cohort.retentionRate30 =
        Math.round((cohort.retained30Days / cohort.newUsers) * 1000) / 10;
      cohort.retentionRate60 =
        Math.round((cohort.retained60Days / cohort.newUsers) * 1000) / 10;
      cohort.retentionRate90 =
        Math.round((cohort.retained90Days / cohort.newUsers) * 1000) / 10;
    }
  });

  // Sort by month descending
  return cohorts.sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12);
}

/**
 * Calculate growth metrics
 */
function calculateGrowthMetrics(users: UserProfile[]) {
  const now = new Date();
  const firstDayThisMonth = getFirstDayOfMonth(now);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const newUsersThisMonth = users.filter((user) => {
    const createdAt = new Date(user.createdAt);
    return createdAt >= firstDayThisMonth;
  }).length;

  const newUsersLastMonth = users.filter((user) => {
    const createdAt = new Date(user.createdAt);
    return createdAt >= firstDayLastMonth && createdAt < firstDayThisMonth;
  }).length;

  const growthRate =
    newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
      : 0;

  const newUsersThisWeek = users.filter((user) => {
    const createdAt = new Date(user.createdAt);
    return createdAt >= sevenDaysAgo;
  }).length;

  const newUsersLastWeek = users.filter((user) => {
    const createdAt = new Date(user.createdAt);
    return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
  }).length;

  return {
    newUsersThisMonth,
    newUsersLastMonth,
    growthRate: Math.round(growthRate * 10) / 10,
    newUsersThisWeek,
    newUsersLastWeek,
  };
}

/**
 * Generate complete analytics dashboard
 */
export async function generateAnalyticsDashboard(
  users: UserProfile[]
): Promise<AnalyticsDashboard> {
  // Default tier pricing (should match SubscriptionManagement defaults)
  const tierPrices = {
    free: { monthly: 0, yearly: 0 },
    builder: { monthly: 29, yearly: 290 },
    pro: { monthly: 79, yearly: 790 },
  };

  const [userEngagement, revenue, content, cohorts] = await Promise.all([
    calculateUserEngagement(users),
    calculateRevenueMetrics(users, tierPrices),
    calculateContentMetrics(users),
    calculateCohortData(users),
  ]);

  const growth = calculateGrowthMetrics(users);

  return {
    generatedAt: new Date().toISOString(),
    userEngagement,
    revenue,
    content,
    cohorts,
    growth,
  };
}

/**
 * Cache analytics dashboard (optional - can be called periodically)
 */
export async function cacheAnalyticsDashboard(
  dashboard: AnalyticsDashboard
): Promise<void> {
  // Store in localStorage for client-side caching
  try {
    localStorage.setItem('analytics_cache', JSON.stringify(dashboard));
    localStorage.setItem('analytics_cache_time', new Date().toISOString());
  } catch (error) {
    console.error('Failed to cache analytics:', error);
  }
}

/**
 * Get cached analytics dashboard
 */
export function getCachedAnalyticsDashboard(): AnalyticsDashboard | null {
  try {
    const cached = localStorage.getItem('analytics_cache');
    const cacheTime = localStorage.getItem('analytics_cache_time');

    if (!cached || !cacheTime) return null;

    // Check if cache is less than 5 minutes old
    const cacheAge = new Date().getTime() - new Date(cacheTime).getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (cacheAge > fiveMinutes) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to get cached analytics:', error);
    return null;
  }
}
