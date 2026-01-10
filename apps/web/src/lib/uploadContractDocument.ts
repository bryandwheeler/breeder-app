import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '@breeder/firebase';
import { ContractDocument } from '@breeder/types';

/**
 * Upload a contract document (PDF or image) to Firebase Storage
 * @param file - The file to upload
 * @param litterId - The ID of the litter
 * @param puppyId - The ID of the puppy
 * @param documentType - 'contract' or 'health_guarantee'
 * @returns ContractDocument object with download URL
 */
export async function uploadContractDocument(
  file: File,
  litterId: string,
  puppyId: string,
  documentType: 'contract' | 'health_guarantee'
): Promise<ContractDocument> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to upload contract documents');

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }

  // Validate file type
  const fileType = getContractFileType(file);
  if (!fileType) {
    throw new Error('File must be a PDF or image (JPEG, PNG)');
  }

  // Create a unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `contracts/${litterId}/${puppyId}/${documentType}_${timestamp}_${sanitizedName}`;
  const storagePath = `users/${user.uid}/${filename}`;

  // Create a storage reference
  const storageRef = ref(storage, storagePath);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);

  // Return document object
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
 * Delete a contract document from Firebase Storage
 * @param url - The download URL of the document
 */
export async function deleteContractDocument(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting contract document:', error);
    // Don't throw - if the file doesn't exist, that's fine
  }
}

/**
 * Determine file type for contract documents
 * Only allows PDF and images
 */
function getContractFileType(file: File): 'pdf' | 'image' | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  // PDF
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }

  // Images
  if (
    type.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif)$/.test(name)
  ) {
    return 'image';
  }

  return null;
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
