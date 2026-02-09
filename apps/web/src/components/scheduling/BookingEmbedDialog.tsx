import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Code } from 'lucide-react';
import { auth } from '@breeder/firebase';

interface BookingEmbedDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function BookingEmbedDialog({ open, setOpen }: BookingEmbedDialogProps) {
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState(auth.currentUser?.uid || '');

  useEffect(() => {
    if (auth.currentUser) {
      setUserId(auth.currentUser.uid);
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
      else setUserId('');
    });
    return unsubscribe;
  }, []);

  const effectiveUserId = userId || 'YOUR_USER_ID';

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const embedCode = `<!-- Appointment Booking Form - Embed Code -->
<div id="booking-form-container"></div>

<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  import { getFirestore, collection, addDoc, doc, getDoc, getDocs, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

  const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const BREEDER_ID = '${effectiveUserId}';

  async function loadBookingForm() {
    const container = document.getElementById('booking-form-container');

    // Load scheduling settings
    const settingsRef = doc(db, 'schedulingSettings', BREEDER_ID);
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists() || !settingsSnap.data().bookingPageEnabled) {
      container.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280;">Booking is currently unavailable.</div>';
      return;
    }

    const settings = settingsSnap.data();
    const enabledTypes = (settings.appointmentTypes || []).filter(t => t.enabled);

    container.innerHTML = \`
      <style>
        .booking-form { max-width: 600px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif; }
        .booking-form h2 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .booking-form .subtitle { color: #6b7280; margin-bottom: 1.5rem; }
        .booking-form .type-card { border: 2px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .booking-form .type-card:hover { border-color: #3b82f6; background: #eff6ff; }
        .booking-form .type-card.selected { border-color: #3b82f6; background: #eff6ff; }
        .booking-form .type-name { font-weight: 600; }
        .booking-form .type-desc { font-size: 0.875rem; color: #6b7280; }
        .booking-form .type-duration { font-size: 0.75rem; color: #3b82f6; margin-top: 0.25rem; }
        .booking-form .form-group { margin-bottom: 1rem; }
        .booking-form label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; }
        .booking-form .required { color: #ef4444; }
        .booking-form input, .booking-form select, .booking-form textarea { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; box-sizing: border-box; }
        .booking-form textarea { min-height: 80px; resize: vertical; }
        .booking-form button.submit { background: #3b82f6; color: white; padding: 0.75rem 2rem; border: none; border-radius: 0.375rem; font-weight: 600; cursor: pointer; font-size: 1rem; width: 100%; }
        .booking-form button.submit:hover { background: #2563eb; }
        .booking-form button.submit:disabled { background: #9ca3af; cursor: not-allowed; }
        .booking-form .success { text-align: center; padding: 3rem; }
        .booking-form .success-icon { font-size: 4rem; color: #10b981; margin-bottom: 1rem; }
        .booking-form .error { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 1rem; border-radius: 0.375rem; margin-bottom: 1rem; }
        .booking-form .date-slots { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        .booking-form .slot-btn { padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.25rem; background: white; cursor: pointer; font-size: 0.875rem; }
        .booking-form .slot-btn:hover { border-color: #3b82f6; }
        .booking-form .slot-btn.selected { background: #3b82f6; color: white; border-color: #3b82f6; }
        .booking-form .step { display: none; }
        .booking-form .step.active { display: block; }
      </style>

      <div class="booking-form">
        <h2>\${settings.bookingPageTitle || 'Book an Appointment'}</h2>
        <p class="subtitle">\${settings.bookingPageDescription || 'Select an appointment type and pick a time.'}</p>
        <div id="error-box"></div>

        <div id="step-types" class="step active">
          <h3 style="font-weight:600;margin-bottom:0.75rem;">Select Appointment Type</h3>
          \${enabledTypes.map(t => \`
            <div class="type-card" data-type-id="\${t.id}" data-type-name="\${t.name}" data-duration="\${t.duration}" onclick="selectType(this)">
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <div style="width:12px;height:12px;border-radius:50%;background:\${t.color}"></div>
                <span class="type-name">\${t.name}</span>
              </div>
              <div class="type-desc">\${t.description}</div>
              <div class="type-duration">\${t.duration} minutes</div>
            </div>
          \`).join('')}
        </div>

        <div id="step-datetime" class="step">
          <h3 style="font-weight:600;margin-bottom:0.75rem;">Select Date & Time</h3>
          <div class="form-group">
            <label>Date <span class="required">*</span></label>
            <input type="date" id="booking-date" onchange="loadSlots()" min="\${new Date().toISOString().split('T')[0]}">
          </div>
          <div id="slots-container"></div>
        </div>

        <div id="step-info" class="step">
          <h3 style="font-weight:600;margin-bottom:0.75rem;">Your Information</h3>
          <form id="booking-form" onsubmit="submitBooking(event)">
            <div class="form-group">
              <label>Full Name <span class="required">*</span></label>
              <input type="text" id="customer-name" required>
            </div>
            <div class="form-group">
              <label>Email <span class="required">*</span></label>
              <input type="email" id="customer-email" required>
            </div>
            <div class="form-group">
              <label>Phone <span class="required">*</span></label>
              <input type="tel" id="customer-phone" required>
            </div>
            <div class="form-group">
              <label>Notes (optional)</label>
              <textarea id="customer-notes" placeholder="Any additional information..."></textarea>
            </div>
            <button type="submit" class="submit" id="submit-btn">Book Appointment</button>
          </form>
        </div>

        <div id="step-success" class="step">
          <div class="success">
            <div class="success-icon">&#10003;</div>
            <h2>Appointment Booked!</h2>
            <p>\${settings.confirmationMessage || 'Your appointment has been booked!'}</p>
          </div>
        </div>
      </div>
    \`;

    // State
    let selectedType = null;
    let selectedSlot = null;
    let selectedDate = null;

    window.selectType = function(el) {
      document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      selectedType = { id: el.dataset.typeId, name: el.dataset.typeName, duration: parseInt(el.dataset.duration) };
      showStep('step-datetime');
    };

    window.loadSlots = async function() {
      const dateInput = document.getElementById('booking-date');
      selectedDate = dateInput.value;
      if (!selectedDate || !selectedType) return;

      const slotsContainer = document.getElementById('slots-container');
      slotsContainer.innerHTML = '<p style="color:#6b7280;">Loading available slots...</p>';

      // Compute slots client-side
      const date = new Date(selectedDate + 'T00:00:00');
      const dayIndex = (date.getDay() + 6) % 7;
      const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
      const dayAvail = settings.weeklyAvailability[days[dayIndex]] || [];

      if (dayAvail.length === 0) {
        slotsContainer.innerHTML = '<p style="color:#6b7280;">No availability on this date.</p>';
        return;
      }

      // Get existing bookings for this date
      const startOfDay = new Date(selectedDate + 'T00:00:00').toISOString();
      const endOfDay = new Date(selectedDate + 'T23:59:59').toISOString();
      const bookingsSnap = await getDocs(query(
        collection(db, 'bookings'),
        where('breederId', '==', BREEDER_ID),
        where('status', 'in', ['pending', 'confirmed'])
      ));
      const existingBookings = bookingsSnap.docs.map(d => d.data()).filter(b => {
        return b.startTime >= startOfDay && b.startTime <= endOfDay;
      });

      const now = new Date();
      const minTime = new Date(now.getTime() + (settings.minAdvanceBooking || 24) * 3600000);
      const interval = settings.slotInterval || 30;
      const slots = [];

      for (const range of dayAvail) {
        const [sh, sm] = range.start.split(':').map(Number);
        const [eh, em] = range.end.split(':').map(Number);
        let slotTime = new Date(date); slotTime.setHours(sh, sm, 0, 0);
        const rangeEnd = new Date(date); rangeEnd.setHours(eh, em, 0, 0);

        while (slotTime < rangeEnd) {
          const slotEnd = new Date(slotTime.getTime() + selectedType.duration * 60000);
          if (slotEnd > rangeEnd) break;
          if (slotTime > minTime) {
            const conflict = existingBookings.some(b => {
              const bs = new Date(b.startTime), be = new Date(b.endTime);
              return slotTime < be && slotEnd > bs;
            });
            if (!conflict) {
              slots.push(slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
            }
          }
          slotTime = new Date(slotTime.getTime() + interval * 60000);
        }
      }

      if (slots.length === 0) {
        slotsContainer.innerHTML = '<p style="color:#6b7280;">No available slots on this date.</p>';
        return;
      }

      slotsContainer.innerHTML = '<label>Available Times</label><div class="date-slots">' +
        slots.map(s => \`<button type="button" class="slot-btn" onclick="selectSlot(this, '\${s}')">\${s}</button>\`).join('') +
        '</div>';
    };

    window.selectSlot = function(el, time) {
      document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
      el.classList.add('selected');
      selectedSlot = time;
      showStep('step-info');
    };

    window.submitBooking = async function(e) {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      btn.disabled = true; btn.textContent = 'Booking...';
      document.getElementById('error-box').innerHTML = '';

      try {
        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;
        const phone = document.getElementById('customer-phone').value;
        const notes = document.getElementById('customer-notes').value;

        // Parse selected time
        const dateStr = selectedDate;
        const [time, period] = selectedSlot.split(' ');
        const [h, m] = time.split(':').map(Number);
        let hour24 = h;
        if (period === 'PM' && h !== 12) hour24 += 12;
        if (period === 'AM' && h === 12) hour24 = 0;

        const startTime = new Date(dateStr + 'T00:00:00');
        startTime.setHours(hour24, m, 0, 0);
        const endTime = new Date(startTime.getTime() + selectedType.duration * 60000);

        await addDoc(collection(db, 'bookings'), {
          breederId: BREEDER_ID,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
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

        showStep('step-success');
      } catch (err) {
        console.error('Booking error:', err);
        document.getElementById('error-box').innerHTML = '<div class="error">Failed to book. Please try again.</div>';
        btn.disabled = false; btn.textContent = 'Book Appointment';
      }
    };

    function showStep(id) {
      document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }
  }

  loadBookingForm();
</script>`;

  const iframeCode = `<!-- Appointment Booking - iframe Embed -->
<iframe
  src="${window.location.origin}/book/${effectiveUserId}"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; max-width: 700px; margin: 0 auto; display: block;"
></iframe>`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Embed Booking Form on External Website
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy and paste one of these code snippets into your external website to allow
            visitors to book appointments directly.
          </p>

          <Tabs defaultValue="standalone" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standalone">Standalone Form (Recommended)</TabsTrigger>
              <TabsTrigger value="iframe">iframe Embed</TabsTrigger>
            </TabsList>

            <TabsContent value="standalone" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Complete Booking Form with Firebase</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(embedCode)}
                  >
                    {copied ? (
                      <><Check className="h-4 w-4 mr-2" />Copied!</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-2" />Copy Code</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Self-contained booking form that submits directly to Firebase. Works on any website.
                </p>
              </div>

              <Textarea
                value={embedCode}
                readOnly
                className="font-mono text-xs h-[400px]"
                onClick={(e) => e.currentTarget.select()}
              />
            </TabsContent>

            <TabsContent value="iframe" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">iframe Embed Code</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(iframeCode)}
                  >
                    {copied ? (
                      <><Check className="h-4 w-4 mr-2" />Copied!</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-2" />Copy Code</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Simple iframe that loads the booking page from your app. Easier to maintain.
                </p>
              </div>

              <Textarea
                value={iframeCode}
                readOnly
                className="font-mono text-xs h-[150px]"
                onClick={(e) => e.currentTarget.select()}
              />

              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <p className="text-xs">
                  <strong>Note:</strong> The iframe loads from:{' '}
                  <code className="bg-background px-1 py-0.5 rounded">
                    {window.location.origin}/book/{effectiveUserId}
                  </code>
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.open(`/book/${effectiveUserId}`, '_blank')}>
              Preview Booking Page
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
