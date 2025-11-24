// CRM - Customer database management
import { useState, useMemo } from 'react';
import { useCrmStore } from '@/store/crmStore';
import { Customer } from '@/types/dog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Mail,
  Phone,
  DollarSign,
  Tag,
  Calendar,
  MoreVertical,
  Eye,
  Trash2,
  UserPlus,
  Search,
  Filter,
  MessageSquare,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { CustomerDetailsDialog } from '@/components/CustomerDetailsDialog';
import { AddCustomerDialog } from '@/components/AddCustomerDialog';
import { formatCurrency } from '@/lib/utils';

export function Customers() {
  const { customers, deleteCustomer } = useCrmStore();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    customers.forEach((customer) => {
      customer.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [customers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = customer.name.toLowerCase().includes(search);
        const matchesEmail = customer.email.toLowerCase().includes(search);
        const matchesPhone = customer.phone?.toLowerCase().includes(search);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && customer.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && customer.status !== statusFilter) return false;

      // Tag filter
      if (tagFilter !== 'all' && !customer.tags?.includes(tagFilter)) return false;

      return true;
    });
  }, [customers, searchTerm, typeFilter, statusFilter, tagFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
    const averageLifetimeValue =
      customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0) / customers.length
        : 0;
    const totalPurchases = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);

    return {
      total: customers.length,
      active: activeCustomers,
      totalRevenue,
      averageLifetimeValue,
      totalPurchases,
    };
  }, [customers]);

  const getTypeColor = (type: Customer['type']) => {
    switch (type) {
      case 'prospect':
        return 'bg-yellow-500';
      case 'waitlist':
        return 'bg-blue-500';
      case 'buyer':
        return 'bg-green-500';
      case 'past_buyer':
        return 'bg-purple-500';
      case 'guardian':
        return 'bg-cyan-500';
      case 'referral_source':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'archived':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      await deleteCustomer(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Database</h1>
          <p className="text-muted-foreground">Manage all customer relationships and interactions</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <User className="h-4 w-4" />
            <div className="text-sm">Total Customers</div>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <div className="text-sm">Active</div>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <div className="text-sm">Total Revenue</div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <div className="text-sm">Avg. LTV</div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.averageLifetimeValue)}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ShoppingCart className="h-4 w-4" />
            <div className="text-sm">Total Purchases</div>
          </div>
          <div className="text-2xl font-bold">{stats.totalPurchases}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="past_buyer">Past Buyer</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="referral_source">Referral Source</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {allTags.length > 0 && (
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </Card>

      {/* Customer Table */}
      {filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {customers.length === 0
              ? 'No customers yet. Add your first customer to get started!'
              : 'No customers match your filters.'}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>LTV</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                  </TableCell>

                  <TableCell>
                    <Badge className={getTypeColor(customer.type)}>
                      {customer.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {customer.phone && (
                        <a
                          href={`tel:${customer.phone}`}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </a>
                      )}
                      {customer.email && (
                        <a
                          href={`mailto:${customer.email}`}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </a>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">{customer.totalPurchases || 0}</div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{formatCurrency(customer.totalRevenue || 0)}</div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(customer.lifetimeValue || 0)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {customer.lastContactDate
                        ? new Date(customer.lastContactDate).toLocaleDateString()
                        : '-'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {customer.tags && customer.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{customer.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`mailto:${customer.email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </a>
                        </DropdownMenuItem>
                        {customer.phone && (
                          <DropdownMenuItem asChild>
                            <a href={`tel:${customer.phone}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(customer.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialogs */}
      {selectedCustomer && (
        <CustomerDetailsDialog
          open={detailsOpen}
          setOpen={setDetailsOpen}
          customer={selectedCustomer}
        />
      )}

      <AddCustomerDialog open={addDialogOpen} setOpen={setAddDialogOpen} />
    </div>
  );
}
