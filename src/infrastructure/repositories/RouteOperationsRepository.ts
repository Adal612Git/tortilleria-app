import { Platform } from 'react-native';
import { DatabaseService } from '../database/DatabaseService';
import {
  RouteBox,
  CoolerRecord,
  CreateCoolerInput,
  RouteDaySummary,
  RiderMetrics,
} from '../../domain/entities/RouteOperations';
import {
  readRouteBoxes,
  saveRouteBoxes,
  readRouteCoolers,
  saveRouteCoolers,
  readRouteInventory,
  saveRouteInventory,
  WebRouteBoxRecord,
  WebCoolerRecord,
  WebRouteInventoryRecord,
} from '../storage/webRouteOperationsStorage';
import { ProductRepositoryImpl } from './ProductRepositoryImpl';

const mexicoCityFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatDateKey = (value: string) => {
  const fallback = mexicoCityFormatter.format(new Date());
  if (value) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      // Keep every operation anchored to Mexico City timezone to avoid UTC drift.
      return mexicoCityFormatter.format(parsed);
    }
  }
  return fallback;
};

const mapBoxRecord = (record: WebRouteBoxRecord): RouteBox => ({
  id: record.id,
  date: record.date,
  isOpen: record.isOpen,
  openedAt: record.openedAt,
  closedAt: record.closedAt ?? null,
  totalSold: record.totalSold,
  totalWaste: record.totalWaste,
  ridersInRoute: record.ridersInRoute,
  ridersSettled: record.ridersSettled,
});

