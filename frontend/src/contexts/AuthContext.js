import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;
console.log("AuthContext: Initializing with API_URL:", API_URL);

const AuthContext = createContext(null);

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
  const [error, setError] = useState(null);
  const initialLoadDone = useRef(false);

  const getStoredTokens = useCallback(() => {
    try {
      return {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken')
      };
    } catch {
      return { accessToken: null, refreshToken: null };
    }
  }, []);

  const setStoredTokens = useCallback((accessToken, refreshToken) => {
    try {
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    } catch (e) {
      console.error('Failed to store tokens:', e);
    }
  }, []);

  const clearStoredTokens = useCallback(() => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (e) {
      console.error('Failed to clear tokens:', e);
    }
  }, []);

  // Create api instance using useMemo to ensure stability
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      timeout: 45000,
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true'
      }
    });

    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refresh_token: refreshToken
              });

              const { access_token, refresh_token: newRefreshToken } = response.data;
              localStorage.setItem('accessToken', access_token);
              localStorage.setItem('refreshToken', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return instance(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }, []);

  const fetchUser = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/me', { timeout: 5000 });
      setUser(response.data.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      if (err.code === 'ECONNABORTED') {
        console.warn('Backend connection timed out. Proceeding as logged out.');
      }
      if (err.response?.status === 401 || err.code === 'ECONNABORTED') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchUser();
    }
  }, [fetchUser]);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user: userData } = response.data;
      setStoredTokens(access_token, refresh_token);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  }, [api, setStoredTokens]);

  const googleLogin = useCallback(async (idToken) => {
    setError(null);
    try {
      const response = await api.post('/auth/google', { id_token: idToken });
      const { access_token, refresh_token, user: userData } = response.data;
      setStoredTokens(access_token, refresh_token);
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Google login error detail:', err);
      const message = err.response?.data?.detail || 'Google login failed';
      setError(message);
      throw new Error(message);
    }
  }, [api, setStoredTokens]);

  const forgotPassword = useCallback(async (email) => {
    setError(null);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to request reset code';
      setError(message);
      throw new Error(message);
    }
  }, [api]);

  const verifyResetCode = useCallback(async (email, code) => {
    setError(null);
    try {
      const response = await api.post('/auth/verify-reset-code', { email, code });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Invalid verification code';
      setError(message);
      throw new Error(message);
    }
  }, [api]);

  const resetPassword = useCallback(async (email, code, new_password) => {
    setError(null);
    try {
      const response = await api.post('/auth/reset-password', { email, code, new_password });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to reset password';
      setError(message);
      throw new Error(message);
    }
  }, [api]);

  const requestOtp = useCallback(async (identifier) => {
    setError(null);
    try {
      const response = await api.post('/auth/otp/request', { identifier });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'OTP request failed';
      setError(message);
      throw new Error(message);
    }
  }, [api]);

  const verifyOtp = useCallback(async (identifier, otp) => {
    setError(null);
    try {
      const response = await api.post('/auth/otp/verify', { identifier, otp });
      const { access_token, refresh_token, user: userData } = response.data;
      setStoredTokens(access_token, refresh_token);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.detail || 'OTP verification failed';
      setError(message);
      throw new Error(message);
    }
  }, [api, setStoredTokens]);

  const verifyOtpOnly = useCallback(async (identifier, otp) => {
    setError(null);
    try {
      const response = await api.post('/auth/otp/verify-only', { identifier, otp });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'OTP verification failed';
      setError(message);
      throw new Error(message);
    }
  }, [api]);

  const register = useCallback(async (userData) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      const { access_token, refresh_token, user: newUser } = response.data;
      setStoredTokens(access_token, refresh_token);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  }, [api, setStoredTokens]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearStoredTokens();
      setUser(null);
    }
  }, [api, clearStoredTokens]);

  const updateUser = useCallback(async (updates) => {
    try {
      const response = await api.patch('/me', updates);
      setUser(response.data.data);
      return response.data.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Update failed');
    }
  }, [api]);

  const setLocation = useCallback(async (mode, data) => {
    try {
      const endpoint = mode === 'auto' ? '/location/set-auto' : '/location/set-manual';
      const response = await api.post(endpoint, data);

      // Update user with new location
      setUser(prevUser => ({ ...prevUser, ...response.data.data, location_mode: mode }));
      return response.data.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to set location');
    }
  }, [api]);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    googleLogin,
    requestOtp,
    verifyOtp,
    verifyOtpOnly,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    register,
    logout,
    updateUser,
    setLocation,
    api,
    refreshUser: fetchUser
  }), [user, loading, error, login, googleLogin, requestOtp, verifyOtp, verifyOtpOnly, forgotPassword, verifyResetCode, resetPassword, register, logout, updateUser, setLocation, api, fetchUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
