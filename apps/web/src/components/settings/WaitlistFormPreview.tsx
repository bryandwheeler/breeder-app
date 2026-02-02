import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WaitlistFormConfig, WaitlistFormField } from '@breeder/types';

interface WaitlistFormPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: WaitlistFormConfig;
}

function FieldPreview({ field }: { field: WaitlistFormField }) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            disabled
          />
        );

      case 'number':
        return (
          <Input
            type='number'
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            disabled
          />
        );

      case 'date':
        return <Input type='date' disabled />;

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            rows={3}
            disabled
          />
        );

      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup disabled>
            {field.options?.map((option) => (
              <div key={option.value} className='flex items-center space-x-2'>
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label htmlFor={`${field.id}-${option.value}`} className='font-normal'>
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className='flex items-center space-x-2'>
            <Checkbox id={field.id} disabled />
            <Label htmlFor={field.id} className='font-normal'>
              {field.label}
            </Label>
          </div>
        );

      default:
        return <Input placeholder={field.placeholder} disabled />;
    }
  };

  // For checkbox, the label is inline
  if (field.type === 'checkbox') {
    return (
      <div className='space-y-1'>
        {renderField()}
        {field.helpText && (
          <p className='text-xs text-muted-foreground ml-6'>{field.helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-1.5'>
      <Label>
        {field.label}
        {field.required && <span className='text-destructive ml-1'>*</span>}
      </Label>
      {renderField()}
      {field.helpText && (
        <p className='text-xs text-muted-foreground'>{field.helpText}</p>
      )}
    </div>
  );
}

export function WaitlistFormPreview({ open, onOpenChange, config }: WaitlistFormPreviewProps) {
  const enabledSections = config.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const getFieldsForSection = (sectionId: string) => {
    return config.fields
      .filter((f) => f.sectionId === sectionId && f.enabled)
      .sort((a, b) => a.order - b.order);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
        </DialogHeader>

        <ScrollArea className='max-h-[70vh] pr-4'>
          <div className='space-y-8 py-4'>
            {enabledSections.map((section) => {
              const fields = getFieldsForSection(section.id);
              if (fields.length === 0) return null;

              return (
                <div key={section.id} className='space-y-4'>
                  <div>
                    <h3 className='text-lg font-semibold'>{section.title}</h3>
                    {section.description && (
                      <p className='text-sm text-muted-foreground'>{section.description}</p>
                    )}
                  </div>

                  <div className='grid gap-4 sm:grid-cols-2'>
                    {fields.map((field) => {
                      // Full width for textarea fields
                      const isFullWidth =
                        field.type === 'textarea' ||
                        field.type === 'radio' ||
                        field.type === 'checkbox';

                      return (
                        <div
                          key={field.id}
                          className={isFullWidth ? 'sm:col-span-2' : ''}
                        >
                          <FieldPreview field={field} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className='pt-4 border-t'>
              <Button className='w-full' disabled>
                {config.submitButtonText || 'Submit Application'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
