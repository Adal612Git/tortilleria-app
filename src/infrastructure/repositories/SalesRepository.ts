import { DatabaseService } from '../database/DatabaseService';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export class SalesRepository {
  private dbService = DatabaseService.getInstance();
  private hasUserId: boolean | null = null;
  private hasTotalPrice: boolean | null = null;
  private hasTotal: boolean | null = null;
  private hasUpdatedAt: boolean | null = null;

  private async ensureSchema() {
    if (this.hasUserId === null || this.hasTotalPrice === null || this.hasTotal === null || this.hasUpdatedAt === null) {
      const db = await this.dbService.getDatabase();
      const info = await db.getAllAsync<any>('PRAGMA table_info(sales);');
      this.hasUserId = info.some((c: any) => c.name === 'userId');
      this.hasTotalPrice = info.some((c: any) => c.name === 'totalPrice');
      this.hasTotal = info.some((c: any) => c.name === 'total');
      this.hasUpdatedAt = info.some((c: any) => c.name === 'updatedAt');
    }
  }

  async recordSale(items: CartItem[], customerName?: string, customerPhone?: string, userId?: number): Promise<void> {
    const db = await this.dbService.getDatabase();
    await this.ensureSchema();
    const saleDate = new Date().toISOString();
    const createdAt = saleDate;

    await db.execAsync('BEGIN TRANSACTION');
    try {
      for (const item of items) {
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
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO sales (${columns.join(', ')}) VALUES (${placeholders})`;
        await db.runAsync(sql, values);

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
