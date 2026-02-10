import { storage } from '@breeder/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadImageToFirebase(
  userId: string,
  imageType: 'logo' | 'hero',
  imageData: string // Data URL
): Promise<string> {
  try {
    // Convert data URL to blob
    const response = await fetch(imageData);
    const blob = await response.blob();

    // Create reference in Firebase Storage
    const timestamp = Date.now();
    const ext = imageType === 'logo' ? 'png' : 'jpg';
    const filename = `website-${imageType}-${timestamp}.${ext}`;
    const storageRef = ref(storage, `users/${userId}/website/${filename}`);

    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image to Firebase:', error);
    throw error;
  }
}
