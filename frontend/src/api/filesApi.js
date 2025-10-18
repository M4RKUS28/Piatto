import { apiWithCookies } from './baseApi';

/**
 * Upload an image file for ingredient recognition.
 * @param {string} userId - The authenticated user's identifier.
 * @param {File} file - The image file selected by the user.
 * @param {string} [category='ingredients'] - Storage category for the upload.
 * @returns {Promise<string>} Resolves to the storage key generated for the file.
 */
export const uploadIngredientImage = async (userId, file, category = 'ingredients') => {
  if (!userId) {
    throw new Error('User ID is required to upload an image.');
  }
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await apiWithCookies.post('/files/upload', formData, {
    params: {
      user_id: userId,
      category,
    },
  });

  return response.data;
};

/**
 * Retrieve a signed GET URL for a stored image key.
 * @param {string} key - The storage key returned from the upload endpoint.
 * @param {number} [minutes=60] - Minutes the signed URL should remain valid.
 * @returns {Promise<object>} File metadata including the signed URL.
 */
export const getSignedImageUrl = async (key, minutes = 60) => {
  if (!key) {
    throw new Error('Storage key is required to generate a signed URL.');
  }

  const response = await apiWithCookies.post('/files/signed-url', null, {
    params: {
      key,
      minutes,
    },
  });

  return response.data;
};
