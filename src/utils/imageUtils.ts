import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export const DEFAULT_IMAGE_OPTIONS: ImageResizeOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  format: 'jpeg'
};

export const THUMBNAIL_OPTIONS: ImageResizeOptions = {
  maxWidth: 300,
  maxHeight: 300,
  quality: 0.7,
  format: 'jpeg'
};

export const AVATAR_OPTIONS: ImageResizeOptions = {
  maxWidth: 256,
  maxHeight: 256,
  quality: 0.8,
  format: 'jpeg'
};

/**
 * Resizes an image to optimize for upload and display
 * @param uri - The original image URI
 * @param options - Resize options
 * @returns Promise with resized image URI and info
 */
export const resizeImage = async (
  uri: string, 
  options: ImageResizeOptions = DEFAULT_IMAGE_OPTIONS
): Promise<{uri: string, width: number, height: number, size?: number}> => {
  try {
    console.log('🖼️ Resizing image:', uri);
    
    const { maxWidth, maxHeight, quality, format } = {
      ...DEFAULT_IMAGE_OPTIONS,
      ...options
    };

    // Get original image dimensions
    const originalImage = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: quality, format: format as any }
    );

    console.log('Original dimensions:', originalImage.width, 'x', originalImage.height);

    // Calculate new dimensions while maintaining aspect ratio
    const aspectRatio = originalImage.width / originalImage.height;
    let newWidth = originalImage.width;
    let newHeight = originalImage.height;

    // Only resize if image is larger than max dimensions
    if (newWidth > maxWidth! || newHeight > maxHeight!) {
      if (aspectRatio > 1) {
        // Landscape
        newWidth = Math.min(maxWidth!, newWidth);
        newHeight = newWidth / aspectRatio;
        
        if (newHeight > maxHeight!) {
          newHeight = maxHeight!;
          newWidth = newHeight * aspectRatio;
        }
      } else {
        // Portrait or square
        newHeight = Math.min(maxHeight!, newHeight);
        newWidth = newHeight * aspectRatio;
        
        if (newWidth > maxWidth!) {
          newWidth = maxWidth!;
          newHeight = newWidth / aspectRatio;
        }
      }
    }

    // Round dimensions
    newWidth = Math.round(newWidth);
    newHeight = Math.round(newHeight);

    console.log('New dimensions:', newWidth, 'x', newHeight);

    // Resize the image
    const resizedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: newWidth,
            height: newHeight,
          },
        },
      ],
      {
        compress: quality,
        format: format as any,
      }
    );

    console.log('✅ Image resized successfully');
    
    return {
      uri: resizedImage.uri,
      width: resizedImage.width,
      height: resizedImage.height,
    };
  } catch (error) {
    console.error('❌ Image resize error:', error);
    // Return original image if resize fails
    return {
      uri,
      width: 0,
      height: 0,
    };
  }
};

/**
 * Get estimated file size from image dimensions (rough estimate)
 */
export const estimateImageSize = (width: number, height: number, quality: number = 0.8): number => {
  // Rough estimate: JPEG compression ratio
  const pixelCount = width * height;
  const bytesPerPixel = 3; // RGB
  const compressionRatio = quality * 0.1; // Rough JPEG compression
  
  return Math.round(pixelCount * bytesPerPixel * compressionRatio);
};

/**
 * Check if image needs resizing based on file size or dimensions
 */
export const needsResizing = (width: number, height: number, maxWidth: number = 1024, maxHeight: number = 1024): boolean => {
  return width > maxWidth || height > maxHeight;
};