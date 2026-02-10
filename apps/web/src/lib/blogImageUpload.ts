import { storage } from '@breeder/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadBlogImage(
  userId: string,
  imageData: string // Data URL
): Promise<string> {
  try {
    const response = await fetch(imageData);
    const blob = await response.blob();
    const timestamp = Date.now();
    const filename = `blog-image-${timestamp}.jpg`;
    const storageRef = ref(storage, `users/${userId}/blog/${filename}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading blog image:', error);
    throw error;
  }
}
