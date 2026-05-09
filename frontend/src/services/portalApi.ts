import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Web portal (DietTracker Pro) API. Source of truth for: client/coach link, diet plan, check-in, chat
const PORTAL_BASE_URL =
  process.env.EXPO_PUBLIC_PORTAL_URL ||
  'https://pdf-platform-1.preview.emergentagent.com';

export const PORTAL_API_URL = `${PORTAL_BASE_URL}/api`;

const portal = axios.create({
  baseURL: PORTAL_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

portal.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portal.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.warn('[Portal API]', error.response.status, error.config?.url, error.response.data);
    } else {
      console.warn('[Portal API] network error:', error.message);
    }
    return Promise.reject(error);
  }
);

export interface PortalRegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  invite_code: string; // required for coach-linked register
}

export interface PortalDietMealItem {
  name: string;
  quantity?: string;
  calories?: number;
}

export interface PortalDietMeal {
  time?: string;
  name: string;
  items: PortalDietMealItem[];
}

export interface PortalDietPlan {
  id: string;
  name: string;
  description?: string;
  daily_calories?: number;
  meals: PortalDietMeal[];
  instructions?: string;
}

export const portalAuthAPI = {
  register: async (data: PortalRegisterPayload) => {
    const res = await portal.post('/client/auth/register', data);
    return res.data;
  },
  login: async (email: string, password: string) => {
    const res = await portal.post('/client/auth/login', { email, password });
    return res.data;
  },
  me: async () => {
    const res = await portal.get('/client/me');
    return res.data;
  },
};

export const portalDietPlanAPI = {
  getAssigned: async () => {
    const res = await portal.get('/client/diet-plan');
    return res.data;
  },
};

export const portalDashboardAPI = {
  get: async () => {
    const res = await portal.get('/client/dashboard');
    return res.data;
  },
};

// Push token endpoint (NOT yet implemented on portal side — see INTEGRATION_TODO.md)
// We attempt the call; gracefully no-op on 404/501.
export const portalPushAPI = {
  registerToken: async (expo_push_token: string, device_info?: Record<string, any>) => {
    try {
      const res = await portal.post('/client/push-token', {
        expo_push_token,
        platform: device_info?.platform || 'unknown',
        device_info,
      });
      return { ok: true, data: res.data };
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404 || status === 501) {
        // Endpoint not yet available on portal — silent no-op
        return { ok: false, reason: 'not_implemented' };
      }
      return { ok: false, reason: e?.message || 'error' };
    }
  },
};

export default portal;
