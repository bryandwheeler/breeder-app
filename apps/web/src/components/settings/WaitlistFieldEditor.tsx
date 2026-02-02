import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  WaitlistFormField,
  WaitlistFieldType,
  WaitlistFormFieldOption,
} from '@breeder/types';

interface WaitlistFieldEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: WaitlistFormField | null;
  onSave: (field: WaitlistFormField) => void;
  isNew?: boolean;
}

const FIELD_TYPES: { value: WaitlistFieldType; label: string }[] = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkbox' },
];

export function WaitlistFieldEditor({
  open,
  onOpenChange,
  field,
  onSave,
  isNew = false,
}: WaitlistFieldEditorProps) {
  const [editedField, setEditedField] = useState<WaitlistFormField | null>(null);

  useEffect(() => {
    if (field) {
      setEditedField({ ...field });
    } else if (isNew) {
      setEditedField({
        id: `custom_${Date.now()}`,
        type: 'text',
        label: '',
        placeholder: '',
        helpText: '',
        required: false,
        enabled: true,
        order: 0,
        sectionId: '',
        builtIn: false,
      });
    }
  }, [field, isNew, open]);

  const handleSave = () => {
    if (editedField && editedField.label.trim()) {
      onSave(editedField);
      onOpenChange(false);
    }
  };

  const updateField = (updates: Partial<WaitlistFormField>) => {
    if (editedField) {
      setEditedField({ ...editedField, ...updates });
    }
  };

  const addOption = () => {
    if (editedField) {
      const newOption: WaitlistFormFieldOption = {
        value: `option_${(editedField.options?.length || 0) + 1}`,
        label: '',
      };
      updateField({
        options: [...(editedField.options || []), newOption],
      });
    }
  };

  const updateOption = (index: number, updates: Partial<WaitlistFormFieldOption>) => {
    if (editedField?.options) {
      const newOptions = [...editedField.options];
      newOptions[index] = { ...newOptions[index], ...updates };
      updateField({ options: newOptions });
    }
  };

  const removeOption = (index: number) => {
    if (editedField?.options) {
      const newOptions = editedField.options.filter((_, i) => i !== index);
      updateField({ options: newOptions });
    }
  };

  const needsOptions = editedField?.type === 'select' || editedField?.type === 'radio';

  if (!editedField) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add Custom Field' : 'Edit Field'}</DialogTitle>
          <DialogDescription>
            {editedField.builtIn
              ? 'Customize the label and settings for this field'
              : 'Configure the field properties'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='label'>Field Label</Label>
            <Input
              id='label'
              value={editedField.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder='e.g., Your Question'
            />
          </div>

          {!editedField.builtIn && (
            <div className='space-y-2'>
              <Label htmlFor='type'>Field Type</Label>
              <Select
                value={editedField.type}
                onValueChange={(value: WaitlistFieldType) => {
                  updateField({ type: value });
                  // Clear options when switching away from select/radio
                  if (value !== 'select' && value !== 'radio') {
                    updateField({ options: undefined });
                  } else if (!editedField.options?.length) {
                    // Add default options for select/radio
                    updateField({
                      options: [
                        { value: 'option_1', label: 'Option 1' },
                        { value: 'option_2', label: 'Option 2' },
                      ],
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select field type' />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {editedField.type !== 'checkbox' && (
            <div className='space-y-2'>
              <Label htmlFor='placeholder'>Placeholder Text</Label>
              <Input
                id='placeholder'
                value={editedField.placeholder || ''}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                placeholder='Shown when field is empty'
              />
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='helpText'>Help Text</Label>
            <Textarea
              id='helpText'
              value={editedField.helpText || ''}
              onChange={(e) => updateField({ helpText: e.target.value })}
              placeholder='Additional instructions for the applicant'
              rows={2}
            />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='required'>Required</Label>
            <Switch
              id='required'
              checked={editedField.required}
              onCheckedChange={(checked) => updateField({ required: checked })}
            />
          </div>

          {needsOptions && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label>Options</Label>
                <Button type='button' variant='outline' size='sm' onClick={addOption}>
                  <Plus className='h-3 w-3 mr-1' />
                  Add Option
                </Button>
              </div>
              <div className='space-y-2'>
                {editedField.options?.map((option, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <GripVertical className='h-4 w-4 text-muted-foreground cursor-move' />
                    <Input
                      value={option.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        updateOption(index, {
                          label,
                          value: label.toLowerCase().replace(/\s+/g, '_'),
                        });
                      }}
                      placeholder={`Option ${index + 1}`}
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeOption(index)}
                      disabled={editedField.options!.length <= 2}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!editedField.builtIn && (
            <div className='space-y-3 pt-2 border-t'>
              <Label className='text-sm font-medium'>Validation (Optional)</Label>
              <div className='grid grid-cols-2 gap-3'>
                {(editedField.type === 'text' || editedField.type === 'textarea') && (
                  <>
                    <div className='space-y-1'>
                      <Label htmlFor='minLength' className='text-xs'>
                        Min Length
                      </Label>
                      <Input
                        id='minLength'
                        type='number'
                        value={editedField.validation?.minLength || ''}
                        onChange={(e) =>
                          updateField({
                            validation: {
                              ...editedField.validation,
                              minLength: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder='0'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='maxLength' className='text-xs'>
                        Max Length
                      </Label>
                      <Input
                        id='maxLength'
                        type='number'
                        value={editedField.validation?.maxLength || ''}
                        onChange={(e) =>
                          updateField({
                            validation: {
                              ...editedField.validation,
                              maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder='500'
                      />
                    </div>
                  </>
                )}
                {editedField.type === 'number' && (
                  <>
                    <div className='space-y-1'>
                      <Label htmlFor='min' className='text-xs'>
                        Min Value
                      </Label>
                      <Input
                        id='min'
                        type='number'
                        value={editedField.validation?.min || ''}
                        onChange={(e) =>
                          updateField({
                            validation: {
                              ...editedField.validation,
                              min: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder='0'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='max' className='text-xs'>
                        Max Value
                      </Label>
                      <Input
                        id='max'
                        type='number'
                        value={editedField.validation?.max || ''}
                        onChange={(e) =>
                          updateField({
                            validation: {
                              ...editedField.validation,
                              max: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder='100'
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!editedField.label.trim()}>
            {isNew ? 'Add Field' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
