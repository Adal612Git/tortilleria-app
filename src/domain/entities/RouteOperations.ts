export type RouteBox = {
  id?: number;
  date: string;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string | null;
  totalSold: number;
  totalWaste: number;
  ridersInRoute: number;
  ridersSettled: number;
};

export type CoolerStatus = 'en_ruta' | 'pendiente_liquidar' | 'liquidada';

export type CoolerProductLine = {
  productId: string;
  quantity: number;
};

export type CoolerRecord = {
  id?: number;
  date: string;
  riderId: number;
  coolerNumber: number;
  kilosOut: number;
  routePrice: number;
  otherProducts: CoolerProductLine[];
  status: CoolerStatus;
  goodReturn: number;
  coldWaste: number;
  kilosSold: number;
  expectedTotal: number;
  receivedTotal: number;
  difference: number;
  initialCash: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCoolerInput = {
  date: string;
  riderId: number;
  kilosOut: number;
  routePrice: number;
  otherProducts?: CoolerProductLine[];
  inventoryProductId?: string;
  inventoryUnit?: string;
  initialCash?: number;
};

export type RouteInventorySlice = {
  id?: number;
  date: string;
  productId: string;
  quantity: number;
  unit: string;
  coolerId?: number | null;
  createdAt: string;
};

export type RouteDaySummary = {
  date: string;
  totalExpected: number;
  kilosSold: number;
  settledCoolers: number;
};

export type RiderMetrics = {
  riderId: number;
  date?: string;
  totalCoolers: number;
  kilosSold: number;
  totalExpected: number;
  totalReceived: number;
  totalDifference: number;
  averageShortage: number;
  onTargetPercentage: number;
};
