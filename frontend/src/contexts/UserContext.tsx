import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { loginUser as loginService, registerUser as registerService } from "../services/auth.server";
import { getUserProfile as getUserProfileService } from "../services/profile.service";

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
  logout: () => void;
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

  // Fetch user profile on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserProfileService();
      setUser(userData);
    } catch (err: any) {
      console.error("Failed to fetch user profile:", err);
      setError(err.response?.data?.message || "Failed to load user profile");
      // If token is invalid, clear it
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await loginService(email, password);
      localStorage.setItem("token", data.token);
      
      // Fetch user profile after successful login
      await fetchUserProfile();
      // Don't set loading to false here - page will navigate away
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
      const data = await registerService(name, email, password);
      localStorage.setItem("token", data.token);
      
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

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setError(null);
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
