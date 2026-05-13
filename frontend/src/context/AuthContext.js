import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API_URL = process.env.REACT_APP_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor for auth header
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Validate token on app load
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (response.data.success) {
          setUser(response.data.data);
          setToken(storedToken);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      if (response.data.success) {
        const { user: userData, token: newToken } = response.data.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        return { success: false, message: err.response.data.message };
      }
      return { success: false, message: 'Invalid login credentials' };
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, { name, email, password });
      if (response.data.success) {
        const { user: userData, token: newToken } = response.data.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        return { success: false, message: err.response.data.message };
      }
      return { success: false, message: 'An error occurred during sign up' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const response = await axios.put(`${API_URL}/api/auth/update-profile`, data);
      if (response.data.success) {
        setUser(response.data.data);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        return { success: false, message: err.response.data.message };
      }
      return { success: false, message: 'Failed to update profile' };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const response = await axios.put(`${API_URL}/api/auth/change-password`, {
        currentPassword, newPassword
      });
      return { success: response.data.success, message: response.data.message };
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        return { success: false, message: err.response.data.message };
      }
      return { success: false, message: 'Failed to change password' };
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    signup,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
