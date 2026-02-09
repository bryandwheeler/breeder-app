import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, ChevronLeft, Check, Loader2 } from 'lucide-react';
import {
  SchedulingSettings,
  AppointmentType,
  Booking,
  DAYS_OF_WEEK,
} from '@breeder/types';
import { BreederProfile } from '@breeder/types';

type Step = 'type' | 'datetime' | 'info' | 'success';

export function BookAppointment() {
  const { userId } = useParams<{ userId: string }>();
  const [settings, setSettings] = useState<SchedulingSettings | null>(null);
  const [breederProfile, setBreederProfile] = useState<BreederProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('type');

  // Selection state
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        // Load scheduling settings
        const settingsRef = doc(db, 'schedulingSettings', userId);
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as SchedulingSettings);
        }

        // Load breeder profile
        const profileQuery = query(
          collection(db, 'breederProfiles'),
          where('userId', '==', userId)
        );
        const profileSnap = await getDocs(profileQuery);
        if (!profileSnap.empty) {
          setBreederProfile({
            id: profileSnap.docs[0].id,
            ...profileSnap.docs[0].data(),
          } as BreederProfile);
        }
      } catch (error) {
        console.error('Error loading booking page:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const loadSlots = async (date: string) => {
    if (!userId || !selectedType || !settings) return;

    setSlotsLoading(true);
    setAvailableSlots([]);

    try {
      const dateObj = new Date(date + 'T00:00:00');
      const dayIndex = (dateObj.getDay() + 6) % 7; // Monday = 0
      const dayName = DAYS_OF_WEEK[dayIndex];
      const dayAvail = settings.weeklyAvailability[dayName] || [];

      if (dayAvail.length === 0) {
        setSlotsLoading(false);
        return;
      }

      // Get existing bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('breederId', '==', userId),
        where('status', 'in', ['pending', 'confirmed'])
      );
      const bookingsSnap = await getDocs(bookingsQuery);
      const existingBookings = bookingsSnap.docs
        .map((d) => d.data() as Booking)
        .filter((b) => {
          const bDate = b.startTime.split('T')[0];
          return bDate === date;
        });

      const now = new Date();
      const minTime = new Date(
        now.getTime() + (settings.minAdvanceBooking || 24) * 3600000
      );
      const interval = settings.slotInterval || 30;
      const slots: string[] = [];

      for (const range of dayAvail) {
        const [sh, sm] = range.start.split(':').map(Number);
        const [eh, em] = range.end.split(':').map(Number);

        let slotTime = new Date(dateObj);
        slotTime.setHours(sh, sm, 0, 0);

        const rangeEnd = new Date(dateObj);
        rangeEnd.setHours(eh, em, 0, 0);

        while (slotTime < rangeEnd) {
          const slotEnd = new Date(
            slotTime.getTime() + selectedType.duration * 60000
          );
          if (slotEnd > rangeEnd) break;

          if (slotTime > minTime) {
            const hasConflict = existingBookings.some((b) => {
              const bStart = new Date(b.startTime);
              const bEnd = new Date(b.endTime);
              const bufferedStart = new Date(
                bStart.getTime() - (selectedType.bufferBefore || 0) * 60000
              );
              const bufferedEnd = new Date(
                bEnd.getTime() + (selectedType.bufferAfter || 0) * 60000
              );
              return slotTime < bufferedEnd && slotEnd > bufferedStart;
            });

            if (!hasConflict) {
              slots.push(
                slotTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              );
            }
          }

          slotTime = new Date(slotTime.getTime() + interval * 60000);
        }
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot('');
    loadSlots(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedType || !selectedDate || !selectedSlot) return;

    setSubmitting(true);

    try {
      // Parse selected time
      const [timePart, period] = selectedSlot.split(' ');
      const [h, m] = timePart.split(':').map(Number);
      let hour24 = h;
      if (period === 'PM' && h !== 12) hour24 += 12;
      if (period === 'AM' && h === 12) hour24 = 0;

      const startTime = new Date(selectedDate + 'T00:00:00');
      startTime.setHours(hour24, m, 0, 0);
      const endTime = new Date(
        startTime.getTime() + selectedType.duration * 60000
      );

      await addDoc(collection(db, 'bookings'), {
        breederId: userId,
        customerName,
        customerEmail,
        customerPhone,
        appointmentTypeId: selectedType.id,
        appointmentTypeName: selectedType.name,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: selectedType.duration,
        status: 'pending',
        notes: notes || '',
        bookedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

      setStep('success');
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute min/max dates for the date picker
  const today = new Date();
  const minDate = new Date(
    today.getTime() + (settings?.minAdvanceBooking || 24) * 3600000
  )
    .toISOString()
    .split('T')[0];
  const maxDate = new Date(
    today.getTime() + (settings?.maxAdvanceBooking || 30) * 86400000
  )
    .toISOString()
    .split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings || !settings.bookingPageEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Booking Unavailable</h2>
          <p className="text-muted-foreground">
            Online booking is not currently available for this breeder.
          </p>
        </Card>
      </div>
    );
  }

  const enabledTypes = settings.appointmentTypes.filter((t) => t.enabled);
  const breederName =
    breederProfile?.kennelName || breederProfile?.breederName || 'Breeder';

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {settings.bookingPageTitle || `Book with ${breederName}`}
          </h1>
          {settings.bookingPageDescription && (
            <p className="text-muted-foreground mt-1">
              {settings.bookingPageDescription}
            </p>
          )}
        </div>

        {/* Step 1: Select Appointment Type */}
        {step === 'type' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Select Appointment Type</h2>
            {enabledTypes.map((type) => (
              <Card
                key={type.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedType?.id === type.id
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => {
                  setSelectedType(type);
                  setSelectedDate('');
                  setSelectedSlot('');
                  setAvailableSlots([]);
                  setStep('datetime');
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: type.color }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{type.name}</h3>
                    {type.description && (
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-sm text-primary">
                      <Clock className="h-3 w-3" />
                      {type.duration} minutes
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 'datetime' && selectedType && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('type')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to appointment types
            </Button>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedType.color }}
                />
                <span className="font-medium">{selectedType.name}</span>
                <span className="text-sm text-muted-foreground">
                  ({selectedType.duration} min)
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Select Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={minDate}
                    max={maxDate}
                  />
                </div>

                {selectedDate && (
                  <div>
                    <Label>Available Times</Label>
                    {slotsLoading ? (
                      <div className="flex items-center gap-2 py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Loading available times...
                        </span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        No available times on this date. Please select another date.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot}
                            variant={selectedSlot === slot ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setStep('info');
                            }}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Customer Info */}
        {step === 'info' && selectedType && selectedSlot && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('datetime')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to date & time
            </Button>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedType.color }}
                />
                <span className="font-medium">{selectedType.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at {selectedSlot}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information..."
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Appointment Booked!</h2>
            <p className="text-muted-foreground">
              {settings.confirmationMessage ||
                'Your appointment has been booked! We will send you a confirmation email shortly.'}
            </p>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          Powered by BreederPro
        </div>
      </div>
    </div>
  );
}
