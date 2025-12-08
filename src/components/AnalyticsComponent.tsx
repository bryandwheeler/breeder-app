import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  AlertCircle,
  Dog,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AnalyticsDashboard } from '@/types/admin';
import {
  generateAnalyticsDashboard,
  getCachedAnalyticsDashboard,
  cacheAnalyticsDashboard,
} from '@/lib/analytics';
import { useAdminStore } from '@/store/adminStore';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

export function AnalyticsComponent() {
  const { users } = useAdminStore();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async (useCache = true) => {
    setLoading(true);
    try {
      // Try cache first
      if (useCache) {
        const cached = getCachedAnalyticsDashboard();
        if (cached) {
          setAnalytics(cached);
          setLoading(false);
          return;
        }
      }

      // Generate fresh analytics
      const dashboard = await generateAnalyticsDashboard(users);
      setAnalytics(dashboard);
      await cacheAnalyticsDashboard(dashboard);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (users.length > 0) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const handleRefresh = () => {
    loadAnalytics(false);
  };

  if (loading || !analytics) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          {loading ? (
            <>
              <RefreshCw className='h-8 w-8 animate-spin mx-auto mb-2' />
              <p>Generating analytics...</p>
            </>
          ) : (
            <>
              <AlertCircle className='h-8 w-8 text-red-500 mx-auto mb-2' />
              <p className='text-red-600'>Failed to load analytics</p>
              <p className='text-sm text-muted-foreground mt-1'>
                Please ensure Firestore rules are updated for admin access
              </p>
              <Button onClick={handleRefresh} className='mt-4' size='sm'>
                <RefreshCw className='h-4 w-4 mr-2' />
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const tierDistributionData = [
    { name: 'Free', value: analytics.revenue.freeUsers, color: COLORS.primary },
    {
      name: 'Builder',
      value: analytics.revenue.builderUsers,
      color: COLORS.success,
    },
    { name: 'Pro', value: analytics.revenue.proUsers, color: COLORS.purple },
  ];

  const growthTrendData = analytics.cohorts
    ?.slice(0, 6)
    .reverse()
    .map((cohort) => ({
      month: cohort.month,
      newUsers: cohort.newUsers,
      retention: cohort.retentionRate30,
    }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className='space-y-6'>
      {/* Header with Refresh */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold'>Analytics Dashboard</h2>
          <p className='text-sm text-muted-foreground'>
            Generated {new Date(analytics.generatedAt).toLocaleString()}
          </p>
        </div>
        <Button onClick={handleRefresh} variant='outline'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Total Users */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics.userEngagement.totalUsers}
            </div>
            <div className='flex items-center text-xs mt-1'>
              {analytics.growth.growthRate >= 0 ? (
                <TrendingUp className='h-3 w-3 text-green-500 mr-1' />
              ) : (
                <TrendingDown className='h-3 w-3 text-red-500 mr-1' />
              )}
              <span
                className={
                  analytics.growth.growthRate >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }
              >
                {formatPercent(Math.abs(analytics.growth.growthRate))}
              </span>
              <span className='text-muted-foreground ml-1'>vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* MRR */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>MRR</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(analytics.revenue.mrr)}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              ARR: {formatCurrency(analytics.revenue.arr)}
            </p>
          </CardContent>
        </Card>

        {/* Active Users (30d) */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Users (30d)
            </CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics.userEngagement.activeUsers30Days}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {formatPercent(
                analytics.userEngagement.totalUsers > 0
                  ? (analytics.userEngagement.activeUsers30Days /
                      analytics.userEngagement.totalUsers) *
                      100
                  : 0
              )}{' '}
              of total
            </p>
          </CardContent>
        </Card>

        {/* Total Dogs */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total Dogs</CardTitle>
            <Dog className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics.content.totalDogs}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              +{analytics.content.dogsAddedThisWeek} this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* User Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>Active users by time period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Last 7 days</span>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>
                    {analytics.userEngagement.activeUsers7Days}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {formatPercent(
                      analytics.userEngagement.totalUsers > 0
                        ? (analytics.userEngagement.activeUsers7Days /
                            analytics.userEngagement.totalUsers) *
                            100
                        : 0
                    )}
                  </span>
                </div>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Last 30 days</span>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>
                    {analytics.userEngagement.activeUsers30Days}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {formatPercent(
                      analytics.userEngagement.totalUsers > 0
                        ? (analytics.userEngagement.activeUsers30Days /
                            analytics.userEngagement.totalUsers) *
                            100
                        : 0
                    )}
                  </span>
                </div>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Last 90 days</span>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>
                    {analytics.userEngagement.activeUsers90Days}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {formatPercent(
                      analytics.userEngagement.totalUsers > 0
                        ? (analytics.userEngagement.activeUsers90Days /
                            analytics.userEngagement.totalUsers) *
                            100
                        : 0
                    )}
                  </span>
                </div>
              </div>
              <div className='pt-4 border-t'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>Activation Rate</span>
                  <Badge>
                    {formatPercent(analytics.userEngagement.activationRate)}
                  </Badge>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Users who have added at least one dog
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Metrics</CardTitle>
            <CardDescription>
              Subscription and revenue breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Total Subscribers</span>
                <Badge variant='default'>
                  {analytics.revenue.totalSubscribers}
                </Badge>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Conversion Rate</span>
                <span className='text-sm font-medium'>
                  {formatPercent(analytics.revenue.conversionRate)}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>ARPU</span>
                <span className='text-sm font-medium'>
                  {formatCurrency(analytics.revenue.averageRevenuePerUser)}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>Lifetime Value</span>
                <span className='text-sm font-medium'>
                  {formatCurrency(analytics.revenue.lifetimeValue)}
                </span>
              </div>
              <div className='pt-4 border-t'>
                <div className='grid grid-cols-3 gap-2 text-center'>
                  <div>
                    <div className='text-2xl font-bold text-blue-600'>
                      {analytics.revenue.freeUsers}
                    </div>
                    <div className='text-xs text-muted-foreground'>Free</div>
                  </div>
                  <div>
                    <div className='text-2xl font-bold text-green-600'>
                      {analytics.revenue.builderUsers}
                    </div>
                    <div className='text-xs text-muted-foreground'>Builder</div>
                  </div>
                  <div>
                    <div className='text-2xl font-bold text-purple-600'>
                      {analytics.revenue.proUsers}
                    </div>
                    <div className='text-xs text-muted-foreground'>Pro</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Tier Distribution</CardTitle>
            <CardDescription>User distribution across tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={250}>
              <PieChart>
                <Pie
                  data={tierDistributionData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {tierDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
            <CardDescription>Platform-wide content statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-2xl font-bold'>
                    {analytics.content.totalDogs}
                  </div>
                  <p className='text-xs text-muted-foreground'>Total Dogs</p>
                </div>
                <div>
                  <div className='text-2xl font-bold'>
                    {analytics.content.totalLitters}
                  </div>
                  <p className='text-xs text-muted-foreground'>Total Litters</p>
                </div>
                <div>
                  <div className='text-2xl font-bold'>
                    {analytics.content.totalPuppies}
                  </div>
                  <p className='text-xs text-muted-foreground'>Total Puppies</p>
                </div>
                <div>
                  <div className='text-2xl font-bold'>
                    {analytics.content.totalCustomers}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Total Customers
                  </p>
                </div>
              </div>
              <div className='pt-4 border-t'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm'>Avg Dogs/User</span>
                  <span className='text-sm font-medium'>
                    {analytics.content.averageDogsPerUser.toFixed(1)}
                  </span>
                </div>
                <div className='flex justify-between items-center mt-2'>
                  <span className='text-sm'>Avg Litters/User</span>
                  <span className='text-sm font-medium'>
                    {analytics.content.averageLittersPerUser.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Trend */}
      {growthTrendData && growthTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Growth & Retention Trend</CardTitle>
            <CardDescription>
              New users and 30-day retention by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={growthTrendData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis yAxisId='left' />
                <YAxis yAxisId='right' orientation='right' />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='newUsers'
                  stroke={COLORS.primary}
                  name='New Users'
                  strokeWidth={2}
                />
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='retention'
                  stroke={COLORS.success}
                  name='30d Retention %'
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Popular Breeds */}
      {analytics.content.popularBreeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Dog Breeds</CardTitle>
            <CardDescription>
              Most popular breeds on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={analytics.content.popularBreeds.slice(0, 10)}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='breed'
                  angle={-45}
                  textAnchor='end'
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey='count' fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
