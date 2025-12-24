import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@breeder/firebase';

/**
 * Upload a photo to Firebase Storage
 * @param file - The file to upload
 * @param path - Optional path within user's folder (e.g., 'dogs/photo.jpg')
 * @returns The download URL of the uploaded file
 */
export async function uploadPhoto(file: File, path?: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to upload photos');

  // Create a unique filename
  const timestamp = Date.now();
  const filename = path || `photos/${timestamp}_${file.name}`;
  const storagePath = `users/${user.uid}/${filename}`;

  // Create a storage reference
  const storageRef = ref(storage, storagePath);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get and return the download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Convert a base64 data URL to a File object
 * @param dataUrl - The base64 data URL
 * @param filename - The name for the file
 * @returns A File object
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}
