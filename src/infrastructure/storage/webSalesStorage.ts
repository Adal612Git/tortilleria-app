import AsyncStorage from '@react-native-async-storage/async-storage';

export const WEB_SALES_STORAGE_KEY = '@tortilleria/sales';

export type WebSaleLine = {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  saleDate: string;
  paymentMethod: string;
  userId?: number;
};

const parse = (raw: string | null): WebSaleLine[] => {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const readWebSales = async (): Promise<WebSaleLine[]> => {
  const raw = await AsyncStorage.getItem(WEB_SALES_STORAGE_KEY);
  return parse(raw);
};

export const appendWebSales = async (lines: WebSaleLine[]): Promise<void> => {
  if (!lines.length) return;
  const current = await readWebSales();
  await AsyncStorage.setItem(WEB_SALES_STORAGE_KEY, JSON.stringify([...current, ...lines]));
};
