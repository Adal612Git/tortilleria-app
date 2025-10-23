import { DatabaseService } from '../database/DatabaseService';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export class SalesRepository {
  private dbService = DatabaseService.getInstance();

  async recordSale(items: CartItem[], customerName?: string, customerPhone?: string): Promise<void> {
    const db = await this.dbService.getDatabase();
    const saleDate = new Date().toISOString();
    const createdAt = saleDate;

    await db.execAsync('BEGIN TRANSACTION');
    try {
      for (const item of items) {
        const total = item.price * item.quantity;
        await db.runAsync(
          'INSERT INTO sales (productId, quantity, totalPrice, customerName, customerPhone, status, saleDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [Number(item.productId), item.quantity, total, customerName ?? null, customerPhone ?? null, 'completed', saleDate, createdAt]
        );

        // disminuir stock
        await db.runAsync('UPDATE products SET stock = stock - ?, updatedAt = ? WHERE id = ?', [item.quantity, createdAt, Number(item.productId)]);
      }
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  }
}

