import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your computer's IP address when testing on physical device
// On emulator/simulator, localhost works fine
const API_BASE = __DEV__ 
  ? 'http://192.168.0.35:5000/api/v1'  // For Android emulator use 10.0.2.2:5000
  : 'https://church-connect-api-qylf.onrender.com/api/v1';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'https://church-connect-api-qylf.onrender.com/api/v1'
});

// Request interceptor - attach token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Navigation to login will be handled by auth state change
    }
    return Promise.reject(error);
  }
);

export default api;