// Public waitlist application form
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useWaitlistStore } from '@breeder/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Plus, Trash2, Instagram, Facebook, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/lib/emailjs';
import { CoApplicant, SocialMediaCommunication, WaitlistFormConfig, WaitlistEntry } from '@breeder/types';
import { DynamicWaitlistForm } from '@/components/waitlist/DynamicWaitlistForm';

export function WaitlistApplication() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { submitWaitlistApplication, loadFormConfigForPublic } = useWaitlistStore();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const inquiryId = searchParams.get('inquiryId');
  const [breederProfile, setBreederProfile] = useState<any>(null);
  const [formConfig, setFormConfig] = useState<WaitlistFormConfig | null>(null);
  const [formConfigLoading, setFormConfigLoading] = useState(true);

  // Load breeder profile and form config
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setFormConfigLoading(true);
      try {
        // Load profile and form config in parallel
        const [profileDoc, config] = await Promise.all([
          getDoc(doc(db, 'breederProfiles', userId)),
          loadFormConfigForPublic(userId),
        ]);

        if (profileDoc.exists()) {
          setBreederProfile(profileDoc.data());
        }
        setFormConfig(config);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setFormConfigLoading(false);
      }
    };
    loadData();
  }, [userId, loadFormConfigForPublic]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    preferredSex: 'either' as 'male' | 'female' | 'either',
    preferredColors: [] as string[],
    preferredSize: 'any' as 'small' | 'medium' | 'large' | 'any',
    timeline: '',
    homeOwnership: 'own' as 'own' | 'rent',
    hasYard: false,
    yardFenced: false,
    otherPets: '',
    children: false,
    childrenAges: '',
    experience: '',
    lifestyle: '',
    reason: '',
    vetReference: '',
    depositRequired: true,
  });

  // Co-applicants state (additional people on the application)
  const [coApplicants, setCoApplicants] = useState<CoApplicant[]>([]);

  // Social media communication state
  const [socialMedia, setSocialMedia] = useState<SocialMediaCommunication>({
    hasCommunicated: false,
    platform: undefined,
    instagramHandle: '',
    facebookProfile: '',
  });

  // Helper to generate unique ID for co-applicants
  const generateId = () => `co-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Add a new co-applicant
  const addCoApplicant = () => {
    setCoApplicants([
      ...coApplicants,
      {
        id: generateId(),
        name: '',
        email: '',
        phone: '',
        relationship: '',
      },
    ]);
  };

  // Remove a co-applicant
  const removeCoApplicant = (id: string) => {
    setCoApplicants(coApplicants.filter((c) => c.id !== id));
  };

  // Update a co-applicant
  const updateCoApplicant = (id: string, updates: Partial<CoApplicant>) => {
    setCoApplicants(
      coApplicants.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // Load inquiry data if inquiryId is present
  useEffect(() => {
    const loadInquiry = async () => {
      if (!inquiryId) return;

      try {
        const inquiriesRef = collection(db, 'inquiries');
        const q = query(inquiriesRef, where('__name__', '==', inquiryId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const inquiry = snapshot.docs[0].data();
          setFormData((prev) => ({
            ...prev,
            name: inquiry.name || '',
            email: inquiry.email || '',
            phone: inquiry.phone || '',
            preferredSex: inquiry.preferredSex || 'either',
            preferredColor: inquiry.preferredColor || '',
            timeline: inquiry.timeline || '',
          }));
        }
      } catch (error) {
        console.error('Error loading inquiry:', error);
      }
    };

    loadInquiry();
  }, [inquiryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();

      // Filter out empty co-applicants and validate
      const validCoApplicants = coApplicants.filter(
        (c) => c.name.trim() && c.email.trim() && c.phone.trim()
      );

      // Prepare social media data (only include if they communicated)
      const socialMediaData = socialMedia.hasCommunicated
        ? {
            hasCommunicated: true,
            platform: socialMedia.platform,
            instagramHandle: socialMedia.instagramHandle?.trim() || undefined,
            facebookProfile: socialMedia.facebookProfile?.trim() || undefined,
          }
        : { hasCommunicated: false };

      await submitWaitlistApplication({
        ...formData,
        userId,
        applicationDate: now.split('T')[0],
        submittedAt: now,
        status: 'pending',
        inquiryId: inquiryId || undefined,
        coApplicants: validCoApplicants.length > 0 ? validCoApplicants : undefined,
        socialMedia: socialMediaData,
        activityLog: [
          {
            timestamp: now,
            action: 'Application submitted',
            details: validCoApplicants.length > 0
              ? `Customer submitted waitlist application with ${validCoApplicants.length} co-applicant(s)`
              : 'Customer submitted waitlist application',
            performedBy: 'customer',
          },
        ],
      });

      // Send notification email to breeder if enabled
      if (breederProfile?.enableWaitlistNotifications !== false) {
        try {
          const publicKey = breederProfile?.emailjsPublicKey || EMAILJS_CONFIG.PUBLIC_KEY;
          const serviceId = breederProfile?.emailjsServiceId || EMAILJS_CONFIG.SERVICE_ID;
          const templateId = breederProfile?.emailjsWaitlistNotificationTemplateId;

          if (publicKey && serviceId && templateId) {
            const notificationEmail = breederProfile?.notificationEmail || breederProfile?.email;

            // Build co-applicant info string for email
            const coApplicantInfo = validCoApplicants.length > 0
              ? validCoApplicants.map((c) => `${c.name} (${c.email}, ${c.phone})${c.relationship ? ` - ${c.relationship}` : ''}`).join('; ')
              : 'None';

            // Build social media info string
            const socialMediaInfo = socialMedia.hasCommunicated
              ? [
                  socialMedia.instagramHandle ? `Instagram: ${socialMedia.instagramHandle}` : '',
                  socialMedia.facebookProfile ? `Facebook: ${socialMedia.facebookProfile}` : '',
                ].filter(Boolean).join(', ') || 'Yes (no profile provided)'
              : 'No';

            await emailjs.send(
              serviceId,
              templateId,
              {
                to_email: notificationEmail,
                to_name: breederProfile?.breederName || 'Breeder',
                customer_name: formData.name,
                customer_email: formData.email,
                customer_phone: formData.phone || 'Not provided',
                customer_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
                preferred_sex: formData.preferredSex === 'either' ? 'No preference' : formData.preferredSex,
                preferred_color: formData.preferredColors?.join(', ') || 'Not specified',
                timeline: formData.timeline || 'Not specified',
                household_type: formData.homeOwnership || 'Not specified',
                has_children: formData.children ? 'Yes' : 'No',
                children_ages: formData.childrenAges || 'N/A',
                experience: formData.experience || 'Not provided',
                lifestyle: formData.lifestyle || 'Not provided',
                reason: formData.reason || 'Not provided',
                submitted_date: new Date().toLocaleString(),
                co_applicants: coApplicantInfo,
                social_media_contact: socialMediaInfo,
              },
              publicKey
            );
          }
        } catch (emailError) {
          // Don't fail the whole submission if notification fails
          console.error('Failed to send notification email:', emailError);
        }
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for dynamic form submission
  const handleDynamicFormSubmit = async (data: Partial<WaitlistEntry>) => {
    if (!userId) throw new Error('No breeder ID');

    const now = new Date().toISOString();

    await submitWaitlistApplication({
      ...data,
      userId,
      applicationDate: now.split('T')[0],
      submittedAt: now,
      status: 'pending',
      depositRequired: true,
      activityLog: [
        {
          timestamp: now,
          action: 'Application submitted',
          details: 'Customer submitted waitlist application',
          performedBy: 'customer',
        },
      ],
    } as any);

    // Send notification email to breeder if enabled
    if (breederProfile?.enableWaitlistNotifications !== false) {
      try {
        const publicKey = breederProfile?.emailjsPublicKey || EMAILJS_CONFIG.PUBLIC_KEY;
        const serviceId = breederProfile?.emailjsServiceId || EMAILJS_CONFIG.SERVICE_ID;
        const templateId = breederProfile?.emailjsWaitlistNotificationTemplateId;

        if (publicKey && serviceId && templateId) {
          const notificationEmail = breederProfile?.notificationEmail || breederProfile?.email;

          await emailjs.send(
            serviceId,
            templateId,
            {
              to_email: notificationEmail,
              to_name: breederProfile?.breederName || 'Breeder',
              customer_name: data.name,
              customer_email: data.email,
              customer_phone: data.phone || 'Not provided',
              submitted_date: new Date().toLocaleString(),
            },
            publicKey
          );
        }
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    }

    setSubmitted(true);
  };

  // Show loading state while fetching form config
  if (formConfigLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            {formConfig?.successMessage || 'Thank you for your interest! The breeder will review your application and contact you soon.'}
          </p>
          <Button onClick={() => navigate(`/home/${userId}`)}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  // Use dynamic form if a custom config exists
  if (formConfig && userId) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Waitlist Application</h1>
            <p className="text-muted-foreground">
              Complete this application to join our waitlist for upcoming litters.
            </p>
          </div>
          <DynamicWaitlistForm
            config={formConfig}
            breederId={userId}
            onSubmit={handleDynamicFormSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2">Waitlist Application</h1>
          <p className="text-muted-foreground mb-8">
            Complete this application to join our waitlist for upcoming litters.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Co-Applicants Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Additional Contacts</h3>
                  <p className="text-sm text-muted-foreground">
                    If someone else will also be involved in caring for the puppy (spouse, partner, etc.), add them here.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCoApplicant}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Person
                </Button>
              </div>

              {coApplicants.length > 0 && (
                <div className="space-y-4">
                  {coApplicants.map((coApplicant, index) => (
                    <Card key={coApplicant.id} className="p-4 bg-muted/30">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium">
                          Additional Contact {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCoApplicant(coApplicant.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>
                            Full Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            required
                            value={coApplicant.name}
                            onChange={(e) =>
                              updateCoApplicant(coApplicant.id, { name: e.target.value })
                            }
                            placeholder="Jane Doe"
                          />
                        </div>
                        <div>
                          <Label>
                            Email Address <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="email"
                            required
                            value={coApplicant.email}
                            onChange={(e) =>
                              updateCoApplicant(coApplicant.id, { email: e.target.value })
                            }
                            placeholder="jane@example.com"
                          />
                        </div>
                        <div>
                          <Label>
                            Phone Number <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="tel"
                            required
                            value={coApplicant.phone}
                            onChange={(e) =>
                              updateCoApplicant(coApplicant.id, { phone: e.target.value })
                            }
                            placeholder="(555) 987-6543"
                          />
                        </div>
                        <div>
                          <Label>Relationship</Label>
                          <Select
                            value={coApplicant.relationship || ''}
                            onValueChange={(value) =>
                              updateCoApplicant(coApplicant.id, { relationship: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="partner">Partner</SelectItem>
                              <SelectItem value="family_member">Family Member</SelectItem>
                              <SelectItem value="co-owner">Co-Owner</SelectItem>
                              <SelectItem value="roommate">Roommate</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Social Media Communication */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Media Communication</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasCommunicated"
                  checked={socialMedia.hasCommunicated}
                  onCheckedChange={(checked) =>
                    setSocialMedia({
                      ...socialMedia,
                      hasCommunicated: checked as boolean,
                      platform: checked ? socialMedia.platform : undefined,
                    })
                  }
                />
                <Label htmlFor="hasCommunicated" className="text-sm">
                  Have you been communicating with us via Instagram or Facebook?
                </Label>
              </div>

              {socialMedia.hasCommunicated && (
                <div className="pl-6 space-y-4 border-l-2 border-muted ml-2">
                  <div>
                    <Label>Which platform(s)?</Label>
                    <Select
                      value={socialMedia.platform || ''}
                      onValueChange={(value: 'instagram' | 'facebook' | 'both') =>
                        setSocialMedia({ ...socialMedia, platform: value })
                      }
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(socialMedia.platform === 'instagram' || socialMedia.platform === 'both') && (
                    <div>
                      <Label htmlFor="instagramHandle" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram Handle (optional)
                      </Label>
                      <Input
                        id="instagramHandle"
                        value={socialMedia.instagramHandle || ''}
                        onChange={(e) =>
                          setSocialMedia({ ...socialMedia, instagramHandle: e.target.value })
                        }
                        placeholder="@yourusername"
                        className="w-full md:w-64"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This helps us link your conversation history
                      </p>
                    </div>
                  )}

                  {(socialMedia.platform === 'facebook' || socialMedia.platform === 'both') && (
                    <div>
                      <Label htmlFor="facebookProfile" className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook Profile Name (optional)
                      </Label>
                      <Input
                        id="facebookProfile"
                        value={socialMedia.facebookProfile || ''}
                        onChange={(e) =>
                          setSocialMedia({ ...socialMedia, facebookProfile: e.target.value })
                        }
                        placeholder="Your name on Facebook"
                        className="w-full md:w-64"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This helps us link your conversation history
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Puppy Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Puppy Preferences</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredSex">Preferred Sex</Label>
                  <Select
                    value={formData.preferredSex}
                    onValueChange={(value: 'male' | 'female' | 'either') =>
                      setFormData({ ...formData, preferredSex: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="either">No Preference</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preferredSize">Preferred Size</Label>
                  <Select
                    value={formData.preferredSize}
                    onValueChange={(value: 'small' | 'medium' | 'large' | 'any') =>
                      setFormData({ ...formData, preferredSize: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Size</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="timeline">When are you hoping to get a puppy?</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (ASAP)</SelectItem>
                      <SelectItem value="1-3 months">1-3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="6-12 months">6-12 months</SelectItem>
                      <SelectItem value="1+ year">1+ year</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Home & Lifestyle */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Home & Lifestyle</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homeOwnership">Home Ownership</Label>
                  <Select
                    value={formData.homeOwnership}
                    onValueChange={(value: 'own' | 'rent') =>
                      setFormData({ ...formData, homeOwnership: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="own">Own</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-6 pt-8">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasYard"
                      checked={formData.hasYard}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasYard: checked as boolean })
                      }
                    />
                    <Label htmlFor="hasYard">Has Yard</Label>
                  </div>

                  {formData.hasYard && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="yardFenced"
                        checked={formData.yardFenced}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, yardFenced: checked as boolean })
                        }
                      />
                      <Label htmlFor="yardFenced">Fenced</Label>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="otherPets">Other Pets (if any)</Label>
                  <Textarea
                    id="otherPets"
                    rows={2}
                    value={formData.otherPets}
                    onChange={(e) => setFormData({ ...formData, otherPets: e.target.value })}
                    placeholder="Describe any other pets you have..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="children"
                    checked={formData.children}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, children: checked as boolean })
                    }
                  />
                  <Label htmlFor="children">I have children</Label>
                </div>

                {formData.children && (
                  <div>
                    <Label htmlFor="childrenAges">Children's Ages</Label>
                    <Input
                      id="childrenAges"
                      value={formData.childrenAges}
                      onChange={(e) => setFormData({ ...formData, childrenAges: e.target.value })}
                      placeholder="e.g., 5, 8, 12"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="lifestyle">Lifestyle</Label>
                <Select
                  value={formData.lifestyle}
                  onValueChange={(value) => setFormData({ ...formData, lifestyle: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your lifestyle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_active">Very Active (hiking, running daily)</SelectItem>
                    <SelectItem value="active">Active (regular walks, some outdoor activities)</SelectItem>
                    <SelectItem value="moderate">Moderate (daily walks, occasional activities)</SelectItem>
                    <SelectItem value="relaxed">Relaxed (indoor lifestyle, occasional walks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Experience & Motivation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Experience & Motivation</h3>

              <div>
                <Label htmlFor="experience">
                  Dog Ownership Experience <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="experience"
                  rows={3}
                  required
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="Tell us about your experience with dogs..."
                />
              </div>

              <div>
                <Label htmlFor="reason">
                  Why do you want this breed? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  rows={4}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="What attracts you to this breed? What are your expectations?"
                />
              </div>

              <div>
                <Label htmlFor="vetReference">Veterinarian Reference (optional)</Label>
                <Input
                  id="vetReference"
                  value={formData.vetReference}
                  onChange={(e) => setFormData({ ...formData, vetReference: e.target.value })}
                  placeholder="Vet clinic name and phone number"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-6 border-t">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/home/${userId}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
