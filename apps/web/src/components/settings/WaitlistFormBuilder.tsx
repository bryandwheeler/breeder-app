import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  Trash2,
  Eye,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWaitlistStore } from '@breeder/firebase';
import {
  WaitlistFormConfig,
  WaitlistFormSection,
  WaitlistFormField,
  createDefaultFormConfig,
} from '@breeder/types';
import { WaitlistFieldEditor } from './WaitlistFieldEditor';
import { WaitlistFormPreview } from './WaitlistFormPreview';
import { useToast } from '@/hooks/use-toast';

interface SortableFieldItemProps {
  field: WaitlistFormField;
  onEdit: (field: WaitlistFormField) => void;
  onToggle: (field: WaitlistFormField, enabled: boolean) => void;
  onDelete?: (field: WaitlistFormField) => void;
}

function SortableFieldItem({ field, onEdit, onToggle, onDelete }: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldTypeLabels: Record<string, string> = {
    text: 'Text',
    textarea: 'Long Text',
    email: 'Email',
    phone: 'Phone',
    select: 'Dropdown',
    checkbox: 'Checkbox',
    radio: 'Radio',
    date: 'Date',
    number: 'Number',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-md border bg-background ${
        !field.enabled ? 'opacity-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className='cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded'
      >
        <GripVertical className='h-4 w-4 text-muted-foreground' />
      </button>

      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <span className='font-medium text-sm truncate'>{field.label}</span>
          {field.required && (
            <span className='text-destructive text-xs'>*</span>
          )}
          <Badge variant='outline' className='text-xs'>
            {fieldTypeLabels[field.type] || field.type}
          </Badge>
          {field.builtIn && (
            <Badge variant='secondary' className='text-xs'>
              Built-in
            </Badge>
          )}
        </div>
      </div>

      <div className='flex items-center gap-1'>
        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => onEdit(field)}>
          <Edit2 className='h-3.5 w-3.5' />
        </Button>
        {!field.builtIn && onDelete && (
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-destructive hover:text-destructive'
            onClick={() => onDelete(field)}
          >
            <Trash2 className='h-3.5 w-3.5' />
          </Button>
        )}
        <Switch
          checked={field.enabled}
          onCheckedChange={(checked) => onToggle(field, checked)}
        />
      </div>
    </div>
  );
}

interface SortableSectionProps {
  section: WaitlistFormSection;
  fields: WaitlistFormField[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onEditSection: (section: WaitlistFormSection) => void;
  onToggleSection: (section: WaitlistFormSection, enabled: boolean) => void;
  onEditField: (field: WaitlistFormField) => void;
  onToggleField: (field: WaitlistFormField, enabled: boolean) => void;
  onDeleteField: (field: WaitlistFormField) => void;
  onAddField: (sectionId: string) => void;
  onFieldsReorder: (sectionId: string, oldIndex: number, newIndex: number) => void;
}

function SortableSection({
  section,
  fields,
  isOpen,
  onToggleOpen,
  onEditSection,
  onToggleSection,
  onEditField,
  onToggleField,
  onDeleteField,
  onAddField,
  onFieldsReorder,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      onFieldsReorder(section.id, oldIndex, newIndex);
    }
  };

  const sectionFields = fields.filter((f) => f.sectionId === section.id).sort((a, b) => a.order - b.order);

  return (
    <div ref={setNodeRef} style={style} className={`border rounded-lg ${!section.enabled ? 'opacity-50' : ''}`}>
      <Collapsible open={isOpen} onOpenChange={onToggleOpen}>
        <div className='flex items-center gap-2 p-3 bg-muted/50'>
          <button
            {...attributes}
            {...listeners}
            className='cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded'
          >
            <GripVertical className='h-4 w-4 text-muted-foreground' />
          </button>

          <CollapsibleTrigger asChild>
            <Button variant='ghost' size='sm' className='p-1 h-auto'>
              {isOpen ? (
                <ChevronDown className='h-4 w-4' />
              ) : (
                <ChevronRight className='h-4 w-4' />
              )}
            </Button>
          </CollapsibleTrigger>

          <div className='flex-1 min-w-0'>
            <span className='font-medium'>{section.title}</span>
            <span className='text-xs text-muted-foreground ml-2'>
              ({sectionFields.filter((f) => f.enabled).length} fields)
            </span>
          </div>

          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => onEditSection(section)}
            >
              <Edit2 className='h-3.5 w-3.5' />
            </Button>
            <Switch
              checked={section.enabled}
              onCheckedChange={(checked) => onToggleSection(section, checked)}
            />
          </div>
        </div>

        <CollapsibleContent>
          <div className='p-3 space-y-2'>
            {section.description && (
              <p className='text-sm text-muted-foreground mb-3'>{section.description}</p>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFieldDragEnd}
            >
              <SortableContext items={sectionFields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                {sectionFields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    onEdit={onEditField}
                    onToggle={onToggleField}
                    onDelete={!field.builtIn ? onDeleteField : undefined}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button
              variant='outline'
              size='sm'
              className='w-full mt-2'
              onClick={() => onAddField(section.id)}
            >
              <Plus className='h-3.5 w-3.5 mr-1' />
              Add Custom Field
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function WaitlistFormBuilder() {
  const { currentUser } = useAuth();
  const { formConfig, formConfigLoading, loadFormConfig, saveFormConfig } = useWaitlistStore();
  const { toast } = useToast();

  const [config, setConfig] = useState<WaitlistFormConfig | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<WaitlistFormField | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [addingToSection, setAddingToSection] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      loadFormConfig(currentUser.uid);
    }
  }, [currentUser?.uid, loadFormConfig]);

  useEffect(() => {
    if (formConfig) {
      setConfig(formConfig);
      // Open all sections by default
      setOpenSections(new Set(formConfig.sections.map((s) => s.id)));
    }
  }, [formConfig]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateConfig = useCallback((updates: Partial<WaitlistFormConfig>) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
    setHasChanges(true);
  }, []);

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!config || !over || active.id === over.id) return;

