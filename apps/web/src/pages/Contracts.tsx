import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContractStore } from '@breeder/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ContractStatusBadge,
  ContractSendDialog,
} from '@/components/contracts';
import {
  SignNowContract,
  ContractStatus,
  CONTRACT_TEMPLATE_TYPE_LABELS,
} from '@breeder/types';
import {
  FileSignature,
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getSignerProgress(contract: SignNowContract): string {
  if (!contract.signers || contract.signers.length === 0) return '0/0';
  const signed = contract.signers.filter((s) => s.status === 'signed').length;
  return `${signed}/${contract.signers.length}`;
}

export function Contracts() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { contracts, loading, subscribeToContracts, cancelContract, deleteContract } = useContractStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [showSendDialog, setShowSendDialog] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToContracts(currentUser.uid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToContracts]);

  // Filter contracts
  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      !searchQuery ||
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.signers?.some((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: contracts.length,
    draft: contracts.filter((c) => c.status === 'draft').length,
    pending: contracts.filter((c) => ['sent', 'viewed', 'partially_signed'].includes(c.status)).length,
    signed: contracts.filter((c) => c.status === 'signed').length,
    declined: contracts.filter((c) => c.status === 'declined').length,
  };

  const handleCancel = async (contract: SignNowContract) => {
    if (!confirm('Are you sure you want to cancel this contract?')) return;
    try {
      await cancelContract(contract.id);
      toast({
        title: 'Contract cancelled',
        description: 'The contract has been cancelled.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel contract',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (contract: SignNowContract) => {
    if (!confirm('Are you sure you want to delete this contract? This cannot be undone.')) return;
    try {
      await deleteContract(contract.id);
      toast({
        title: 'Contract deleted',
        description: 'The contract has been deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete contract',
        variant: 'destructive',
      });
    }
  };

  if (loading && contracts.length === 0) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2' />
          <p className='text-muted-foreground'>Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <FileSignature className='h-8 w-8' />
            Contracts
          </h1>
          <p className='text-muted-foreground'>
            Manage e-signature contracts for your sales and agreements
          </p>
        </div>
        <Button onClick={() => setShowSendDialog(true)}>
          <Plus className='h-4 w-4 mr-2' />
          New Contract
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <FileText className='h-8 w-8 text-muted-foreground' />
              <div>
                <p className='text-2xl font-bold'>{stats.total}</p>
                <p className='text-xs text-muted-foreground'>Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <FileText className='h-8 w-8 text-gray-400' />
              <div>
                <p className='text-2xl font-bold'>{stats.draft}</p>
                <p className='text-xs text-muted-foreground'>Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <Clock className='h-8 w-8 text-blue-500' />
              <div>
                <p className='text-2xl font-bold'>{stats.pending}</p>
                <p className='text-xs text-muted-foreground'>Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <CheckCircle className='h-8 w-8 text-green-500' />
              <div>
                <p className='text-2xl font-bold'>{stats.signed}</p>
                <p className='text-xs text-muted-foreground'>Signed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <XCircle className='h-8 w-8 text-red-500' />
              <div>
                <p className='text-2xl font-bold'>{stats.declined}</p>
                <p className='text-xs text-muted-foreground'>Declined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search contracts...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ContractStatus | 'all')}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Statuses</SelectItem>
                <SelectItem value='draft'>Draft</SelectItem>
                <SelectItem value='sent'>Sent</SelectItem>
                <SelectItem value='viewed'>Viewed</SelectItem>
                <SelectItem value='partially_signed'>Partially Signed</SelectItem>
                <SelectItem value='signed'>Signed</SelectItem>
                <SelectItem value='declined'>Declined</SelectItem>
                <SelectItem value='expired'>Expired</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardContent className='p-0'>
          {filteredContracts.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <FileSignature className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-medium mb-1'>No contracts found</h3>
              <p className='text-muted-foreground mb-4'>
                {contracts.length === 0
                  ? 'Create your first contract to get started'
                  : 'No contracts match your filters'}
              </p>
              {contracts.length === 0 && (
                <Button onClick={() => setShowSendDialog(true)}>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Contract
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signers</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className='w-12'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow
                    key={contract.id}
                    className='cursor-pointer hover:bg-muted/50'
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className='font-medium'>{contract.name}</p>
                        {contract.signers && contract.signers.length > 0 && (
                          <p className='text-xs text-muted-foreground'>
                            {contract.signers.map((s) => s.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm'>
                        {CONTRACT_TEMPLATE_TYPE_LABELS[contract.templateType] || contract.templateType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ContractStatusBadge status={contract.status} />
                    </TableCell>
                    <TableCell>
                      <span className='text-sm'>
                        {getSignerProgress(contract)} signed
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {formatDate(contract.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {formatDate(contract.completedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant='ghost' size='icon'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/contracts/${contract.id}`);
                            }}
                          >
                            <Eye className='h-4 w-4 mr-2' />
                            View Details
                          </DropdownMenuItem>
                          {['draft', 'sent', 'viewed', 'partially_signed'].includes(contract.status) && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(contract);
                              }}
                            >
                              <XCircle className='h-4 w-4 mr-2' />
                              Cancel Contract
                            </DropdownMenuItem>
                          )}
                          {['draft', 'cancelled'].includes(contract.status) && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(contract);
                              }}
                              className='text-destructive'
                            >
                              <Trash2 className='h-4 w-4 mr-2' />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Dialog */}
      <ContractSendDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        onSuccess={(contractId) => navigate(`/contracts/${contractId}`)}
      />
    </div>
  );
}
