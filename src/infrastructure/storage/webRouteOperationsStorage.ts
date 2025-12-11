import AsyncStorage from '@react-native-async-storage/async-storage';

export const ROUTE_BOXES_KEY = '@tortilleria/route_boxes';
export const ROUTE_COOLERS_KEY = '@tortilleria/route_coolers';
export const ROUTE_INVENTORY_KEY = '@tortilleria/route_inventory';

export type WebRouteBoxRecord = {
  id: number;
  date: string;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string | null;
  totalSold: number;
  totalWaste: number;
  ridersInRoute: number;
  ridersSettled: number;
};

export type WebCoolerRecord = {
  id: number;
  date: string;
  riderId: number;
  coolerNumber: number;
  kilosOut: number;
  routePrice: number;
  otherProducts: { productId: number; quantity: number }[];
  status: 'en_ruta' | 'pendiente_liquidar' | 'liquidada';
  goodReturn: number;
  coldWaste: number;
  kilosSold: number;
  expectedTotal: number;
  receivedTotal: number;
  difference: number;
  createdAt: string;
  updatedAt: string;
};

export type WebRouteInventoryRecord = {
  id: number;
  date: string;
  productId: string;
  quantity: number;
  unit: string;
  coolerId?: number | null;
  createdAt: string;
};

const parseList = <T,>(raw: string | null): T[] => {
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

const writeList = async (key: string, list: any[]): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(list));
};

export const readRouteBoxes = async (): Promise<WebRouteBoxRecord[]> => {
  const raw = await AsyncStorage.getItem(ROUTE_BOXES_KEY);
  return parseList<WebRouteBoxRecord>(raw);
};

export const saveRouteBoxes = async (boxes: WebRouteBoxRecord[]): Promise<void> => {
  await writeList(ROUTE_BOXES_KEY, boxes);
};

export const readRouteCoolers = async (): Promise<WebCoolerRecord[]> => {
  const raw = await AsyncStorage.getItem(ROUTE_COOLERS_KEY);
  return parseList<WebCoolerRecord>(raw);
};

export const saveRouteCoolers = async (coolers: WebCoolerRecord[]): Promise<void> => {
  await writeList(ROUTE_COOLERS_KEY, coolers);
};

export const readRouteInventory = async (): Promise<WebRouteInventoryRecord[]> => {
  const raw = await AsyncStorage.getItem(ROUTE_INVENTORY_KEY);
  return parseList<WebRouteInventoryRecord>(raw);
};

export const saveRouteInventory = async (records: WebRouteInventoryRecord[]): Promise<void> => {
  await writeList(ROUTE_INVENTORY_KEY, records);
};
