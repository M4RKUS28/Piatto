import { apiWithCookies } from './baseApi';

/**
 * Generate instructions for a recipe using AI
 * @param {number} preparingSessionId - The preparing session ID
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<number>} The recipe ID
 * @throws {Error} If the request fails
 */
export const generateInstructions = async (preparingSessionId, recipeId) => {
  try {
    const response = await apiWithCookies.post('/instruction/generate', {
      preparing_session_id: preparingSessionId,
      recipe_id: recipeId,
    });
    return response.data;
  } catch (error) {
    console.error('generateInstructions error:', error);
    throw error;
  }
};

/**
 * Get instructions for a recipe
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<Array>} Array of instruction step objects
 * @throws {Error} If the request fails
 */
export const getInstructions = async (recipeId) => {
  try {
    const response = await apiWithCookies.get(`/instruction/${recipeId}`);
    return response.data;
  } catch (error) {
    console.error('getInstructions error:', error);
    throw error;
  }
};

/**
 * Delete instructions for a recipe
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<Object>} Success message
 * @throws {Error} If the request fails
 */
export const deleteInstructions = async (recipeId) => {
  try {
    const response = await apiWithCookies.delete(`/instruction/${recipeId}`);
    return response.data;
  } catch (error) {
    console.error('deleteInstructions error:', error);
    throw error;
  }
};
