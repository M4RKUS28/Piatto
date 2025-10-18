import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';
import { extractErrorMessage } from '../utils/errorHandler';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Fetch current user from /users/me
  const fetchAndSetCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      console.log('AuthContext: Fetching current user...');
      const userData = await authApi.getCurrentUser();
      console.log("Current User after await authApi.getCurrentUser();:", userData);
      
      if (userData && userData.id) {
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    fetchAndSetCurrentUser();
  }, [fetchAndSetCurrentUser]);

  // Login with email or username and password
  const login = async (emailOrUsername, password) => {
    try {
      setLoading(true);
      await authApi.login(emailOrUsername, password);
      const userData = await fetchAndSetCurrentUser();
      
      if (userData) {
        navigate('/app');
        return { success: true };
      } else {
        return { success: false, error: 'Failed to fetch user data after login' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = extractErrorMessage(error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (email, password, username) => {
    try {
      setLoading(true);
      await authApi.register(email, password, username);
      const userData = await fetchAndSetCurrentUser();
      
      if (userData) {
        navigate('/app');
        return { success: true };
      } else {
        return { success: false, error: 'Failed to fetch user data after registration' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = extractErrorMessage(error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on backend, clear local state
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Initiate Google OAuth login
  const loginWithGoogle = () => {
    authApi.initiateGoogleLogin();
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    loginWithGoogle,
    fetchAndSetCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
