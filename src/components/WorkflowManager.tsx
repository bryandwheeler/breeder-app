import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkflowStore } from '@/store/workflowStore';
import { Workflow, WorkflowCategory, TriggerType, ActionType } from '@/types/workflow';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Zap,
  Play,
  Pause,
  Trash2,
  Plus,
  Activity,
  Filter,
  Copy,
} from 'lucide-react';

const TRIGGER_LABELS: Record<TriggerType, string> = {
  customer_created: 'Customer Created',
  customer_status_changed: 'Customer Status Changed',
  litter_born: 'Litter Born',
  puppy_ready: 'Puppy Ready for Pickup',
  days_after_pickup: 'Days After Pickup',
  puppy_birthday: 'Puppy Birthday',
  no_response: 'No Response from Customer',
  payment_received: 'Payment Received',
  payment_overdue: 'Payment Overdue',
  waitlist_joined: 'Joined Waitlist',
  heat_cycle_detected: 'Heat Cycle Detected',
  manual: 'Manual Trigger',
};

const ACTION_LABELS: Record<ActionType, string> = {
  send_email: 'Send Email',
  schedule_email: 'Schedule Email',
  send_sms: 'Send SMS',
  add_tag: 'Add Tag',
  remove_tag: 'Remove Tag',
  change_status: 'Change Customer Status',
  create_task: 'Create Task',
  create_interaction: 'Create Interaction',
  webhook: 'Call Webhook',
  wait: 'Wait (Delay)',
};

