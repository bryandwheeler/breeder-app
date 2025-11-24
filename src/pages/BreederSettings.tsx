// Breeder profile and website settings
import { useState, useEffect } from 'react';
import { useBreederStore } from '@/store/breederStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Save, Eye } from 'lucide-react';
import { BreederProfile } from '@/types/dog';
import { CareScheduleEditor } from '@/components/CareScheduleEditor';
import { Combobox } from '@/components/ui/combobox';
import { DOG_BREEDS } from '@/data/dogBreeds';

export function BreederSettings() {
  const { currentUser } = useAuth();
  const { profile, createProfile, updateProfile, loading } = useBreederStore();
  const [formData, setFormData] = useState<Partial<BreederProfile>>({
    breederName: '',
    kennelName: '',
    tagline: '',
    about: '',
    philosophy: '',
    experience: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    primaryBreed: '',
    otherBreeds: [],
    akc: '',
    otherOrganizations: [],
    healthTestingDescription: '',
    healthGuarantee: '',
    guardianProgramAvailable: false,
    guardianProgramDescription: '',
    acceptingInquiries: true,
    showPricing: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      if (profile) {
        await updateProfile(formData);
      } else {
        await createProfile(formData as Omit<BreederProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>);
      }
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const publicUrl = currentUser ? `${window.location.origin}/home/${currentUser.uid}` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Breeder Website Settings</h1>
          <p className="text-muted-foreground">Manage your public breeder profile and website</p>
        </div>
        <div className="flex gap-3">
          {profile && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Public Site
              </Button>
            </a>
          )}
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {publicUrl && (
        <Card className="p-4 bg-primary/5">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Your Public URL:</span>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {publicUrl}
            </a>
          </div>
        </Card>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="contact">Contact & Social</TabsTrigger>
          <TabsTrigger value="about">About & Philosophy</TabsTrigger>
          <TabsTrigger value="health">Health Testing</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="care">Care Schedule</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Info */}
        <TabsContent value="basic">
          <Card className="p-6 space-y-6">
            <div>
              <Label htmlFor="breederName">Breeder Name *</Label>
              <Input
                id="breederName"
                value={formData.breederName}
                onChange={(e) => setFormData({ ...formData, breederName: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            <div>
              <Label htmlFor="kennelName">Kennel Name</Label>
              <Input
                id="kennelName"
                value={formData.kennelName}
                onChange={(e) => setFormData({ ...formData, kennelName: e.target.value })}
                placeholder="e.g., Expert Breeder Kennel"
              />
            </div>

            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="A short, catchy tagline for your program"
              />
            </div>

            <div>
              <Label htmlFor="primaryBreed">Primary Breed *</Label>
              <Combobox
                options={DOG_BREEDS.map((breed) => ({ value: breed, label: breed }))}
                value={formData.primaryBreed}
                onValueChange={(value) => setFormData({ ...formData, primaryBreed: value })}
                placeholder="Select a breed..."
                searchPlaceholder="Search breeds..."
                emptyText="No breeds found."
              />
            </div>
          </Card>
        </TabsContent>

        {/* Contact & Social */}
        <TabsContent value="contact">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-semibold">Contact Information</h3>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <h3 className="text-lg font-semibold mt-8">Social Media</h3>

            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="https://instagram.com/yourpage"
              />
            </div>

            <div>
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="https://twitter.com/yourpage"
              />
            </div>

            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
          </Card>
        </TabsContent>

        {/* About & Philosophy */}
        <TabsContent value="about">
          <Card className="p-6 space-y-6">
            <div>
              <Label htmlFor="about">About Us *</Label>
              <Textarea
                id="about"
                rows={6}
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                placeholder="Tell visitors about your breeding program, your passion for dogs, and what makes you different..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the first thing visitors will see. Make it compelling!
              </p>
            </div>

            <div>
              <Label htmlFor="philosophy">Breeding Philosophy</Label>
              <Textarea
                id="philosophy"
                rows={4}
                value={formData.philosophy}
                onChange={(e) => setFormData({ ...formData, philosophy: e.target.value })}
                placeholder="Describe your breeding philosophy, ethics, and what you prioritize..."
              />
            </div>

            <div>
              <Label htmlFor="experience">Experience</Label>
              <Textarea
                id="experience"
                rows={4}
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="How long have you been breeding? What's your background and expertise?"
              />
            </div>

            <div>
              <Label>Guardian Program</Label>
              <div className="flex items-center gap-2 mb-2">
                <Switch
                  checked={formData.guardianProgramAvailable || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, guardianProgramAvailable: checked })
                  }
                />
                <span className="text-sm">We offer a Guardian Home program</span>
              </div>
              {formData.guardianProgramAvailable && (
                <Textarea
                  rows={3}
                  value={formData.guardianProgramDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianProgramDescription: e.target.value })
                  }
                  placeholder="Describe your Guardian Home program..."
                />
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Health Testing */}
        <TabsContent value="health">
          <Card className="p-6 space-y-6">
            <div>
              <Label htmlFor="healthTesting">Health Testing Commitment</Label>
              <Textarea
                id="healthTesting"
                rows={6}
                value={formData.healthTestingDescription}
                onChange={(e) =>
                  setFormData({ ...formData, healthTestingDescription: e.target.value })
                }
                placeholder="Describe what health testing you perform on your dogs, why it's important, and your commitment to breeding healthy dogs..."
              />
            </div>

            <div>
              <Label htmlFor="healthGuarantee">Health Guarantee</Label>
              <Textarea
                id="healthGuarantee"
                rows={4}
                value={formData.healthGuarantee}
                onChange={(e) => setFormData({ ...formData, healthGuarantee: e.target.value })}
                placeholder="Describe your health guarantee policy..."
              />
            </div>
          </Card>
        </TabsContent>

        {/* Credentials */}
        <TabsContent value="credentials">
          <Card className="p-6 space-y-6">
            <div>
              <Label htmlFor="akc">AKC Status</Label>
              <Input
                id="akc"
                value={formData.akc}
                onChange={(e) => setFormData({ ...formData, akc: e.target.value })}
                placeholder="e.g., AKC Breeder of Merit"
              />
            </div>

            <div>
              <Label>Other Organizations & Certifications</Label>
              <p className="text-sm text-muted-foreground mb-2">
                List any breed clubs, certifications, or memberships (one per line)
              </p>
              <Textarea
                rows={4}
                value={formData.otherOrganizations?.join('\n') || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    otherOrganizations: e.target.value.split('\n').filter((s) => s.trim()),
                  })
                }
                placeholder="Golden Retriever Club of America&#10;Good Dog Member&#10;OFA Health Certified"
              />
            </div>
          </Card>
        </TabsContent>

        {/* Care Schedule */}
        <TabsContent value="care">
          <Card className="p-6">
            <CareScheduleEditor />
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Accept Inquiries</div>
                <div className="text-sm text-muted-foreground">
                  Allow visitors to submit contact inquiries through your website
                </div>
              </div>
              <Switch
                checked={formData.acceptingInquiries || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, acceptingInquiries: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Pricing</div>
                <div className="text-sm text-muted-foreground">
                  Display puppy pricing on public litter pages
                </div>
              </div>
              <Switch
                checked={formData.showPricing || false}
                onCheckedChange={(checked) => setFormData({ ...formData, showPricing: checked })}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
