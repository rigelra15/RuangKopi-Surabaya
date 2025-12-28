// Cloudinary Image Upload Service
// For unsigned uploads, we need cloud name and upload preset

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface CloudinaryImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

/**
 * Upload image to Cloudinary
 * @param file - File to upload
 * @param folder - Optional folder name for organization
 * @returns Upload result with URL and public ID
 */
export async function uploadImage(
  file: File,
  folder: string = 'ruangkopi-cafes'
): Promise<CloudinaryUploadResult> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    return {
      success: false,
      error: 'Cloudinary belum dikonfigurasi. Silakan tambahkan VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET di file .env'
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload gagal');
    }

    const data = await response.json();

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengupload gambar',
    };
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of files to upload
 * @param folder - Optional folder name
 * @param onProgress - Optional progress callback
 * @returns Array of upload results
 */
export async function uploadMultipleImages(
  files: File[],
  folder: string = 'ruangkopi-cafes',
  onProgress?: (current: number, total: number) => void
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], folder);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return results;
}

/**
 * Get optimized image URL with transformations
 * @param url - Original Cloudinary URL
 * @param options - Transformation options
 * @returns Transformed URL
 */
export function getOptimizedUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const { width, height, quality = 80, format = 'auto' } = options;

  // Build transformation string
  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);
  transforms.push('c_fill'); // Crop mode: fill

  const transformString = transforms.join(',');

  // Insert transformation into URL
  // Cloudinary URL format: https://res.cloudinary.com/CLOUD_NAME/image/upload/TRANSFORMS/PUBLIC_ID
  return url.replace('/upload/', `/upload/${transformString}/`);
}

/**
 * Get thumbnail URL (small size for listings)
 */
export function getThumbnailUrl(url: string): string {
  return getOptimizedUrl(url, { width: 150, height: 150, quality: 70 });
}

/**
 * Get medium size URL (for cards/previews)
 */
export function getMediumUrl(url: string): string {
  return getOptimizedUrl(url, { width: 400, height: 300, quality: 80 });
}

/**
 * Get large URL (for detail view)
 */
export function getLargeUrl(url: string): string {
  return getOptimizedUrl(url, { width: 800, height: 600, quality: 85 });
}

/**
 * Get original URL without any transformations
 * Returns the original uploaded image without crop, resize, or quality changes
 */
export function getOriginalUrl(url: string): string {
  // If not a Cloudinary URL, return as is
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  // Remove any existing transformations from the URL
  // Cloudinary URL format: https://res.cloudinary.com/CLOUD_NAME/image/upload/TRANSFORMS/PUBLIC_ID
  // We want: https://res.cloudinary.com/CLOUD_NAME/image/upload/PUBLIC_ID
  
  // Check if URL has transformations (anything between /upload/ and the next /)
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  
  const afterUpload = url.substring(uploadIndex + 8); // 8 = length of '/upload/'
  const nextSlashIndex = afterUpload.indexOf('/');
  
  // If there's content between /upload/ and next /, it might be transformations
  if (nextSlashIndex > 0) {
    const potentialTransform = afterUpload.substring(0, nextSlashIndex);
    // Check if it looks like a transformation (contains common transform patterns)
    if (potentialTransform.includes('_') || potentialTransform.includes(',')) {
      // Remove the transformation part
      return url.substring(0, uploadIndex + 8) + afterUpload.substring(nextSlashIndex + 1);
    }
  }
  
  return url;
}

/**
 * Get delete URL for Cloudinary image (requires API secret - should be done server-side)
 * Note: For security, deletion should be handled by backend
 * @param _publicId - The public ID of the image to delete (unused in frontend, needed by backend)
 */
export function getDeleteUrl(_publicId: string): string {
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`;
}

/**
 * Validate file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Ukuran file terlalu besar. Maksimal 10MB.',
    };
  }

  return { valid: true };
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
}
