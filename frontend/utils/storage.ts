import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Cross-platform storage that works on both web and native
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.log('localStorage error:', error);
        return null;
      }
    } else {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.log('SecureStore error:', error);
        return null;
      }
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.log('localStorage error:', error);
      }
    } else {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.log('SecureStore error:', error);
      }
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.log('localStorage error:', error);
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.log('SecureStore error:', error);
      }
    }
  },
};

export default storage;
