import { apiWithCookies } from './baseApi';

/**
 * Uploads a file and makes it public, returning the public URL.
 * @param {string} userId - ID of the authenticated user.
 * @param {string} category - Storage category for the file.
 * @param {File} file - File object selected by the user.
 * @returns {Promise<string>} Public URL of the uploaded file.
 */
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
