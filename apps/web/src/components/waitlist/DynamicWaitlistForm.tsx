import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { WaitlistFormConfig, WaitlistFormField, WaitlistEntry } from '@breeder/types';

interface DynamicWaitlistFormProps {
  config: WaitlistFormConfig;
  breederId: string;
  onSubmit: (data: Partial<WaitlistEntry>) => Promise<void>;
}

interface FormData {
  [key: string]: any;
}

interface FormErrors {
  [key: string]: string;
}

function FormField({
  field,
  value,
  onChange,
  error,
}: {
  field: WaitlistFormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'number':
        return (
          <Input
            type='number'
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            min={field.validation?.min}
            max={field.validation?.max}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type='date'
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
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
          <RadioGroup value={value || ''} onValueChange={onChange}>
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
          <div className='flex items-start space-x-2'>
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={field.id} className='font-normal leading-tight'>
              {field.label}
              {field.required && <span className='text-destructive ml-1'>*</span>}
            </Label>
          </div>
        );

      default:
        return <Input placeholder={field.placeholder} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
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
        {error && <p className='text-xs text-destructive ml-6'>{error}</p>}
      </div>
    );
  }

  return (
    <div className='space-y-1.5'>
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className='text-destructive ml-1'>*</span>}
      </Label>
      {renderField()}
      {field.helpText && (
        <p className='text-xs text-muted-foreground'>{field.helpText}</p>
      )}
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  );
}

export function DynamicWaitlistForm({ config, breederId, onSubmit }: DynamicWaitlistFormProps) {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const enabledSections = config.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const getFieldsForSection = (sectionId: string) => {
    return config.fields
      .filter((f) => f.sectionId === sectionId && f.enabled)
      .sort((a, b) => a.order - b.order);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const enabledFields = config.fields.filter((f) => f.enabled);

    for (const field of enabledFields) {
      const value = formData[field.id];

      // Check required
      if (field.required) {
        if (field.type === 'checkbox' && !value) {
          newErrors[field.id] = 'This field is required';
        } else if (field.type !== 'checkbox' && (!value || (typeof value === 'string' && !value.trim()))) {
          newErrors[field.id] = 'This field is required';
        }
      }

      // Check validation rules
      if (value && field.validation) {
        if (field.validation.minLength && typeof value === 'string' && value.length < field.validation.minLength) {
          newErrors[field.id] = `Must be at least ${field.validation.minLength} characters`;
        }
        if (field.validation.maxLength && typeof value === 'string' && value.length > field.validation.maxLength) {
          newErrors[field.id] = `Must be no more than ${field.validation.maxLength} characters`;
        }
        if (field.validation.min !== undefined && typeof value === 'number' && value < field.validation.min) {
          newErrors[field.id] = `Must be at least ${field.validation.min}`;
        }
        if (field.validation.max !== undefined && typeof value === 'number' && value > field.validation.max) {
          newErrors[field.id] = `Must be no more than ${field.validation.max}`;
        }
      }

      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Build the WaitlistEntry data from form fields
      const builtInData: Partial<WaitlistEntry> = {};
      const customFields: Record<string, any> = {};

      for (const field of config.fields.filter((f) => f.enabled)) {
        const value = formData[field.id];
        if (value === undefined || value === '') continue;

        if (field.builtIn && field.fieldKey) {
          // Map to built-in field
          (builtInData as any)[field.fieldKey] = value;
        } else if (!field.builtIn) {
          // Store as custom field
          customFields[field.id] = value;
        }
      }

      // Build the name from firstName and lastName if they exist
      if (builtInData.firstName || builtInData.lastName) {
        builtInData.name = `${builtInData.firstName || ''} ${builtInData.lastName || ''}`.trim();
      }

      const entryData: Partial<WaitlistEntry> = {
        ...builtInData,
        userId: breederId,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        formConfigId: config.id,
      };

      await onSubmit(entryData);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ _form: 'Failed to submit application. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardContent className='pt-6'>
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h2 className='text-2xl font-bold mb-2'>Application Submitted!</h2>
            <p className='text-muted-foreground'>
              {config.successMessage || 'Thank you for your application. We will review it and get back to you soon.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-8 max-w-2xl mx-auto'>
      {errors._form && (
        <div className='p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm'>
          {errors._form}
        </div>
      )}

      {enabledSections.map((section) => {
        const fields = getFieldsForSection(section.id);
        if (fields.length === 0) return null;

        // Skip co-applicants section for now (needs special handling)
        if (section.id === 'co-applicants') return null;

        return (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.description && (
                <CardDescription>{section.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 sm:grid-cols-2'>
                {fields.map((field) => {
                  // Full width for textarea, radio, and checkbox fields
                  const isFullWidth =
                    field.type === 'textarea' ||
                    field.type === 'radio' ||
                    field.type === 'checkbox';

                  return (
                    <div
                      key={field.id}
                      className={isFullWidth ? 'sm:col-span-2' : ''}
                    >
                      <FormField
                        field={field}
                        value={formData[field.id]}
                        onChange={(value) => handleFieldChange(field.id, value)}
                        error={errors[field.id]}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button type='submit' className='w-full' size='lg' disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Submitting...
          </>
        ) : (
          config.submitButtonText || 'Submit Application'
        )}
      </Button>
    </form>
  );
}
