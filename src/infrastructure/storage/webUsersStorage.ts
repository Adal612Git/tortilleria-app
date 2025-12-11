import AsyncStorage from '@react-native-async-storage/async-storage';

export const WEB_USERS_STORAGE_KEY = '@tortilleria/users';

export type WebUserRecord = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'empleado' | 'repartidor';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const parseList = (raw: string | null): WebUserRecord[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const readWebUsers = async (): Promise<WebUserRecord[]> => {
  const raw = await AsyncStorage.getItem(WEB_USERS_STORAGE_KEY);
  return parseList(raw);
};

export const saveWebUsers = async (users: WebUserRecord[]): Promise<void> => {
  await AsyncStorage.setItem(WEB_USERS_STORAGE_KEY, JSON.stringify(users));
};

export const getNextWebUserId = (users: WebUserRecord[]): number => {
  return users.reduce((max, user) => (user.id > max ? user.id : max), 0) + 1;
};
