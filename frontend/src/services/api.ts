import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://pdf-platform-1.preview.emergentagent.com/api';

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
  register: async (data: { name: string; email: string; password: string; invite_code: string }) => {
    const response = await api.post('/auth/register', { ...data, role: 'client' });
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

// Client endpoints
export const clientAPI = {
  getDashboard: async () => {
    const response = await api.get('/client/dashboard');
    return response.data;
  },
  
  getDietPlan: async () => {
    const response = await api.get('/client/diet-plan');
    return response.data;
  },
  
  getWeights: async () => {
    const response = await api.get('/client/weights');
    return response.data;
  },
  
  logWeight: async (weight_kg: number, notes?: string) => {
    const response = await api.post('/client/weight', { weight_kg, notes });
    return response.data;
  },
  
  getCheckins: async () => {
    const response = await api.get('/client/checkins');
    return response.data;
  },
  
  getCheckinToday: async () => {
    const response = await api.get('/client/checkin/today');
    return response.data;
  },
  
  submitCheckin: async (data: {
    meals: Array<{ meal_name: string; completed: boolean }>;
    water_glasses: number;
    mood: string;
    notes?: string;
  }) => {
    const response = await api.post('/client/checkin', data);
    return response.data;
  },
};

export default api;
