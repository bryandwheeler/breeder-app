import { useState, useEffect } from 'react';
import { useSchedulingStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
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
import { Save, Copy, Check, ExternalLink, Code, Calendar } from 'lucide-react';
import {
  SchedulingSettings,
  AppointmentType,
  WeeklyAvailability,
  DEFAULT_WEEKLY_AVAILABILITY,
  DEFAULT_APPOINTMENT_TYPES,
} from '@breeder/types';
import { AppointmentTypeEditor } from './AppointmentTypeEditor';
import { AvailabilityEditor } from './AvailabilityEditor';
import { BookingEmbedDialog } from './BookingEmbedDialog';

export function SchedulingSettingsPanel() {
  const { currentUser } = useAuth();
  const { settings, loading, saveSettings } = useSchedulingStore();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<SchedulingSettings>>({
    bookingPageEnabled: false,
    bookingPageTitle: '',
    bookingPageDescription: '',
    confirmationMessage: 'Your appointment has been booked! We will send you a confirmation email shortly.',
    weeklyAvailability: DEFAULT_WEEKLY_AVAILABILITY,
    appointmentTypes: DEFAULT_APPOINTMENT_TYPES,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    minAdvanceBooking: 24,
    maxAdvanceBooking: 30,
    slotInterval: 30,
    googleCalendarEnabled: false,
    googleCalendarId: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        bookingPageEnabled: settings.bookingPageEnabled,
        bookingPageTitle: settings.bookingPageTitle,
        bookingPageDescription: settings.bookingPageDescription,
        confirmationMessage: settings.confirmationMessage,
        weeklyAvailability: settings.weeklyAvailability,
        appointmentTypes: settings.appointmentTypes,
        timezone: settings.timezone,
        minAdvanceBooking: settings.minAdvanceBooking,
        maxAdvanceBooking: settings.maxAdvanceBooking,
        slotInterval: settings.slotInterval as 15 | 30 | 60,
        googleCalendarEnabled: settings.googleCalendarEnabled,
        googleCalendarId: settings.googleCalendarId,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(formData);
      alert('Scheduling settings saved!');
    } catch (error) {
      console.error('Error saving scheduling settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const bookingUrl = currentUser
    ? `${window.location.origin}/book/${currentUser.uid}`
    : '';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading scheduling settings...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable + URL */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Booking Page</Label>
            <p className="text-sm text-muted-foreground">
              Allow customers to book appointments online
            </p>
          </div>
          <Switch
            checked={formData.bookingPageEnabled || false}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, bookingPageEnabled: checked })
            }
          />
        </div>

        {formData.bookingPageEnabled && bookingUrl && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <ExternalLink className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate">{bookingUrl}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEmbedOpen(true)}>
                <Code className="h-3 w-3 mr-1" />
                Embed
              </Button>
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </a>
            </div>
          </div>
        )}

        <div>
          <Label>Booking Page Title</Label>
          <Input
            value={formData.bookingPageTitle || ''}
            onChange={(e) =>
              setFormData({ ...formData, bookingPageTitle: e.target.value })
            }
            placeholder="e.g., Schedule a Visit"
          />
        </div>

        <div>
          <Label>Booking Page Description</Label>
          <Textarea
            value={formData.bookingPageDescription || ''}
            onChange={(e) =>
              setFormData({ ...formData, bookingPageDescription: e.target.value })
            }
            placeholder="Brief description shown on your booking page"
            rows={2}
          />
        </div>

        <div>
          <Label>Confirmation Message</Label>
          <Textarea
            value={formData.confirmationMessage || ''}
            onChange={(e) =>
              setFormData({ ...formData, confirmationMessage: e.target.value })
            }
            placeholder="Message shown after a customer books"
            rows={2}
          />
        </div>
      </Card>

      {/* Appointment Types */}
      <Card className="p-6">
        <AppointmentTypeEditor
          appointmentTypes={formData.appointmentTypes || []}
          onChange={(types) => setFormData({ ...formData, appointmentTypes: types })}
        />
      </Card>

      {/* Weekly Availability */}
      <Card className="p-6">
        <AvailabilityEditor
          availability={formData.weeklyAvailability || DEFAULT_WEEKLY_AVAILABILITY}
          onChange={(avail) => setFormData({ ...formData, weeklyAvailability: avail })}
        />
      </Card>

      {/* Booking Rules */}
      <Card className="p-6 space-y-4">
        <div>
          <Label className="text-base font-semibold">Booking Rules</Label>
          <p className="text-sm text-muted-foreground">
            Configure booking constraints and time slot settings
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Slot Interval</Label>
            <Select
              value={String(formData.slotInterval || 30)}
              onValueChange={(v) =>
                setFormData({ ...formData, slotInterval: Number(v) as 15 | 30 | 60 })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Every 15 min</SelectItem>
                <SelectItem value="30">Every 30 min</SelectItem>
                <SelectItem value="60">Every 60 min</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              How often time slots start
            </p>
          </div>

          <div>
            <Label>Min Advance Booking</Label>
            <Select
              value={String(formData.minAdvanceBooking || 24)}
              onValueChange={(v) =>
                setFormData({ ...formData, minAdvanceBooking: Number(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">1 day</SelectItem>
                <SelectItem value="48">2 days</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">1 week</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Earliest a customer can book
            </p>
          </div>

          <div>
            <Label>Max Advance Booking</Label>
            <Select
              value={String(formData.maxAdvanceBooking || 30)}
              onValueChange={(v) =>
                setFormData({ ...formData, maxAdvanceBooking: Number(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="14">2 weeks</SelectItem>
                <SelectItem value="30">1 month</SelectItem>
                <SelectItem value="60">2 months</SelectItem>
                <SelectItem value="90">3 months</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Furthest out a customer can book
            </p>
          </div>
        </div>

        <div>
          <Label>Timezone</Label>
          <Input
            value={formData.timezone || ''}
            onChange={(e) =>
              setFormData({ ...formData, timezone: e.target.value })
            }
            placeholder="America/New_York"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Auto-detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </p>
        </div>
      </Card>

      {/* Google Calendar - Phase 2 placeholder */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Google Calendar Sync
            </Label>
            <p className="text-sm text-muted-foreground">
              Sync bookings with your Google Calendar
            </p>
          </div>
          <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Google Calendar integration will allow two-way sync between your bookings
          and Google Calendar. Stay tuned for this feature.
        </p>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Scheduling Settings'}
        </Button>
      </div>

      <BookingEmbedDialog open={embedOpen} setOpen={setEmbedOpen} />
    </div>
  );
}
