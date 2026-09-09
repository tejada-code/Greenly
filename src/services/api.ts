import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Expo Go en un dispositivo físico debe acceder a la IP LAN del equipo servidor.
const API_BASE_URL = 'http://192.168.18.181:8080/api';

export const TOKEN_STORAGE_KEY = '@greenly/jwt';
export const USER_STORAGE_KEY = '@greenly/user';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;