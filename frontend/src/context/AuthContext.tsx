import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, profileAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  goal_weight_kg?: number;
  activity_level?: string;
  bmi?: number;
  daily_calorie_goal?: number;
  coach_code?: string;
  package_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    goal_weight_kg?: number;
    activity_level?: string;
  }) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token is still valid
        try {
          const userData = await authAPI.me();
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          // Token invalid, clear storage
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    await AsyncStorage.setItem('auth_token', response.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    setToken(response.access_token);
    setUser(response.user);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    goal_weight_kg?: number;
    activity_level?: string;
  }) => {
    const response = await authAPI.register(data);
    await AsyncStorage.setItem('auth_token', response.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    setToken(response.access_token);
    setUser(response.user);
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await profileAPI.update(data);
    // Refresh user data
    const userData = await authAPI.me();
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        updateProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
