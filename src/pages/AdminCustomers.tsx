import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SubscriptionTier } from '@/types/admin';
import { format } from 'date-fns';
import { ExternalLink, Mail, DollarSign, Calendar } from 'lucide-react';

interface CustomerSubscription {
  uid: string;
  email: string;
  breederName: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  currentPeriodEnd: number;
  stripeCustomerId: string;
  createdAt: Date;
}

const tierColors: Record<SubscriptionTier, string> = {
  free: 'bg-gray-100 text-gray-800',
  builder: 'bg-blue-100 text-blue-800',
  pro: 'bg-amber-100 text-amber-800',
};

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSubscription | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const snapshot = await getDocs(q);

        const customerList: CustomerSubscription[] = [];

        for (const userDoc of snapshot.docs) {
          const data = userDoc.data();
          const breederDocs = await getDocs(
            query(collection(db, 'breeders'), where('uid', '==', userDoc.id))
          );
          const breederName = breederDocs.docs[0]?.data()?.breederName || 'N/A';

          customerList.push({
            uid: userDoc.id,
            email: data.email || 'N/A',
            breederName,
            subscriptionTier: data.subscriptionTier || 'free',
            subscriptionStatus: data.subscriptionStatus || 'active',
            currentPeriodEnd: data.currentPeriodEnd || 0,
            stripeCustomerId: data.stripeCustomerId || 'N/A',
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }

        setCustomers(
          customerList.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          )
        );
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleViewDetails = (customer: CustomerSubscription) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  const handleOpenStripe = (customerId: string) => {
    window.open(
      `https://dashboard.stripe.com/customers/${customerId}`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold mb-2'>Customer Management</h1>
        <p className='text-muted-foreground'>
          View and manage customer subscriptions and billing
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted-foreground'>Total Customers</p>
              <p className='text-3xl font-bold'>{customers.length}</p>
            </div>
            <Mail className='h-8 w-8 text-blue-500 opacity-50' />
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted-foreground'>Pro Tier</p>
              <p className='text-3xl font-bold'>
                {customers.filter((c) => c.subscriptionTier === 'pro').length}
              </p>
            </div>
            <DollarSign className='h-8 w-8 text-amber-500 opacity-50' />
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted-foreground'>Builder Tier</p>
              <p className='text-3xl font-bold'>
                {
                  customers.filter((c) => c.subscriptionTier === 'builder')
                    .length
                }
              </p>
            </div>
            <DollarSign className='h-8 w-8 text-blue-500 opacity-50' />
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted-foreground'>Free Tier</p>
              <p className='text-3xl font-bold'>
                {customers.filter((c) => c.subscriptionTier === 'free').length}
              </p>
            </div>
            <Calendar className='h-8 w-8 text-gray-500 opacity-50' />
          </div>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Breeder Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.uid}>
                  <TableCell className='font-medium'>
                    {customer.breederName}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>
                    <Badge className={tierColors[customer.subscriptionTier]}>
                      {customer.subscriptionTier.charAt(0).toUpperCase() +
                        customer.subscriptionTier.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.subscriptionStatus === 'active'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {customer.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {customer.currentPeriodEnd > 0
                      ? format(
                          new Date(customer.currentPeriodEnd * 1000),
                          'MMM d, yyyy'
                        )
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      <Button
                        onClick={() => handleViewDetails(customer)}
                        size='sm'
                        variant='outline'
                      >
                        Details
                      </Button>
                      {customer.stripeCustomerId !== 'N/A' && (
                        <Button
                          onClick={() =>
                            handleOpenStripe(customer.stripeCustomerId)
                          }
                          size='sm'
                          variant='ghost'
                        >
                          <ExternalLink className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-muted-foreground'>Breeder Name</p>
                  <p className='font-medium'>{selectedCustomer.breederName}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Email</p>
                  <p className='font-medium'>{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Current Plan</p>
                  <Badge
                    className={tierColors[selectedCustomer.subscriptionTier]}
                  >
                    {selectedCustomer.subscriptionTier}
                  </Badge>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Status</p>
                  <Badge
                    variant={
                      selectedCustomer.subscriptionStatus === 'active'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {selectedCustomer.subscriptionStatus}
                  </Badge>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Next Billing</p>
                  <p className='font-medium'>
                    {selectedCustomer.currentPeriodEnd > 0
                      ? format(
                          new Date(selectedCustomer.currentPeriodEnd * 1000),
                          'MMM d, yyyy'
                        )
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Stripe Customer ID
                  </p>
                  <p className='font-mono text-sm'>
                    {selectedCustomer.stripeCustomerId}
                  </p>
                </div>
              </div>

              <div className='pt-4 border-t'>
                {selectedCustomer.stripeCustomerId !== 'N/A' && (
                  <Button
                    onClick={() =>
                      handleOpenStripe(selectedCustomer.stripeCustomerId)
                    }
                    className='w-full'
                  >
                    <ExternalLink className='h-4 w-4 mr-2' />
                    View in Stripe Dashboard
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
