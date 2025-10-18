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
    console.error('startCookingSession error:', error);
    throw error;
  }
};

/**
 * Get cooking session details
 * @param {number} sessionId - The cooking session ID
 * @returns {Promise<Object>} Cooking session object
 * @throws {Error} If the request fails
 */
export const getCookingSession = async (sessionId) => {
  try {
    const response = await apiWithCookies.get(`/cooking/${sessionId}/get_session`);
    return response.data;
  } catch (error) {
    console.error('getCookingSession error:', error);
    throw error;
  }
};

/**
 * Update cooking session state (progress through steps)
 * @param {number} sessionId - The cooking session ID
 * @param {number} newState - The new state/step number
 * @returns {Promise<void>}
 * @throws {Error} If the request fails
 */
export const updateCookingState = async (sessionId, newState) => {
  try {
    const response = await apiWithCookies.put('/cooking/change_state', {
      cooking_session_id: sessionId,
      new_state: newState,
    });
    return response.data;
  } catch (error) {
    console.error('updateCookingState error:', error);
    throw error;
  }
};

/**
 * Ask a question during cooking
 * @param {number} sessionId - The cooking session ID
 * @param {string} prompt - The question
 * @returns {Promise<Object>} Prompt history with response
 * @throws {Error} If the request fails
 */
export const askCookingQuestion = async (sessionId, prompt) => {
  try {
    const response = await apiWithCookies.post('/cooking/ask_question', {
      cooking_session_id: sessionId,
      prompt,
    });
    return response.data;
  } catch (error) {
    console.error('askCookingQuestion error:', error);
    throw error;
  }
};

/**
 * Get prompt history for a cooking session
 * @param {number} sessionId - The cooking session ID
 * @returns {Promise<Object>} Prompt history object
 * @throws {Error} If the request fails
 */
export const getPromptHistory = async (sessionId) => {
  try {
    const response = await apiWithCookies.get(`/cooking/${sessionId}/get_prompt_history`);
    return response.data;
  } catch (error) {
    console.error('getPromptHistory error:', error);
    throw error;
  }
};

/**
 * Finish a cooking session
 * @param {number} sessionId - The cooking session ID
 * @returns {Promise<void>}
 * @throws {Error} If the request fails
 */
export const finishCookingSession = async (sessionId) => {
  try {
    const response = await apiWithCookies.delete(`/cooking/${sessionId}/finish`);
    return response.data;
  } catch (error) {
    console.error('finishCookingSession error:', error);
    throw error;
  }
};
