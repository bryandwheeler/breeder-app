import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Code } from 'lucide-react';
import { auth } from '@/lib/firebase';

interface WaitlistEmbedDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function WaitlistEmbedDialog({ open, setOpen }: WaitlistEmbedDialogProps) {
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState(auth.currentUser?.uid || '');

  useEffect(() => {
    // Immediately set userId if already authenticated
    if (auth.currentUser) {
      setUserId(auth.currentUser.uid);
    }

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId('');
      }
    });
    return unsubscribe;
  }, []);

  // Compute these values based on current userId state
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Use current userId or placeholder
  const effectiveUserId = userId || 'YOUR_USER_ID';

  const embedCode = `<!-- Waitlist Application Form - Embed Code -->
<div id="waitlist-form-container"></div>

<script type="module">
  // Import Firebase
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

  // Firebase configuration
  const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // User ID for this breeder
  const BREEDER_USER_ID = '${effectiveUserId}';

  // Create form HTML
  const formHTML = \`
    <style>
      .waitlist-form {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .waitlist-form h2 {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }
      .waitlist-form p {
        color: #6b7280;
        margin-bottom: 2rem;
      }
      .waitlist-form .form-section {
        margin-bottom: 2rem;
      }
      .waitlist-form .form-section h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }
      .waitlist-form .form-group {
        margin-bottom: 1rem;
      }
      .waitlist-form label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }
      .waitlist-form .required {
        color: #ef4444;
      }
      .waitlist-form input,
      .waitlist-form select,
      .waitlist-form textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
      }
      .waitlist-form textarea {
        min-height: 100px;
        resize: vertical;
      }
      .waitlist-form .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
      }
      .waitlist-form .checkbox-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .waitlist-form .checkbox-group input[type="checkbox"] {
        width: auto;
      }
      .waitlist-form button {
        background: #3b82f6;
        color: white;
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 0.375rem;
        font-weight: 600;
        cursor: pointer;
        font-size: 1rem;
      }
      .waitlist-form button:hover {
        background: #2563eb;
      }
      .waitlist-form button:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }
      .waitlist-form .success-message {
        text-align: center;
        padding: 3rem;
      }
      .waitlist-form .success-icon {
        font-size: 4rem;
        color: #10b981;
        margin-bottom: 1rem;
      }
      .waitlist-form .error-message {
        background: #fef2f2;
        border: 1px solid #fca5a5;
        color: #991b1b;
        padding: 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
      }
    </style>

    <div class="waitlist-form">
      <div id="form-content">
        <h2>Waitlist Application</h2>
        <p>Complete this application to join our waitlist for upcoming litters.</p>

        <div id="error-container"></div>

        <form id="waitlist-application-form">
          <!-- Contact Information -->
          <div class="form-section">
            <h3>Contact Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Full Name <span class="required">*</span></label>
                <input type="text" name="name" required>
              </div>
              <div class="form-group">
                <label>Email Address <span class="required">*</span></label>
                <input type="email" name="email" required>
              </div>
              <div class="form-group">
                <label>Phone Number <span class="required">*</span></label>
                <input type="tel" name="phone" required>
              </div>
              <div class="form-group">
                <label>Street Address</label>
                <input type="text" name="address">
              </div>
              <div class="form-group">
                <label>City</label>
                <input type="text" name="city">
              </div>
              <div class="form-group">
                <label>State</label>
                <input type="text" name="state">
              </div>
            </div>
          </div>

          <!-- Puppy Preferences -->
          <div class="form-section">
            <h3>Puppy Preferences</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Preferred Sex</label>
                <select name="preferredSex">
                  <option value="either">No Preference</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div class="form-group">
                <label>Preferred Size</label>
                <select name="preferredSize">
                  <option value="any">Any Size</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div class="form-group">
                <label>When are you hoping to get a puppy?</label>
                <select name="timeline">
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediate (ASAP)</option>
                  <option value="1-3 months">1-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="1+ year">1+ year</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Home & Lifestyle -->
          <div class="form-section">
            <h3>Home & Lifestyle</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Home Ownership</label>
                <select name="homeOwnership">
                  <option value="own">Own</option>
                  <option value="rent">Rent</option>
                </select>
              </div>
              <div class="form-group">
                <label>Lifestyle</label>
                <select name="lifestyle">
                  <option value="">Select your lifestyle</option>
                  <option value="very_active">Very Active (hiking, running daily)</option>
                  <option value="active">Active (regular walks, some outdoor activities)</option>
                  <option value="moderate">Moderate (daily walks, occasional activities)</option>
                  <option value="relaxed">Relaxed (indoor lifestyle, occasional walks)</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <div class="checkbox-group">
                <input type="checkbox" id="hasYard" name="hasYard">
                <label for="hasYard">Has Yard</label>
              </div>
            </div>
            <div class="form-group">
              <div class="checkbox-group">
                <input type="checkbox" id="yardFenced" name="yardFenced">
                <label for="yardFenced">Yard is Fenced</label>
              </div>
            </div>
            <div class="form-group">
              <label>Other Pets (if any)</label>
              <textarea name="otherPets"></textarea>
            </div>
            <div class="form-group">
              <div class="checkbox-group">
                <input type="checkbox" id="children" name="children">
                <label for="children">I have children</label>
              </div>
            </div>
            <div class="form-group">
              <label>Children's Ages (if applicable)</label>
              <input type="text" name="childrenAges" placeholder="e.g., 5, 8, 12">
            </div>
          </div>

          <!-- Experience & Motivation -->
          <div class="form-section">
            <h3>Experience & Motivation</h3>
            <div class="form-group">
              <label>Dog Ownership Experience <span class="required">*</span></label>
              <textarea name="experience" required></textarea>
            </div>
            <div class="form-group">
              <label>Why do you want this breed? <span class="required">*</span></label>
              <textarea name="reason" required></textarea>
            </div>
            <div class="form-group">
              <label>Veterinarian Reference (optional)</label>
              <input type="text" name="vetReference" placeholder="Vet clinic name and phone number">
            </div>
          </div>

          <button type="submit" id="submit-button">Submit Application</button>
        </form>
      </div>
    </div>
  \`;

  // Insert form HTML
  document.getElementById('waitlist-form-container').innerHTML = formHTML;

  // Handle form submission
  document.getElementById('waitlist-application-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitButton = document.getElementById('submit-button');
    const errorContainer = document.getElementById('error-container');

    // Disable button
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    errorContainer.innerHTML = '';

    try {
      // Get form data
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address') || '',
        city: formData.get('city') || '',
        state: formData.get('state') || '',
        preferredSex: formData.get('preferredSex') || 'either',
        preferredSize: formData.get('preferredSize') || 'any',
        timeline: formData.get('timeline') || '',
        homeOwnership: formData.get('homeOwnership') || 'own',
        hasYard: formData.get('hasYard') === 'on',
        yardFenced: formData.get('yardFenced') === 'on',
        otherPets: formData.get('otherPets') || '',
        children: formData.get('children') === 'on',
        childrenAges: formData.get('childrenAges') || '',
        experience: formData.get('experience'),
        lifestyle: formData.get('lifestyle') || '',
        reason: formData.get('reason'),
        vetReference: formData.get('vetReference') || '',
        userId: BREEDER_USER_ID,
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        depositRequired: true,
        depositPaid: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Submit to Firestore
      await addDoc(collection(db, 'waitlist'), data);

      // Show success message
      document.getElementById('form-content').innerHTML = \`
        <div class="success-message">
          <div class="success-icon">✓</div>
          <h2>Application Submitted!</h2>
          <p>Thank you for your interest! The breeder will review your application and contact you soon.</p>
        </div>
      \`;

    } catch (error) {
      console.error('Error submitting application:', error);
      errorContainer.innerHTML = \`
        <div class="error-message">
          Failed to submit application. Please try again or contact the breeder directly.
        </div>
      \`;
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Application';
    }
  });
</script>`;

  const iframeCode = `<!-- Waitlist Application Form - iframe Embed -->
<iframe
  src="${window.location.origin}/waitlist-apply/${effectiveUserId}"
  width="100%"
  height="1200"
  frameborder="0"
  style="border: none; max-width: 900px; margin: 0 auto; display: block;"
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
            Embed Waitlist Form on External Website
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy and paste one of these code snippets into your external website to allow
            visitors to submit waitlist applications directly to your Firebase backend.
          </p>

          <Tabs defaultValue="standalone" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standalone">Standalone Form (Recommended)</TabsTrigger>
              <TabsTrigger value="iframe">iframe Embed</TabsTrigger>
            </TabsList>

            <TabsContent value="standalone" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Complete Form with Firebase Integration</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(embedCode)}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This code includes the complete form with styling and Firebase integration.
                  It will submit applications directly to your Firebase database from any domain.
                </p>
              </div>

              <Textarea
                value={embedCode}
                readOnly
                className="font-mono text-xs h-[400px]"
                onClick={(e) => e.currentTarget.select()}
              />

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                <h4 className="text-sm font-semibold">Important: Update Firebase Security Rules</h4>
                <p className="text-xs text-muted-foreground">
                  To allow submissions from external domains, you need to update your Firestore security rules:
                </p>
                <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /waitlist/{document} {
      // Allow public to create waitlist entries
      allow create: if request.resource.data.userId != null;

      // Only allow authenticated users to read/update/delete
      allow read, update, delete: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}`}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Also add your external domain to Firebase Authentication's authorized domains.
                </p>
              </div>
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
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Simple iframe embed that loads your hosted application form. Easier to maintain
                  but requires the form to be accessible at the URL below.
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
                  <strong>Note:</strong> The iframe method loads the form from your deployed application
                  at: <code className="bg-background px-1 py-0.5 rounded">{window.location.origin}/waitlist-apply/{effectiveUserId}</code>
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.open(`/waitlist-apply/${effectiveUserId}`, '_blank')}>
              Preview Form
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
