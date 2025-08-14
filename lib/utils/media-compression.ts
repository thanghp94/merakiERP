// Utility functions for compressing and resizing media files

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 800,
  quality: 0.8,
  maxSizeKB: 500 // 500KB max file size
};

/**
 * Compress and resize an image file
 */
export function compressImage(
  file: File,
  options: CompressionOptions = DEFAULT_COMPRESSION_OPTIONS
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width,
          img.height,
          options.maxWidth || DEFAULT_COMPRESSION_OPTIONS.maxWidth!,
          options.maxHeight || DEFAULT_COMPRESSION_OPTIONS.maxHeight!
        );

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check if compressed size is acceptable
            const compressedSizeKB = blob.size / 1024;
            const maxSizeKB = options.maxSizeKB || DEFAULT_COMPRESSION_OPTIONS.maxSizeKB!;

            if (compressedSizeKB > maxSizeKB) {
              // Try with lower quality
              const lowerQuality = Math.max(0.3, (options.quality || 0.8) - 0.2);
              compressImage(file, { ...options, quality: lowerQuality })
                .then(resolve)
                .catch(reject);
              return;
            }

            // Create new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });

            resolve(compressedFile);
          },
          file.type,
          options.quality || DEFAULT_COMPRESSION_OPTIONS.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress a video file (basic compression by reducing quality)
 */
export function compressVideo(
  file: File,
  options: CompressionOptions = DEFAULT_COMPRESSION_OPTIONS
): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      try {
        // Calculate new dimensions
        const { width: newWidth, height: newHeight } = calculateDimensions(
          video.videoWidth,
          video.videoHeight,
          options.maxWidth || DEFAULT_COMPRESSION_OPTIONS.maxWidth!,
          options.maxHeight || DEFAULT_COMPRESSION_OPTIONS.maxHeight!
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // For video, we'll create a thumbnail instead of compressing the entire video
        // Full video compression would require more complex processing
        video.currentTime = 1; // Get frame at 1 second
      } catch (error) {
        reject(error);
      }
    };

    video.onseeked = () => {
      try {
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create video thumbnail'));
              return;
            }

            // Create thumbnail file
            const thumbnailFile = new File([blob], `${file.name}_thumbnail.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            resolve(thumbnailFile);
          },
          'image/jpeg',
          options.quality || DEFAULT_COMPRESSION_OPTIONS.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Main compression function that handles both images and videos
 */
export async function compressMediaFile(
  file: File,
  options: CompressionOptions = DEFAULT_COMPRESSION_OPTIONS
): Promise<File> {
  if (isImage(file)) {
    return compressImage(file, options);
  } else if (isVideo(file)) {
    // For videos, we'll create a thumbnail for preview
    // The original video can still be uploaded but with size limits
    const maxSizeKB = options.maxSizeKB || DEFAULT_COMPRESSION_OPTIONS.maxSizeKB!;
    const fileSizeKB = file.size / 1024;
    
    if (fileSizeKB > maxSizeKB * 10) { // Allow videos to be 10x larger than images
      throw new Error(`Video file too large. Maximum size is ${maxSizeKB * 10}KB`);
    }
    
    return file; // Return original video file
  } else {
    throw new Error('Unsupported file type. Only images and videos are allowed.');
  }
}
