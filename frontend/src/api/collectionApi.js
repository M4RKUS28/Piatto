import { apiWithCookies } from './baseApi';

/**
 * Fetch all collections for the authenticated user
 * @returns {Promise<Array>} Array of collection preview objects
 * @throws {Error} If the request fails
 */
export const getUserCollections = async () => {
  try {
    const response = await apiWithCookies.get('/collection/all');
    return response.data;
  } catch (error) {
    console.error('getUserCollections error:', error);
    throw error;
  }
};

/**
 * Fetch a single collection by ID with all its recipes
 * @param {number} collectionId - The collection ID
 * @returns {Promise<Object>} Complete collection object with recipes
 * @throws {Error} If the request fails
 */
export const getCollectionById = async (collectionId) => {
  try {
    const response = await apiWithCookies.get(`/collection/${collectionId}`);
    return response.data;
  } catch (error) {
    console.error('getCollectionById error:', error);
    throw error;
  }
};

/**
 * Create a new collection
 * @param {Object} collectionData - { name: string, description?: string }
 * @returns {Promise<Object>} Created collection object
 * @throws {Error} If the request fails
 */
export const createCollection = async (collectionData) => {
  try {
    const response = await apiWithCookies.post('/collection/create', collectionData);
    return response.data;
  } catch (error) {
    console.error('createCollection error:', error);
    throw error;
  }
};

/**
 * Update an existing collection
 * @param {number} collectionId - The collection ID
 * @param {Object} updates - { name?: string, description?: string }
 * @returns {Promise<Object>} Updated collection object
 * @throws {Error} If the request fails
 */
export const updateCollection = async (collectionId, updates) => {
  try {
    const response = await apiWithCookies.put(`/collection/${collectionId}`, updates);
    return response.data;
  } catch (error) {
    console.error('updateCollection error:', error);
    throw error;
  }
};

/**
 * Delete a collection
 * @param {number} collectionId - The collection ID
 * @returns {Promise<void>}
 * @throws {Error} If the request fails
 */
export const deleteCollection = async (collectionId) => {
  try {
    const response = await apiWithCookies.delete(`/collection/${collectionId}`);
    return response.data;
  } catch (error) {
    console.error('deleteCollection error:', error);
    throw error;
  }
};

/**
 * Update the recipes in a collection
 * @param {number} collectionId - The collection ID
 * @param {Array<number>} recipeIds - Array of recipe IDs to set
 * @returns {Promise<Object>} Updated collection object
 * @throws {Error} If the request fails
 */
export const updateCollectionRecipes = async (collectionId, recipeIds) => {
  try {
    const response = await apiWithCookies.patch(`/collection/${collectionId}/recipes`, {
      recipe_ids: recipeIds,
    });
    return response.data;
  } catch (error) {
    console.error('updateCollectionRecipes error:', error);
    throw error;
  }
};

/**
 * Get all collections that contain a specific recipe
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<Array>} Array of collection objects
 * @throws {Error} If the request fails
 */
export const getCollectionsForRecipe = async (recipeId) => {
  try {
    const response = await apiWithCookies.get(`/collection/recipe/${recipeId}/collections`);
    return response.data;
  } catch (error) {
    console.error('getCollectionsForRecipe error:', error);
    throw error;
  }
};
