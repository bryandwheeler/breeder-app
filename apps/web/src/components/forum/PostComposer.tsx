import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Image, X, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useForumStore } from '@breeder/firebase';
import { useBreederStore } from '@breeder/firebase';
import { ForumAttachment } from '@breeder/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@breeder/firebase';
import { v4 as uuidv4 } from 'uuid';

interface PostComposerProps {
  threadId: string;
  parentPostId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function PostComposer({
  threadId,
  parentPostId,
  onCancel,
  onSuccess,
  placeholder = 'Write your reply...',
  autoFocus = false,
}: PostComposerProps) {
  const { currentUser } = useAuth();
  const { profile } = useBreederStore();
  const { createPost } = useForumStore();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<ForumAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (profile?.breederName || currentUser?.displayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentUser) return;

    setUploading(true);
    try {
      const newAttachments: ForumAttachment[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Only image files are allowed');
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          continue;
        }

        const fileId = uuidv4();
        const fileExt = file.name.split('.').pop();
        const filePath = `forum/${currentUser.uid}/${fileId}.${fileExt}`;
        const storageRef = ref(storage, filePath);

        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        newAttachments.push({
          id: fileId,
          url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) return;

    setSubmitting(true);
    try {
      await createPost(
        threadId,
        content.trim(),
        attachments.length > 0 ? attachments : undefined,
        parentPostId
      );
      setContent('');
      setAttachments([]);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={profile?.logo || currentUser?.photoURL || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <Textarea
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              autoFocus={autoFocus}
            />

            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative group">
                    <img
                      src={attachment.url}
                      alt={attachment.fileName}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Image className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Add Image</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting || (!content.trim() && attachments.length === 0)}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
