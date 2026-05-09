import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, profileAPI } from '../services/api';
import { portalAuthAPI, PortalRegisterPayload } from '../services/portalApi';
import { registerPushTokenWithPortal, clearPushTokenRegistration } from '../services/pushToken';

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
  // Portal (coach) connection
  isCoachConnected: boolean;
  portalToken: string | null;
  coachId: string | null;
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
  // Portal (coach) actions
  connectCoach: (inviteCode: string, password?: string) => Promise<{ coach_id: string | null }>;
  disconnectCoach: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedPortalToken = await AsyncStorage.getItem('portal_token');
      const storedCoachId = await AsyncStorage.getItem('coach_id');

      if (storedPortalToken) setPortalToken(storedPortalToken);
      if (storedCoachId) setCoachId(storedCoachId);

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

      // Try register push token in the background if portal connection exists
      if (storedPortalToken) {
        registerPushTokenWithPortal().catch(() => {});
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

    // Best-effort: re-login to portal with same credentials if we previously connected.
    // We do NOT register them on the portal automatically — only re-auth if a portal_token existed.
    const existingPortalToken = await AsyncStorage.getItem('portal_token');
    if (existingPortalToken) {
      try {
        const portalRes = await portalAuthAPI.login(email, password);
        const newPortalToken = portalRes.access_token || portalRes.token;
        if (newPortalToken) {
          await AsyncStorage.setItem('portal_token', newPortalToken);
          setPortalToken(newPortalToken);
          const cid = portalRes.client?.coach_id || portalRes.user?.coach_id;
          if (cid) {
            await AsyncStorage.setItem('coach_id', cid);
            setCoachId(cid);
          }
          registerPushTokenWithPortal().catch(() => {});
        }
      } catch (e) {
        // Portal re-auth failed; leave portal disconnected for this session
      }
    }
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
    await AsyncStorage.removeItem('portal_token');
    await AsyncStorage.removeItem('coach_id');
    await clearPushTokenRegistration();
    setToken(null);
    setUser(null);
    setPortalToken(null);
    setCoachId(null);
  };

  /**
   * Connect the user to a coach by registering them on the web portal with the
   * supplied invite_code. Email comes from the local user; password is required
   * the first time so we can create the portal account.
   */
  const connectCoach = async (inviteCode: string, password?: string) => {
    if (!user || !user.email) throw new Error('You must be signed in first.');
    const code = inviteCode.trim();
    if (!code) throw new Error('Please enter an invite code.');

    const payload: PortalRegisterPayload = {
      email: user.email,
      password: password || `${user.email}::diettracker`, // deterministic fallback if user not asked
      name: user.name,
      invite_code: code,
    };

    let portalRes: any;
    try {
      portalRes = await portalAuthAPI.register(payload);
    } catch (e: any) {
      // If user already exists on portal, try login instead
      if (e?.response?.status === 400) {
        try {
          portalRes = await portalAuthAPI.login(payload.email, payload.password);
        } catch (innerErr: any) {
          throw new Error(
            'A portal account exists for this email but the password did not match. Please use the same password as your portal account.'
          );
        }
      } else {
        throw new Error(
          e?.response?.data?.detail || 'Failed to connect with coach. Please try again.'
        );
      }
    }

    const newToken: string | undefined = portalRes?.access_token || portalRes?.token;
    if (!newToken) throw new Error('Portal did not return a token.');

    const portalCoachId: string | null =
      portalRes?.client?.coach_id || portalRes?.user?.coach_id || null;

    await AsyncStorage.setItem('portal_token', newToken);
    if (portalCoachId) await AsyncStorage.setItem('coach_id', portalCoachId);

    setPortalToken(newToken);
    setCoachId(portalCoachId);

    // Register Expo push token with portal in background
    registerPushTokenWithPortal().catch(() => {});

    return { coach_id: portalCoachId };
  };

  const disconnectCoach = async () => {
    await AsyncStorage.removeItem('portal_token');
    await AsyncStorage.removeItem('coach_id');
    await clearPushTokenRegistration();
    setPortalToken(null);
    setCoachId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isCoachConnected: !!portalToken,
        portalToken,
        coachId,
        login,
        register,
        updateProfile,
        logout,
        refreshUser,
        connectCoach,
        disconnectCoach,
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
