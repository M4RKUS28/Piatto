import { apiWithCookies } from './baseApi';

/**
 * Generate recipes based on user input
 * @param {string} prompt - Natural language prompt describing what the user wants to cook
 * @param {string} writtenIngredients - Comma-separated ingredients available to the user
 * @param {string} imageKey - Optional image reference for ingredient photo (default: empty string)
 * @param {number|null} preparingSessionId - Optional existing session ID for regeneration (default: null)
 * @returns {Promise<number>} Preparing session ID
 * @throws {Error} If the request fails
 */
export const generateRecipes = async (prompt, writtenIngredients, imageKey = '', preparingSessionId = null) => {
  try {
    const response = await apiWithCookies.post('/preparing/generate', {
      prompt,
      written_ingredients: writtenIngredients,
      image_key: imageKey,
      preparing_session_id: preparingSessionId,
    });
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('generateRecipes error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    throw error;
  }
};

/**
 * Get recipe options for a preparing session
 * @param {number} preparingSessionId - The preparing session ID
 * @returns {Promise<Array>} Array of recipe preview objects (exactly 3)
 * @throws {Error} If the request fails
 */
export const getRecipeOptions = async (preparingSessionId) => {
  try {
    console.log('!!!API: About to make HTTP GET request to /preparing/' + preparingSessionId + '/get_options');
    const response = await apiWithCookies.get(`/preparing/${preparingSessionId}/get_options`);
    console.log('!!!API: Received HTTP response');
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('getRecipeOptions error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method
      }
    });
    throw error;
  }
};

/**
 * Finish and cleanup a preparing session
 * @param {number} preparingSessionId - The preparing session ID
 * @returns {Promise<void>}
 * @throws {Error} If the request fails
 */
export const finishPreparingSession = async (preparingSessionId) => {
  try {
    const response = await apiWithCookies.delete(`/preparing/${preparingSessionId}/finish`);
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('finishPreparingSession error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method
      }
    });
    throw error;
  }
};

/**
 * Get image analysis metadata for a preparing session
 * @param {number} preparingSessionId - The preparing session ID
 * @returns {Promise<{image_key: string|null, analyzed_ingredients: string|null}>}
 * @throws {Error} If the request fails
 */
export const getImageAnalysisBySessionId = async (preparingSessionId) => {
  try {
    const response = await apiWithCookies.get(`/preparing/${preparingSessionId}/image-analysis`);
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('getImageAnalysisBySessionId error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method
      }
    });
    throw error;
  }
};

/**
 * Remove a recipe from the current list for a preparing session
 * @param {number} preparingSessionId - The preparing session ID
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<Object>} Updated current recipe ids
 * @throws {Error} If the request fails
 */
export const removeRecipeFromCurrent = async (preparingSessionId, recipeId) => {
  try {
    const response = await apiWithCookies.delete(`/preparing/${preparingSessionId}/current-recipes/${recipeId}`);
    return response.data;
  } catch (error) {
    console.error('removeRecipeFromCurrent error:', error);
    throw error;
  }
};

/**
 * Re-add a recipe to the current list for a preparing session
 * @param {number} preparingSessionId - The preparing session ID
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<Object>} Updated current recipe ids
 * @throws {Error} If the request fails
 */
export const addRecipeToCurrent = async (preparingSessionId, recipeId) => {
  try {
    const response = await apiWithCookies.post(`/preparing/${preparingSessionId}/current-recipes/${recipeId}`);
    return response.data;
  } catch (error) {
    console.error('addRecipeToCurrent error:', error);
    throw error;
  }
};
