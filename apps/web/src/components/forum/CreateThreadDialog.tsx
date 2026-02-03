import { useState, useRef } from 'react';
import { useForumStore } from '@breeder/firebase';
import { useBreederStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ForumAttachment } from '@breeder/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, X, Plus } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CreateThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  onSuccess?: () => void;
}

export function CreateThreadDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  categorySlug,
  onSuccess,
}: CreateThreadDialogProps) {
  const { currentUser } = useAuth();
  const { profile } = useBreederStore();
  const { createThread } = useForumStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [breedTags, setBreedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [breedTagInput, setBreedTagInput] = useState('');
  const [attachments, setAttachments] = useState<ForumAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setBreedTags([]);
    setTagInput('');
    setBreedTagInput('');
    setAttachments([]);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const handleAddBreedTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = breedTagInput.trim();
      if (newTag && !breedTags.includes(newTag) && breedTags.length < 3) {
        setBreedTags([...breedTags, newTag]);
        setBreedTagInput('');
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !currentUser) return;

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 5MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    if (attachments.length + validFiles.length > 4) {
      toast({
        title: 'Too many images',
        description: 'Maximum 4 images per thread',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const storage = getStorage();

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`;
        const storageRef = ref(
          storage,
          `forum/${currentUser.uid}/threads/${fileName}`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        return {
          id: fileName,
          url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        } as ForumAttachment;
      });

      const newAttachments = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async () => {
    if (!currentUser || !profile) return;
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your thread',
        variant: 'destructive',
      });
      return;
    }
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter content for your thread',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await createThread(
        categoryId,
        title.trim(),
        content.trim(),
        attachments.length > 0 ? attachments : undefined,
        tags.length > 0 ? tags : undefined,
        breedTags.length > 0 ? breedTags : undefined
      );

      toast({
        title: 'Thread created',
        description: 'Your thread has been posted successfully',
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create thread:', error);
      toast({
        title: 'Error',
        description: 'Failed to create thread. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
          <DialogDescription>
            Posting in: {categoryName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What's your question or topic?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/200
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, questions, or experiences..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/10000
            </p>
          </div>

          {/* Breed Tags */}
          <div className="space-y-2">
            <Label htmlFor="breedTags">Breed Tags (optional)</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {breedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setBreedTags((prev) => prev.filter((t) => t !== tag))
                    }
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id="breedTags"
              placeholder="Add breed (press Enter)"
              value={breedTagInput}
              onChange={(e) => setBreedTagInput(e.target.value)}
              onKeyDown={handleAddBreedTag}
              disabled={breedTags.length >= 3}
            />
            <p className="text-xs text-muted-foreground">
              Add up to 3 breed tags (e.g., Golden Retriever, Labrador)
            </p>
          </div>

          {/* Topic Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Topic Tags (optional)</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setTags((prev) => prev.filter((t) => t !== tag))
                    }
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id="tags"
              placeholder="Add tag (press Enter)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              disabled={tags.length >= 5}
            />
            <p className="text-xs text-muted-foreground">
              Add up to 5 topic tags (e.g., puppy, training, nutrition)
            </p>
          </div>

          {/* Image Attachments */}
          <div className="space-y-2">
            <Label>Images (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative group w-24 h-24 rounded-lg overflow-hidden border"
                >
                  <img
                    src={attachment.url}
                    alt={attachment.fileName}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {attachments.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 mb-1" />
                      <span className="text-xs">Add Image</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Up to 4 images, 5MB max each
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || uploading}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Thread
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
