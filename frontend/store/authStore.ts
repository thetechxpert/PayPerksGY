import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';

interface User {
  id: string;
  role: 'user' | 'merchant' | 'admin';
  name?: string;
  email: string;
  business_name?: string;
  approved?: boolean;
  points_balance?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  registerMerchant: (data: any) => Promise<void>;
  registerAdmin: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      await SecureStore.setItemAsync('auth_token', access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  registerUser: async (data: any) => {
    try {
      const response = await api.post('/auth/register/user', data);
      const { access_token, user } = response.data;
      
      await SecureStore.setItemAsync('auth_token', access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  registerMerchant: async (data: any) => {
    try {
      const response = await api.post('/auth/register/merchant', data);
      const { access_token, user } = response.data;
      
      await SecureStore.setItemAsync('auth_token', access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  registerAdmin: async (data: any) => {
    try {
      const response = await api.post('/auth/register/admin', data);
      const { access_token, user } = response.data;
      
      await SecureStore.setItemAsync('auth_token', access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userData = await SecureStore.getItemAsync('user_data');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        set({ user, token, isAuthenticated: true, isLoading: false });
        
        // Refresh user data from server
        try {
          const response = await api.get('/auth/me');
          const freshUser = response.data;
          await SecureStore.setItemAsync('user_data', JSON.stringify(freshUser));
          set({ user: freshUser });
        } catch (error) {
          // Token might be invalid
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_data');
          set({ user: null, token: null, isAuthenticated: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data;
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.log('Error refreshing user:', error);
    }
  },
}));
