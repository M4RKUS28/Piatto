import { apiWithCookies } from './baseApi';

/**
 * Fetch all permanent recipes for the authenticated user
 * @returns {Promise<Array>} Array of recipe preview objects
 * @throws {Error} If the request fails
 */
export const getUserRecipes = async () => {
  try {
    const response = await apiWithCookies.get('/recipe/get_all');
    return response.data;
  } catch (error) {
    console.error('getUserRecipes error:', error);
    throw error;
  }
};

/**
 * Fetch a single recipe by ID
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<Object>} Complete recipe object
 * @throws {Error} If the request fails
 */
export const getRecipeById = async (recipeId) => {
  try {
    const response = await apiWithCookies.get(`/recipe/${recipeId}/get`);
    return response.data;
  } catch (error) {
    console.error('getRecipeById error:', error);
    throw error;
  }
};

/**
 * Save a recipe (mark as permanent)
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<void>}
 * @throws {Error} If the request fails
 */
export const saveRecipe = async (recipeId) => {
  try {
    const response = await apiWithCookies.post(`/recipe/${recipeId}/save`);
    return response.data;
  } catch (error) {
    console.error('saveRecipe error:', error);
    throw error;
  }
};

/**
 * Unsave a recipe (mark as temporary)
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<void>}
 * @throws {Error} If the request fails
 */
export const unsaveRecipe = async (recipeId) => {
  try {
    const response = await apiWithCookies.post(`/recipe/${recipeId}/unsave`);
    return response.data;
  } catch (error) {
    console.error('unsaveRecipe error:', error);
    throw error;
  }
};

/**
 * Delete a recipe
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<void>}
 * @throws {Error} If the request fails
 */
export const deleteRecipe = async (recipeId) => {
  try {
    const response = await apiWithCookies.delete(`/recipe/${recipeId}/delete`);
    return response.data;
  } catch (error) {
    console.error('deleteRecipe error:', error);
    throw error;
  }
};

/**
 * Update recipe using AI
 * @param {number} recipeId - The recipe ID
 * @param {string} changePrompt - The change request
 * @returns {Promise<Object>} Updated recipe object
 * @throws {Error} If the request fails
 */
export const changeRecipeAI = async (recipeId, changePrompt) => {
  try {
    const response = await apiWithCookies.put('/recipe/change_ai', {
      recipe_id: recipeId,
      change_prompt: changePrompt,
    });
    return response.data;
  } catch (error) {
    console.error('changeRecipeAI error:', error);
    throw error;
  }
};

/**
 * Update recipe manually
 * @param {number} recipeId - The recipe ID
 * @param {Object} updates - Recipe updates
 * @returns {Promise<Object>} Updated recipe object
 * @throws {Error} If the request fails
 */
export const changeRecipeManual = async (recipeId, updates) => {
  try {
    const response = await apiWithCookies.put('/recipe/change_manual', {
      recipe_id: recipeId,
      ...updates,
    });
    return response.data;
  } catch (error) {
    console.error('changeRecipeManual error:', error);
    throw error;
  }
};
