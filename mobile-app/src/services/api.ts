import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = __DEV__
  ? 'http://192.168.0.35:5000/api/v1'   // Local dev — your machine's LAN IP
  : 'https://church-connect-api-qylf.onrender.com/api/v1'; // Production

const api = axios.create({
  baseURL: API_BASE_URL,
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
    }
    return Promise.reject(error);
  }
);

export default api;