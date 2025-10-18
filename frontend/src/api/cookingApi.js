import { apiWithCookies } from './baseApi';

/**
 * Start a cooking session for a recipe
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<number>} Cooking session ID
 * @throws {Error} If the request fails
 */
export const startCookingSession = async (recipeId) => {
  try {
    const response = await apiWithCookies.post(`/cooking/${recipeId}/start`);
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('startCookingSession error:', error);
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
 * Get cooking session details
 * @param {number} cookingSessionId - The cooking session ID
 * @returns {Promise<Object>} Cooking session object with state and details
 * @throws {Error} If the request fails
 */
export const getCookingSession = async (cookingSessionId) => {
  try {
    const response = await apiWithCookies.get(`/cooking/${cookingSessionId}/get`);
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('getCookingSession error:', error);
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
 * Update cooking session state
 * @param {number} cookingSessionId - The cooking session ID
 * @param {number} newState - New state value
 * @returns {Promise<void>}
 * @throws {Error} If the request fails
 */
export const updateCookingState = async (cookingSessionId, newState) => {
  try {
    const response = await apiWithCookies.put('/cooking/change_state', {
      cooking_session_id: cookingSessionId,
      new_state: newState,
    });
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('updateCookingState error:', error);
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
 * Ask a question during cooking
 * @param {number} cookingSessionId - The cooking session ID
 * @param {string} prompt - Question text
 * @returns {Promise<Object>} Prompt history object with question and answer
 * @throws {Error} If the request fails
 */
export const askCookingQuestion = async (cookingSessionId, prompt) => {
  try {
    const response = await apiWithCookies.post('/cooking/ask_question', {
      cooking_session_id: cookingSessionId,
      prompt,
    });
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('askCookingQuestion error:', error);
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
 * Finish and cleanup a cooking session
 * @param {number} cookingSessionId - The cooking session ID
 * @returns {Promise<void>}
 * @throws {Error} If the request fails
 */
export const finishCookingSession = async (cookingSessionId) => {
  try {
    const response = await apiWithCookies.delete(`/cooking/${cookingSessionId}/finish`);
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('finishCookingSession error:', error);
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
