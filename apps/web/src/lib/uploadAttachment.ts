import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage, auth } from '@breeder/firebase';
import { VetVisitAttachment, TicketAttachment } from '@breeder/types';

/**
 * Upload a file attachment to Firebase Storage
 * @param file - The file to upload
 * @param dogId - The ID of the dog this attachment belongs to
 * @param visitId - The ID of the vet visit this attachment belongs to
 * @returns VetVisitAttachment object with download URL
 */
export async function uploadVetVisitAttachment(
  file: File,
  dogId: string,
  visitId: string,
): Promise<VetVisitAttachment> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to upload attachments');

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }

  // Create a unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `vet-visits/${dogId}/${visitId}/${timestamp}_${sanitizedName}`;
  const storagePath = `users/${user.uid}/${filename}`;

  // Create a storage reference
  const storageRef = ref(storage, storagePath);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);

  // Determine file type
  const fileType = getFileType(file);

  // Return attachment object
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: fileType,
    url: downloadURL,
    uploadDate: new Date().toISOString(),
    size: file.size,
  };
}

/**
 * Upload a support ticket attachment to Firebase Storage
 * @param file - The file to upload
 * @returns TicketAttachment object with download URL
 */
export async function uploadTicketAttachment(
  file: File,
): Promise<TicketAttachment> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to upload attachments');

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }

  // Create a unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `support-tickets/${user.uid}/${timestamp}_${sanitizedName}`;
  const storagePath = `users/${user.uid}/${filename}`;

  // Create a storage reference
  const storageRef = ref(storage, storagePath);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);

  // Return attachment object
  return {
    id: crypto.randomUUID(),
    name: file.name,
    url: downloadURL,
    type: file.type || 'application/octet-stream',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: user.uid,
  };
}

/**
 * Delete an attachment from Firebase Storage
 * @param url - The download URL of the attachment
 */
export async function deleteVetVisitAttachment(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting attachment:', error);
    // Don't throw - if the file doesn't exist, that's fine
  }
}

/**
 * Determine file type based on MIME type and extension
 */
function getFileType(file: File): VetVisitAttachment['type'] {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  // PDF
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }

  // Images
  if (
    type.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(name)
  ) {
    return 'image';
  }

  // Email files
  if (
    type === 'message/rfc822' ||
    name.endsWith('.eml') ||
    name.endsWith('.msg') ||
    type === 'application/vnd.ms-outlook'
  ) {
    return 'email';
  }

  // Documents
  if (
    type.includes('word') ||
    type.includes('document') ||
    type === 'application/msword' ||
    type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'text/plain' ||
    type === 'application/rtf' ||
    /\.(doc|docx|txt|rtf)$/.test(name)
  ) {
    return 'document';
  }

  return 'other';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
