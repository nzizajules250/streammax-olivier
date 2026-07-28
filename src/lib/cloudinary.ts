// Cloudinary upload service with Firebase Storage fallback
import { storage, ref, uploadBytes, getDownloadURL } from './firebase';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  duration?: number;
  format?: string;
  width?: number;
  height?: number;
}

// Main upload function with Firebase Storage fallback
export const uploadToCloudinary = async (
  file: File,
  cloudName: string,
  uploadPreset: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // If Cloudinary credentials are configured, use Cloudinary
  if (cloudName && uploadPreset) {
    try {
      return await uploadToCloudinaryDirect(file, cloudName, uploadPreset, onProgress);
    } catch (error) {
      console.warn('Cloudinary upload failed, falling back to Firebase Storage:', error);
      return await uploadToFirebaseStorage(file, onProgress);
    }
  }
  
  // Fallback to Firebase Storage
  return await uploadToFirebaseStorage(file, onProgress);
};

// Direct Cloudinary upload
export const uploadToCloudinaryDirect = async (
  file: File,
  cloudName: string,
  uploadPreset: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  
  // Detect file type for better optimization
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  
  // Add transformation parameters based on file type
  if (isImage) {
    formData.append('transformation', 'f_auto,q_auto,w_1200,c_limit');
  } else if (isVideo) {
    formData.append('transformation', 'f_auto,q_auto,du_30,w_720,c_limit');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText) as CloudinaryUploadResponse;
          resolve(response.secure_url);
        } catch (e) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`);
    xhr.send(formData);
  });
};

// Firebase Storage upload as fallback
export const uploadToFirebaseStorage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const path = `uploads/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    
    // Simulate progress since Firebase Storage doesn't provide progress events easily
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 10, 90);
      if (onProgress) onProgress(progress);
    }, 300);

    const snapshot = await uploadBytes(storageRef, file);
    clearInterval(progressInterval);
    
    if (onProgress) onProgress(100);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Firebase Storage upload failed:', error);
    throw error;
  }
};

// Upload from URL with both Cloudinary and Firebase Storage support
export const uploadFromUrl = async (
  url: string,
  cloudName: string,
  uploadPreset: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Try to upload to Cloudinary if configured
    if (cloudName && uploadPreset) {
      // Fetch the file from URL
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      
      const blob = await response.blob();
      const file = new File([blob], `upload_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type });
      
      return await uploadToCloudinary(file, cloudName, uploadPreset, onProgress);
    }
    
    // Fallback: return original URL
    return url;
  } catch (error) {
    console.warn('Failed to copy from URL, using original:', error);
    return url;
  }
};

// Batch upload for episodes
export const uploadMultipleEpisodes = async (
  files: File[],
  cloudName: string,
  uploadPreset: string,
  onProgress?: (index: number, progress: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const url = await uploadToCloudinary(file, cloudName, uploadPreset, (progress) => {
        if (onProgress) onProgress(i, progress);
      });
      urls.push(url);
    } catch (error) {
      console.error(`Failed to upload episode ${i + 1}:`, error);
      urls.push(''); // Empty string for failed uploads
    }
  }
  
  return urls;
};