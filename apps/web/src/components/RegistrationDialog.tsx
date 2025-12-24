import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Registration, RegistrationDocument } from '@breeder/types';
import { FileText, Upload, X, ExternalLink } from 'lucide-react';
import { storage } from '@breeder/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface RegistrationDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  registration: Registration | undefined;
  onSave: (registration: Registration) => void;
  puppyName: string;
}

export function RegistrationDialog({
  open,
  setOpen,
  registration,
  onSave,
  puppyName,
}: RegistrationDialogProps) {
  const [formData, setFormData] = useState<Registration>(
    registration || {
      registry: 'AKC',
      registrationType: 'limited',
      status: 'not_started',
      documents: [],
    }
  );
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: RegistrationDocument['type']) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `registration/${timestamp}_${file.name}`;
      const storageRef = ref(storage, filename);

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Add to documents
      const newDoc: RegistrationDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: docType,
        url: downloadUrl,
        uploadDate: new Date().toISOString().split('T')[0],
      };

      setFormData({
        ...formData,
        documents: [...(formData.documents || []), newDoc],
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const removeDocument = (docId: string) => {
    setFormData({
      ...formData,
      documents: formData.documents?.filter((doc) => doc.id !== docId),
    });
  };

  const handleSave = () => {
    onSave(formData);
    setOpen(false);
  };

  const getStatusColor = (status: Registration['status']) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'submitted':
        return 'bg-blue-500';
      case 'approved':
        return 'bg-green-500';
      case 'issued':
        return 'bg-green-700';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Registration Management - {puppyName}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Status Badge */}
          <div className='flex items-center gap-4'>
            <Badge className={getStatusColor(formData.status)}>
              {formData.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {formData.registrationNumber && (
              <div className='text-sm'>
                <strong>Registration #:</strong> {formData.registrationNumber}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='registry'>Registry</Label>
              <Select
                value={formData.registry}
                onValueChange={(value) =>
                  setFormData({ ...formData, registry: value as Registration['registry'] })
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
                value={formData.registrationType}
                onValueChange={(value) =>
                  setFormData({ ...formData, registrationType: value as Registration['registrationType'] })
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

          {formData.registrationType !== 'none' && (
            <>
              {/* Status and Number */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='status'>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as Registration['status'] })
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
                    value={formData.registrationNumber || ''}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder='e.g., WS12345678'
                  />
                </div>
              </div>

              {/* Registered Name */}
              <div>
                <Label htmlFor='registeredName'>Registered Name</Label>
                <Input
                  id='registeredName'
                  value={formData.registeredName || ''}
                  onChange={(e) => setFormData({ ...formData, registeredName: e.target.value })}
                  placeholder='e.g., Kennel Name Amazing Puppy'
                />
              </div>

              {/* Important Dates */}
              <div className='grid grid-cols-4 gap-4'>
                <div>
                  <Label htmlFor='applicationDate'>Application Date</Label>
                  <Input
                    id='applicationDate'
                    type='date'
                    value={formData.applicationDate || ''}
                    onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor='submissionDate'>Submission Date</Label>
                  <Input
                    id='submissionDate'
                    type='date'
                    value={formData.submissionDate || ''}
                    onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor='approvalDate'>Approval Date</Label>
                  <Input
                    id='approvalDate'
                    type='date'
                    value={formData.approvalDate || ''}
                    onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor='deadline' className='text-red-600'>
                    Deadline
                  </Label>
                  <Input
                    id='deadline'
                    type='date'
                    value={formData.registrationDeadline || ''}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className='border-red-300'
                  />
                </div>
              </div>

              {/* Documents */}
              <div className='space-y-3'>
                <Label>Registration Documents</Label>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <input
                      type='file'
                      accept='.pdf,.jpg,.jpeg,.png'
                      onChange={(e) => handleFileUpload(e, 'application')}
                      disabled={uploading}
                      className='hidden'
                      id='application-upload'
                    />
                    <label htmlFor='application-upload' className='w-full'>
                      <Button type='button' disabled={uploading} variant='outline' className='w-full' asChild>
                        <span className='cursor-pointer flex items-center justify-center'>
                          <Upload className='mr-2 h-4 w-4' />
                          {uploading ? 'Uploading...' : 'Upload Application'}
                        </span>
                      </Button>
                    </label>
                  </div>

                  <div>
                    <input
                      type='file'
                      accept='.pdf,.jpg,.jpeg,.png'
                      onChange={(e) => handleFileUpload(e, 'certificate')}
                      disabled={uploading}
                      className='hidden'
                      id='certificate-upload'
                    />
                    <label htmlFor='certificate-upload' className='w-full'>
                      <Button type='button' disabled={uploading} variant='outline' className='w-full' asChild>
                        <span className='cursor-pointer flex items-center justify-center'>
                          <Upload className='mr-2 h-4 w-4' />
                          {uploading ? 'Uploading...' : 'Upload Certificate'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Document List */}
                {formData.documents && formData.documents.length > 0 && (
                  <div className='border rounded-md p-3 space-y-2'>
                    {formData.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className='flex items-center justify-between p-2 bg-muted rounded hover:bg-muted/80'
                      >
                        <div className='flex items-center gap-2 flex-1'>
                          <FileText className='h-4 w-4 text-muted-foreground' />
                          <div className='flex-1'>
                            <div className='font-medium text-sm'>{doc.name}</div>
                            <div className='text-xs text-muted-foreground'>
                              {doc.type.replace('_', ' ')} • Uploaded {doc.uploadDate}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <ExternalLink className='h-4 w-4' />
                          </Button>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => removeDocument(doc.id)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor='notes'>Notes</Label>
                <Textarea
                  id='notes'
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder='Notes about registration process, requirements, communications with registry, etc.'
                  rows={4}
                />
              </div>
            </>
          )}
        </div>

        <div className='flex justify-end gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Registration Info</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
