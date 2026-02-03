/**
 * Breeder Newsletter Lead Magnets Management
 *
 * Upload and manage downloadable resources for lead generation.
 */

import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNewsletterStore } from '@breeder/firebase';
import type { LeadMagnet } from '@breeder/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Upload,
  FileText,
  Video,
  Music,
  Archive,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-8 w-8" />,
  ebook: <FileText className="h-8 w-8" />,
  video: <Video className="h-8 w-8" />,
  audio: <Music className="h-8 w-8" />,
  zip: <Archive className="h-8 w-8" />,
  other: <Download className="h-8 w-8" />,
};

export function BreederNewsletterLeadMagnets() {
  const { currentUser } = useAuth();
  const {
    lists,
    leadMagnets,
    loading,
    subscribeLists,
    subscribeLeadMagnets,
    createLeadMagnet,
    updateLeadMagnet,
    deleteLeadMagnet,
  } = useNewsletterStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMagnet, setSelectedMagnet] = useState<LeadMagnet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'pdf' as LeadMagnet['type'],
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    deliveryMethod: 'email' as LeadMagnet['deliveryMethod'],
    addToListIds: [] as string[],
  });

  // Subscribe to data with breeder ownerType
  useEffect(() => {
    if (!currentUser) return;

    const unsubLists = subscribeLists(currentUser.uid, 'breeder');
    const unsubLeadMagnets = subscribeLeadMagnets(currentUser.uid, 'breeder');

    return () => {
      unsubLists();
      unsubLeadMagnets();
    };
  }, [currentUser, subscribeLists, subscribeLeadMagnets]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'pdf',
      fileUrl: '',
      fileName: '',
      fileSize: 0,
      deliveryMethod: 'email',
      addToListIds: [],
    });
    setUploadProgress(0);
  };

  const handleFileUpload = async (file: File) => {
    if (!currentUser) return;

    setUploading(true);
    setUploadProgress(0);

    const storage = getStorage();
    const storageRef = ref(storage, `lead-magnets/${currentUser.uid}/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        toast({ title: 'Failed to upload file', variant: 'destructive' });
        setUploading(false);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData({
          ...formData,
          fileUrl: downloadUrl,
          fileName: file.name,
          fileSize: file.size,
        });
        setUploading(false);
        toast({ title: 'File uploaded successfully' });
      }
    );
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (!formData.fileUrl) {
      toast({ title: 'Please upload a file', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await createLeadMagnet({
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        fileUrl: formData.fileUrl,
        fileName: formData.fileName,
        fileSize: formData.fileSize,
        downloadCount: 0,
        deliveryMethod: formData.deliveryMethod,
        addToListIds: formData.addToListIds,
        addTags: [],
        requireEmailConfirmation: false,
        ownerId: currentUser!.uid,
        ownerType: 'breeder',
      });
      toast({ title: 'Lead magnet created' });
      setShowCreateDialog(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to create lead magnet', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedMagnet || !formData.name.trim()) return;

    setSubmitting(true);
    try {
      await updateLeadMagnet(selectedMagnet.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        deliveryMethod: formData.deliveryMethod,
        addToListIds: formData.addToListIds,
      });
      toast({ title: 'Lead magnet updated' });
      setShowEditDialog(false);
      setSelectedMagnet(null);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to update lead magnet', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMagnet) return;

    setSubmitting(true);
    try {
      await deleteLeadMagnet(selectedMagnet.id);
      toast({ title: 'Lead magnet deleted' });
      setShowDeleteDialog(false);
      setSelectedMagnet(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete lead magnet', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (magnet: LeadMagnet) => {
    setSelectedMagnet(magnet);
    setFormData({
      name: magnet.name,
      description: magnet.description || '',
      type: magnet.type,
      fileUrl: magnet.fileUrl,
      fileName: magnet.fileName,
      fileSize: magnet.fileSize,
      deliveryMethod: magnet.deliveryMethod,
      addToListIds: magnet.addToListIds || [],
    });
    setShowEditDialog(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading && leadMagnets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading lead magnets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Lead Magnets</h1>
            <p className="text-muted-foreground">
              Manage downloadable resources for lead generation
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Lead Magnet
        </Button>
      </div>

      {/* Lead Magnets Grid */}
      {leadMagnets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No lead magnets yet</p>
            <p className="mb-4">Upload PDFs, guides, or other resources to grow your list</p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Lead Magnet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leadMagnets.map((magnet) => (
            <Card key={magnet.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    {typeIcons[magnet.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold truncate">{magnet.name}</h3>
                        <p className="text-sm text-muted-foreground">{magnet.fileName}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={magnet.fileUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View File
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(magnet)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setSelectedMagnet(magnet); setShowDeleteDialog(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-sm">
                      <Badge variant="secondary">{magnet.type.toUpperCase()}</Badge>
                      <span className="text-muted-foreground">{formatFileSize(magnet.fileSize)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {magnet.downloadCount} downloads
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Lead Magnet</DialogTitle>
            <DialogDescription>
              Upload a file to offer as a free download
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Puppy Care Guide"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this resource..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="ebook">eBook</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="zip">ZIP Archive</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File *</Label>
              {formData.fileUrl ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">{formData.fileName}</span>
                  <Button variant="ghost" size="sm" onClick={() => setFormData({ ...formData, fileUrl: '', fileName: '', fileSize: 0 })}>
                    Change
                  </Button>
                </div>
              ) : uploading ? (
                <div className="p-4 border-2 border-dashed rounded-lg">
                  <Progress value={uploadProgress} className="mb-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              ) : (
                <div
                  className="p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select
                value={formData.deliveryMethod}
                onValueChange={(value: any) => setFormData({ ...formData, deliveryMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Send via email</SelectItem>
                  <SelectItem value="redirect">Redirect to download</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting || uploading}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead Magnet</DialogTitle>
            <DialogDescription>
              Update lead magnet settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm truncate">{formData.fileName}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                To change the file, delete this lead magnet and create a new one
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead Magnet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMagnet?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BreederNewsletterLeadMagnets;
