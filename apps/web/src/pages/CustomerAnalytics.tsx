import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { Customer } from '@breeder/types';
import { CustomerLTVDashboard } from '@/components/CustomerLTVDashboard';
import { CustomerJourneyVisualization } from '@/components/CustomerJourneyVisualization';
import { calculateConversionMetrics, ConversionMetrics } from '@/lib/customerAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, BarChart3, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export function CustomerAnalytics() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, orderBy('inquiryDate', 'desc'));
      const snapshot = await getDocs(q);
      const customersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];

      setCustomers(customersData);
      setConversionMetrics(calculateConversionMetrics(customersData));

      // Select first customer by default if available
      if (customersData.length > 0 && !selectedCustomer) {
        setSelectedCustomer(customersData[0]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Customer Analytics</h1>
          <p className="text-muted-foreground">
            Track customer journeys, lifetime value, and conversion metrics
          </p>
        </div>
        <Alert>
          <AlertDescription>
            No customer data available. Add customers to see analytics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Customer Analytics</h1>
        <p className="text-muted-foreground">
          Track customer journeys, lifetime value, and conversion metrics
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ltv">
            <TrendingUp className="h-4 w-4 mr-2" />
            Lifetime Value
          </TabsTrigger>
          <TabsTrigger value="journey">
            <User className="h-4 w-4 mr-2" />
            Customer Journey
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Track how customers progress through each stage of the journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{metric.stage}</h4>
                          <span className="text-xs text-muted-foreground">
                            {metric.total} customers
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {metric.converted} converted •{' '}
                          {metric.averageDaysToConvert > 0 &&
                            `${Math.round(metric.averageDaysToConvert)} days avg`}
                        </div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className="text-lg font-bold">
                          {Math.round(metric.conversionRate)}%
                        </div>
                        <div className="text-xs text-muted-foreground">conversion</div>
                      </div>
                    </div>
                    <Progress value={metric.conversionRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {customers.filter((c) => c.stage === 'pickup').length} completed journey
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers.filter((c) => c.stage !== 'pickup' && c.stage !== 'archived').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">In journey</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Journey Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const completed = customers.filter(
                      (c) => c.inquiryDate && c.pickupDate
                    );
                    if (completed.length === 0) return '—';
                    const avgDays =
                      completed.reduce((sum, c) => {
                        const days = Math.floor(
                          (new Date(c.pickupDate!).getTime() -
                            new Date(c.inquiryDate!).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return sum + days;
                      }, 0) / completed.length;
                    return Math.round(avgDays);
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Days</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lifetime Value Tab */}
        <TabsContent value="ltv">
          <CustomerLTVDashboard customers={customers} />
        </TabsContent>

        {/* Customer Journey Tab */}
        <TabsContent value="journey" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Customer</CardTitle>
              <CardDescription>
                View detailed journey timeline for individual customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedCustomer?.id || ''}
                onValueChange={(value) => {
                  const customer = customers.find((c) => c.id === value);
                  if (customer) setSelectedCustomer(customer);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedCustomer && <CustomerJourneyVisualization customer={selectedCustomer} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
