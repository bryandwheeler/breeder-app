import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { WeeklyAvailability, DayOfWeek, TimeSlot, DAYS_OF_WEEK } from '@breeder/types';

interface AvailabilityEditorProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
}

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    );
  }
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function AvailabilityEditor({ availability, onChange }: AvailabilityEditorProps) {
  const toggleDay = (day: DayOfWeek) => {
    const updated = { ...availability };
    if (updated[day].length > 0) {
      updated[day] = [];
    } else {
      updated[day] = [{ start: '09:00', end: '17:00' }];
    }
    onChange(updated);
  };

  const addTimeRange = (day: DayOfWeek) => {
    const updated = { ...availability };
    const lastSlot = updated[day][updated[day].length - 1];
    const newStart = lastSlot ? lastSlot.end : '09:00';
    const [h] = newStart.split(':').map(Number);
    const newEnd = `${String(Math.min(h + 4, 23)).padStart(2, '0')}:00`;
    updated[day] = [...updated[day], { start: newStart, end: newEnd }];
    onChange(updated);
  };

  const updateTimeRange = (day: DayOfWeek, index: number, updates: Partial<TimeSlot>) => {
    const updated = { ...availability };
    updated[day] = [...updated[day]];
    updated[day][index] = { ...updated[day][index], ...updates };
    onChange(updated);
  };

  const removeTimeRange = (day: DayOfWeek, index: number) => {
    const updated = { ...availability };
    updated[day] = updated[day].filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Weekly Availability</Label>
        <p className="text-sm text-muted-foreground">
          Set the hours you're available for appointments each day
        </p>
      </div>

      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const isEnabled = availability[day].length > 0;

          return (
            <div
              key={day}
              className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3 min-w-[140px]">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleDay(day)}
                />
                <span className={`text-sm font-medium ${!isEnabled ? 'text-muted-foreground' : ''}`}>
                  {DAY_LABELS[day]}
                </span>
              </div>

              {isEnabled ? (
                <div className="flex-1 space-y-2">
                  {availability[day].map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={slot.start}
                        onValueChange={(v) => updateTimeRange(day, index, { start: v })}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue>{formatTime(slot.start)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {formatTime(t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">to</span>
                      <Select
                        value={slot.end}
                        onValueChange={(v) => updateTimeRange(day, index, { end: v })}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue>{formatTime(slot.end)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.filter((t) => t > slot.start).map((t) => (
                            <SelectItem key={t} value={t}>
                              {formatTime(t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availability[day].length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTimeRange(day, index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => addTimeRange(day)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add time range
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unavailable</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
