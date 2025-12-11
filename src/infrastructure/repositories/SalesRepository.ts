import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DatabaseService } from '../database/DatabaseService';
import { appendWebSales, WebSaleLine } from '../storage/webSalesStorage';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unitLabel?: string;
  unitAmount?: number;
};

type StoredProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  unit: 'kg' | 'pieza' | 'docena';
  isActive: boolean;
  createdAt: string;
};

const PRODUCTS_STORAGE_KEY = '@tortilleria/products';

const parseStoredProducts = (raw: string | null): StoredProduct[] => {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const getStoredProducts = async (): Promise<StoredProduct[]> => {
  const raw = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
  return parseStoredProducts(raw);
};

const saveStoredProducts = async (products: StoredProduct[]) => {
  await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
};

export class SalesRepository {
  private dbService = DatabaseService.getInstance();
  private hasUserId: boolean | null = null;
  private hasTotalPrice: boolean | null = null;
  private hasTotal: boolean | null = null;
  private hasUpdatedAt: boolean | null = null;
  private hasPaymentMethod: boolean | null = null;

  private async ensureSchema() {
    if (
      this.hasUserId === null ||
      this.hasTotalPrice === null ||
      this.hasTotal === null ||
      this.hasUpdatedAt === null ||
      this.hasPaymentMethod === null
    ) {
      const db = await this.dbService.getDatabase();
      const info = await db.getAllAsync<any>('PRAGMA table_info(sales);');
      this.hasUserId = info.some((c: any) => c.name === 'userId');
      this.hasTotalPrice = info.some((c: any) => c.name === 'totalPrice');
      this.hasTotal = info.some((c: any) => c.name === 'total');
      this.hasUpdatedAt = info.some((c: any) => c.name === 'updatedAt');
      this.hasPaymentMethod = info.some((c: any) => c.name === 'paymentMethod');
    }
  }

  private async recordSaleWeb(items: CartItem[], userId?: number, paymentMethod: string = 'cash'): Promise<void> {
    const products = await getStoredProducts();
    if (!products.length) {
      throw new Error('No hay inventario disponible en este dispositivo.');
    }
    const draft = products.map(product => ({ ...product }));
    const saleId = `web-sale-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const saleDate = new Date().toISOString();
    const saleLines: WebSaleLine[] = [];

    items.forEach((item, index) => {
      const productIndex = draft.findIndex(p => p.id === item.productId);
      if (productIndex === -1) {
        throw new Error(`Producto no encontrado para ${item.name ?? 'producto'}`);
      }
      const product = draft[productIndex];
      if (!product.isActive) {
        throw new Error(`El producto ${product.name} no esta disponible.`);
      }
      const currentStock = Number(product.stock ?? 0);
      if (currentStock < item.quantity) {
        throw new Error(`Stock insuficiente para ${item.name ?? product.name}`);
      }
      const nextStock = parseFloat((currentStock - item.quantity).toFixed(3));
      draft[productIndex] = { ...product, stock: nextStock };

      saleLines.push({
        id: `${saleId}-${index}`,
        saleId,
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        saleDate,
        paymentMethod,
        userId,
      });
    });

    await saveStoredProducts(draft);
    await appendWebSales(saleLines);
  }

  async recordSale(items: CartItem[], customerName?: string, customerPhone?: string, userId?: number, paymentMethod: string = 'cash'): Promise<void> {
    if (Platform.OS === 'web') {
      await this.recordSaleWeb(items, userId, paymentMethod);
      return;
    }
    const db = await this.dbService.getDatabase();
    await this.ensureSchema();
    const saleDate = new Date().toISOString();
    const createdAt = saleDate;

    await db.execAsync('BEGIN TRANSACTION');
    try {
      for (const item of items) {
        const productRow = await db.getFirstAsync<{ stock: number }>('SELECT stock FROM products WHERE id = ?', [Number(item.productId)]);
        if (!productRow) {
          throw new Error('Producto no encontrado');
        }
        if (productRow.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${item.name ?? 'producto'}`);
        }
        const total = item.price * item.quantity;
        // Build dynamic insert to support legacy schemas (total vs totalPrice, optional userId)
        const columns: string[] = ['productId', 'quantity'];
        const values: any[] = [Number(item.productId), item.quantity];
        if (this.hasTotalPrice) {
          columns.push('totalPrice');
          values.push(total);
        }
        if (this.hasTotal) {
          columns.push('total');
          values.push(total);
        }
        columns.push('customerName', 'customerPhone', 'status', 'saleDate', 'createdAt');
        values.push(customerName ?? null, customerPhone ?? null, 'completed', saleDate, createdAt);
        if (this.hasUpdatedAt) {
          columns.push('updatedAt');
          values.push(createdAt);
        }
        if (this.hasUserId) {
          columns.push('userId');
          values.push(userId ?? null);
        }
        if (this.hasPaymentMethod) {
          columns.push('paymentMethod');
          values.push(paymentMethod);
        }
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO sales (${columns.join(', ')}) VALUES (${placeholders})`;
        await db.runAsync(sql, values);

        // disminuir stock
        const updateResult = await db.runAsync(
          'UPDATE products SET stock = stock - ?, updatedAt = ? WHERE id = ? AND stock >= ?',
          [item.quantity, createdAt, Number(item.productId), item.quantity]
        );
        if (!updateResult || (typeof updateResult.changes === 'number' && updateResult.changes === 0)) {
          throw new Error(`No fue posible actualizar el stock para ${item.name ?? 'el producto'}`);
        }
      }
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  }
}
