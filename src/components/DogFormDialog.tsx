// src/components/DogFormDialog.tsx – FINAL 100% WORKING VERSION
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDogStore } from '@/store/dogStoreFirebase';
import { Dog, ShotRecord, HealthTest, GuardianHome, Registration } from '@/types/dog';
import { GuardianHomeDialog } from '@/components/GuardianHomeDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageCropDialog } from '@/components/ImageCropDialog';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  registeredName: z.string().optional(),
  callName: z.string().optional(),
  kennelName: z.string().optional(),
  breederName: z.string().optional(),
  breed: z.string().min(1, 'Breed is required'),
  sex: z.enum(['male', 'female']),
  dateOfBirth: z.string().min(1, 'DOB is required'),
  color: z.string().optional(),
  microchip: z.string().optional(),
  sireId: z.string().optional(),
  damId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DogFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dog: Dog | null;
}

function DogFormContent({ dog, setOpen }: { dog: Dog | null; setOpen: (open: boolean) => void }) {
  const { dogs, addDog, updateDog } = useDogStore();
  const males = dogs.filter((d) => d.sex === 'male');
  const females = dogs.filter((d) => d.sex === 'female');

  const [photos, setPhotos] = useState<string[]>(dog?.photos || []);
  const [shotRecords, setShotRecords] = useState<ShotRecord[]>(dog?.shotRecords || []);
  const [healthTests, setHealthTests] = useState<HealthTest[]>(dog?.healthTests || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [programStatus, setProgramStatus] = useState<'owned' | 'guardian' | 'external_stud' | 'co-owned'>(
    dog?.programStatus || 'owned'
  );
  const [guardianHome, setGuardianHome] = useState<GuardianHome | undefined>(dog?.guardianHome);
  const [guardianDialogOpen, setGuardianDialogOpen] = useState(false);
  const [registration, setRegistration] = useState<Registration | undefined>(
    dog?.registration || {
      registry: 'AKC',
      registrationType: 'none',
      status: 'not_started',
    }
  );

  console.log('DogFormContent initialized with:', {
    dogId: dog?.id,
    dogName: dog?.name,
    programStatus: dog?.programStatus,
    guardianHome: dog?.guardianHome
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: dog?.name || '',
      registeredName: dog?.registeredName || '',
      callName: dog?.callName || '',
      kennelName: dog?.kennelName || '',
      breederName: dog?.breederName || '',
      breed: dog?.breed || '',
      sex: dog?.sex || 'female',
      dateOfBirth: dog?.dateOfBirth || '',
      color: dog?.color || '',
      microchip: dog?.microchip || '',
      sireId: dog?.sireId || '',
      damId: dog?.damId || '',
      notes: dog?.notes || '',
    },
  });

  const onSubmit = (values: FormValues) => {
    const dogData: Partial<Dog> = {
      ...values,
      photos,
      shotRecords,
      healthTests,
      reminders: dog?.reminders || [],
      weightHistory: dog?.weightHistory || [],
      medications: dog?.medications || [],
      dewormings: dog?.dewormings || [],
      vetVisits: dog?.vetVisits || [],
      heatCycles: dog?.heatCycles || [],
      programStatus,
      registration,
    };

    // Only add dnaProfile if it exists (Firestore doesn't accept undefined)
    if (dog?.dnaProfile) {
      dogData.dnaProfile = dog.dnaProfile;
    }

    // Only add guardianHome if status is guardian and it exists
    if (programStatus === 'guardian' && guardianHome) {
      dogData.guardianHome = guardianHome;
    }

    console.log('Saving dog with data:', { programStatus, guardianHome, registration, dogData });

    if (dog) {
      updateDog(dog.id, dogData);
    } else {
      addDog(dogData as Omit<Dog, 'id'>);
    }
    setOpen(false);
  };

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Read the file and open crop dialog
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset the input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingPhoto(true);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `dogs/${timestamp}_cropped.jpg`;
      const storageRef = ref(storage, filename);

      // Upload the cropped file
      await uploadBytes(storageRef, croppedBlob);

      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Add the URL to photos
      setPhotos((prev) => [...prev, downloadUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addShot = () =>
    setShotRecords((prev) => [
      ...prev,
      { id: uuidv4(), vaccine: '', dateGiven: '', dueDate: '', notes: '' },
    ]);
  const addHealthTest = () =>
    setHealthTests((prev) => [
      ...prev,
      { id: uuidv4(), test: '', result: '', date: '' },
    ]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registered Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='CH Doodle Bliss King of Hearts'
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='callName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Boots' {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='kennelName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kennel Name (if outside dog)</FormLabel>
                      <FormControl>
                        <Input placeholder='Golden Dreams Kennel' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='breederName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breeder Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Jane Smith' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='breed'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed *</FormLabel>
                      <FormControl>
                        <Input placeholder='Goldendoodle' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='sex'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='female'>Female</SelectItem>
                            <SelectItem value='male'>Male</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='dateOfBirth'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DOB *</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Parents */}
              <div className='space-y-4'>
                <h3 className='font-semibold text-lg'>Parents</h3>

                <FormField
                  control={form.control}
                  name='sireId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sire (Father)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select sire' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='none'>None / Unknown</SelectItem>
                          {males.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} {m.callName && `("${m.callName}")`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='damId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dam (Mother)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select dam' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='none'>None / Unknown</SelectItem>
                          {females.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} {f.callName && `("${f.callName}")`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Program Status & Guardian Home */}
              <div className='space-y-4 border-t pt-4'>
                <h3 className='font-semibold text-lg'>Breeder Program</h3>

                <div>
                  <Label>Program Status</Label>
                  <Select
                    value={programStatus || 'owned'}
                    onValueChange={(value) => setProgramStatus(value as 'owned' | 'guardian' | 'external_stud' | 'co-owned')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='owned'>Owned by Program</SelectItem>
                      <SelectItem value='guardian'>Guardian Home</SelectItem>
                      <SelectItem value='external_stud'>External Stud</SelectItem>
                      <SelectItem value='co-owned'>Co-Owned</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {programStatus === 'owned' && 'Dog is owned and kept at your kennel'}
                    {programStatus === 'guardian' && 'Dog lives in a guardian home with breeding rights'}
                    {programStatus === 'external_stud' && 'Stud service from another breeder'}
                    {programStatus === 'co-owned' && 'Shared ownership with another party'}
                  </p>
                </div>

                {programStatus === 'guardian' && (
                  <div className='space-y-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setGuardianDialogOpen(true)}
                    >
                      {guardianHome ? 'Edit Guardian Info' : 'Add Guardian Info'}
                    </Button>
                    {guardianHome && (
                      <div className='p-3 border rounded-md bg-muted/50'>
                        <p className='font-medium'>{guardianHome.guardianName}</p>
                        {guardianHome.email && <p className='text-sm text-muted-foreground'>{guardianHome.email}</p>}
                        <p className='text-sm mt-1'>
                          Contract: {guardianHome.littersCompleted} / {guardianHome.littersAllowed} litters
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Photos */}
            <div>
              <Label>Photos ({photos.length})</Label>
              <div className='grid grid-cols-4 gap-4 mt-2'>
                {photos.map((p, i) => (
                  <div key={i} className='relative group'>
                    <img
                      src={p}
                      alt='dog'
                      className='w-full h-32 object-cover rounded-lg border'
                    />
                    <Button
                      size='icon'
                      variant='destructive'
                      className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition'
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      type='button'
                      disabled={uploadingPhoto}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                <label className={`border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploadingPhoto ? (
                    <>
                      <Upload className='h-8 w-8 text-muted-foreground animate-pulse' />
                      <span className='text-xs text-muted-foreground mt-2'>Uploading...</span>
                    </>
                  ) : (
                    <Plus className='h-10 w-10 text-muted-foreground' />
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handlePhotoAdd}
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>
            </div>

            {/* Shot Records */}
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-semibold flex items-center gap-2'>
                  Shot & Vaccination Records
                </h3>
                <Button type='button' size='sm' onClick={addShot}>
                  <Plus className='h-4 w-4' /> Add Shot
                </Button>
              </div>
              {shotRecords.length === 0 ? (
                <p className='text-muted-foreground'>No shot records</p>
              ) : (
                <div className='space-y-3'>
                  {shotRecords.map((shot, i) => (
                    <div
                      key={shot.id}
                      className='flex gap-3 items-end border-b pb-3'
                    >
                      <Input
                        placeholder='Vaccine name'
                        value={shot.vaccine}
                        onChange={(e) => {
                          const newRecords = [...shotRecords];
                          newRecords[i].vaccine = e.target.value;
                          setShotRecords(newRecords);
                        }}
                      />
                      <Input
                        type='date'
                        value={shot.dateGiven}
                        onChange={(e) => {
                          const newRecords = [...shotRecords];
                          newRecords[i].dateGiven = e.target.value;
                          setShotRecords(newRecords);
                        }}
                      />
                      <Input
                        type='date'
                        placeholder='Due'
                        value={shot.dueDate || ''}
                        onChange={(e) => {
                          const newRecords = [...shotRecords];
                          newRecords[i].dueDate = e.target.value;
                          setShotRecords(newRecords);
                        }}
                      />
                      <Input
                        placeholder='Notes'
                        value={shot.notes || ''}
                        onChange={(e) => {
                          const newRecords = [...shotRecords];
                          newRecords[i].notes = e.target.value;
                          setShotRecords(newRecords);
                        }}
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        size='icon'
                        onClick={() =>
                          setShotRecords((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Health Tests */}
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-semibold flex items-center gap-2'>
                  Health Tests
                </h3>
                <Button type='button' size='sm' onClick={addHealthTest}>
                  <Plus className='h-4 w-4' /> Add Test
                </Button>
              </div>
              {healthTests.length === 0 ? (
                <p className='text-muted-foreground'>
                  No health tests recorded
                </p>
              ) : (
                <div className='space-y-3'>
                  {healthTests.map((test, i) => (
                    <div
                      key={test.id}
                      className='flex gap-3 items-end border-b pb-3'
                    >
                      <Input
                        placeholder='Test (OFA, PennHIP, DNA...)'
                        value={test.test}
                        onChange={(e) => {
                          const newTests = [...healthTests];
                          newTests[i].test = e.target.value;
                          setHealthTests(newTests);
                        }}
                      />
                      <Input
                        placeholder='Result'
                        value={test.result}
                        onChange={(e) => {
                          const newTests = [...healthTests];
                          newTests[i].result = e.target.value;
                          setHealthTests(newTests);
                        }}
                      />
                      <Input
                        type='date'
                        value={test.date}
                        onChange={(e) => {
                          const newTests = [...healthTests];
                          newTests[i].date = e.target.value;
                          setHealthTests(newTests);
                        }}
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        size='icon'
                        onClick={() =>
                          setHealthTests((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registration Tracking */}
            <div className='space-y-4 border-t pt-4'>
              <h3 className='font-semibold text-lg'>Registration Information</h3>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='registry'>Registry</Label>
                  <Select
                    value={registration?.registry || 'AKC'}
                    onValueChange={(value) =>
                      setRegistration({
                        ...registration,
                        registry: value as Registration['registry'],
                        registrationType: registration?.registrationType || 'none',
                        status: registration?.status || 'not_started',
                      } as Registration)
                    }
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
                    value={registration?.registrationType || 'none'}
                    onValueChange={(value) =>
                      setRegistration({
                        ...registration,
                        registry: registration?.registry || 'AKC',
                        registrationType: value as Registration['registrationType'],
                        status: registration?.status || 'not_started',
                      } as Registration)
                    }
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

              {registration?.registrationType !== 'none' && (
                <>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='status'>Status</Label>
                      <Select
                        value={registration?.status || 'not_started'}
                        onValueChange={(value) =>
                          setRegistration({
                            ...registration!,
                            status: value as Registration['status'],
                          })
                        }
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
                        value={registration?.registrationNumber || ''}
                        onChange={(e) =>
                          setRegistration({
                            ...registration!,
                            registrationNumber: e.target.value,
                          })
                        }
                        placeholder='e.g., WS12345678'
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor='registeredName'>Registered Name</Label>
                    <Input
                      id='registeredName'
                      value={registration?.registeredName || ''}
                      onChange={(e) =>
                        setRegistration({
                          ...registration!,
                          registeredName: e.target.value,
                        })
                      }
                      placeholder='Official registered name'
                    />
                  </div>

                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <Label htmlFor='applicationDate'>Application Date</Label>
                      <Input
                        id='applicationDate'
                        type='date'
                        value={registration?.applicationDate || ''}
                        onChange={(e) =>
                          setRegistration({
                            ...registration!,
                            applicationDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor='submissionDate'>Submission Date</Label>
                      <Input
                        id='submissionDate'
                        type='date'
                        value={registration?.submissionDate || ''}
                        onChange={(e) =>
                          setRegistration({
                            ...registration!,
                            submissionDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor='approvalDate'>Approval Date</Label>
                      <Input
                        id='approvalDate'
                        type='date'
                        value={registration?.approvalDate || ''}
                        onChange={(e) =>
                          setRegistration({
                            ...registration!,
                            approvalDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

        <div className='flex justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type='submit'>{dog ? 'Save Changes' : 'Add Dog'}</Button>
        </div>
      </form>

      <ImageCropDialog
        open={cropDialogOpen}
        setOpen={setCropDialogOpen}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />

      <GuardianHomeDialog
        open={guardianDialogOpen}
        setOpen={setGuardianDialogOpen}
        guardianHome={guardianHome}
        onSave={(guardian) => setGuardianHome(guardian)}
      />
    </Form>
  );
}

export function DogFormDialog({ open, setOpen, dog }: DogFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{dog ? `Edit ${dog.name}` : 'Add New Dog'}</DialogTitle>
        </DialogHeader>
        <DogFormContent key={dog?.id || 'new'} dog={dog} setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}
