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

const formatDateKey = (value: string) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    const rows = await db.getAllAsync<any>('SELECT * FROM route_inventory WHERE coolerId = ?', [coolerId]);
    return rows;
  }

  private async consumeInventoryReturn(
    date: string,
    coolerId: number,
    goodReturn: number,
  ) {
    if (!goodReturn || goodReturn <= 0) {
      return;
    }
    if (this.isWeb) {
      const inventory = await readRouteInventory();
      let remaining = goodReturn;
      const updated = inventory.map((record) => {
        if (record.coolerId !== coolerId || remaining <= 0) {
          return record;
        }
        const available = Number(record.quantity ?? 0);
        const toReturn = Math.min(available, remaining);
        if (toReturn > 0) {
          this.updateProductStock(record.productId, toReturn);
          remaining -= toReturn;
          return { ...record, quantity: Math.max(0, available - toReturn) };
        }
        return record;
      });
      await saveRouteInventory(updated);
      return;
    }
    const db = await this.dbService.getDatabase();
    const slices = await db.getAllAsync<any>('SELECT * FROM route_inventory WHERE coolerId = ?', [coolerId]);
    let remaining = goodReturn;
    for (const slice of slices) {
      if (remaining <= 0) {
        break;
      }
      const available = Number(slice.quantity ?? 0);
      const toReturn = Math.min(available, remaining);
      if (toReturn > 0) {
        await this.updateProductStock(String(slice.productId), toReturn);
        remaining -= toReturn;
        await db.runAsync(
          'UPDATE route_inventory SET quantity = ? WHERE id = ?',
          [Math.max(0, available - toReturn), slice.id]
        );
      }
    }
  }


  private buildRiderMetrics(
    riderId: number,
    dateFilter: string | null,
    records: Array<{ expectedTotal?: number; receivedTotal?: number; kilosSold?: number; difference?: number }>,
  ): RiderMetrics {
    const totalCoolers = records.length;
    let totalExpected = 0;
    let totalReceived = 0;
    let kilosSold = 0;
    let totalDifference = 0;
    let shortageCount = 0;
    let shortageAccumulator = 0;
    let onTargetCount = 0;

    records.forEach((record) => {
      const expected = Number(record.expectedTotal ?? 0);
      const received = Number(record.receivedTotal ?? 0);
      const diff = Number(record.difference ?? received - expected);
      const sold = Number(record.kilosSold ?? 0);

      totalExpected += expected;
      totalReceived += received;
      kilosSold += sold;
      totalDifference += diff;

      if (diff < 0) {
        shortageCount += 1;
        shortageAccumulator += Math.abs(diff);
      } else {
        onTargetCount += 1;
      }
    });

    const averageShortage = shortageCount > 0 ? shortageAccumulator / shortageCount : 0;
    const onTargetPercentage = totalCoolers > 0 ? (onTargetCount / totalCoolers) * 100 : 0;

    return {
      riderId,
      date: dateFilter ?? undefined,
      totalCoolers,
      kilosSold,
      totalExpected,
      totalReceived,
      totalDifference,
      averageShortage,
      onTargetPercentage,
    };
  }

  async getRouteBox(date: string): Promise<RouteBox | null> {
    const normalizedDate = formatDateKey(date);
    if (this.isWeb) {
      const boxes = await readRouteBoxes();
      const found = boxes.find((box) => box.date === normalizedDate);
      return found ? mapBoxRecord(found) : null;
    }
    const db = await this.dbService.getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM route_boxes WHERE date = ? LIMIT 1',
      [normalizedDate]
    );
    return row ? this.mapBoxRow(row) : null;
  }

  async openRouteBox(date: string): Promise<RouteBox> {
    const normalizedDate = formatDateKey(date);
    const openedAt = new Date().toISOString();
    if (this.isWeb) {
      const boxes = await readRouteBoxes();
      const existing = boxes.find((box) => box.date === normalizedDate);
      if (existing?.isOpen) {
        throw new Error('La caja de ruta ya esta abierta para este dia');
      }
      if (existing) {
        const next: WebRouteBoxRecord = {
          ...existing,
          isOpen: true,
          openedAt,
          closedAt: null,
        };
        const updated = boxes.map((box) => (box.id === existing.id ? next : box));
        await saveRouteBoxes(updated);
        return mapBoxRecord(next);
      }
      const newRecord: WebRouteBoxRecord = {
        id: boxes.reduce((max, box) => (box.id > max ? box.id : max), 0) + 1,
        date: normalizedDate,
        isOpen: true,
        openedAt,
        closedAt: null,
        totalSold: 0,
        totalWaste: 0,
        ridersInRoute: 0,
        ridersSettled: 0,
      };
      await saveRouteBoxes([...boxes, newRecord]);
      return mapBoxRecord(newRecord);
    }

    const db = await this.dbService.getDatabase();
    const existing = await db.getFirstAsync<any>('SELECT * FROM route_boxes WHERE date = ?', [normalizedDate]);
    if (existing?.isOpen) {
      throw new Error('La caja de ruta ya esta abierta para este dia');
    }
    if (existing) {
      await db.runAsync(
        'UPDATE route_boxes SET isOpen = 1, openedAt = ?, closedAt = NULL, updatedAt = ? WHERE id = ?',
        [openedAt, openedAt, existing.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO route_boxes (date, isOpen, openedAt, totalSold, totalWaste, ridersInRoute, ridersSettled, createdAt, updatedAt)
         VALUES (?, 1, ?, 0, 0, 0, 0, ?, ?)`,
        [normalizedDate, openedAt, openedAt, openedAt]
      );
    }
    const next = await this.getRouteBox(normalizedDate);
    if (!next) {
      throw new Error('No fue posible abrir la caja de ruta');
    }
    return next;
  }

  async closeRouteBox(date: string): Promise<RouteBox> {
    const normalizedDate = formatDateKey(date);
    if (this.isWeb) {
      const coolers = await readRouteCoolers();
      const pending = coolers.some((cooler) => cooler.date === normalizedDate && cooler.status !== 'liquidada');
      if (pending) {
        throw new Error('Liquida todas las hieleras antes de cerrar el dia');
      }
      const boxes = await readRouteBoxes();
      let next: WebRouteBoxRecord | null = null;
      const now = new Date().toISOString();
      const updated = boxes.map((box) => {
        if (box.date === normalizedDate) {
          next = { ...box, isOpen: false, closedAt: now };
          return next;
        }
        return box;
      });
      if (!next) {
        throw new Error('No existe caja de ruta para este dia');
      }
      await saveRouteBoxes(updated);
      return mapBoxRecord(next);
    }
    const db = await this.dbService.getDatabase();
    const pending = await db.getFirstAsync<any>(
      'SELECT id FROM coolers WHERE date = ? AND status != "liquidada" LIMIT 1',
      [normalizedDate]
    );
    if (pending) {
      throw new Error('Liquida todas las hieleras antes de cerrar el dia');
    }
    const now = new Date().toISOString();
    await db.runAsync('UPDATE route_boxes SET isOpen = 0, closedAt = ?, updatedAt = ? WHERE date = ?', [now, now, normalizedDate]);
    const next = await this.getRouteBox(normalizedDate);
    if (!next) {
      throw new Error('No existe caja de ruta para este dia');
    }
    return next;
  }


  async getDaySummary(date: string): Promise<RouteDaySummary> {
    const normalizedDate = formatDateKey(date);
    if (this.isWeb) {
      const coolers = await readRouteCoolers();
      const settled = coolers.filter((cooler) => cooler.date === normalizedDate && cooler.status === 'liquidada');
      const totalExpected = settled.reduce((sum, cooler) => sum + Number(cooler.expectedTotal ?? 0), 0);
      const kilosSold = settled.reduce((sum, cooler) => sum + Number(cooler.kilosSold ?? 0), 0);
      return {
        date: normalizedDate,
        totalExpected,
        kilosSold,
        settledCoolers: settled.length,
      };
    }
    const db = await this.dbService.getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT 
        COALESCE(SUM(expectedTotal), 0) as totalExpected,
        COALESCE(SUM(kilosSold), 0) as kilosSold,
        COUNT(*) as settledCoolers
      FROM coolers
      WHERE date = ? AND status = 'liquidada'`,
      [normalizedDate]
    );
    return {
      date: normalizedDate,
      totalExpected: Number(row?.totalExpected ?? 0),
      kilosSold: Number(row?.kilosSold ?? 0),
      settledCoolers: Number(row?.settledCoolers ?? 0),
    };
  }

  async getRiderMetrics(riderId: number, date?: string): Promise<RiderMetrics> {
    const normalizedDate = date ? formatDateKey(date) : null;
    if (this.isWeb) {
      const coolers = await readRouteCoolers();
      const filtered = coolers.filter(
        (cooler) =>
          cooler.riderId === riderId &&
          cooler.status === 'liquidada' &&
          (!normalizedDate || cooler.date === normalizedDate)
      );
      return this.buildRiderMetrics(riderId, normalizedDate, filtered);
    }
    const db = await this.dbService.getDatabase();
    const params: Array<string | number> = [riderId];
    let query = "SELECT expectedTotal, receivedTotal, kilosSold, difference FROM coolers WHERE riderId = ? AND status = 'liquidada'";
    if (normalizedDate) {
      query += ' AND date = ?';
      params.push(normalizedDate);
    }
    const rows = await db.getAllAsync<any>(query, params);
    return this.buildRiderMetrics(riderId, normalizedDate, rows);
  }

  async listCoolers(date: string): Promise<CoolerRecord[]> {
    const normalizedDate = formatDateKey(date);
    if (this.isWeb) {
      const coolers = await readRouteCoolers();
      return coolers.filter((cooler) => cooler.date === normalizedDate).map(mapCoolerRecord);
    }
    const db = await this.dbService.getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM coolers WHERE date = ? ORDER BY coolerNumber ASC', [normalizedDate]);
    return rows.map((row: any) => this.mapCoolerRow(row));
  }

  async createCooler(input: CreateCoolerInput): Promise<CoolerRecord> {
    const normalizedDate = formatDateKey(input.date);
    const opened = await this.getRouteBox(normalizedDate);
    if (!opened || !opened.isOpen) {
      throw new Error('Abre la caja de ruta antes de crear una hielera');
    }
    const otherProducts = input.otherProducts ?? [];
    const now = new Date().toISOString();
    const inventoryProductId = input.inventoryProductId;
    const inventoryUnit = input.inventoryUnit ?? 'kg';

    if (this.isWeb) {
      const [coolers, boxes] = await Promise.all([readRouteCoolers(), readRouteBoxes()]);
      const sequence =
        coolers
          .filter((cooler) => cooler.date === normalizedDate)
          .reduce((max, cooler) => (cooler.coolerNumber > max ? cooler.coolerNumber : max), 0) + 1;
      const newRecord: WebCoolerRecord = {
        id: coolers.reduce((max, cooler) => (cooler.id > max ? cooler.id : max), 0) + 1,
        date: normalizedDate,
        riderId: input.riderId,
        coolerNumber: sequence,
        kilosOut: input.kilosOut,
        routePrice: input.routePrice,
        otherProducts,
        status: 'en_ruta',
        goodReturn: 0,
        coldWaste: 0,
        kilosSold: 0,
        expectedTotal: 0,
        receivedTotal: 0,
        difference: 0,
        createdAt: now,
        updatedAt: now,
      };
      await saveRouteCoolers([...coolers, newRecord]);
      const boxesUpdated = boxes.map((box) =>
        box.date === normalizedDate ? { ...box, ridersInRoute: box.ridersInRoute + 1 } : box
      );
      await saveRouteBoxes(boxesUpdated);
      await this.reserveInventory(normalizedDate, inventoryProductId, input.kilosOut, inventoryUnit, newRecord.id);
      return mapCoolerRecord(newRecord);
    }

    const db = await this.dbService.getDatabase();
    const result = await db.runAsync(
      `INSERT INTO coolers (
        date, riderId, coolerNumber, kilosOut, routePrice, otherProducts, status,
        goodReturn, coldWaste, kilosSold, expectedTotal, receivedTotal, difference,
        createdAt, updatedAt
      ) VALUES (
        ?,
        ?,
        (SELECT COALESCE(MAX(coolerNumber), 0) + 1 FROM coolers WHERE date = ?),
        ?, ?, ?, 'en_ruta',
        0, 0, 0, 0, 0, 0,
        ?, ?
      )`,
      [
        normalizedDate,
        input.riderId,
        normalizedDate,
        input.kilosOut,
        input.routePrice,
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
