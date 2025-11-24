// Public waitlist application form
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWaitlistStore } from '@/store/waitlistStore';
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
import { CheckCircle } from 'lucide-react';

export function WaitlistApplication() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const submitWaitlistApplication = useWaitlistStore((state) => state.submitWaitlistApplication);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      await submitWaitlistApplication({
        ...formData,
        userId,
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for your interest! The breeder will review your application and contact you soon.
          </p>
          <Button onClick={() => navigate(`/home/${userId}`)}>Back to Home</Button>
        </Card>
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
              </div>
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
