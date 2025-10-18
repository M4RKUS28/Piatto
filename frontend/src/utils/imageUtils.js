/**
 * Utility functions for handling image URLs from the backend
 */

/**
 * Converts a bucket key to a proper image URL
 * @param {string} imageKey - The bucket key (e.g., "users/123/image/01-01-2025/abc.png")
 * @returns {string} - Full API URL to serve the image
 */
export const getImageUrl = (imageKey) => {
  if (!imageKey) {
    return null;
  }
  
  // If it's already a full URL, return as-is
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    return imageKey;
  }
  
  // Construct the API endpoint URL
  return `/api/files/serve/${imageKey}`;
};

/**
 * Get image URL with fallback for errors
 * @param {string} imageKey - The bucket key
 * @param {string} fallback - Fallback URL or emoji if image fails
 * @returns {string} - Image URL or fallback
 */
export const getImageUrlWithFallback = (imageKey, fallback = '🍽️') => {
  return imageKey ? getImageUrl(imageKey) : fallback;
};
