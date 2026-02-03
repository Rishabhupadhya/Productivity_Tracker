import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { loginUser as loginService, registerUser as registerService, logoutUser as logoutService } from "../services/auth.server";
import { getUserProfile as getUserProfileService } from "../services/profile.service";
// import { initializeCSRF } from "../services/api"; // DISABLED - CSRF causing 500 errors

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  activeTeamId?: string;
  xp?: number;
  level?: number;
  settings?: {
    theme?: string;
    notifications?: boolean;
    [key: string]: any;
  };
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserData: (data: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile on mount (only if token exists)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if token exists in localStorage first
        const token = localStorage.getItem('token');
        
        if (!token) {
          // No token - user is not logged in
          console.log('No token in localStorage - user not authenticated');
          setLoading(false);
          return;
        }
        
        // Token exists - fetch user profile
        console.log('Token found, fetching user profile...');
        await fetchUserProfile();
      } catch (err) {
        console.error('Auth initialization failed:', err);
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserProfileService();
      setUser(userData);
      console.log('User profile loaded successfully:', userData?.name || 'Unknown');
    } catch (err: any) {
      console.error("Failed to fetch user profile:", err);
      
      // If authentication fails (401 or 403), clear token and user
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Auth failed with 401/403 - token is invalid');
        localStorage.removeItem('token');
        setUser(null);
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || "Failed to load user profile");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await loginService(email, password);
      // Token is stored in localStorage by service
      
      // Verify token was saved before fetching profile
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Failed to save authentication token');
      }
      
      console.log('Login successful, token saved');
      // Fetch user profile after successful login
      await fetchUserProfile();
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || err.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await registerService(name, email, password);
      // Cookies are set automatically by backend
      
      // Fetch user profile after successful registration
      await fetchUserProfile();
      // Don't set loading to false here - page will navigate away
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || err.message || "Registration failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = useCallback(async () => {
    try {
      await logoutService();
      // Cookies are cleared by backend
      setUser(null);
      setError(null);
    } catch (err: any) {
      console.error("Logout failed:", err);
      // Even if logout fails, clear local state
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUserProfile();
  }, [fetchUserProfile]);

  const updateUserData = useCallback((data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  }, []);

  const value: UserContextType = useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    updateUserData,
  }), [user, loading, error, login, register, logout, refreshUser, updateUserData]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
