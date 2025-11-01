import { apiWithCookies } from './baseApi';

const COOKING_SESSION_STORAGE_KEY = 'piatto_current_cooking_session_id';

const isBrowser = typeof window !== 'undefined';

const storeCookingSessionId = (sessionId) => {
  try {
    if (!sessionId && sessionId !== 0) {
      return;
    }

    if (isBrowser && window.localStorage) {
      window.localStorage.setItem(
        COOKING_SESSION_STORAGE_KEY,
        JSON.stringify(Number(sessionId))
      );
    }
  } catch (err) {
    console.warn('Failed to persist cooking session ID:', err);
  }
};

const getStoredCookingSessionId = () => {
  try {
    if (isBrowser && window.localStorage) {
      const raw = window.localStorage.getItem(COOKING_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }
  } catch (err) {
    console.warn('Failed to read stored cooking session ID:', err);
  }
  return null;
};

const clearStoredCookingSessionId = () => {
  try {
    if (isBrowser && window.localStorage) {
      window.localStorage.removeItem(COOKING_SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to clear stored cooking session ID:', err);
  }
};

/**
 * Start a cooking session for a recipe
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<number>} Cooking session ID
 * @throws {Error} If the request fails
 */
export const startCookingSession = async (recipeId) => {
  try {
    const response = await apiWithCookies.post(`/cooking/${recipeId}/start`);
    storeCookingSessionId(response.data);
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
 * Get prompt history for a cooking session
 * @param {number} cookingSessionId - The cooking session ID
 * @returns {Promise<Object>} Prompt history object with prompts and responses arrays
 * @throws {Error} If the request fails
 */
export const getPromptHistory = async (cookingSessionId) => {
  const sessionIdToUse = cookingSessionId ?? getStoredCookingSessionId();
  if (!sessionIdToUse && sessionIdToUse !== 0) {
    throw new Error('No cooking session ID available for prompt history request.');
  }

  try {
    const response = await apiWithCookies.get(`/cooking/${sessionIdToUse}/get_prompt_history`);
    return response.data;
  } catch (error) {
    // Log all errors to console with full error details for debugging
    console.error('getPromptHistory error:', error);
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
 * Ask a question during cooking
 * @param {number} cookingSessionId - The cooking session ID
 * @param {string} prompt - Question text
 * @returns {Promise<Object>} Prompt history object with question and answer
 * @throws {Error} If the request fails
 */
export const askCookingQuestion = async (cookingSessionId, prompt) => {
  const sessionIdToUse = cookingSessionId ?? getStoredCookingSessionId();
  if (!sessionIdToUse && sessionIdToUse !== 0) {
    throw new Error('No cooking session ID available for cooking question.');
  }

  try {
    const response = await apiWithCookies.post('/cooking/ask_question', {
      cooking_session_id: sessionIdToUse,
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
  const sessionIdToUse = cookingSessionId ?? getStoredCookingSessionId();
  if (!sessionIdToUse && sessionIdToUse !== 0) {
    throw new Error('No cooking session ID available to finish.');
  }

  try {
    const response = await apiWithCookies.delete(`/cooking/${sessionIdToUse}/finish`);
    clearStoredCookingSessionId();
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
