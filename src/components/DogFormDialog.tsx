// src/components/DogFormDialog.tsx – FINAL 100% WORKING VERSION
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDogStore } from '@/store/dogStoreFirebase';
import {
  Dog,
  ShotRecord,
  HealthTest,
  GuardianHome,
  Registration,
} from '@/types/dog';
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
import { Plus, Trash2, Upload, Search, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import { searchDogs, type DogSearchResult } from '@/lib/kennelSearch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useConnectionStore } from '@/store/connectionStore';
import { useBreederStore } from '@/store/breederStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import emailjs from '@emailjs/browser';
import { Badge } from '@/components/ui/badge';
import { Link2 } from 'lucide-react';

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

function DogFormContent({
  dog,
  setOpen,
}: {
  dog: Dog | null;
  setOpen: (open: boolean) => void;
}) {
  const { currentUser } = useAuth();
  const { dogs, addDog, updateDog } = useDogStore();
  const males = dogs.filter((d) => d.sex === 'male');
  const females = dogs.filter((d) => d.sex === 'female');
  const profile = useBreederStore((state) => state.profile);
  const { createConnectionRequest, addNotification } = useConnectionStore();

  const [photos, setPhotos] = useState<string[]>(dog?.photos || []);
  const [shotRecords, setShotRecords] = useState<ShotRecord[]>(
    dog?.shotRecords || []
  );
  const [healthTests, setHealthTests] = useState<HealthTest[]>(
    dog?.healthTests || []
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [programStatus, setProgramStatus] = useState<
    'owned' | 'guardian' | 'external_stud' | 'co-owned' | 'retired'
  >(dog?.programStatus || 'owned');
  const [guardianHome, setGuardianHome] = useState<GuardianHome | undefined>(
    dog?.guardianHome
  );
  const [guardianDialogOpen, setGuardianDialogOpen] = useState(false);
  const [registration, setRegistration] = useState<Registration | undefined>(
    dog?.registration || {
      registry: 'AKC',
      registrationType: 'none',
      status: 'not_started',
    }
  );

  // Sire search state
  const [sireSearchMode, setSireSearchMode] = useState(!!dog?.externalSire);
  const [sireSearchTerm, setSireSearchTerm] = useState('');
  const [sireSearching, setSireSearching] = useState(false);
  const [sireSearchResults, setSireSearchResults] = useState<DogSearchResult[]>(
    []
  );
  const [externalSire, setExternalSire] = useState<DogSearchResult | null>(
    dog?.externalSire
      ? ({
          dogId: dog.externalSire.dogId || '',
          dogName: dog.externalSire.name,
          registrationNumber: dog.externalSire.registrationNumber,
          breed: dog.externalSire.breed,
          sex: 'male',
          ownerId: dog.externalSire.ownerId || '',
          ownerKennel: dog.externalSire.kennelName || 'Unknown Kennel',
          ownerBreederName: dog.externalSire.breederName,
          connectionRequestId: dog.externalSire.connectionRequestId,
          connectionStatus: dog.externalSire.connectionStatus,
          connectedDogId: dog.externalSire.connectedDogId,
        } as any)
      : null
  );

  // Dam search state
  const [damSearchMode, setDamSearchMode] = useState(!!dog?.externalDam);
  const [damSearchTerm, setDamSearchTerm] = useState('');
  const [damSearching, setDamSearching] = useState(false);
  const [damSearchResults, setDamSearchResults] = useState<DogSearchResult[]>(
    []
  );
  const [externalDam, setExternalDam] = useState<DogSearchResult | null>(
    dog?.externalDam
      ? ({
          dogId: dog.externalDam.dogId || '',
          dogName: dog.externalDam.name,
          registrationNumber: dog.externalDam.registrationNumber,
          breed: dog.externalDam.breed,
          sex: 'female',
          ownerId: dog.externalDam.ownerId || '',
          ownerKennel: dog.externalDam.kennelName || 'Unknown Kennel',
          ownerBreederName: dog.externalDam.breederName,
          connectionRequestId: dog.externalDam.connectionRequestId,
          connectionStatus: dog.externalDam.connectionStatus,
          connectedDogId: dog.externalDam.connectedDogId,
        } as any)
      : null
  );

  console.log('DogFormContent initialized with:', {
    dogId: dog?.id,
    dogName: dog?.name,
    programStatus: dog?.programStatus,
    guardianHome: dog?.guardianHome,
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
      programStatus,
      registration,
    };

    // Handle external sire
    if (externalSire) {
      dogData.sireId = ''; // Clear internal sire ID
      dogData.externalSire = {
        name: externalSire.dogName,
        registrationNumber: externalSire.registrationNumber,
        breed: externalSire.breed,
        kennelName: externalSire.ownerKennel,
        breederName: externalSire.ownerBreederName,
        // Connection tracking
        connectionRequestId: (externalSire as any).connectionRequestId,
        connectionStatus: (externalSire as any).connectionStatus,
        ownerId: externalSire.ownerId,
        dogId: externalSire.dogId,
        connectedDogId: (externalSire as any).connectedDogId,
      };
    } else if (dogData.externalSire) {
      // Clear external sire if switching back to internal
      delete dogData.externalSire;
    }

    // Handle external dam
    if (externalDam) {
      dogData.damId = ''; // Clear internal dam ID
      dogData.externalDam = {
        name: externalDam.dogName,
        registrationNumber: externalDam.registrationNumber,
        breed: externalDam.breed,
        kennelName: externalDam.ownerKennel,
        breederName: externalDam.ownerBreederName,
        // Connection tracking
        connectionRequestId: (externalDam as any).connectionRequestId,
        connectionStatus: (externalDam as any).connectionStatus,
        ownerId: externalDam.ownerId,
        dogId: externalDam.dogId,
        connectedDogId: (externalDam as any).connectedDogId,
      };
    } else if (dogData.externalDam) {
      // Clear external dam if switching back to internal
      delete dogData.externalDam;
    }

    // Only add dnaProfile if it exists (Firestore doesn't accept undefined)
    if (dog?.dnaProfile) {
      dogData.dnaProfile = dog.dnaProfile;
    }

    // Only add guardianHome if status is guardian and it exists
    if (programStatus === 'guardian' && guardianHome) {
      dogData.guardianHome = guardianHome;
    }

    console.log('Saving dog with data:', {
      programStatus,
      guardianHome,
      registration,
      dogData,
    });

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

  const handleRequestSireConnection = async () => {
    if (!externalSire || !currentUser || !profile) return;

    try {
      const requestData: any = {
        requesterId: currentUser.uid,
        requesterKennelName:
          profile.kennelName || profile.breederName || 'Unknown',
        ownerId: externalSire.ownerId,
        ownerKennelName: externalSire.ownerKennel,
        dogId: externalSire.dogId,
        dogName: externalSire.dogName,
        purpose: 'sire' as const,
        requestDate: new Date().toISOString(),
      };

      if (externalSire.registrationNumber) {
        requestData.dogRegistrationNumber = externalSire.registrationNumber;
      }
      if (dog?.name) {
        requestData.message = `Requesting connection to use as sire for ${dog.name}`;
      }

      const requestId = await createConnectionRequest(requestData);

      // Update external sire with connection request info
      const updatedSire = { ...externalSire } as DogSearchResult & {
        connectionRequestId?: string;
        connectionStatus?: 'pending' | 'approved' | 'declined' | 'cancelled';
      };
      updatedSire.connectionRequestId = requestId;
      updatedSire.connectionStatus = 'pending';
      setExternalSire(updatedSire);

      // Save the dog document immediately with updated connection status
      if (dog) {
        await updateDog(dog.id, {
          externalSire: {
            name: externalSire.dogName,
            registrationNumber: externalSire.registrationNumber,
            breed: externalSire.breed,
            kennelName: externalSire.ownerKennel,
            breederName: externalSire.ownerBreederName,
            connectionRequestId: requestId,
            connectionStatus: 'pending',
            ownerId: externalSire.ownerId,
            dogId: externalSire.dogId,
          },
        });
      }

      // Create notification for owner
      await addNotification({
        userId: externalSire.ownerId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${
          profile.kennelName || profile.breederName
        } wants to connect with ${externalSire.dogName}`,
        relatedId: requestId,
        read: false,
      });

      // Send email notification if configured
      const ownerProfileDoc = await getDoc(
        doc(db, 'breederProfiles', externalSire.ownerId)
      );
      const ownerProfile = ownerProfileDoc.data();

      if (
        ownerProfile?.emailjsPublicKey &&
        ownerProfile?.emailjsServiceId &&
        ownerProfile?.emailjsConnectionRequestTemplateId &&
        ownerProfile?.enableConnectionRequestNotifications !== false
      ) {
        try {
          const notificationEmail =
            ownerProfile.notificationEmail || ownerProfile.email;

          await emailjs.send(
            ownerProfile.emailjsServiceId,
            ownerProfile.emailjsConnectionRequestTemplateId,
            {
              to_email: notificationEmail,
              to_name: ownerProfile.kennelName || ownerProfile.breederName,
              requester_name: profile.kennelName || profile.breederName,
              dog_name: externalSire.dogName,
              dog_registration: externalSire.registrationNumber || 'N/A',
              purpose: 'Sire (Father)',
              message: dog?.name
                ? `Requesting connection to use as sire for ${dog.name}`
                : '',
              connections_url: `${window.location.origin}/connections`,
            },
            ownerProfile.emailjsPublicKey
          );
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }

      toast({
        title: 'Connection Request Sent',
        description: `Request sent to ${externalSire.ownerKennel}`,
      });
    } catch (error) {
      console.error('Error creating connection request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send connection request',
        variant: 'destructive',
      });
    }
  };

  const handleSireSearch = async () => {
    if (!sireSearchTerm.trim() || !currentUser) return;

    setSireSearching(true);
    setSireSearchResults([]);

    try {
      const results = await searchDogs(sireSearchTerm, currentUser.uid);
      const maleResults = results.filter((r) => r.sex === 'male');

      if (maleResults.length > 0) {
        setSireSearchResults(maleResults);
      } else {
        toast({
          title: 'No males found',
          description:
            'No male dogs found matching your search. Try different keywords.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching for sire:', error);
      toast({
        title: 'Search error',
        description: 'Failed to search for dogs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSireSearching(false);
    }
  };

  const handleRequestDamConnection = async () => {
    if (!externalDam || !currentUser || !profile) return;

    try {
      const requestData: any = {
        requesterId: currentUser.uid,
        requesterKennelName:
          profile.kennelName || profile.breederName || 'Unknown',
        ownerId: externalDam.ownerId,
        ownerKennelName: externalDam.ownerKennel,
        dogId: externalDam.dogId,
        dogName: externalDam.dogName,
        purpose: 'dam' as const,
        requestDate: new Date().toISOString(),
      };

      if (externalDam.registrationNumber) {
        requestData.dogRegistrationNumber = externalDam.registrationNumber;
      }
      if (dog?.name) {
        requestData.message = `Requesting connection to use as dam for ${dog.name}`;
      }

      const requestId = await createConnectionRequest(requestData);

      // Update external dam with connection request info
      const updatedDam = { ...externalDam } as DogSearchResult & {
        connectionRequestId?: string;
        connectionStatus?: 'pending' | 'approved' | 'declined' | 'cancelled';
      };
      updatedDam.connectionRequestId = requestId;
      updatedDam.connectionStatus = 'pending';
      setExternalDam(updatedDam);

      // Save the dog document immediately with updated connection status
      if (dog) {
        await updateDog(dog.id, {
          externalDam: {
            name: externalDam.dogName,
            registrationNumber: externalDam.registrationNumber,
            breed: externalDam.breed,
            kennelName: externalDam.ownerKennel,
            breederName: externalDam.ownerBreederName,
            connectionRequestId: requestId,
            connectionStatus: 'pending',
            ownerId: externalDam.ownerId,
            dogId: externalDam.dogId,
          },
        });
      }

      // Create notification for owner
      await addNotification({
        userId: externalDam.ownerId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${
          profile.kennelName || profile.breederName
        } wants to connect with ${externalDam.dogName}`,
        relatedId: requestId,
        read: false,
      });

      // Send email notification if configured
      const ownerProfileDoc = await getDoc(
        doc(db, 'breederProfiles', externalDam.ownerId)
      );
      const ownerProfile = ownerProfileDoc.data();

      if (
        ownerProfile?.emailjsPublicKey &&
        ownerProfile?.emailjsServiceId &&
        ownerProfile?.emailjsConnectionRequestTemplateId &&
        ownerProfile?.enableConnectionRequestNotifications !== false
      ) {
        try {
          const notificationEmail =
            ownerProfile.notificationEmail || ownerProfile.email;

          await emailjs.send(
            ownerProfile.emailjsServiceId,
            ownerProfile.emailjsConnectionRequestTemplateId,
            {
              to_email: notificationEmail,
              to_name: ownerProfile.kennelName || ownerProfile.breederName,
              requester_name: profile.kennelName || profile.breederName,
              dog_name: externalDam.dogName,
              dog_registration: externalDam.registrationNumber || 'N/A',
              purpose: 'Dam (Mother)',
              message: dog?.name
                ? `Requesting connection to use as dam for ${dog.name}`
                : '',
              connections_url: `${window.location.origin}/connections`,
            },
            ownerProfile.emailjsPublicKey
          );
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }

      toast({
        title: 'Connection Request Sent',
        description: `Request sent to ${externalDam.ownerKennel}`,
      });
    } catch (error) {
      console.error('Error creating connection request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send connection request',
        variant: 'destructive',
      });
    }
  };

  const handleDamSearch = async () => {
    if (!damSearchTerm.trim() || !currentUser) return;

    setDamSearching(true);
    setDamSearchResults([]);

    try {
      const results = await searchDogs(damSearchTerm, currentUser.uid);
      const femaleResults = results.filter((r) => r.sex === 'female');

      if (femaleResults.length > 0) {
        setDamSearchResults(femaleResults);
      } else {
        toast({
          title: 'No females found',
          description:
            'No female dogs found matching your search. Try different keywords.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching for dam:', error);
      toast({
        title: 'Search error',
        description: 'Failed to search for dogs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDamSearching(false);
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
                    <Input
                      placeholder='Boots'
                      {...field}
                      value={field.value || ''}
                    />
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Sire Selection */}
            <div className='space-y-2'>
              <Label>Sire (Father)</Label>

              {!sireSearchMode && !externalSire ? (
                <div className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='sireId'
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === 'none' ? '' : value)
                          }
                          value={field.value || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select sire from your dogs' />
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
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSireSearchMode(true);
                      form.setValue('sireId', '');
                    }}
                  >
                    <Search className='h-4 w-4 mr-2' />
                    Search External Sire
                  </Button>
                </div>
              ) : externalSire ? (
                <div className='space-y-2'>
                  <div className='p-3 bg-muted rounded-lg'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <div className='text-sm font-semibold text-muted-foreground'>
                          External Sire
                        </div>
                        <div className='font-bold'>{externalSire.dogName}</div>
                        <div className='text-sm text-muted-foreground'>
                          {externalSire.breed && (
                            <span>{externalSire.breed}</span>
                          )}
                          {externalSire.registrationNumber && (
                            <span> • {externalSire.registrationNumber}</span>
                          )}
                        </div>
                        <div className='text-sm text-muted-foreground mt-1'>
                          Owner: {externalSire.ownerKennel}
                        </div>
                        {(
                          externalSire as DogSearchResult & {
                            connectionStatus?: string;
                          }
                        ).connectionStatus && (
                          <Badge
                            variant={
                              (
                                externalSire as DogSearchResult & {
                                  connectionStatus?: string;
                                }
                              ).connectionStatus === 'approved'
                                ? 'default'
                                : 'secondary'
                            }
                            className='mt-2'
                          >
                            {(
                              externalSire as DogSearchResult & {
                                connectionStatus?: string;
                              }
                            ).connectionStatus === 'pending' &&
                              'Request Pending'}
                            {(
                              externalSire as DogSearchResult & {
                                connectionStatus?: string;
                              }
                            ).connectionStatus === 'approved' && 'Connected'}
                            {(
                              externalSire as DogSearchResult & {
                                connectionStatus?: string;
                              }
                            ).connectionStatus === 'declined' &&
                              'Request Declined'}
                            {(
                              externalSire as DogSearchResult & {
                                connectionStatus?: string;
                              }
                            ).connectionStatus === 'cancelled' &&
                              'Request Cancelled'}
                          </Badge>
                        )}
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setExternalSire(null);
                          setSireSearchMode(false);
                          setSireSearchResults([]);
                          setSireSearchTerm('');
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                  {!(
                    externalSire as DogSearchResult & {
                      connectionRequestId?: string;
                    }
                  ).connectionRequestId && (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleRequestSireConnection}
                    >
                      <Link2 className='h-4 w-4 mr-2' />
                      Request Connection
                    </Button>
                  )}
                </div>
              ) : (
                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      value={sireSearchTerm}
                      onChange={(e) => setSireSearchTerm(e.target.value)}
                      placeholder='Search by name, reg #, kennel, or breeder...'
                      disabled={sireSearching}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSireSearch();
                        }
                      }}
                    />
                    <Button
                      type='button'
                      onClick={handleSireSearch}
                      disabled={sireSearching || !sireSearchTerm.trim()}
                      size='icon'
                    >
                      {sireSearching ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Search className='h-4 w-4' />
                      )}
                    </Button>
                  </div>

                  {sireSearchResults.length > 0 && (
                    <div className='border rounded-lg max-h-48 overflow-y-auto'>
                      <div className='text-sm font-medium p-2 bg-muted'>
                        Found {sireSearchResults.length} male
                        {sireSearchResults.length !== 1 ? 's' : ''} - Click to
                        select:
                      </div>
                      {sireSearchResults.map((dog) => (
                        <button
                          key={dog.dogId}
                          type='button'
                          onClick={() => {
                            setExternalSire(dog);
                            setSireSearchResults([]);
                            form.setValue('sireId', '');
                          }}
                          className='w-full text-left p-3 hover:bg-accent border-b last:border-b-0 transition-colors'
                        >
                          <div className='font-semibold'>{dog.dogName}</div>
                          <div className='text-sm text-muted-foreground'>
                            {dog.breed && <span>{dog.breed}</span>}
                            {dog.registrationNumber && (
                              <span> • {dog.registrationNumber}</span>
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground mt-1'>
                            Owner: {dog.ownerKennel}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSireSearchMode(false);
                      setSireSearchResults([]);
                      setSireSearchTerm('');
                    }}
                  >
                    Use My Dogs Instead
                  </Button>
                </div>
              )}
            </div>

            {/* Dam Selection */}
            <div className='space-y-2'>
              <Label>Dam (Mother)</Label>

              {!damSearchMode && !externalDam ? (
                <div className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='damId'
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === 'none' ? '' : value)
                          }
                          value={field.value || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select dam from your dogs' />
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
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setDamSearchMode(true);
                      form.setValue('damId', '');
                    }}
                  >
                    <Search className='h-4 w-4 mr-2' />
                    Search External Dam
                  </Button>
                </div>
              ) : externalDam ? (
                <div className='space-y-2'>
                  <div className='p-3 bg-muted rounded-lg'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <div className='text-sm font-semibold text-muted-foreground'>
                          External Dam
                        </div>
                        <div className='font-bold'>{externalDam.dogName}</div>
                        <div className='text-sm text-muted-foreground'>
                          {externalDam.breed && (
                            <span>{externalDam.breed}</span>
                          )}
                          {externalDam.registrationNumber && (
                            <span> • {externalDam.registrationNumber}</span>
                          )}
                        </div>
                        <div className='text-sm text-muted-foreground mt-1'>
                          Owner: {externalDam.ownerKennel}
                        </div>
                        {(
                          externalDam as DogSearchResult & {
                            connectionStatus?: string;
                          }
                        ).connectionStatus && (
                          <Badge
                            variant={
                              (
                                externalDam as DogSearchResult & {
                                  connectionStatus?: string;
                                }
                              ).connectionStatus === 'approved'
                                ? 'default'
                                : 'secondary'
                            }
                            className='mt-2'
                          >
                            {(
                              externalDam as DogSearchResult & {
                                connectionStatus?: string;
                              }
                            ).connectionStatus === 'pending' &&
                              'Request Pending'}
                            {(
                              externalDam as DogSearchResult & {
                                connectionStatus?: string;
                              }
                            ).connectionStatus === 'approved' && 'Connected'}
                            {(
                              externalDam as DogSearchResult & {
                                connectionStatus?: string;
                              }
                            ).connectionStatus === 'declined' &&
                              'Request Declined'}
                            {(
                              externalDam as DogSearchResult & {
                                connectionStatus?: string;
                              }
                            ).connectionStatus === 'cancelled' &&
                              'Request Cancelled'}
                          </Badge>
                        )}
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setExternalDam(null);
                          setDamSearchMode(false);
                          setDamSearchResults([]);
                          setDamSearchTerm('');
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                  {!(
                    externalDam as DogSearchResult & {
                      connectionRequestId?: string;
                    }
                  ).connectionRequestId && (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleRequestDamConnection}
                    >
                      <Link2 className='h-4 w-4 mr-2' />
                      Request Connection
                    </Button>
                  )}
                </div>
              ) : (
                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      value={damSearchTerm}
                      onChange={(e) => setDamSearchTerm(e.target.value)}
                      placeholder='Search by name, reg #, kennel, or breeder...'
                      disabled={damSearching}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleDamSearch();
                        }
                      }}
                    />
                    <Button
                      type='button'
                      onClick={handleDamSearch}
                      disabled={damSearching || !damSearchTerm.trim()}
                      size='icon'
                    >
                      {damSearching ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Search className='h-4 w-4' />
                      )}
                    </Button>
                  </div>

                  {damSearchResults.length > 0 && (
                    <div className='border rounded-lg max-h-48 overflow-y-auto'>
                      <div className='text-sm font-medium p-2 bg-muted'>
                        Found {damSearchResults.length} female
                        {damSearchResults.length !== 1 ? 's' : ''} - Click to
                        select:
                      </div>
                      {damSearchResults.map((dog) => (
                        <button
                          key={dog.dogId}
                          type='button'
                          onClick={() => {
                            setExternalDam(dog);
                            setDamSearchResults([]);
                            form.setValue('damId', '');
                          }}
                          className='w-full text-left p-3 hover:bg-accent border-b last:border-b-0 transition-colors'
                        >
                          <div className='font-semibold'>{dog.dogName}</div>
                          <div className='text-sm text-muted-foreground'>
                            {dog.breed && <span>{dog.breed}</span>}
                            {dog.registrationNumber && (
                              <span> • {dog.registrationNumber}</span>
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground mt-1'>
                            Owner: {dog.ownerKennel}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setDamSearchMode(false);
                      setDamSearchResults([]);
                      setDamSearchTerm('');
                    }}
                  >
                    Use My Dogs Instead
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Program Status & Guardian Home */}
          <div className='space-y-4 border-t pt-4'>
            <h3 className='font-semibold text-lg'>Breeder Program</h3>

            <div>
              <Label>Program Status</Label>
              <Select
                value={programStatus || 'owned'}
                onValueChange={(value) =>
                  setProgramStatus(
                    value as
                      | 'owned'
                      | 'guardian'
                      | 'external_stud'
                      | 'co-owned'
                      | 'retired'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='owned'>Owned by Program</SelectItem>
                  <SelectItem value='guardian'>Guardian Home</SelectItem>
                  <SelectItem value='external_stud'>External Stud</SelectItem>
                  <SelectItem value='co-owned'>Co-Owned</SelectItem>
                  <SelectItem value='retired'>Retired</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground mt-1'>
                {programStatus === 'owned' &&
                  'Dog is owned and kept at your kennel'}
                {programStatus === 'guardian' &&
                  'Dog lives in a guardian home with breeding rights'}
                {programStatus === 'external_stud' &&
                  'Stud service from another breeder'}
                {programStatus === 'co-owned' &&
                  'Shared ownership with another party'}
                {programStatus === 'retired' &&
                  'Dog is retired from breeding program'}
              </p>
            </div>

            {programStatus === 'guardian' && (
              <div className='space-y-2'>
                <Button
                  type='button'
                  variant='default'
                  size='sm'
                  onClick={() => setGuardianDialogOpen(true)}
                >
                  {guardianHome ? 'Edit Guardian Info' : 'Add Guardian Info'}
                </Button>
                {guardianHome && (
                  <div className='p-3 border rounded-md bg-muted/50'>
                    <p className='font-medium'>{guardianHome.guardianName}</p>
                    {guardianHome.email && (
                      <p className='text-sm text-muted-foreground'>
                        {guardianHome.email}
                      </p>
                    )}
                    <p className='text-sm mt-1'>
                      Contract: {guardianHome.littersCompleted} /{' '}
                      {guardianHome.littersAllowed} litters
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
            <label
              className={`border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition ${
                uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploadingPhoto ? (
                <>
                  <Upload className='h-8 w-8 text-muted-foreground animate-pulse' />
                  <span className='text-xs text-muted-foreground mt-2'>
                    Uploading...
                  </span>
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
            <p className='text-muted-foreground'>No health tests recorded</p>
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
                  <SelectItem value='AKC'>
                    AKC (American Kennel Club)
                  </SelectItem>
                  <SelectItem value='CKC'>
                    CKC (Canadian Kennel Club)
                  </SelectItem>
                  <SelectItem value='UKC'>UKC (United Kennel Club)</SelectItem>
                  <SelectItem value='FCI'>
                    FCI (Fédération Cynologique)
                  </SelectItem>
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
                  <Label htmlFor='registrationNumber'>
                    Registration Number
                  </Label>
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
