import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '@breeder/firebase';
import { EvaluationVideo } from '@breeder/types';

/**
 * Upload a video file for puppy evaluation to Firebase Storage
 * @param file - The video file to upload
 * @param litterId - The ID of the litter
 * @param puppyId - The ID of the puppy
 * @param testType - The type of evaluation test
 * @param stepId - Optional step/test identifier (for per-question videos)
 * @param onProgress - Optional callback for upload progress
 * @returns EvaluationVideo object with download URL
 */
export async function uploadEvaluationVideo(
  file: File,
  litterId: string,
  puppyId: string,
  testType: string,
  stepId?: string,
  onProgress?: (progress: number) => void
): Promise<EvaluationVideo> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to upload videos');

  // Validate file type
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-m4v'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid video format. Supported formats: MP4, WebM, MOV, AVI, M4V');
  }

  // Validate file size (100MB limit for videos)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    throw new Error('Video file size must be less than 100MB');
  }

  // Create a unique filename
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'mp4';
  const sanitizedName = stepId
    ? `${testType}_${stepId}_${timestamp}.${extension}`
    : `${testType}_overall_${timestamp}.${extension}`;

  const storagePath = `users/${user.uid}/evaluations/${litterId}/${puppyId}/${sanitizedName}`;

  // Create a storage reference
  const storageRef = ref(storage, storagePath);

  // Upload with progress tracking
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(new Error('Failed to upload video. Please try again.'));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            filename: file.name,
            uploadedAt: new Date().toISOString(),
            size: file.size,
          });
        } catch (error) {
          reject(new Error('Failed to get download URL'));
        }
      }
    );
  });
}

/**
 * Delete an evaluation video from Firebase Storage
 * @param url - The download URL of the video
 */
export async function deleteEvaluationVideo(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting video:', error);
    // Don't throw - if the file doesn't exist, that's fine
  }
}

/**
 * Format video file size for display
 */
export function formatVideoSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get video duration from file (approximate)
 */
export function getVideoDurationEstimate(sizeBytes: number): string {
  // Rough estimate: 1MB ≈ 4 seconds at typical smartphone quality
  const seconds = Math.round(sizeBytes / (1024 * 1024) * 4);
  if (seconds < 60) return `~${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `~${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
