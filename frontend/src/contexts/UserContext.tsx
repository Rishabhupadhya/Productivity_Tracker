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

  // Fetch user profile on mount (cookies are sent automatically)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // CSRF disabled - was causing 500 errors
        // await initializeCSRF();
        
        // Try to fetch user profile (if token exists, backend will authenticate)
        await fetchUserProfile();
      } catch (err) {
        // No valid session, that's okay
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
    } catch (err: any) {
      console.error("Failed to fetch user profile:", err);
      
      // If authentication fails (401 or 403), clear user and token
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Auth failed with 401/403 - clearing token and redirecting');
        localStorage.removeItem('token');
        setUser(null);
        setError('Session expired. Please log in again.');
        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
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
