import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Use local backend API
const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL 
  ? `${Constants.expoConfig.extra.EXPO_PUBLIC_BACKEND_URL}/api`
  : 'https://meal-log-mobile.preview.emergentagent.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: async (data: {
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
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Profile endpoints
export const profileAPI = {
  update: async (data: {
    name?: string;
    age?: number;
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    goal_weight_kg?: number;
    activity_level?: string;
  }) => {
    const response = await api.put('/profile', data);
    return response.data;
  },
};

// Dashboard endpoint
export const dashboardAPI = {
  get: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

// Weight endpoints
export const weightAPI = {
  log: async (weight_kg: number, notes?: string) => {
    const response = await api.post('/weight', { weight_kg, notes });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/weight/history');
    return response.data;
  },
};

// Water endpoints
export const waterAPI = {
  log: async (glasses: number) => {
    const response = await api.post('/water', { glasses });
    return response.data;
  },

  getToday: async () => {
    const response = await api.get('/water/today');
    return response.data;
  },
};

// Sleep endpoints
export const sleepAPI = {
  log: async (data: { bedtime: string; wake_time: string; quality?: string; notes?: string }) => {
    const response = await api.post('/sleep', data);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/sleep/history');
    return response.data;
  },
};

// Workout endpoints
export const workoutAPI = {
  log: async (data: {
    workout_type: string;
    duration_mins: number;
    calories_burned?: number;
    exercises?: Array<{ name: string; sets?: number; reps?: number }>;
    notes?: string;
  }) => {
    const response = await api.post('/workout', data);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/workout/history');
    return response.data;
  },
};

// Steps endpoints
export const stepsAPI = {
  log: async (steps: number, distance_km?: number, calories_burned?: number) => {
    const response = await api.post('/steps', { steps, distance_km, calories_burned });
    return response.data;
  },

  getToday: async () => {
    const response = await api.get('/steps/today');
    return response.data;
  },
};

// Meals endpoints
export const mealsAPI = {
  log: async (data: {
    meal_type: string;
    food_items: Array<{ name: string; calories?: number; protein?: number; carbs?: number; fat?: number }>;
    total_calories?: number;
    notes?: string;
  }) => {
    const response = await api.post('/meal', data);
    return response.data;
  },

  getToday: async () => {
    const response = await api.get('/meals/today');
    return response.data;
  },
};

// Diet Plan endpoints
export const dietPlanAPI = {
  getSample: async () => {
    const response = await api.get('/diet-plan/sample');
    return response.data;
  },
};

// Packages endpoints
export const packagesAPI = {
  getAll: async () => {
    const response = await api.get('/packages');
    return response.data;
  },

  subscribe: async (packageId: string) => {
    const response = await api.post(`/packages/subscribe/${packageId}`);
    return response.data;
  },
};

// Coach endpoints
export const coachAPI = {
  connect: async (coachCode: string) => {
    const response = await api.post('/coach/connect', { coach_code: coachCode });
    return response.data;
  },

  disconnect: async () => {
    const response = await api.delete('/coach/disconnect');
    return response.data;
  },
};

export default api;
