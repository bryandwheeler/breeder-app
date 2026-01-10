import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Puppy, Buyer, ShotRecord, WeightEntry, BreedingRights, CoOwnership, Registration, WaitlistEntry } from '@breeder/types';
import { X, Upload, Plus, Trash2, Users, User } from 'lucide-react';
import { storage } from '@breeder/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageCropDialog } from '@/components/ImageCropDialog';

// Combined buyer option type for unified dropdown
type BuyerOption = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'legacy' | 'waitlist';
  waitlistEntryId?: string;
};

interface PuppyFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  puppy: Puppy | null;
  litterBuyers: Buyer[];
  litterWaitlist?: WaitlistEntry[]; // Waitlist entries for this litter
  onSave: (puppy: Puppy, selectedWaitlistEntry?: WaitlistEntry) => Promise<void>;
}

export function PuppyFormDialog({ open, setOpen, puppy, litterBuyers, litterWaitlist = [], onSave }: PuppyFormDialogProps) {
  const [formData, setFormData] = useState<Puppy>({
    id: crypto.randomUUID(),
    sex: 'male',
    color: '',
    photos: [],
    status: 'available',
    healthTests: [],
    shotRecords: [],
    weightHistory: [],
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [selectedBuyerOption, setSelectedBuyerOption] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Build combined buyer options from legacy buyers and waitlist entries
  const buyerOptions: BuyerOption[] = [
    // Legacy buyers (already on this litter)
    ...litterBuyers.map((buyer) => ({
      id: buyer.id,
      name: buyer.name,
      email: buyer.email,
      phone: buyer.phone,
      type: 'legacy' as const,
    })),
    // Waitlist entries - include most statuses, and allow entries assigned to THIS puppy
    ...litterWaitlist
      .filter((entry) => {
        // Include pending, approved, active, and matched statuses
        const validStatus = ['pending', 'approved', 'active', 'matched', 'reserved'].includes(entry.status);
        // Not assigned to a DIFFERENT puppy (allow if assigned to this puppy or unassigned)
        const notAssignedElsewhere = !entry.assignedPuppyId || entry.assignedPuppyId === puppy?.id;
        return validStatus && notAssignedElsewhere;
      })
      .map((entry) => ({
        id: `waitlist-${entry.id}`,
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        type: 'waitlist' as const,
        waitlistEntryId: entry.id,
      })),
  ];

  useEffect(() => {
    if (puppy) {
      setFormData(puppy);
      // Check if this puppy has a buyer assigned
      if (puppy.buyerId) {
        setSelectedBuyerOption(puppy.buyerId);
      } else {
        // Check if there's a waitlist entry assigned to this puppy
        const assignedWaitlist = litterWaitlist.find((e) => e.assignedPuppyId === puppy.id);
        if (assignedWaitlist) {
          setSelectedBuyerOption(`waitlist-${assignedWaitlist.id}`);
        } else {
          setSelectedBuyerOption('');
        }
      }
    } else {
      setFormData({
        id: crypto.randomUUID(),
        sex: 'male',
        color: '',
        photos: [],
        status: 'available',
        healthTests: [],
        shotRecords: [],
        weightHistory: [],
      });
      setSelectedBuyerOption('');
    }
  }, [puppy, open, litterWaitlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return; // Prevent double-submit
    setSaving(true);

    try {
      // Determine if we're selecting a waitlist entry as the buyer
      let selectedWaitlistEntry: WaitlistEntry | undefined;
      let updatedFormData = { ...formData };

      if (selectedBuyerOption) {
        const buyerOption = buyerOptions.find((b) => b.id === selectedBuyerOption);
        if (buyerOption?.type === 'waitlist' && buyerOption.waitlistEntryId) {
          // Selecting from waitlist - don't set buyerId, let parent handle the waitlist assignment
          selectedWaitlistEntry = litterWaitlist.find((e) => e.id === buyerOption.waitlistEntryId);
          // Clear buyerId since we're using waitlist assignment instead
          updatedFormData.buyerId = undefined;
        } else if (buyerOption?.type === 'legacy') {
          // Legacy buyer selection
          updatedFormData.buyerId = buyerOption.id;
        }
      } else {
        // No buyer selected - clear buyerId
        updatedFormData.buyerId = undefined;
      }

      await onSave(updatedFormData, selectedWaitlistEntry);
      setOpen(false);
    } catch (error) {
      console.error('Error saving puppy:', error);
      alert('Failed to save puppy. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = () => {
    if (photoUrl.trim()) {
      setFormData({ ...formData, photos: [...formData.photos, photoUrl.trim()] });
      setPhotoUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - include HEIC for iOS devices
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
    const isValidType = file.type.startsWith('image/') ||
                        validTypes.includes(file.type.toLowerCase()) ||
                        file.name.toLowerCase().endsWith('.heic') ||
                        file.name.toLowerCase().endsWith('.heif');

    if (!isValidType) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB for mobile - HEIC can be larger)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      // Read the file and open crop dialog
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setCropDialogOpen(true);
        setUploading(false);
      };
      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        alert('Failed to read image file. Please try again.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read image file. Please try again.');
      setUploading(false);
    }

    // Reset the input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(true);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `puppies/${timestamp}_cropped.jpg`;
      const storageRef = ref(storage, filename);

      // Upload the cropped file
      await uploadBytes(storageRef, croppedBlob);

      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Add the URL to photos
      setFormData({ ...formData, photos: [...formData.photos, downloadUrl] });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{puppy ? 'Edit Puppy' : 'Add Puppy'}</DialogTitle>
          <DialogDescription>
            {puppy ? 'Update the details for this puppy.' : 'Enter the details for the new puppy.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='name'>Name (Optional)</Label>
              <Input
                id='name'
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='Puppy name'
              />
            </div>

            <div>
              <Label htmlFor='tempName'>Temp Name/Collar</Label>
              <Input
                id='tempName'
                value={formData.tempName || ''}
                onChange={(e) => setFormData({ ...formData, tempName: e.target.value })}
                placeholder='e.g., Red Collar, Puppy 1'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='sex'>Sex *</Label>
              <Select
                value={formData.sex}
                onValueChange={(value) => setFormData({ ...formData, sex: value as 'male' | 'female' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='male'>Male</SelectItem>
                  <SelectItem value='female'>Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='color'>Color *</Label>
              <Input
                id='color'
                required
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder='e.g., Apricot, Chocolate'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='weight'>Current Weight</Label>
              <Input
                id='weight'
                type='number'
                step='0.1'
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                placeholder='0.0'
              />
            </div>

            <div>
              <Label htmlFor='weightUnit'>Weight Unit</Label>
              <Select
                value={formData.weightUnit || 'lbs'}
                onValueChange={(value) => setFormData({ ...formData, weightUnit: value as 'lbs' | 'kg' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='lbs'>lbs</SelectItem>
                  <SelectItem value='kg'>kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='collar'>Collar ID</Label>
              <Input
                id='collar'
                value={formData.collar || ''}
                onChange={(e) => setFormData({ ...formData, collar: e.target.value })}
                placeholder='e.g., Red, Blue, #1'
              />
            </div>

            <div>
              <Label htmlFor='microchip'>Microchip Number</Label>
              <Input
                id='microchip'
                value={formData.microchip || ''}
                onChange={(e) => setFormData({ ...formData, microchip: e.target.value })}
                placeholder='Microchip ID'
              />
            </div>
          </div>

          <div>
            <Label htmlFor='status'>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as 'available' | 'reserved' | 'sold' | 'kept' | 'unavailable' | 'pending',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='available'>Available</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='reserved'>Reserved</SelectItem>
                <SelectItem value='sold'>Sold</SelectItem>
                <SelectItem value='kept'>Kept</SelectItem>
                <SelectItem value='unavailable'>Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='isDeceased'
              checked={formData.isDeceased || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDeceased: checked as boolean })
              }
            />
            <Label htmlFor='isDeceased' className='cursor-pointer'>
              Deceased
            </Label>
          </div>

          {(formData.status === 'reserved' || formData.status === 'sold') && (
            <>
              <div>
                <Label htmlFor='buyerId'>Buyer / Waitlist Assignee</Label>
                <Select
                  value={selectedBuyerOption}
                  onValueChange={(value) => setSelectedBuyerOption(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a buyer or waitlist entry' />
                  </SelectTrigger>
                  <SelectContent>
                    {buyerOptions.length === 0 ? (
                      <div className='p-2 text-sm text-muted-foreground text-center'>
                        No buyers or waitlist entries available
                      </div>
                    ) : (
                      buyerOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className='flex items-center gap-2'>
                            {option.type === 'waitlist' ? (
                              <Users className='h-3.5 w-3.5 text-blue-500' />
                            ) : (
                              <User className='h-3.5 w-3.5 text-green-500' />
                            )}
                            <span>{option.name}</span>
                            <span className='text-muted-foreground'>- {option.email}</span>
                            {option.type === 'waitlist' && (
                              <Badge variant='secondary' className='text-xs ml-1'>Waitlist</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className='text-xs text-muted-foreground mt-1'>
                  Select from existing buyers or assign someone from the waitlist
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='salePrice'>Sale Price</Label>
                  <Input
                    id='salePrice'
                    type='number'
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })}
                    placeholder='0.00'
                  />
                </div>

                <div>
                  <Label htmlFor='depositAmount'>Deposit Amount</Label>
                  <Input
                    id='depositAmount'
                    type='number'
                    value={formData.depositAmount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, depositAmount: parseFloat(e.target.value) })
                    }
                    placeholder='0.00'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='reservationDate'>Reservation Date</Label>
                  <Input
                    id='reservationDate'
                    type='date'
                    value={formData.reservationDate || ''}
                    onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor='pickupDate'>Pickup Date</Label>
                  <Input
                    id='pickupDate'
                    type='date'
                    value={formData.pickupDate || ''}
                    onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  />
                </div>
              </div>

              {formData.status === 'sold' && (
                <div>
                  <Label htmlFor='finalPaymentDate'>Final Payment Date</Label>
                  <Input
                    id='finalPaymentDate'
                    type='date'
                    value={formData.finalPaymentDate || ''}
                    onChange={(e) => setFormData({ ...formData, finalPaymentDate: e.target.value })}
                  />
                </div>
              )}

              {/* Contract Type */}
              <div>
                <Label htmlFor='contractType'>Contract Type</Label>
                <Select
                  value={formData.contractType || 'pet'}
                  onValueChange={(value) => {
                    const updates: Partial<Puppy> = { contractType: value as 'pet' | 'breeding_rights' | 'co_ownership' };

                    // Initialize contract-specific data structures
                    if (value === 'breeding_rights' && !formData.breedingRights) {
                      updates.breedingRights = {
                        minimumBreedingAge: 24,
                        requiredHealthTests: [],
                        restrictions: [],
                      };
                    } else if (value === 'co_ownership' && !formData.coOwnership) {
                      const buyer = litterBuyers.find(b => b.id === formData.buyerId);
                      updates.coOwnership = {
                        coOwnerName: buyer?.name || '',
                        coOwnerEmail: buyer?.email || '',
                        coOwnerPhone: buyer?.phone || '',
                        coOwnerAddress: buyer?.address || '',
                        ownershipPercentage: 50,
                        primaryResidence: 'breeder',
                        breedingRights: 'breeder',
                      };
                    }

                    setFormData({ ...formData, ...updates });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pet'>Pet Only (Limited Registration)</SelectItem>
                    <SelectItem value='breeding_rights'>Breeding Rights</SelectItem>
                    <SelectItem value='co_ownership'>Co-Ownership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Breeding Rights Details */}
              {formData.contractType === 'breeding_rights' && (
                <div className='space-y-4 border p-4 rounded-md bg-muted/30'>
                  <h4 className='font-semibold text-sm'>Breeding Rights Terms</h4>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='minimumBreedingAge'>Minimum Breeding Age (months)</Label>
                      <Input
                        id='minimumBreedingAge'
                        type='number'
                        value={formData.breedingRights?.minimumBreedingAge || 24}
                        onChange={(e) => setFormData({
                          ...formData,
                          breedingRights: {
                            ...formData.breedingRights,
                            minimumBreedingAge: parseInt(e.target.value)
                          } as BreedingRights
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor='maxLitters'>Maximum Litters Allowed</Label>
                      <Input
                        id='maxLitters'
                        type='number'
                        value={formData.breedingRights?.maxLitters || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          breedingRights: {
                            ...formData.breedingRights,
                            maxLitters: parseInt(e.target.value)
                          } as BreedingRights
                        })}
                        placeholder='e.g., 3'
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor='requiredHealthTests'>Required Health Tests (comma-separated)</Label>
                    <Input
                      id='requiredHealthTests'
                      value={formData.breedingRights?.requiredHealthTests?.join(', ') || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        breedingRights: {
                          ...formData.breedingRights,
                          requiredHealthTests: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                        } as BreedingRights
                      })}
                      placeholder='e.g., Hip Dysplasia, Eye Clearance, Cardiac'
                    />
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='requiresBreederApproval'
                      checked={formData.breedingRights?.requiresBreederApproval || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        breedingRights: {
                          ...formData.breedingRights,
                          requiresBreederApproval: checked as boolean
                        } as BreedingRights
                      })}
                    />
                    <Label htmlFor='requiresBreederApproval' className='cursor-pointer'>
                      Requires breeder approval before breeding
                    </Label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='litterReturnAgreement'
                      checked={formData.breedingRights?.litterReturnAgreement || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        breedingRights: {
                          ...formData.breedingRights,
                          litterReturnAgreement: checked as boolean
                        } as BreedingRights
                      })}
                    />
                    <Label htmlFor='litterReturnAgreement' className='cursor-pointer'>
                      Breeder receives pick of litter
                    </Label>
                  </div>

                  {formData.breedingRights?.litterReturnAgreement && (
                    <div>
                      <Label htmlFor='pickOfLitter'>Pick of Litter</Label>
                      <Select
                        value={formData.breedingRights?.pickOfLitter || 'first'}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          breedingRights: {
                            ...formData.breedingRights,
                            pickOfLitter: value as 'first' | 'second' | 'none'
                          } as BreedingRights
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='first'>First Pick</SelectItem>
                          <SelectItem value='second'>Second Pick</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor='additionalTerms'>Additional Terms</Label>
                    <Textarea
                      id='additionalTerms'
                      value={formData.breedingRights?.additionalTerms || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        breedingRights: {
                          ...formData.breedingRights,
                          additionalTerms: e.target.value
                        } as BreedingRights
                      })}
                      placeholder='Any additional breeding terms or restrictions'
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Co-Ownership Details */}
              {formData.contractType === 'co_ownership' && (
                <div className='space-y-4 border p-4 rounded-md bg-muted/30'>
                  <h4 className='font-semibold text-sm'>Co-Ownership Agreement</h4>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='coOwnerName'>Co-Owner Name</Label>
                      <Input
                        id='coOwnerName'
                        value={formData.coOwnership?.coOwnerName || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          coOwnership: {
                            ...formData.coOwnership,
                            coOwnerName: e.target.value
                          } as CoOwnership
                        })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor='coOwnerEmail'>Co-Owner Email</Label>
                      <Input
                        id='coOwnerEmail'
                        type='email'
                        value={formData.coOwnership?.coOwnerEmail || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          coOwnership: {
                            ...formData.coOwnership,
                            coOwnerEmail: e.target.value
                          } as CoOwnership
                        })}
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='coOwnerPhone'>Co-Owner Phone</Label>
                      <Input
                        id='coOwnerPhone'
                        value={formData.coOwnership?.coOwnerPhone || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          coOwnership: {
                            ...formData.coOwnership,
                            coOwnerPhone: e.target.value
                          } as CoOwnership
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor='ownershipPercentage'>Your Ownership %</Label>
                      <Input
                        id='ownershipPercentage'
                        type='number'
                        min='0'
                        max='100'
                        value={formData.coOwnership?.ownershipPercentage || 50}
                        onChange={(e) => setFormData({
                          ...formData,
                          coOwnership: {
                            ...formData.coOwnership,
                            ownershipPercentage: parseInt(e.target.value)
                          } as CoOwnership
                        })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor='coOwnerAddress'>Co-Owner Address</Label>
                    <Input
                      id='coOwnerAddress'
                      value={formData.coOwnership?.coOwnerAddress || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        coOwnership: {
                          ...formData.coOwnership,
                          coOwnerAddress: e.target.value
                        } as CoOwnership
                      })}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='primaryResidence'>Primary Residence</Label>
                      <Select
                        value={formData.coOwnership?.primaryResidence || 'breeder'}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          coOwnership: {
                            ...formData.coOwnership,
                            primaryResidence: value as 'breeder' | 'co_owner'
                          } as CoOwnership
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='breeder'>With Breeder</SelectItem>
                          <SelectItem value='co_owner'>With Co-Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor='coBreedingRights'>Breeding Rights</Label>
                      <Select
                        value={formData.coOwnership?.breedingRights || 'breeder'}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          coOwnership: {
                            ...formData.coOwnership,
                            breedingRights: value as 'breeder' | 'co_owner' | 'shared'
                          } as CoOwnership
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='breeder'>Breeder Only</SelectItem>
                          <SelectItem value='co_owner'>Co-Owner Only</SelectItem>
                          <SelectItem value='shared'>Shared</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor='litterArrangement'>Litter Arrangement</Label>
                    <Input
                      id='litterArrangement'
                      value={formData.coOwnership?.litterArrangement || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        coOwnership: {
                          ...formData.coOwnership,
                          litterArrangement: e.target.value
                        } as CoOwnership
                      })}
                      placeholder='e.g., Breeder gets first pick, co-owner gets second pick'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='coMaxLitters'>Maximum Litters</Label>
                      <Input
                        id='coMaxLitters'
                        type='number'
                        value={formData.coOwnership?.maxLitters || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          coOwnership: {
                            ...formData.coOwnership,
                            maxLitters: parseInt(e.target.value)
                          } as CoOwnership
                        })}
                        placeholder='e.g., 3'
                      />
                    </div>

                    <div>
                      <Label htmlFor='buyoutAmount'>Buyout Amount ($)</Label>
                      <Input
                        id='buyoutAmount'
                        type='number'
                        value={formData.coOwnership?.buyoutAmount || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          coOwnership: {
                            ...formData.coOwnership,
                            buyoutAmount: parseFloat(e.target.value),
                            buyoutOption: true
                          } as CoOwnership
                        })}
                        placeholder='Optional'
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor='coAdditionalTerms'>Additional Terms</Label>
                    <Textarea
                      id='coAdditionalTerms'
                      value={formData.coOwnership?.additionalTerms || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        coOwnership: {
                          ...formData.coOwnership,
                          additionalTerms: e.target.value
                        } as CoOwnership
                      })}
                      placeholder='Any additional co-ownership terms'
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Registration Tracking */}
          <div className='space-y-4 border p-4 rounded-md'>
            <h4 className='font-semibold text-sm'>Registration Information</h4>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='registry'>Registry</Label>
                <Select
                  value={formData.registrations?.[0]?.registry || 'AKC'}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    registrations: [{
                      ...formData.registrations?.[0],
                      registry: value as 'AKC' | 'CKC' | 'UKC' | 'FCI' | 'Other',
                      registrationType: formData.registrations?.[0]?.registrationType || 'none',
                      status: formData.registrations?.[0]?.status || 'not_started'
                    } as Registration]
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='AKC'>AKC (American Kennel Club)</SelectItem>
                    <SelectItem value='CKC'>CKC (Canadian Kennel Club)</SelectItem>
                    <SelectItem value='UKC'>UKC (United Kennel Club)</SelectItem>
                    <SelectItem value='FCI'>FCI (Fédération Cynologique)</SelectItem>
                    <SelectItem value='Other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='registrationType'>Registration Type</Label>
                <Select
                  value={formData.registrations?.[0]?.registrationType || 'none'}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    registrations: [{
                      ...formData.registrations?.[0],
                      registry: formData.registrations?.[0]?.registry || 'AKC',
                      registrationType: value as 'none' | 'limited' | 'full',
                      status: formData.registrations?.[0]?.status || 'not_started'
                    } as Registration]
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>No Registration</SelectItem>
                    <SelectItem value='limited'>Limited Registration</SelectItem>
                    <SelectItem value='full'>Full Registration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.registrations?.[0]?.registrationType !== 'none' && (
              <>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='registrationStatus'>Status</Label>
                    <Select
                      value={formData.registrations?.[0]?.status || 'not_started'}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        registrations: [{
                          ...formData.registrations?.[0],
                          registry: formData.registrations?.[0]?.registry || 'AKC',
                          registrationType: formData.registrations?.[0]?.registrationType || 'limited',
                          status: value as 'not_started' | 'pending' | 'submitted' | 'approved' | 'issued'
                        } as Registration]
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='not_started'>Not Started</SelectItem>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='submitted'>Submitted</SelectItem>
                        <SelectItem value='approved'>Approved</SelectItem>
                        <SelectItem value='issued'>Issued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor='registrationNumber'>Registration Number</Label>
                    <Input
                      id='registrationNumber'
                      value={formData.registrations?.[0]?.registrationNumber || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        registrations: [{
                          ...formData.registrations?.[0],
                          registry: formData.registrations?.[0]?.registry || 'AKC',
                          registrationType: formData.registrations?.[0]?.registrationType || 'limited',
                          status: formData.registrations?.[0]?.status || 'not_started',
                          registrationNumber: e.target.value
                        } as Registration]
                      })}
                      placeholder='e.g., WS12345678'
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='registeredName'>Registered Name</Label>
                  <Input
                    id='registeredName'
                    value={formData.registrations?.[0]?.registeredName || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      registrations: [{
                        ...formData.registrations?.[0],
                        registry: formData.registrations?.[0]?.registry || 'AKC',
                        registrationType: formData.registrations?.[0]?.registrationType || 'limited',
                        status: formData.registrations?.[0]?.status || 'not_started',
                        registeredName: e.target.value
                      } as Registration]
                    })}
                    placeholder='e.g., Kennel Name Amazing Puppy'
                  />
                </div>

                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <Label htmlFor='applicationDate'>Application Date</Label>
                    <Input
                      id='applicationDate'
                      type='date'
                      value={formData.registrations?.[0]?.applicationDate || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        registrations: [{
                          ...formData.registrations?.[0],
                          registry: formData.registrations?.[0]?.registry || 'AKC',
                          registrationType: formData.registrations?.[0]?.registrationType || 'limited',
                          status: formData.registrations?.[0]?.status || 'not_started',
                          applicationDate: e.target.value
                        } as Registration]
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor='submissionDate'>Submission Date</Label>
                    <Input
                      id='submissionDate'
                      type='date'
                      value={formData.registrations?.[0]?.submissionDate || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        registrations: [{
                          ...formData.registrations?.[0],
                          registry: formData.registrations?.[0]?.registry || 'AKC',
                          registrationType: formData.registrations?.[0]?.registrationType || 'limited',
                          status: formData.registrations?.[0]?.status || 'not_started',
                          submissionDate: e.target.value
                        } as Registration]
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor='registrationDeadline'>Deadline</Label>
                    <Input
                      id='registrationDeadline'
                      type='date'
                      value={formData.registrations?.[0]?.registrationDeadline || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        registrations: [{
                          ...formData.registrations?.[0],
                          registry: formData.registrations?.[0]?.registry || 'AKC',
                          registrationType: formData.registrations?.[0]?.registrationType || 'limited',
                          status: formData.registrations?.[0]?.status || 'not_started',
                          registrationDeadline: e.target.value
                        } as Registration]
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='registrationNotes'>Registration Notes</Label>
                  <Textarea
                    id='registrationNotes'
                    value={formData.registrations?.[0]?.notes || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      registrations: [{
                        ...formData.registrations?.[0],
                        registry: formData.registrations?.[0]?.registry || 'AKC',
                        registrationType: formData.registrations?.[0]?.registrationType || 'limited',
                        status: formData.registrations?.[0]?.status || 'not_started',
                        notes: e.target.value
                      } as Registration]
                    })}
                    placeholder='Notes about registration process, documents needed, etc.'
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <Label>Photos</Label>
            <div className='space-y-2 mb-2'>
              <div className='flex gap-2 items-center'>
                <input
                  type='file'
                  accept='image/*,.heic,.heif'
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className='hidden'
                  id='photo-upload'
                />
                <label htmlFor='photo-upload' className='flex-1'>
                  <Button type='button' disabled={uploading} className='w-full' asChild>
                    <span className='cursor-pointer flex items-center justify-center'>
                      <Upload className='mr-2 h-4 w-4' />
                      {uploading ? 'Uploading...' : 'Choose & Upload Photo'}
                    </span>
                  </Button>
                </label>
              </div>
              <div className='flex gap-2'>
                <Input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder='Or enter photo URL'
                  disabled={uploading}
                />
                <Button type='button' onClick={addPhoto} disabled={uploading}>
                  Add URL
                </Button>
              </div>
            </div>
            {formData.photos.length > 0 && (
              <div className='grid grid-cols-3 gap-2'>
                {formData.photos.map((url, index) => (
                  <div key={index} className='relative'>
                    <img
                      src={url}
                      alt={`Puppy ${index + 1}`}
                      className='w-full h-24 object-cover rounded'
                    />
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      className='absolute top-1 right-1 h-6 w-6 p-0'
                      onClick={() => removePhoto(index)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shot Records */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <Label>Vaccinations / Shots</Label>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => {
                  const newShot: ShotRecord = {
                    id: crypto.randomUUID(),
                    vaccine: '',
                    dateGiven: '',
                    dueDate: '',
                  };
                  setFormData({ ...formData, shotRecords: [...formData.shotRecords, newShot] });
                }}
              >
                <Plus className='h-4 w-4 mr-1' /> Add Shot
              </Button>
            </div>
            {formData.shotRecords.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No shots recorded</p>
            ) : (
              <div className='space-y-2'>
                {formData.shotRecords.map((shot, i) => (
                  <div key={shot.id} className='flex gap-2 items-end'>
                    <div className='flex-1'>
                      <Input
                        placeholder='Vaccine name'
                        value={shot.vaccine}
                        onChange={(e) => {
                          const updated = [...formData.shotRecords];
                          updated[i] = { ...updated[i], vaccine: e.target.value };
                          setFormData({ ...formData, shotRecords: updated });
                        }}
                      />
                    </div>
                    <div className='w-32'>
                      <Input
                        type='date'
                        value={shot.dateGiven}
                        onChange={(e) => {
                          const updated = [...formData.shotRecords];
                          updated[i] = { ...updated[i], dateGiven: e.target.value };
                          setFormData({ ...formData, shotRecords: updated });
                        }}
                      />
                    </div>
                    <Button
                      type='button'
                      variant='destructive'
                      size='icon'
                      onClick={() => {
                        setFormData({
                          ...formData,
                          shotRecords: formData.shotRecords.filter((_, idx) => idx !== i),
                        });
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weight History */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <Label>Weight History</Label>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => {
                  const newWeight: WeightEntry = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString().split('T')[0],
                    weight: 0,
                    unit: formData.weightUnit || 'lbs',
                  };
                  setFormData({ ...formData, weightHistory: [...formData.weightHistory, newWeight] });
                }}
              >
                <Plus className='h-4 w-4 mr-1' /> Add Weight
              </Button>
            </div>
            {formData.weightHistory.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No weights recorded</p>
            ) : (
              <div className='space-y-2'>
                {formData.weightHistory.map((entry, i) => (
                  <div key={entry.id} className='flex gap-2 items-end'>
                    <div className='w-32'>
                      <Input
                        type='date'
                        value={entry.date}
                        onChange={(e) => {
                          const updated = [...formData.weightHistory];
                          updated[i] = { ...updated[i], date: e.target.value };
                          setFormData({ ...formData, weightHistory: updated });
                        }}
                      />
                    </div>
                    <div className='w-24'>
                      <Input
                        type='number'
                        step='0.1'
                        placeholder='Weight'
                        value={entry.weight || ''}
                        onChange={(e) => {
                          const updated = [...formData.weightHistory];
                          updated[i] = { ...updated[i], weight: parseFloat(e.target.value) };
                          setFormData({ ...formData, weightHistory: updated });
                        }}
                      />
                    </div>
                    <div className='w-20'>
                      <Select
                        value={entry.unit}
                        onValueChange={(value) => {
                          const updated = [...formData.weightHistory];
                          updated[i] = { ...updated[i], unit: value as 'lbs' | 'kg' };
                          setFormData({ ...formData, weightHistory: updated });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='lbs'>lbs</SelectItem>
                          <SelectItem value='kg'>kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type='button'
                      variant='destructive'
                      size='icon'
                      onClick={() => {
                        setFormData({
                          ...formData,
                          weightHistory: formData.weightHistory.filter((_, idx) => idx !== i),
                        });
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea
              id='notes'
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder='Any additional notes about this puppy'
              rows={3}
            />
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type='submit' disabled={saving}>
              {saving ? 'Saving...' : 'Save Puppy'}
            </Button>
          </div>
        </form>
      </DialogContent>

      <ImageCropDialog
        open={cropDialogOpen}
        setOpen={setCropDialogOpen}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </Dialog>
  );
}
