import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'tortilleria_session';

export const StorageService = {
  async saveSession(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  },

  async getSession(): Promise<any> {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  },

  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Error limpiando sesión:', error);
    }
  }
};