const mapCoolerRecord = (record: WebCoolerRecord): CoolerRecord => ({
  id: record.id,
  date: record.date,
  riderId: record.riderId,
  coolerNumber: record.coolerNumber,
  kilosOut: record.kilosOut,
  routePrice: record.routePrice,
  initialCash: record.initialCash ?? 0,
  otherProducts: record.otherProducts,
  status: record.status,
  goodReturn: record.goodReturn,
  coldWaste: record.coldWaste,
  kilosSold: record.kilosSold,
  expectedTotal: record.expectedTotal,
  receivedTotal: record.receivedTotal,
  difference: record.difference,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export class RouteOperationsRepository {
  private dbService = DatabaseService.getInstance();
  private readonly isWeb = Platform.OS === 'web';
  private products = new ProductRepositoryImpl();

  private mapBoxRow(row: any): RouteBox {
    return {
      id: Number(row.id),
      date: row.date,
      isOpen: row.isOpen === 1,
      openedAt: row.openedAt,
      closedAt: row.closedAt ?? null,
      totalSold: Number(row.totalSold ?? 0),
      totalWaste: Number(row.totalWaste ?? 0),
      ridersInRoute: Number(row.ridersInRoute ?? 0),
      ridersSettled: Number(row.ridersSettled ?? 0),
    };
  }

  private mapCoolerRow(row: any): CoolerRecord {
    let otherProducts: { productId: number; quantity: number }[] = [];
    if (row.otherProducts) {
      try {
        const parsed = JSON.parse(row.otherProducts);
        if (Array.isArray(parsed)) {
          otherProducts = parsed;
        }
      } catch {
        otherProducts = [];
      }
    }
    return {
      id: Number(row.id),
      date: row.date,
      riderId: Number(row.riderId ?? row.repartidor_id ?? 0),
      coolerNumber: Number(row.coolerNumber ?? row.numero_hielera ?? 0),
      kilosOut: Number(row.kilosOut ?? row.kilos_salidos ?? 0),
      routePrice: Number(row.routePrice ?? row.precio_ruta ?? 0),
      initialCash: Number(row.initialCash ?? 0),
      otherProducts,
      status: (row.status ?? 'en_ruta') as CoolerRecord['status'],
      goodReturn: Number(row.goodReturn ?? row.kilos_sobrantes_buenos ?? 0),
      coldWaste: Number(row.coldWaste ?? row.kilos_merma_fria ?? 0),
      kilosSold: Number(row.kilosSold ?? row.kilos_vendidos ?? 0),
      expectedTotal: Number(row.expectedTotal ?? row.total_esperado ?? 0),
      receivedTotal: Number(row.receivedTotal ?? row.total_recibido ?? 0),
      difference: Number(row.difference ?? row.faltante ?? 0),
      createdAt: row.createdAt ?? new Date().toISOString(),
      updatedAt: row.updatedAt ?? new Date().toISOString(),
    };
  }

  private async updateProductStock(productId: string, delta: number) {
    if (!productId || !delta) {
      return;
    }
    const product = await this.products.getById(productId);
    await this.products.update(productId, { stock: product.stock + delta });
  }

  private async getInventorySlices(coolerId: number) {
    if (this.isWeb) {
      const records = await readRouteInventory();
      return records.filter((record) => record.coolerId === coolerId);
    }
    const db = await this.dbService.getDatabase();
    const result = await db.runAsync(
      `INSERT INTO coolers (
        date, riderId, coolerNumber, kilosOut, routePrice, initialCash, otherProducts, status,
        goodReturn, coldWaste, kilosSold, expectedTotal, receivedTotal, difference,
        createdAt, updatedAt
      ) VALUES (
        ?,
        ?,
        (SELECT COALESCE(MAX(coolerNumber), 0) + 1 FROM coolers WHERE date = ?),
        ?, ?, ?, ?, 'en_ruta',
        0, 0, 0, 0, 0, 0,
        ?, ?
      )`,
      [
        normalizedDate,
        input.riderId,
        normalizedDate,
        input.kilosOut,
        input.routePrice,
        input.initialCash ?? input.routePrice * input.kilosOut,
        JSON.stringify(otherProducts),
        now,
        now,
      ]
    );
    const insertedId = Number(result.lastInsertRowId);
    await this.reserveInventory(normalizedDate, inventoryProductId, input.kilosOut, inventoryUnit, insertedId);
    const inserted = await db.getFirstAsync<any>('SELECT * FROM coolers WHERE id = ?', [insertedId]);
    await db.runAsync(
      'UPDATE route_boxes SET ridersInRoute = ridersInRoute + 1, updatedAt = ? WHERE date = ?',
      [now, normalizedDate]
    );
    return this.mapCoolerRow(inserted);
  }

  private async reserveInventory(
    date: string,
    productId?: string,
    quantity?: number,
    unit: string = 'kg',
    coolerId?: number,
  ) {
    if (!productId || !quantity || quantity <= 0) {
      return;
    }
    const product = await this.products.getById(productId);
    if (product.stock < quantity) {
      throw new Error('Stock insuficiente para asignar a la hielera');
    }
    await this.products.update(productId, { stock: product.stock - quantity });
    const createdAt = new Date().toISOString();
    if (this.isWeb) {
      const records = await readRouteInventory();
      const next: WebRouteInventoryRecord = {
        id: records.reduce((max, record) => (record.id > max ? record.id : max), 0) + 1,
        date,
        productId,
        quantity,
        unit,
        coolerId: coolerId ?? null,
        createdAt,
      };
      await saveRouteInventory([...records, next]);
      return;
    }
    const db = await this.dbService.getDatabase();
    await db.runAsync(
      'INSERT INTO route_inventory (date, productId, quantity, unit, coolerId, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [date, Number(productId), quantity, unit, coolerId ?? null, createdAt]
    );
  }

  async liquidateCooler(input: {
    coolerId: number;
    goodReturn: number;
    coldWaste: number;
    receivedTotal: number;
  }): Promise<CoolerRecord> {
    const now = new Date().toISOString();
    if (this.isWeb) {
      const coolers = await readRouteCoolers();
      const index = coolers.findIndex((cooler) => cooler.id === input.coolerId);
      if (index === -1) {
        throw new Error('Hielera no encontrada');
      }
      const target = coolers[index];
      if (target.status === 'liquidada') {
        return mapCoolerRecord(target);
      }
      const kilosSold = Math.max(0, target.kilosOut - (input.goodReturn + input.coldWaste));
      const expectedTotal = kilosSold * target.routePrice;
      const difference = input.receivedTotal - expectedTotal;
      const nextRecord: WebCoolerRecord = {
        ...target,
        status: 'liquidada',
        goodReturn: input.goodReturn,
        coldWaste: input.coldWaste,
        kilosSold,
        expectedTotal,
        receivedTotal: input.receivedTotal,
        difference,
        updatedAt: now,
      };
      coolers[index] = nextRecord;
      await saveRouteCoolers(coolers);
      const boxes = await readRouteBoxes();
      const updatedBoxes = boxes.map((box) =>
        box.date === target.date
          ? {
              ...box,
              totalSold: box.totalSold + kilosSold,
              totalWaste: box.totalWaste + input.coldWaste,
              ridersInRoute: Math.max(0, box.ridersInRoute - 1),
              ridersSettled: box.ridersSettled + 1,
              updatedAt: now,
            }
          : box
      );
      await saveRouteBoxes(updatedBoxes);
      await this.consumeInventoryReturn(target.date, target.id!, input.goodReturn);
      return mapCoolerRecord(nextRecord);
    }
    const db = await this.dbService.getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM coolers WHERE id = ?', [input.coolerId]);
    if (!row) {
      throw new Error('Hielera no encontrada');
    }
    if (row.status === 'liquidada') {
      return this.mapCoolerRow(row);
    }
    const kilosSold = Math.max(0, Number(row.kilosOut ?? 0) - (input.goodReturn + input.coldWaste));
    const expectedTotal = kilosSold * Number(row.routePrice ?? 0);
    const difference = input.receivedTotal - expectedTotal;
    await db.runAsync(
      `UPDATE coolers SET status = 'liquidada', goodReturn = ?, coldWaste = ?, kilosSold = ?, expectedTotal = ?, receivedTotal = ?, difference = ?, updatedAt = ? WHERE id = ?`,
      [input.goodReturn, input.coldWaste, kilosSold, expectedTotal, input.receivedTotal, difference, now, input.coolerId]
    );
    await db.runAsync(
      'UPDATE route_boxes SET totalSold = totalSold + ?, totalWaste = totalWaste + ?, ridersInRoute = MAX(ridersInRoute - 1, 0), ridersSettled = ridersSettled + 1, updatedAt = ? WHERE date = ?',
      [kilosSold, input.coldWaste, now, row.date]
    );
    await this.consumeInventoryReturn(row.date, input.coolerId, input.goodReturn);
    const next = await db.getFirstAsync<any>('SELECT * FROM coolers WHERE id = ?', [input.coolerId]);
    return this.mapCoolerRow(next);
  }
}
