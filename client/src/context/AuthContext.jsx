import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncingCF, setIsSyncingCF] = useState(false);

  // Fetch current authenticated user on initial load
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      const currentUser = res.data?.user || res.data;
      if (res.success && currentUser) {
        setUser(currentUser);
      } else {
        localStorage.removeItem('cp_token');
        localStorage.removeItem('cp_refresh_token');
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('cp_token');
      localStorage.removeItem('cp_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const loggedUser = res.data?.user || res.data;
      if (res.success && loggedUser) {
        if (res.data?.accessToken) {
          localStorage.setItem('cp_token', res.data.accessToken);
        }
        if (res.data?.refreshToken) {
          localStorage.setItem('cp_refresh_token', res.data.refreshToken);
        }
        setUser(loggedUser);
        return { success: true, user: loggedUser };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const register = async (name, email, password, codeforcesHandle) => {
    setError(null);
    try {
      const payload = { name, email, password };
      if (codeforcesHandle && codeforcesHandle.trim()) {
        payload.codeforcesHandle = codeforcesHandle.trim();
      }
      const res = await api.post('/auth/register', payload);
      const regUser = res.data?.user || res.data;
      if (res.success && regUser) {
        if (res.data?.accessToken) {
          localStorage.setItem('cp_token', res.data.accessToken);
        }
        if (res.data?.refreshToken) {
          localStorage.setItem('cp_refresh_token', res.data.refreshToken);
        }
        setUser(regUser);
        return { success: true, user: regUser };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('cp_token');
      localStorage.removeItem('cp_refresh_token');
      setUser(null);
    }
  };

  const syncCodeforces = async () => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setIsSyncingCF(true);
    try {
      const res = await api.post('/users/me/codeforces/sync');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return {
          success: true,
          user: res.data.user,
          stats: res.data.stats,
          totalSolved: res.data.stats?.totalSolved,
        };
      }
      throw new Error(res.message || 'Sync failed');
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsSyncingCF(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.patch('/users/me', profileData);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res.message || 'Profile update failed');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    isSyncingCF,
    login,
    register,
    logout,
    syncCodeforces,
    updateProfile,
    refreshUser: fetchCurrentUser,
    isAuthenticated: !!user,
    isMentor: user?.role === 'mentor' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
