import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectionStore } from '@breeder/firebase';
import { useDogStore } from '@breeder/firebase';
import { useAdminStore } from '@breeder/firebase';
import { useBreederStore } from '@breeder/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Link2,
  Send,
  Inbox,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Users,
} from 'lucide-react';
import { ConnectionRequestDialog } from '@/components/ConnectionRequestDialog';
import { DataSharingPreferencesDialog } from '@/components/DataSharingPreferencesDialog';
import { DeclineRequestDialog } from '@/components/DeclineRequestDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { format } from 'date-fns';
import { DogConnectionRequest, DogSharingPreferences, Dog } from '@breeder/types';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@breeder/firebase';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/lib/emailjs';

export function Connections() {
  const { currentUser } = useAuth();
  const {
    incomingRequests,
    outgoingRequests,
    subscribeToConnectionRequests,
    approveConnectionRequest,
    declineConnectionRequest,
    cancelConnectionRequest,
    deleteConnectionRequest,
    addNotification,
  } = useConnectionStore();
  const { addDog, dogs, deleteDog, updateDog, subscribeToUserData } =
    useDogStore();
  const impersonatedUserId = useAdminStore((s) => s.impersonatedUserId);
  const profile = useBreederStore((state) => state.profile);
  const { toast } = useToast();

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [editSharingDialogOpen, setEditSharingDialogOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<DogConnectionRequest | null>(null);
  const [selectedConnectedDog, setSelectedConnectedDog] = useState<Dog | null>(
    null
  );

  // Get all connected dogs (dogs that are linked from other kennels)
  const connectedDogs = dogs.filter((dog) => dog.isConnectedDog);

  // Get approved connections (both incoming and outgoing)
  const approvedIncoming = incomingRequests.filter(
    (r) => r.status === 'approved'
  );
  const approvedOutgoing = outgoingRequests.filter(
    (r) => r.status === 'approved'
  );

  // Sort requests by date descending (newest first)
  const sortedIncomingRequests = [...incomingRequests].sort((a, b) => {
    const dateA = new Date(a.requestDate).getTime();
    const dateB = new Date(b.requestDate).getTime();
    return dateB - dateA;
  });

  const sortedOutgoingRequests = [...outgoingRequests].sort((a, b) => {
    const dateA = new Date(a.requestDate).getTime();
    const dateB = new Date(b.requestDate).getTime();
    return dateB - dateA;
  });

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToConnectionRequests(currentUser.uid);
      return () => unsubscribe();
    }
  }, [currentUser, subscribeToConnectionRequests]);

  useEffect(() => {
    const targetUid = impersonatedUserId || currentUser?.uid;
    if (!targetUid) return;
    const unsubscribe = subscribeToUserData(targetUid);
    return () => unsubscribe();
  }, [subscribeToUserData, impersonatedUserId, currentUser?.uid]);

  const sendEmailNotification = async (
    recipientUserId: string,
    templateType: 'approved' | 'declined',
    dogName: string,
    responseMessage?: string
  ) => {
    try {
      const recipientProfileDoc = await getDoc(
        doc(db, 'breederProfiles', recipientUserId)
      );
      if (!recipientProfileDoc.exists()) return;

      const recipientProfile = recipientProfileDoc.data();
      if (recipientProfile.enableConnectionRequestNotifications === false)
        return;

      const publicKey =
        recipientProfile.emailjsPublicKey || EMAILJS_CONFIG.PUBLIC_KEY;
      const serviceId =
        recipientProfile.emailjsServiceId || EMAILJS_CONFIG.SERVICE_ID;
      const templateId = recipientProfile.emailjsConnectionRequestTemplateId;

      if (!publicKey || !serviceId || !templateId) return;

      const notificationEmail =
        recipientProfile.notificationEmail || recipientProfile.email;
      const connectionsUrl = `${window.location.origin}/connections`;
      const ownerKennelName =
        profile?.kennelName || profile?.breederName || 'A breeder';

      const subject =
        templateType === 'approved'
          ? `Connection Request Approved - ${dogName}`
          : `Connection Request Declined - ${dogName}`;

      const mainMessage =
        templateType === 'approved'
          ? `${ownerKennelName} has approved your connection request for "${dogName}".`
          : `${ownerKennelName} has declined your connection request for "${dogName}".`;

      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: notificationEmail,
          to_name:
            recipientProfile.kennelName ||
            recipientProfile.breederName ||
            'Breeder',
          subject,
          message: mainMessage,
          dog_name: dogName,
          owner_name: ownerKennelName,
          response_message: responseMessage || 'No additional message',
          connections_url: connectionsUrl,
          status: templateType,
        },
        publicKey
      );
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  };

  const handleApproveClick = (request: DogConnectionRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const handleDeclineClick = (request: DogConnectionRequest) => {
    setSelectedRequest(request);
    setDeclineDialogOpen(true);
  };

  const handleApprove = async (
    preferences: DogSharingPreferences,
    responseMessage?: string
  ) => {
    if (!selectedRequest || !currentUser) return;

    try {
      // Fetch the original dog data
      const dogRef = doc(db, 'dogs', selectedRequest.dogId);
      const dogSnap = await getDoc(dogRef);

      if (!dogSnap.exists()) {
        toast({
          title: 'Error',
          description: 'Dog not found',
          variant: 'destructive',
        });
        return;
      }

      const originalDog = { id: dogSnap.id, ...dogSnap.data() } as Dog;

      // Create a linked dog entry for the requester with only shared fields
      const linkedDog: Partial<Dog> = {
        userId: selectedRequest.requesterId,
        isConnectedDog: true,
        connectionRequestId: selectedRequest.id,
        originalDogId: selectedRequest.dogId, // Store the original dog's Firebase ID
        originalOwnerId: currentUser.uid,
        originalOwnerKennel: selectedRequest.ownerKennelName,
        sharingPreferences: preferences,
        lastSyncDate: new Date().toISOString(),
      };

      // Copy fields based on sharing preferences
      if (preferences.shareBasicInfo) {
        linkedDog.name = originalDog.name;
        linkedDog.sex = originalDog.sex;
        linkedDog.breed = originalDog.breed;
        linkedDog.color = originalDog.color;
      }

      if (preferences.shareRegistration) {
        if (originalDog.registrationNumber) {
          linkedDog.registrationNumber = originalDog.registrationNumber;
        }
        if (originalDog.microchipNumber) {
          linkedDog.microchipNumber = originalDog.microchipNumber;
        }
      }

      if (preferences.sharePhoto && originalDog.profileImage) {
        linkedDog.profileImage = originalDog.profileImage;
      }

      if (preferences.shareDateOfBirth) {
        linkedDog.dateOfBirth = originalDog.dateOfBirth;
      }

      if (preferences.sharePedigree) {
        if (originalDog.sireId) {
          linkedDog.sireId = originalDog.sireId;
        }
        if (originalDog.damId) {
          linkedDog.damId = originalDog.damId;
        }
        if (originalDog.sireName) {
          linkedDog.sireName = originalDog.sireName;
        }
        if (originalDog.damName) {
          linkedDog.damName = originalDog.damName;
        }
      }

      if (preferences.shareHealthTests && originalDog.healthTests) {
        linkedDog.healthTests = originalDog.healthTests;
      }

      if (preferences.shareHealthRecords && originalDog.healthRecords) {
        linkedDog.healthRecords = originalDog.healthRecords;
      }

      if (preferences.shareVaccinations && originalDog.vaccinations) {
        linkedDog.vaccinations = originalDog.vaccinations;
      }

      if (preferences.shareDnaProfile && originalDog.dnaProfile) {
        linkedDog.dnaProfile = originalDog.dnaProfile;
      }

      if (preferences.shareTitles && originalDog.titles) {
        linkedDog.titles = originalDog.titles;
      }

      if (preferences.shareShows && originalDog.shows) {
        linkedDog.shows = originalDog.shows;
      }

      if (preferences.shareBreedingHistory) {
        linkedDog.litters = originalDog.litters;
      }

      if (preferences.shareBreedingRights) {
        linkedDog.breedingRights = originalDog.breedingRights;
      }

      // Add the linked dog to requester's account (not the current viewer)
      const newDogId = await addDog(
        linkedDog as Dog,
        selectedRequest.requesterId
      );

      // Update the connection request with approval
      await approveConnectionRequest(
        selectedRequest.id,
        preferences,
        responseMessage
      );

      // Send notification to the requester
      await addNotification({
        userId: selectedRequest.requesterId,
        type: 'connection_approved',
        title: 'Connection Request Approved',
        message: `${selectedRequest.ownerKennelName} has approved your request to connect with "${selectedRequest.dogName}"`,
        relatedId: selectedRequest.id,
        relatedType: 'dog_connection',
      });

      // Send email notification
      await sendEmailNotification(
        selectedRequest.requesterId,
        'approved',
        selectedRequest.dogName,
        responseMessage
      );

      toast({
        title: 'Request Approved',
        description: `Connection request approved. Dog data has been shared with ${selectedRequest.requesterKennelName}.`,
      });

      setApproveDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve connection request',
        variant: 'destructive',
      });
    }
  };

  const handleDecline = async (responseMessage?: string) => {
    if (!selectedRequest) return;

    try {
      await declineConnectionRequest(selectedRequest.id, responseMessage);

      // Send notification to the requester
      await addNotification({
        userId: selectedRequest.requesterId,
        type: 'connection_declined',
        title: 'Connection Request Declined',
        message: `${selectedRequest.ownerKennelName} has declined your request to connect with "${selectedRequest.dogName}"`,
        relatedId: selectedRequest.id,
        relatedType: 'dog_connection',
      });

      // Send email notification
      await sendEmailNotification(
        selectedRequest.requesterId,
        'declined',
        selectedRequest.dogName,
        responseMessage
      );

      toast({
        title: 'Request Declined',
        description: 'Connection request has been declined.',
      });

      setDeclineDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline connection request',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await cancelConnectionRequest(requestId);

      toast({
        title: 'Request Cancelled',
        description: 'Connection request has been cancelled.',
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel connection request',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRequest = (request: DogConnectionRequest) => {
    setSelectedRequest(request);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteRequest = async () => {
    if (!selectedRequest) return;

    try {
      await deleteConnectionRequest(selectedRequest.id);
      toast({
        title: 'Request Deleted',
        description: 'Connection request has been deleted.',
      });
      setConfirmDeleteOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete connection request',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveConnection = (dog: Dog) => {
    setSelectedConnectedDog(dog);
    setConfirmRemoveOpen(true);
  };

  const confirmRemoveConnection = async () => {
    if (!selectedConnectedDog) return;

    try {
      await deleteDog(selectedConnectedDog.id);
      toast({
        title: 'Connection Removed',
        description: `${selectedConnectedDog.name} has been removed from your dogs.`,
      });
      setConfirmRemoveOpen(false);
      setSelectedConnectedDog(null);
    } catch (error) {
      console.error('Error removing connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove connection',
        variant: 'destructive',
      });
    }
  };

  const handleEditSharing = (dog: Dog) => {
    // Find the corresponding connection request
    const request = approvedOutgoing.find(
      (r) => r.id === dog.connectionRequestId
    );
    if (request) {
      setSelectedRequest(request);
      setSelectedConnectedDog(dog);
      setEditSharingDialogOpen(true);
    }
  };

  const handleUpdateSharing = async (preferences: DogSharingPreferences) => {
    if (!selectedConnectedDog || !currentUser) return;

    try {
      // Note: This would require the owner to update sharing preferences
      // For now, we'll just show a message that this needs owner approval
      toast({
        title: 'Update Request',
        description:
          'Sharing preference updates must be requested from the dog owner.',
        variant: 'default',
      });
      setEditSharingDialogOpen(false);
      setSelectedConnectedDog(null);
    } catch (error) {
      console.error('Error updating sharing preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sharing preferences',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      declined: 'bg-red-500',
      cancelled: 'bg-gray-500',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-500'}>{status}</Badge>
    );
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      sire: 'Sire',
      dam: 'Dam',
      offspring: 'Offspring',
      relative: 'Relative',
      reference: 'Reference',
    };
    return labels[purpose] || purpose;
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Dog Connections</h1>
          <p className='text-muted-foreground'>
            Connect dogs from other kennels to build comprehensive pedigrees
          </p>
        </div>
        <Button onClick={() => setRequestDialogOpen(true)}>
          <Plus className='h-4 w-4 mr-2' />
          New Connection Request
        </Button>
      </div>

      <Tabs defaultValue='connections' className='w-full'>
        <TabsList>
          <TabsTrigger value='connections'>
            <Users className='h-4 w-4 mr-2' />
            My Connections
            {connectedDogs.length > 0 && (
              <Badge className='ml-2'>{connectedDogs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='incoming'>
            <Inbox className='h-4 w-4 mr-2' />
            Incoming Requests
            {incomingRequests.filter((r) => r.status === 'pending').length >
              0 && (
              <Badge className='ml-2 bg-red-500'>
                {incomingRequests.filter((r) => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='outgoing'>
            <Send className='h-4 w-4 mr-2' />
            Outgoing Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value='connections' className='space-y-4'>
          {connectedDogs.length === 0 ? (
            <Card className='p-8 text-center'>
              <Users className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <p className='text-muted-foreground mb-4'>
                No connected dogs yet
              </p>
              <p className='text-sm text-muted-foreground mb-4'>
                Connected dogs are dogs from other kennels that you've requested
                access to. They'll appear in your dog list and can be used in
                pedigrees.
              </p>
              <Button onClick={() => setRequestDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Request Your First Connection
              </Button>
            </Card>
          ) : (
            <div className='space-y-4'>
              <Card className='p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'>
                <p className='text-sm text-blue-800 dark:text-blue-200'>
                  <CheckCircle className='h-4 w-4 inline mr-2' />
                  You have {connectedDogs.length} connected dog
                  {connectedDogs.length !== 1 ? 's' : ''} from other kennels.
                  These dogs appear in your dog list and can be used as parents
                  in pedigrees.
                </p>
              </Card>
              {connectedDogs.map((dog) => (
                <Card key={dog.id} className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='space-y-3 flex-1'>
                      <div className='flex items-center gap-3'>
                        {dog.profileImage && (
                          <img
                            src={dog.profileImage}
                            alt={dog.name}
                            className='h-16 w-16 rounded-full object-cover'
                          />
                        )}
                        <div>
                          <div className='font-semibold text-lg'>
                            {dog.name}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {dog.breed} •{' '}
                            {dog.sex === 'male' ? 'Male' : 'Female'}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Owner: {dog.originalOwnerKennel}
                          </div>
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        {dog.registrationNumber && (
                          <div>
                            <span className='font-medium'>Registration:</span>{' '}
                            {dog.registrationNumber}
                          </div>
                        )}
                        {dog.dateOfBirth && (
                          <div>
                            <span className='font-medium'>DOB:</span>{' '}
                            {format(new Date(dog.dateOfBirth), 'MMM d, yyyy')}
                          </div>
                        )}
                        {dog.lastSyncDate && (
                          <div className='col-span-2'>
                            <span className='font-medium'>Last Updated:</span>{' '}
                            {format(new Date(dog.lastSyncDate), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>

                      {dog.sharingPreferences && (
                        <div className='p-3 bg-muted rounded text-sm'>
                          <div className='font-medium mb-2'>
                            Shared Information:
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {dog.sharingPreferences.shareBasicInfo && (
                              <Badge variant='secondary'>Basic Info</Badge>
                            )}
                            {dog.sharingPreferences.shareRegistration && (
                              <Badge variant='secondary'>Registration</Badge>
                            )}
                            {dog.sharingPreferences.sharePedigree && (
                              <Badge variant='secondary'>Pedigree</Badge>
                            )}
                            {dog.sharingPreferences.sharePhoto && (
                              <Badge variant='secondary'>Photo</Badge>
                            )}
                            {dog.sharingPreferences.shareHealthTests && (
                              <Badge variant='secondary'>Health Tests</Badge>
                            )}
                            {dog.sharingPreferences.shareDnaProfile && (
                              <Badge variant='secondary'>DNA Profile</Badge>
                            )}
                            {dog.sharingPreferences.shareDateOfBirth && (
                              <Badge variant='secondary'>Date of Birth</Badge>
                            )}
                            {dog.sharingPreferences.shareTitles && (
                              <Badge variant='secondary'>Titles</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className='flex gap-2 ml-4'>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleRemoveConnection(dog)}
                        title='Remove this connection'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='incoming' className='space-y-4'>
          {sortedIncomingRequests.length === 0 ? (
            <Card className='p-8 text-center'>
              <Inbox className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <p className='text-muted-foreground'>
                No incoming connection requests
              </p>
            </Card>
          ) : (
            sortedIncomingRequests.map((request) => (
              <Card key={request.id} className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-2 flex-1'>
                    <div className='flex items-center gap-3'>
                      <Link2 className='h-5 w-5 text-primary' />
                      <div>
                        <div className='font-semibold text-lg'>
                          {request.dogName}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          Registration:{' '}
                          {request.dogRegistrationNumber || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='font-medium'>From:</span>{' '}
                        {request.requesterKennelName}
                      </div>
                      <div>
                        <span className='font-medium'>Purpose:</span>{' '}
                        {getPurposeLabel(request.purpose)}
                      </div>
                      <div>
                        <span className='font-medium'>Date:</span>{' '}
                        {format(new Date(request.requestDate), 'MMM d, yyyy')}
                      </div>
                      <div>
                        <span className='font-medium'>Status:</span>{' '}
                        {getStatusBadge(request.status)}
                      </div>
                    </div>

                    {request.purposeDetails && (
                      <div className='text-sm'>
                        <span className='font-medium'>Details:</span>{' '}
                        {request.purposeDetails}
                      </div>
                    )}

                    {request.message && (
                      <div className='p-3 bg-muted rounded text-sm'>
                        <div className='font-medium mb-1'>Message:</div>
                        {request.message}
                      </div>
                    )}

                    {request.responseMessage && (
                      <div className='p-3 bg-blue-50 border border-blue-200 rounded text-sm'>
                        <div className='font-medium mb-1'>Your Response:</div>
                        {request.responseMessage}
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className='flex gap-2 ml-4'>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleDeclineClick(request)}
                      >
                        Decline
                      </Button>
                      <Button
                        size='sm'
                        variant='default'
                        onClick={() => handleApproveClick(request)}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value='outgoing' className='space-y-4'>
          {sortedOutgoingRequests.length === 0 ? (
            <Card className='p-8 text-center'>
              <Send className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <p className='text-muted-foreground mb-4'>
                No outgoing connection requests
              </p>
              <Button onClick={() => setRequestDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Create Your First Request
              </Button>
            </Card>
          ) : (
            sortedOutgoingRequests.map((request) => (
              <Card key={request.id} className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-2 flex-1'>
                    <div className='flex items-center gap-3'>
                      <Link2 className='h-5 w-5 text-primary' />
                      <div>
                        <div className='font-semibold text-lg'>
                          {request.dogName}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          Owner: {request.ownerKennelName}
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='font-medium'>Purpose:</span>{' '}
                        {getPurposeLabel(request.purpose)}
                      </div>
                      <div>
                        <span className='font-medium'>Requested:</span>{' '}
                        {format(
                          new Date(request.requestDate),
                          'MMM d, yyyy h:mm a'
                        )}
                      </div>
                      <div className='col-span-2'>
                        <span className='font-medium'>Status:</span>{' '}
                        {getStatusBadge(request.status)}
                      </div>
                    </div>

                    {request.responseMessage && (
                      <div className='p-3 bg-muted rounded text-sm'>
                        <div className='font-medium mb-1'>
                          Owner's Response:
                        </div>
                        {request.responseMessage}
                      </div>
                    )}
                  </div>

                  <div className='ml-4 flex gap-2'>
                    {request.status === 'pending' ? (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleCancel(request.id)}
                      >
                        Cancel Request
                      </Button>
                    ) : (
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleDeleteRequest(request)}
                        title='Delete this request'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <ConnectionRequestDialog
        open={requestDialogOpen}
        setOpen={setRequestDialogOpen}
      />

      {selectedRequest && (
        <>
          <DataSharingPreferencesDialog
            open={approveDialogOpen}
            setOpen={setApproveDialogOpen}
            dogName={selectedRequest.dogName}
            requesterName={selectedRequest.requesterKennelName}
            onApprove={handleApprove}
          />

          <DeclineRequestDialog
            open={declineDialogOpen}
            setOpen={setDeclineDialogOpen}
            dogName={selectedRequest.dogName}
            requesterName={selectedRequest.requesterKennelName}
            onDecline={handleDecline}
          />
        </>
      )}

      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title='Remove Connection'
        description={`Are you sure you want to remove ${
          selectedConnectedDog?.name || 'this dog'
        } from your dog list? This will delete the dog from your account.`}
        confirmText='Remove'
        cancelText='Cancel'
        onConfirm={confirmRemoveConnection}
        variant='destructive'
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title='Delete Connection Request'
        description={`Are you sure you want to delete the connection request for "${
          selectedRequest?.dogName || 'this dog'
        }"? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        onConfirm={confirmDeleteRequest}
        variant='destructive'
      />
    </div>
  );
}
