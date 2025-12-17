import { useState, useEffect } from 'react';
import { Customer } from '@/types/dog';
import {
  calculateCustomerLTV,
  segmentCustomers,
  getTopReferrers,
  CustomerLifetimeValue,
  CustomerSegment,
  TopReferrer,
} from '@/lib/customerAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Award, AlertCircle, ShoppingCart, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerLTVDashboardProps {
  customers: Customer[];
}

export function CustomerLTVDashboard({ customers }: CustomerLTVDashboardProps) {
  const [clvData, setClvData] = useState<CustomerLifetimeValue[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);

  useEffect(() => {
    // Calculate CLV for all customers
    const purchases = customers.flatMap((customer) => {
      const customerPurchases: Array<{ customerId: string; amount: number; date: string }> = [];

      // Add deposit as purchase if exists
      if (customer.depositAmount && customer.depositDate) {
        customerPurchases.push({
          customerId: customer.id,
          amount: customer.depositAmount,
          date: customer.depositDate,
        });
      }

      // Add final payment if exists
      if (customer.finalPaymentAmount && customer.pickupDate) {
        customerPurchases.push({
          customerId: customer.id,
          amount: customer.finalPaymentAmount,
          date: customer.pickupDate,
        });
      }

      return customerPurchases;
    });

    const clvResults = customers.map((customer) =>
      calculateCustomerLTV(customer, customers, purchases)
    );

    setClvData(clvResults);
    setSegments(segmentCustomers(clvResults));
    setTopReferrers(getTopReferrers(customers, purchases));
  }, [customers]);

  const totalRevenue = clvData.reduce((sum, c) => sum + c.totalValue, 0);
  const averageLTV = clvData.length > 0 ? totalRevenue / clvData.length : 0;
  const repeatCustomers = clvData.filter((c) => c.purchaseCount > 1).length;
  const totalReferrals = clvData.reduce((sum, c) => sum + c.referralCount, 0);

  const getCustomerTypeBadge = (type: 'new' | 'repeat' | 'vip' | 'advocate') => {
    const badges = {
      new: { label: 'New', className: 'bg-gray-100 text-gray-700' },
      repeat: { label: 'Repeat', className: 'bg-blue-100 text-blue-700' },
      vip: { label: 'VIP', className: 'bg-purple-100 text-purple-700' },
      advocate: { label: 'Advocate', className: 'bg-green-100 text-green-700' },
    };
    return badges[type];
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    const badges = {
      low: { label: 'Low Risk', className: 'bg-green-100 text-green-700' },
      medium: { label: 'Medium Risk', className: 'bg-yellow-100 text-yellow-700' },
      high: { label: 'High Risk', className: 'bg-red-100 text-red-700' },
    };
    return badges[risk];
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {clvData.length} customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(averageLTV).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repeatCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {clvData.length > 0
                ? `${Math.round((repeatCustomers / clvData.length) * 100)}% of total`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              By {topReferrers.length} referrers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
          <CardDescription>Revenue distribution across customer types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map((segment) => (
              <div
                key={segment.name}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{segment.name}</h4>
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full',
                      segment.color === 'purple' && 'bg-purple-500',
                      segment.color === 'blue' && 'bg-blue-500',
                      segment.color === 'green' && 'bg-green-500',
                      segment.color === 'gray' && 'bg-gray-400'
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{segment.count}</div>
                  <div className="text-sm text-muted-foreground">
                    ${Math.round(segment.totalRevenue).toLocaleString()} total
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${Math.round(segment.averageValue).toLocaleString()} avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers by LTV */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Lifetime Value</CardTitle>
          <CardDescription>Your most valuable customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clvData
              .sort((a, b) => b.totalValue - a.totalValue)
              .slice(0, 10)
              .map((customer) => {
                const typeBadge = getCustomerTypeBadge(customer.customerType);
                const riskBadge = getRiskBadge(customer.predictions.riskLevel);

                return (
                  <div
                    key={customer.customerId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{customer.customerName}</h4>
                        <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {customer.purchaseCount} purchase{customer.purchaseCount !== 1 ? 's' : ''}
                        </span>
                        {customer.referralCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {customer.referralCount} referral{customer.referralCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        <Badge variant="outline" className={riskBadge.className}>
                          {riskBadge.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        ${customer.totalValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${Math.round(customer.averageOrderValue).toLocaleString()} avg
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Top Referrers */}
      {topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Customers who bring the most referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topReferrers.slice(0, 5).map((referrer, index) => (
                <div
                  key={referrer.customerId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{referrer.customerName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {referrer.referralCount} referral{referrer.referralCount !== 1 ? 's' : ''} •{' '}
                        {Math.round(referrer.conversionRate)}% conversion
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      ${referrer.referralRevenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Referral revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* At-Risk Customers */}
      {clvData.filter((c) => c.predictions.riskLevel === 'high').length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">At-Risk Customers</CardTitle>
            </div>
            <CardDescription>Customers who may need re-engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clvData
                .filter((c) => c.predictions.riskLevel === 'high')
                .slice(0, 5)
                .map((customer) => (
                  <div
                    key={customer.customerId}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{customer.customerName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Last purchase:{' '}
                        {new Date(customer.lastPurchaseDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${customer.totalValue.toLocaleString()}</div>
                      <p className="text-xs text-red-600">High churn risk</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
