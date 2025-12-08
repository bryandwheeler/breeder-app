import { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { DefaultTaskTemplate, TaskFrequency } from '@/types/task';

export function DefaultTaskTemplates() {
  const {
    defaultTemplates,
    subscribeToDefaultTemplates,
    createDefaultTemplate,
    updateDefaultTemplate,
    deleteDefaultTemplate,
  } = useTaskStore();

  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DefaultTaskTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dayOrWeek: 0,
    frequency: 'once' as TaskFrequency,
    category: 'general' as 'health' | 'training' | 'care' | 'vaccination' | 'general',
    isActive: true,
  });

  useEffect(() => {
    const unsubscribe = subscribeToDefaultTemplates();
    return unsubscribe;
  }, [subscribeToDefaultTemplates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTemplate) {
        await updateDefaultTemplate(editingTemplate.id, formData);
      } else {
        const maxSortOrder = Math.max(...defaultTemplates.map(t => t.sortOrder), 0);
        await createDefaultTemplate({
          ...formData,
          sortOrder: maxSortOrder + 1,
          createdBy: 'system',
        });
      }

      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleEdit = (template: DefaultTaskTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description,
      dayOrWeek: template.dayOrWeek,
      frequency: template.frequency,
      category: template.category,
      isActive: template.isActive,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteDefaultTemplate(id);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      title: '',
      description: '',
      dayOrWeek: 0,
      frequency: 'once',
      category: 'general',
      isActive: true,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'vaccination': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'training': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'care': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const formatDayOrWeek = (dayOrWeek: number) => {
    if (dayOrWeek <= 21) {
      return `Day ${dayOrWeek}`;
    } else {
      return `Week ${dayOrWeek}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Default Puppy Care Tasks</CardTitle>
            <CardDescription>
              Manage the default task templates that will be copied to new breeders
            </CardDescription>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {defaultTemplates.length === 0 ? (
            <p className='text-center text-muted-foreground py-8'>
              No default tasks found. Click "Add Task" to create one.
            </p>
          ) : (
            defaultTemplates.map((template) => (
              <div
                key={template.id}
                className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-start gap-3 flex-1'>
                    <GripVertical className='h-5 w-5 text-muted-foreground mt-1' />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1 flex-wrap'>
                        <h3 className='font-semibold'>{template.title}</h3>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        <Badge variant='outline'>
                          {formatDayOrWeek(template.dayOrWeek)}
                        </Badge>
                        <Badge variant='outline'>{template.frequency}</Badge>
                        {!template.isActive && (
                          <Badge variant='outline' className='text-red-600'>
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleEdit(template)}
                    >
                      <Edit2 className='h-3 w-3' />
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Task Template' : 'Add Task Template'}
            </DialogTitle>
            <DialogDescription>
              Create a default task template that will be available to all breeders
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='col-span-2'>
                <Label htmlFor='title'>Task Title</Label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder='e.g., First Deworming'
                  required
                />
              </div>

              <div className='col-span-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Detailed description of the task...'
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor='dayOrWeek'>Day/Week Number</Label>
                <Input
                  id='dayOrWeek'
                  type='number'
                  min='0'
                  value={formData.dayOrWeek}
                  onChange={(e) => setFormData({ ...formData, dayOrWeek: parseInt(e.target.value) })}
                  required
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  0-21 for days, or week number
                </p>
              </div>

              <div>
                <Label htmlFor='frequency'>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: TaskFrequency) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='once'>Once</SelectItem>
                    <SelectItem value='daily'>Daily</SelectItem>
                    <SelectItem value='weekly'>Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='category'>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='health'>Health</SelectItem>
                    <SelectItem value='vaccination'>Vaccination</SelectItem>
                    <SelectItem value='training'>Training</SelectItem>
                    <SelectItem value='care'>Care</SelectItem>
                    <SelectItem value='general'>General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='isActive'>Status</Label>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => {
                setShowDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type='submit'>
                {editingTemplate ? 'Update' : 'Create'} Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