export function WorkflowManager() {
  const { currentUser } = useAuth();
  const {
    workflows,
    loading,
    loadWorkflows,
    subscribeToWorkflows,
    deleteWorkflow,
    toggleWorkflow,
    initializeDefaultWorkflows,
  } = useWorkflowStore();

  const [filterCategory, setFilterCategory] = useState<WorkflowCategory | 'all'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    loadWorkflows(currentUser.uid);
    const unsubscribe = subscribeToWorkflows(currentUser.uid);

    return () => {
      unsubscribe();
    };
  }, [currentUser, loadWorkflows, subscribeToWorkflows]);

  const handleInitializeDefaults = async () => {
    if (!currentUser) return;
    try {
      await initializeDefaultWorkflows(currentUser.uid);
    } catch (error) {
      console.error('Error initializing default workflows:', error);
    }
  };

  const handleToggle = async (workflowId: string, isActive: boolean) => {
    try {
      await toggleWorkflow(workflowId, !isActive);
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await deleteWorkflow(workflowId);
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setEditDialogOpen(true);
  };

  const filteredWorkflows = workflows.filter((workflow) => {
    if (filterCategory !== 'all' && workflow.category !== filterCategory) {
      return false;
    }
    if (filterActive === 'active' && !workflow.isActive) {
      return false;
    }
    if (filterActive === 'inactive' && workflow.isActive) {
      return false;
    }
    return true;
  });

  const activeCount = workflows.filter((w) => w.isActive).length;
  const totalTriggered = workflows.reduce((sum, w) => sum + (w.timesTriggered || 0), 0);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Workflow Automation</h2>
          <p className='text-sm text-muted-foreground'>
            Automate repetitive tasks with intelligent workflows
          </p>
        </div>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedWorkflow(null)}>
              <Plus className='mr-2 h-4 w-4' />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <WorkflowEditor
              workflow={selectedWorkflow}
              onClose={() => setEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{workflows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalTriggered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Initialize Defaults */}
      {workflows.length === 0 && !loading && (
        <Card className='border-dashed'>
          <CardHeader>
            <CardTitle>Get Started with Workflows</CardTitle>
            <CardDescription>
              Start with pre-built workflow templates designed for dog breeders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInitializeDefaults}>
              <Zap className='mr-2 h-4 w-4' />
              Initialize Default Workflows
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {workflows.length > 0 && (
        <div className='flex gap-4'>
          <Select
            value={filterCategory}
            onValueChange={(value) => setFilterCategory(value as WorkflowCategory | 'all')}
          >
            <SelectTrigger className='w-48'>
              <Filter className='mr-2 h-4 w-4' />
              <SelectValue placeholder='Filter by category' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              <SelectItem value='communication'>Communication</SelectItem>
              <SelectItem value='customer_management'>Customer Management</SelectItem>
              <SelectItem value='puppy_management'>Puppy Management</SelectItem>
              <SelectItem value='breeding'>Breeding</SelectItem>
              <SelectItem value='financial'>Financial</SelectItem>
              <SelectItem value='marketing'>Marketing</SelectItem>
              <SelectItem value='tasks'>Tasks</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterActive}
            onValueChange={(value) => setFilterActive(value as 'all' | 'active' | 'inactive')}
          >
            <SelectTrigger className='w-48'>
              <Activity className='mr-2 h-4 w-4' />
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Workflows</SelectItem>
              <SelectItem value='active'>Active Only</SelectItem>
              <SelectItem value='inactive'>Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Workflows List */}
      <div className='grid grid-cols-1 gap-4'>
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <CardTitle className='text-lg'>{workflow.name}</CardTitle>
                    {workflow.isActive ? (
                      <Badge variant='default'>Active</Badge>
                    ) : (
                      <Badge variant='secondary'>Inactive</Badge>
                    )}
                  </div>
                  {workflow.description && (
                    <CardDescription className='mt-1'>{workflow.description}</CardDescription>
                  )}
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleToggle(workflow.id, workflow.isActive)}
                  >
                    {workflow.isActive ? (
                      <>
                        <Pause className='h-4 w-4' />
                      </>
                    ) : (
                      <>
                        <Play className='h-4 w-4' />
                      </>
                    )}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleEdit(workflow)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleDelete(workflow.id)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {/* Trigger */}
                <div>
                  <h4 className='text-sm font-semibold mb-2'>Trigger</h4>
                  <div className='flex items-center gap-2'>
                    <Zap className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm'>
                      {TRIGGER_LABELS[workflow.trigger.type as TriggerType] || workflow.trigger.type}
                    </span>
                  </div>
                </div>

                {/* Conditions */}
                {workflow.conditions && workflow.conditions.length > 0 && (
                  <div>
                    <h4 className='text-sm font-semibold mb-2'>Conditions</h4>
                    <ul className='space-y-1'>
                      {workflow.conditions.map((condition, idx) => (
                        <li key={idx} className='text-sm text-muted-foreground'>
                          • {condition.type} {condition.operator} {condition.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div>
                  <h4 className='text-sm font-semibold mb-2'>Actions</h4>
                  <ul className='space-y-1'>
                    {workflow.actions.map((action, idx) => (
                      <li key={idx} className='text-sm text-muted-foreground'>
                        • {ACTION_LABELS[action.type as ActionType] || action.type}
                        {action.type === 'send_email' && action.templateId && ' (Template)'}
                        {action.type === 'schedule_email' && action.delayDays && ` (in ${action.delayDays} days)`}
                        {action.type === 'add_tag' && action.tagName && `: ${action.tagName}`}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Stats */}
                <div className='flex items-center gap-6 text-sm text-muted-foreground'>
                  <div>
                    <span className='font-medium'>Triggered:</span> {workflow.timesTriggered || 0} times
                  </div>
                  {workflow.lastTriggered && (
                    <div>
                      <span className='font-medium'>Last:</span>{' '}
                      {new Date(workflow.lastTriggered).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && workflows.length > 0 && (
        <Card className='border-dashed'>
          <CardHeader>
            <CardTitle>No workflows match your filters</CardTitle>
            <CardDescription>
              Try adjusting your filter settings
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

interface WorkflowEditorProps {
  workflow: Workflow | null;
  onClose: () => void;
}

function WorkflowEditor({ workflow, onClose }: WorkflowEditorProps) {
  const { currentUser } = useAuth();
  const { createWorkflow, updateWorkflow } = useWorkflowStore();

  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [isActive, setIsActive] = useState(workflow?.isActive ?? true);
  const [triggerType, setTriggerType] = useState<TriggerType>(
    (workflow?.trigger.type as TriggerType) || 'customer_created'
  );

  const handleSave = async () => {
    if (!currentUser || !name.trim()) return;

    const workflowData = {
      userId: currentUser.uid,
      name: name.trim(),
      description: description.trim(),
      isActive,
      category: 'communication' as WorkflowCategory,
      trigger: {
        type: triggerType,
      },
      actions: [],
    };

    try {
      if (workflow) {
        await updateWorkflow(workflow.id, workflowData);
      } else {
        await createWorkflow(workflowData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{workflow ? 'Edit Workflow' : 'Create New Workflow'}</DialogTitle>
        <DialogDescription>
          Configure when and what actions should happen automatically
        </DialogDescription>
      </DialogHeader>

      <div className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Workflow Name</Label>
          <Input
            id='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g., Welcome New Customers'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='description'>Description (Optional)</Label>
          <Textarea
            id='description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Describe what this workflow does'
            rows={2}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='trigger'>Trigger</Label>
          <Select value={triggerType} onValueChange={(value) => setTriggerType(value as TriggerType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center justify-between'>
          <Label htmlFor='active'>Start Active</Label>
          <Switch
            id='active'
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        <div className='flex gap-2 justify-end'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {workflow ? 'Update Workflow' : 'Create Workflow'}
          </Button>
        </div>
      </div>
    </>
  );
}
