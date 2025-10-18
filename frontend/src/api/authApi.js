import { apiWithCookies } from './baseApi';

/**
 * Login with email or username and password
 * @param {string} emailOrUsername - Email address or username
 * @param {string} password - Password
 */
export const login = async (emailOrUsername, password) => {
  const formData = new URLSearchParams();
  formData.append('username', emailOrUsername);
  formData.append('password', password);

  const response = await apiWithCookies.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response.data;
};

/**
 * Register new user
 */
export const register = async (email, password, username) => {
  const response = await apiWithCookies.post('/auth/signup', {
    email,
    password,
    username,
  });
  
  return response.data;
};

/**
 * Logout current user
 */
export const logout = async () => {
  const response = await apiWithCookies.post('/auth/logout');
  return response.data;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    console.log('AuthAPI: Fetching current user...');
    const response = await apiWithCookies.get('/users/me');
    console.log("Current User:", response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Initiate Google OAuth login
 * Redirects to backend Google OAuth endpoint
 */
export const initiateGoogleLogin = () => {
  const backendUrl = window.location.origin;
  window.location.href = `${backendUrl}/api/auth/login/google`;
};

/**
 * Refresh authentication token
 */
export const refreshToken = async () => {
  const response = await apiWithCookies.post('/auth/refresh');
  return response.data;
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updateData - Data to update (username, email, profile_image_url, theme, language)
 */
export const updateUser = async (userId, updateData) => {
  const response = await apiWithCookies.put(`/users/${userId}`, updateData);
  return response.data;
};