    const oldIndex = config.sections.findIndex((s) => s.id === active.id);
    const newIndex = config.sections.findIndex((s) => s.id === over.id);

    const newSections = arrayMove(config.sections, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i,
    }));

    updateConfig({ sections: newSections });
  };

  const handleFieldsReorder = (sectionId: string, oldIndex: number, newIndex: number) => {
    if (!config) return;

    const sectionFields = config.fields
      .filter((f) => f.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);

    const reorderedFields = arrayMove(sectionFields, oldIndex, newIndex).map((f, i) => ({
      ...f,
      order: i,
    }));

    const otherFields = config.fields.filter((f) => f.sectionId !== sectionId);
    updateConfig({ fields: [...otherFields, ...reorderedFields] });
  };

  const handleToggleSection = (section: WaitlistFormSection, enabled: boolean) => {
    if (!config) return;
    const newSections = config.sections.map((s) =>
      s.id === section.id ? { ...s, enabled } : s
    );
    updateConfig({ sections: newSections });
  };

  const handleToggleField = (field: WaitlistFormField, enabled: boolean) => {
    if (!config) return;
    const newFields = config.fields.map((f) => (f.id === field.id ? { ...f, enabled } : f));
    updateConfig({ fields: newFields });
  };

  const handleEditField = (field: WaitlistFormField) => {
    setEditingField(field);
    setIsAddingField(false);
  };

  const handleAddField = (sectionId: string) => {
    setAddingToSection(sectionId);
    setIsAddingField(true);
    setEditingField(null);
  };

  const handleSaveField = (field: WaitlistFormField) => {
    if (!config) return;

    if (isAddingField) {
      // Adding new field
      const sectionFields = config.fields.filter((f) => f.sectionId === addingToSection);
      const newField = {
        ...field,
        sectionId: addingToSection,
        order: sectionFields.length,
      };
      updateConfig({ fields: [...config.fields, newField] });
    } else {
      // Updating existing field
      const newFields = config.fields.map((f) => (f.id === field.id ? field : f));
      updateConfig({ fields: newFields });
    }

    setEditingField(null);
    setIsAddingField(false);
  };

  const handleDeleteField = (field: WaitlistFormField) => {
    if (!config || field.builtIn) return;
    const newFields = config.fields.filter((f) => f.id !== field.id);
    updateConfig({ fields: newFields });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await saveFormConfig(config);
      setHasChanges(false);
      toast({
        title: 'Form saved',
        description: 'Your waitlist form configuration has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save form configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!currentUser?.uid) return;
    const defaultConfig = createDefaultFormConfig(currentUser.uid);
    setConfig(defaultConfig);
    setHasChanges(true);
    setConfirmReset(false);
  };

  if (formConfigLoading || !config) {
    return (
      <Card>
        <CardContent className='py-8'>
          <div className='text-center text-muted-foreground'>Loading form configuration...</div>
        </CardContent>
      </Card>
    );
  }

  const sortedSections = [...config.sections].sort((a, b) => a.order - b.order);

  return (
    <>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <CardTitle>Waitlist Application Form</CardTitle>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={() => setShowPreview(true)}>
              <Eye className='h-4 w-4 mr-1' />
              Preview
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setConfirmReset(true)}
              disabled={saving}
            >
              <RotateCcw className='h-4 w-4 mr-1' />
              Reset
            </Button>
            <Button size='sm' onClick={handleSave} disabled={!hasChanges || saving}>
              <Save className='h-4 w-4 mr-1' />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='submitButtonText'>Submit Button Text</Label>
              <Input
                id='submitButtonText'
                value={config.submitButtonText || ''}
                onChange={(e) => updateConfig({ submitButtonText: e.target.value })}
                placeholder='Submit Application'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='successMessage'>Success Message</Label>
              <Input
                id='successMessage'
                value={config.successMessage || ''}
                onChange={(e) => updateConfig({ successMessage: e.target.value })}
                placeholder='Thank you for applying!'
              />
            </div>
          </div>

          <div className='pt-4'>
            <h3 className='text-sm font-medium mb-3'>Form Sections</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              Drag sections to reorder. Toggle switches to enable/disable sections and fields.
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext
                items={sortedSections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='space-y-3'>
                  {sortedSections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      fields={config.fields}
                      isOpen={openSections.has(section.id)}
                      onToggleOpen={() => {
                        const newOpen = new Set(openSections);
                        if (newOpen.has(section.id)) {
                          newOpen.delete(section.id);
                        } else {
                          newOpen.add(section.id);
                        }
                        setOpenSections(newOpen);
                      }}
                      onEditSection={(s) => {
                        // TODO: Add section editor dialog
                      }}
                      onToggleSection={handleToggleSection}
                      onEditField={handleEditField}
                      onToggleField={handleToggleField}
                      onDeleteField={handleDeleteField}
                      onAddField={handleAddField}
                      onFieldsReorder={handleFieldsReorder}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </CardContent>
      </Card>

      <WaitlistFieldEditor
        open={!!editingField || isAddingField}
        onOpenChange={(open) => {
          if (!open) {
            setEditingField(null);
            setIsAddingField(false);
          }
        }}
        field={editingField}
        onSave={handleSaveField}
        isNew={isAddingField}
      />

      <WaitlistFormPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        config={config}
      />

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Form Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all sections and fields to their default settings. Any custom fields
              will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset to Default</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
