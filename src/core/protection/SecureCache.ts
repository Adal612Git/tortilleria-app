import AsyncStorage from '@react-native-async-storage/async-storage';

export const secureCache = {
    set: async (key: string, data: any): Promise<void> => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('Error guardando en cache:', error);
        }
    },
    get: async (key: string): Promise<any> => {
        try {
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Error leyendo cache:', error);
            return null;
        }
    },
    remove: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.warn('Error removiendo cache:', error);
        }
    }
};
