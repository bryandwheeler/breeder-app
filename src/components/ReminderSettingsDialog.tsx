import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getReminderSettings, setReminderSettings } from '@/lib/reminderService';
import { isEmailConfigured } from '@/lib/emailService';
import { AlertCircle } from 'lucide-react';

interface ReminderSettingsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function ReminderSettingsDialog({ open, setOpen }: ReminderSettingsDialogProps) {
  const [settings, setSettings] = useState(getReminderSettings());
  const emailConfigured = isEmailConfigured();

  useEffect(() => {
    if (open) {
      setSettings(getReminderSettings());
    }
  }, [open]);

  const handleSave = () => {
    setReminderSettings(settings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reminder Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!emailConfigured && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>Configure email settings first to enable automated reminders.</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Automated Reminders</Label>
              <p className="text-sm text-muted-foreground">Send email reminders automatically</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
              disabled={!emailConfigured}
            />
          </div>

          <div className="space-y-2">
            <Label>Pickup Reminder (days before)</Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={settings.pickupReminderDays}
              onChange={(e) => setSettings({ ...settings, pickupReminderDays: parseInt(e.target.value) || 0 })}
              disabled={!settings.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Send reminder to buyers this many days before pickup. Set to 0 to disable.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Deposit Reminders</Label>
              <p className="text-sm text-muted-foreground">Remind buyers with unpaid deposits</p>
            </div>
            <Switch
              checked={settings.depositReminderEnabled}
              onCheckedChange={(depositReminderEnabled) => setSettings({ ...settings, depositReminderEnabled })}
              disabled={!settings.enabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Heat Cycle Reminder (days before)</Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={settings.heatCycleReminderDays}
              onChange={(e) => setSettings({ ...settings, heatCycleReminderDays: parseInt(e.target.value) || 0 })}
              disabled={!settings.enabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Vaccination Reminder (days before)</Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={settings.vaccinationReminderDays}
              onChange={(e) => setSettings({ ...settings, vaccinationReminderDays: parseInt(e.target.value) || 0 })}
              disabled={!settings.enabled}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
