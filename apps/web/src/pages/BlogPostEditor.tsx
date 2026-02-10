import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBlogStore } from '@breeder/firebase';
import { useAdminStore } from '@breeder/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Save, Image, X } from 'lucide-react';
import { uploadBlogImage } from '@/lib/blogImageUpload';
import { useToast } from '@/hooks/use-toast';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function BlogPostEditor() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const impersonatedUserId = useAdminStore((s) => s.impersonatedUserId);
  const { posts, subscribePosts, createPost, updatePost, loading } =
    useBlogStore();
  const { toast } = useToast();

  const isEditing = Boolean(postId);
  const existingPost = isEditing
    ? posts.find((p) => p.id === postId)
    : undefined;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Subscribe to posts for edit mode
  useEffect(() => {
    if (!currentUser) return;
    const targetUid = impersonatedUserId || currentUser.uid;
    const unsubscribe = subscribePosts(targetUid);
    return unsubscribe;
  }, [currentUser, subscribePosts, impersonatedUserId]);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && existingPost && !initialized) {
      setTitle(existingPost.title);
      setSlug(existingPost.slug);
      setContent(existingPost.content);
      setExcerpt(existingPost.excerpt);
      setFeaturedImage(existingPost.featuredImage || '');
      setTagsInput(existingPost.tags.join(', '));
      setPublished(existingPost.published);
      setInitialized(true);
    }
  }, [isEditing, existingPost, initialized]);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (!isEditing || !initialized) {
        setSlug(generateSlug(value));
      }
    },
    [isEditing, initialized],
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const targetUid = impersonatedUserId || currentUser.uid;
        const url = await uploadBlogImage(targetUid, dataUrl);
        setFeaturedImage(url);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your blog post.',
        variant: 'destructive',
      });
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const targetUid = impersonatedUserId || currentUser.uid;

    try {
      setSaving(true);

      if (isEditing && postId) {
        const updates: Record<string, any> = {
          title,
          slug: slug || generateSlug(title),
          content,
          excerpt,
          featuredImage: featuredImage || null,
          tags,
          published,
          status: published ? 'published' : 'draft',
        };
        // Set publishedAt on first publish
        if (published && !existingPost?.publishedAt) {
          updates.publishedAt = new Date().toISOString();
        }
        await updatePost(postId, updates);
        toast({ title: 'Post updated' });
      } else {
        await createPost({
          userId: targetUid,
          title,
          slug: slug || generateSlug(title),
          content,
          excerpt,
          ...(featuredImage ? { featuredImage } : {}),
          tags,
          published,
          status: published ? 'published' : 'draft',
          ...(published ? { publishedAt: new Date().toISOString() } : {}),
        });
        toast({ title: 'Post created' });
      }

      navigate('/blog');
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save blog post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loading && !existingPost) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-4xl'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' onClick={() => navigate('/blog')}>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back
        </Button>
        <h1 className='text-2xl font-bold tracking-tight'>
          {isEditing ? 'Edit Post' : 'New Blog Post'}
        </h1>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main content */}
        <div className='lg:col-span-2 space-y-4'>
          <Card>
            <CardContent className='p-4 space-y-4'>
              <div>
                <label className='text-sm font-medium mb-1.5 block'>
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder='Enter post title...'
                />
              </div>

              <div>
                <label className='text-sm font-medium mb-1.5 block'>Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder='url-friendly-slug'
                  className='text-sm'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  URL path for this post. Auto-generated from title.
                </p>
              </div>

              <div>
                <label className='text-sm font-medium mb-1.5 block'>
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder='Write your blog post content here... (HTML supported)'
                  rows={16}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                />
              </div>

              <div>
                <label className='text-sm font-medium mb-1.5 block'>
                  Excerpt
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder='A short summary shown on the blog listing page...'
                  rows={3}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-4'>
          {/* Publish settings */}
          <Card>
            <CardContent className='p-4 space-y-4'>
              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium'>Published</label>
                <Switch
                  checked={published}
                  onCheckedChange={(v) => setPublished(v === true)}
                />
              </div>
              <Badge variant={published ? 'default' : 'secondary'}>
                {published ? 'Published' : 'Draft'}
              </Badge>

              <Button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className='w-full'
              >
                {saving ? (
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                ) : (
                  <Save className='h-4 w-4 mr-2' />
                )}
                {isEditing ? 'Update Post' : 'Save Post'}
              </Button>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardContent className='p-4 space-y-3'>
              <label className='text-sm font-medium block'>
                Featured Image
              </label>
              {featuredImage ? (
                <div className='relative'>
                  <img
                    src={featuredImage}
                    alt='Featured'
                    className='w-full h-40 object-cover rounded-lg'
                  />
                  <Button
                    variant='destructive'
                    size='sm'
                    className='absolute top-2 right-2 h-7 w-7 p-0'
                    onClick={() => setFeaturedImage('')}
                  >
                    <X className='h-3 w-3' />
                  </Button>
                </div>
              ) : (
                <label className='flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-8 cursor-pointer hover:bg-muted/50 transition'>
                  {uploadingImage ? (
                    <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                  ) : (
                    <>
                      <Image className='h-6 w-6 text-muted-foreground mb-2' />
                      <span className='text-xs text-muted-foreground'>
                        Click to upload
                      </span>
                    </>
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className='p-4 space-y-3'>
              <label className='text-sm font-medium block'>Tags</label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder='puppy tips, training, health'
              />
              <p className='text-xs text-muted-foreground'>
                Separate tags with commas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
