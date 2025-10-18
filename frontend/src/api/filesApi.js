import { apiWithCookies } from './baseApi';

/**

Uploads a file and makes it public, returning the public URL.
@param {string} userId - ID of the authenticated user.
@param {string} category - Storage category for the file.
@param {File} file - File object selected by the user.
@returns {Promise<string>} Public URL of the uploaded file.*/
export const uploadPublicFile = async (userId, category, file) => {
  if (!file) {
    throw new Error('File is required for upload');
  }

  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('category', category);
  formData.append('file', file);

  const response = await apiWithCookies.post('/files/public-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

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
  formData.append('user_id', userId);
  formData.append('category', category);
  formData.append('file', file);

  const response = await apiWithCookies.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
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
