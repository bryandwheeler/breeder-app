// Public contact/inquiry form
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBreederStore } from '@breeder/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export function ContactForm() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const addInquiry = useBreederStore((state) => state.addInquiry);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredBreed: '',
    preferredSex: 'either' as 'male' | 'female' | 'either',
    preferredColor: '',
    timeline: '',
    message: '',
    source: 'website' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      await addInquiry({
        ...formData,
        userId,
        status: 'new',
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='max-w-md w-full p-8 text-center'>
          <CheckCircle className='h-16 w-16 text-green-500 mx-auto mb-4' />
          <h2 className='text-2xl font-bold mb-2'>Thank You!</h2>
          <p className='text-muted-foreground mb-6'>
            Your inquiry has been submitted successfully. The breeder will
            contact you soon.
          </p>
          <Button onClick={() => navigate(`/home/${userId}`)}>
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background py-12 px-4'>
      <div className='container mx-auto max-w-2xl'>
        <Card className='p-8'>
          <h1 className='text-3xl font-bold mb-2'>Send an Inquiry</h1>
          <p className='text-muted-foreground mb-8'>
            Fill out the form below and we'll get back to you as soon as
            possible.
          </p>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Contact Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Contact Information</h3>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor='name'>
                      Full Name <span className='text-destructive'>*</span>
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>Enter your full name</TooltipContent>
                </Tooltip>
                <Input
                  id='name'
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='John Doe'
                />
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor='email'>
                      Email Address <span className='text-destructive'>*</span>
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>We'll send confirmation here</TooltipContent>
                </Tooltip>
                <Input
                  id='email'
                  type='email'
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder='john@example.com'
                />
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor='phone'>Phone Number</Label>
                  </TooltipTrigger>
                  <TooltipContent>Optional, for faster contact</TooltipContent>
                </Tooltip>
                <Input
                  id='phone'
                  type='tel'
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder='(555) 123-4567'
                />
              </div>
            </div>

            {/* Preferences */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Preferences</h3>

              <div>
                <Label htmlFor='preferredSex'>Preferred Sex</Label>
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
                    <SelectItem value='either'>No Preference</SelectItem>
                    <SelectItem value='male'>Male</SelectItem>
                    <SelectItem value='female'>Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='preferredColor'>Preferred Color</Label>
                <Input
                  id='preferredColor'
                  value={formData.preferredColor}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredColor: e.target.value })
                  }
                  placeholder='e.g., Black, Cream, Parti'
                />
              </div>

              <div>
                <Label htmlFor='timeline'>Timeline</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) =>
                    setFormData({ ...formData, timeline: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select timeline' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='immediate'>
                      Immediate (within 1 month)
                    </SelectItem>
                    <SelectItem value='3-6 months'>3-6 months</SelectItem>
                    <SelectItem value='6-12 months'>6-12 months</SelectItem>
                    <SelectItem value='1+ year'>1+ year</SelectItem>
                    <SelectItem value='flexible'>Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Message */}
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor='message'>
                    Message <span className='text-destructive'>*</span>
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  Tell us about yourself and your interest
                </TooltipContent>
              </Tooltip>
              <Textarea
                id='message'
                required
                rows={6}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Tell us about yourself, your experience with dogs, your living situation, and why you're interested in a puppy..."
              />
            </div>

            <div className='flex gap-4'>
              <Button type='submit' disabled={loading} className='flex-1'>
                {loading ? 'Submitting...' : 'Submit Inquiry'}
              </Button>
              <Button
                type='button'
                variant='outline'
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
