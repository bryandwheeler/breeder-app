/**
 * Admin Newsletter Lead Magnets Management
 *
 * Create, edit, and manage lead magnets (downloadable resources).
 * Supports file uploads, delivery settings, and automation triggers.
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore, useNewsletterStore } from '@breeder/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { LeadMagnet, LeadMagnetType, NewsletterList, AutoresponderSequence } from '@breeder/types';
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
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  FileText,
  Video,
  Music,
  Archive,
  File,
  Upload,
  ExternalLink,
  Copy,
  Eye,
  Mail,
  Link as LinkIcon,
  Image,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const typeConfig: Record<LeadMagnetType, { label: string; icon: React.ReactNode; accept: string }> = {
  pdf: { label: 'PDF', icon: <FileText className="h-4 w-4" />, accept: '.pdf' },
  ebook: { label: 'eBook', icon: <FileText className="h-4 w-4" />, accept: '.pdf,.epub,.mobi' },
  video: { label: 'Video', icon: <Video className="h-4 w-4" />, accept: '.mp4,.mov,.avi,.webm' },
  audio: { label: 'Audio', icon: <Music className="h-4 w-4" />, accept: '.mp3,.wav,.ogg,.m4a' },
  zip: { label: 'ZIP Archive', icon: <Archive className="h-4 w-4" />, accept: '.zip,.rar,.7z' },
  other: { label: 'Other', icon: <File className="h-4 w-4" />, accept: '*' },
};

export function NewsletterLeadMagnets() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { checkIsAdmin } = useAdminStore();
  const {
    lists,
    sequences,
    leadMagnets,
    loading,
    subscribeLists,
    subscribeSequences,
    subscribeLeadMagnets,
    createLeadMagnet,
    updateLeadMagnet,
    deleteLeadMagnet,
  } = useNewsletterStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMagnet, setSelectedMagnet] = useState<LeadMagnet | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'pdf' as LeadMagnetType,
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    thumbnailUrl: '',
    deliveryMethod: 'email' as 'email' | 'redirect' | 'both',
    deliveryEmailSubject: '',
    deliveryEmailContent: '',
    redirectUrl: '',
    addToListIds: [] as string[],
    addTags: [] as string[],
    sequenceId: '',
    requireEmailConfirmation: false,
  });

  const [tagInput, setTagInput] = useState('');

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const adminStatus = await checkIsAdmin(currentUser.uid);
      if (!adminStatus) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [currentUser, navigate, checkIsAdmin]);

  // Subscribe to data
  useEffect(() => {
    if (!isAdmin || !currentUser) return;

    const unsubLists = subscribeLists(currentUser.uid, 'admin');
    const unsubSequences = subscribeSequences(currentUser.uid, 'admin');
    const unsubLeadMagnets = subscribeLeadMagnets(currentUser.uid, 'admin');

    return () => {
      unsubLists();
      unsubSequences();
      unsubLeadMagnets();
    };
  }, [isAdmin, currentUser, subscribeLists, subscribeSequences, subscribeLeadMagnets]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'pdf',
      fileUrl: '',
      fileName: '',
      fileSize: 0,
      thumbnailUrl: '',
      deliveryMethod: 'email',
      deliveryEmailSubject: '',
      deliveryEmailContent: '',
      redirectUrl: '',
      addToListIds: [],
      addTags: [],
      sequenceId: '',
      requireEmailConfirmation: false,
    });
    setTagInput('');
  };

  const handleOpenDialog = (magnet?: LeadMagnet) => {
    if (magnet) {
      setSelectedMagnet(magnet);
      setFormData({
        name: magnet.name,
        description: magnet.description,
        type: magnet.type,
        fileUrl: magnet.fileUrl,
        fileName: magnet.fileName,
        fileSize: magnet.fileSize,
        thumbnailUrl: magnet.thumbnailUrl || '',
        deliveryMethod: magnet.deliveryMethod,
        deliveryEmailSubject: magnet.deliveryEmailSubject || '',
        deliveryEmailContent: magnet.deliveryEmailContent || '',
        redirectUrl: magnet.redirectUrl || '',
        addToListIds: magnet.addToListIds,
        addTags: magnet.addTags,
        sequenceId: magnet.sequenceId || '',
        requireEmailConfirmation: magnet.requireEmailConfirmation,
      });
    } else {
      setSelectedMagnet(null);
      resetForm();
    }
    setShowDialog(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumb = false) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const storage = getStorage();
      const path = isThumb
        ? `lead-magnets/thumbnails/${currentUser.uid}/${Date.now()}_${file.name}`
        : `lead-magnets/files/${currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          toast({ title: 'Upload failed', variant: 'destructive' });
          setUploading(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          if (isThumb) {
            setFormData({ ...formData, thumbnailUrl: downloadUrl });
          } else {
            setFormData({
              ...formData,
              fileUrl: downloadUrl,
              fileName: file.name,
              fileSize: file.size,
            });
          }
          setUploading(false);
          setUploadProgress(0);
          toast({ title: 'File uploaded successfully' });
        }
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: error.message || 'Upload failed', variant: 'destructive' });
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.addTags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        addTags: [...formData.addTags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      addTags: formData.addTags.filter((t) => t !== tag),
    });
  };

  const handleSave = async () => {
    if (!currentUser) return;

    if (!formData.name.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }

    if (!formData.fileUrl) {
      toast({ title: 'Please upload a file', variant: 'destructive' });
      return;
    }

    try {
      if (selectedMagnet) {
        await updateLeadMagnet(selectedMagnet.id, {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          fileUrl: formData.fileUrl,
          fileName: formData.fileName,
          fileSize: formData.fileSize,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          deliveryMethod: formData.deliveryMethod,
          deliveryEmailSubject: formData.deliveryEmailSubject || undefined,
          deliveryEmailContent: formData.deliveryEmailContent || undefined,
          redirectUrl: formData.redirectUrl || undefined,
          addToListIds: formData.addToListIds,
          addTags: formData.addTags,
          sequenceId: formData.sequenceId || undefined,
          requireEmailConfirmation: formData.requireEmailConfirmation,
        });
        toast({ title: 'Lead magnet updated successfully' });
      } else {
        await createLeadMagnet({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          fileUrl: formData.fileUrl,
          fileName: formData.fileName,
          fileSize: formData.fileSize,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          deliveryMethod: formData.deliveryMethod,
          deliveryEmailSubject: formData.deliveryEmailSubject || undefined,
          deliveryEmailContent: formData.deliveryEmailContent || undefined,
          redirectUrl: formData.redirectUrl || undefined,
          addToListIds: formData.addToListIds,
          addTags: formData.addTags,
          sequenceId: formData.sequenceId || undefined,
          requireEmailConfirmation: formData.requireEmailConfirmation,
          ownerId: currentUser.uid,
          ownerType: 'admin',
        });
        toast({ title: 'Lead magnet created successfully' });
      }

      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to save lead magnet', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedMagnet) return;

    try {
      await deleteLeadMagnet(selectedMagnet.id);
      toast({ title: 'Lead magnet deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedMagnet(null);
    } catch (error: any) {
      toast({ title: error.message || 'Failed to delete lead magnet', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Lead Magnets</h1>
            <p className="text-muted-foreground">
              Create downloadable resources to grow your email list
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Lead Magnet
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lead Magnets</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadMagnets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leadMagnets.reduce((sum, m) => sum + m.downloadCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leadMagnets.length > 0
                ? Math.round(leadMagnets.reduce((sum, m) => sum + m.downloadCount, 0) / leadMagnets.length)
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Magnets List */}
      <Card>
        <CardContent className="pt-6">
          {leadMagnets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No lead magnets yet</p>
              <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create your first lead magnet
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Lists</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadMagnets.map((magnet) => (
                  <TableRow key={magnet.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {magnet.thumbnailUrl ? (
                          <img
                            src={magnet.thumbnailUrl}
                            alt={magnet.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            {typeConfig[magnet.type].icon}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{magnet.name}</p>
                          {magnet.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {magnet.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeConfig[magnet.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="truncate max-w-[150px]">{magnet.fileName}</p>
                        <p className="text-muted-foreground">{formatFileSize(magnet.fileSize)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {magnet.deliveryMethod === 'email' && <Mail className="h-4 w-4" />}
                        {magnet.deliveryMethod === 'redirect' && <LinkIcon className="h-4 w-4" />}
                        {magnet.deliveryMethod === 'both' && (
                          <>
                            <Mail className="h-4 w-4" />
                            <LinkIcon className="h-4 w-4" />
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{magnet.downloadCount}</TableCell>
                    <TableCell>
                      {magnet.addToListIds.length > 0 ? (
                        <Badge variant="secondary">
                          {magnet.addToListIds.length} list{magnet.addToListIds.length > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(magnet)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(magnet.fileUrl, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(magnet.fileUrl);
                              toast({ title: 'URL copied to clipboard' });
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedMagnet(magnet);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMagnet ? 'Edit Lead Magnet' : 'Add Lead Magnet'}
            </DialogTitle>
            <DialogDescription>
              Create a downloadable resource to grow your email list
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Puppy Care Guide"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A comprehensive guide to caring for your new puppy..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as LeadMagnetType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>File</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {formData.fileUrl ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {typeConfig[formData.type].icon}
                        <div>
                          <p className="text-sm font-medium">{formData.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(formData.fileSize)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload File'}
                      </Button>
                    </div>
                  )}
                  {uploading && (
                    <Progress value={uploadProgress} className="mt-2" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={typeConfig[formData.type].accept}
                  onChange={(e) => handleFileUpload(e)}
                />
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label>Thumbnail (optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {formData.thumbnailUrl ? (
                    <div className="flex items-center justify-between">
                      <img
                        src={formData.thumbnailUrl}
                        alt="Thumbnail"
                        className="h-16 w-16 rounded object-cover"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        Upload Thumbnail
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, true)}
                />
              </div>
            </div>

            {/* Right Column - Delivery & Automation */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Delivery Method</Label>
                <Select
                  value={formData.deliveryMethod}
                  onValueChange={(value) => setFormData({ ...formData, deliveryMethod: value as 'email' | 'redirect' | 'both' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Only
                      </div>
                    </SelectItem>
                    <SelectItem value="redirect">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Redirect Only
                      </div>
                    </SelectItem>
                    <SelectItem value="both">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <LinkIcon className="h-4 w-4" />
                        Email + Redirect
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.deliveryMethod === 'email' || formData.deliveryMethod === 'both') && (
                <>
                  <div className="space-y-2">
                    <Label>Delivery Email Subject</Label>
                    <Input
                      value={formData.deliveryEmailSubject}
                      onChange={(e) => setFormData({ ...formData, deliveryEmailSubject: e.target.value })}
                      placeholder="Your download is ready!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Email Content</Label>
                    <Textarea
                      value={formData.deliveryEmailContent}
                      onChange={(e) => setFormData({ ...formData, deliveryEmailContent: e.target.value })}
                      placeholder="HTML content for the delivery email..."
                      rows={4}
                    />
                  </div>
                </>
              )}

              {(formData.deliveryMethod === 'redirect' || formData.deliveryMethod === 'both') && (
                <div className="space-y-2">
                  <Label>Redirect URL</Label>
                  <Input
                    value={formData.redirectUrl}
                    onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                    placeholder="https://example.com/thank-you"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Add to Lists</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                  {lists.map((list) => (
                    <div key={list.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`list-${list.id}`}
                        checked={formData.addToListIds.includes(list.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              addToListIds: [...formData.addToListIds, list.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              addToListIds: formData.addToListIds.filter((id) => id !== list.id),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`list-${list.id}`} className="text-sm font-normal">
                        {list.name}
                      </Label>
                    </div>
                  ))}
                  {lists.length === 0 && (
                    <p className="text-sm text-muted-foreground">No lists available</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Enter a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {formData.addTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.addTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                        {tag} &times;
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Start Autoresponder</Label>
                <Select
                  value={formData.sequenceId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, sequenceId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {sequences.filter(s => s.status === 'active').map((seq) => (
                      <SelectItem key={seq.id} value={seq.id}>
                        {seq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={formData.requireEmailConfirmation}
                  onCheckedChange={(checked) => setFormData({ ...formData, requireEmailConfirmation: checked })}
                />
                <Label>Require email confirmation (double opt-in)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || uploading}>
              {selectedMagnet ? 'Save Changes' : 'Create Lead Magnet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead Magnet?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedMagnet?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default NewsletterLeadMagnets;
