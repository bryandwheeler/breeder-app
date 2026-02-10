import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { queryAuditLogs } from '@/lib/auditLog';
import {
  AuditLogEntry,
  AuditEventCategory,
  AuditLogFilters,
} from '@breeder/types';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [maxResults, setMaxResults] = useState(100);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedLogs = await queryAuditLogs(
        { ...filters, searchQuery },
        maxResults
      );
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, maxResults, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    fetchLogs();
  };

  const handleExport = () => {
    const csv = [
      [
        'Timestamp',
        'Category',
        'Action',
        'Actor',
        'Target',
        'Description',
        'Success',
      ].join(','),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.category,
          log.action,
          `${log.actorDisplayName} (${log.actorEmail})`,
          log.targetDisplayName
            ? `${log.targetDisplayName} (${log.targetEmail})`
            : 'N/A',
          `"${log.description}"`,
          log.success ? 'Yes' : 'No',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getCategoryColor = (category: AuditEventCategory) => {
    const colors: Record<AuditEventCategory, string> = {
      auth: 'bg-blue-100 text-blue-800',
      user_management: 'bg-purple-100 text-purple-800',
      subscription: 'bg-green-100 text-green-800',
      settings: 'bg-rose-100 text-rose-800',
      content: 'bg-pink-100 text-pink-800',
      security: 'bg-red-100 text-red-800',
      data_export: 'bg-yellow-100 text-yellow-800',
      system: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Track all administrative actions and user activity across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className='space-y-4 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {/* Search */}
            <div className='md:col-span-2'>
              <Label>Search</Label>
              <div className='flex gap-2'>
                <Input
                  placeholder='Search by user, email, or description...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size='icon'>
                  <Search className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <Label>Category</Label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    category:
                      value === 'all'
                        ? undefined
                        : (value as AuditEventCategory),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  <SelectItem value='auth'>Authentication</SelectItem>
                  <SelectItem value='user_management'>
                    User Management
                  </SelectItem>
                  <SelectItem value='subscription'>Subscription</SelectItem>
                  <SelectItem value='settings'>Settings</SelectItem>
                  <SelectItem value='content'>Content</SelectItem>
                  <SelectItem value='security'>Security</SelectItem>
                  <SelectItem value='data_export'>Data Export</SelectItem>
                  <SelectItem value='system'>System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Results */}
            <div>
              <Label>Show Results</Label>
              <Select
                value={maxResults.toString()}
                onValueChange={(value) => setMaxResults(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='50'>50</SelectItem>
                  <SelectItem value='100'>100</SelectItem>
                  <SelectItem value='250'>250</SelectItem>
                  <SelectItem value='500'>500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2'>
            <Button onClick={fetchLogs} variant='outline' size='sm'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              variant='outline'
              size='sm'
              disabled={logs.length === 0}
            >
              <Download className='h-4 w-4 mr-2' />
              Export CSV
            </Button>
            <Button
              onClick={() => {
                setFilters({});
                setSearchQuery('');
              }}
              variant='outline'
              size='sm'
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className='mb-4 text-sm text-muted-foreground'>
          {loading ? 'Loading...' : `Showing ${logs.length} logs`}
        </div>

        {/* Logs Table */}
        <div className='border rounded-lg overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[180px]'>Timestamp</TableHead>
                <TableHead className='w-[120px]'>Category</TableHead>
                <TableHead className='w-[150px]'>Actor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className='w-[80px]'>Status</TableHead>
                <TableHead className='w-[50px]'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <>
                    <TableRow key={log.id}>
                      <TableCell className='font-mono text-xs'>
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={getCategoryColor(log.category)}
                        >
                          {log.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          <div className='font-medium'>
                            {log.actorDisplayName}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {log.actorEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>{log.description}</div>
                        {log.targetDisplayName && (
                          <div className='text-xs text-muted-foreground mt-1'>
                            Target: {log.targetDisplayName} ({log.targetEmail})
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <CheckCircle className='h-4 w-4 text-green-500' />
                        ) : (
                          <XCircle className='h-4 w-4 text-red-500' />
                        )}
                      </TableCell>
                      <TableCell>
                        {log.metadata && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => toggleExpanded(log.id)}
                          >
                            {expandedLogId === log.id ? (
                              <ChevronUp className='h-4 w-4' />
                            ) : (
                              <ChevronDown className='h-4 w-4' />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedLogId === log.id && log.metadata && (
                      <TableRow>
                        <TableCell colSpan={6} className='bg-muted/50'>
                          <div className='p-4'>
                            <div className='text-sm font-semibold mb-2'>
                              Additional Details:
                            </div>
                            <pre className='text-xs bg-background p-3 rounded border overflow-x-auto'>
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                            {log.errorMessage && (
                              <div className='mt-2'>
                                <div className='text-sm font-semibold text-red-600'>
                                  Error:
                                </div>
                                <div className='text-sm text-red-600'>
                                  {log.errorMessage}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
