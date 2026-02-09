import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { AppointmentType } from '@breeder/types';

interface AppointmentTypeEditorProps {
  appointmentTypes: AppointmentType[];
  onChange: (types: AppointmentType[]) => void;
}

const COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

export function AppointmentTypeEditor({ appointmentTypes, onChange }: AppointmentTypeEditorProps) {
  const addType = () => {
    const newType: AppointmentType = {
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      duration: 30,
      bufferBefore: 0,
      bufferAfter: 15,
      color: COLORS[appointmentTypes.length % COLORS.length],
      enabled: true,
      order: appointmentTypes.length,
    };
    onChange([...appointmentTypes, newType]);
  };

  const updateType = (index: number, updates: Partial<AppointmentType>) => {
    const updated = [...appointmentTypes];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeType = (index: number) => {
    onChange(appointmentTypes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Appointment Types</Label>
          <p className="text-sm text-muted-foreground">
            Configure the types of appointments customers can book
          </p>
        </div>
        <Button size="sm" onClick={addType}>
          <Plus className="h-4 w-4 mr-1" />
          Add Type
        </Button>
      </div>

      {appointmentTypes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No appointment types configured. Add one to get started.
        </p>
      )}

      {appointmentTypes.map((type, index) => (
        <Card key={type.id} className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: type.color }}
              />
              <span className="font-medium text-sm">
                {type.name || 'New Appointment Type'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={type.enabled}
                onCheckedChange={(checked) => updateType(index, { enabled: checked })}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeType(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={type.name}
                onChange={(e) => updateType(index, { name: e.target.value })}
                placeholder="e.g., Puppy Visit"
              />
            </div>
            <div>
              <Label>Duration</Label>
              <Select
                value={String(type.duration)}
                onValueChange={(v) => updateType(index, { duration: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={type.description}
              onChange={(e) => updateType(index, { description: e.target.value })}
              placeholder="Brief description shown to customers"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Buffer Before (min)</Label>
              <Select
                value={String(type.bufferBefore)}
                onValueChange={(v) => updateType(index, { bufferBefore: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Buffer After (min)</Label>
              <Select
                value={String(type.bufferAfter)}
                onValueChange={(v) => updateType(index, { bufferAfter: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-1 mt-1 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      type.color === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateType(index, { color })}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
