import { DatabaseService } from '../../infrastructure/database/DatabaseService';

type ProductRow = { id: number; name: string; price: number; stock: number };

export class DemoDataService {
  private dbService = DatabaseService.getInstance();

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private sample<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async seedDemoSalesIfEmpty(months = 3) {
    const db = await this.dbService.getDatabase();
    const countRows = await db.getAllAsync<any>('SELECT COUNT(1) as c FROM sales');
    const count = Number(countRows?.[0]?.c ?? 0);
    if (count > 50) {
      console.log(`ℹ️ Ventas existentes: ${count}. Se omite seed demo.`);
      return;
    }
    await this.seedDemoSales(months);
  }

  async seedDemoSales(months = 3) {
    const db = await this.dbService.getDatabase();
    console.log(`🧪 Seed de ventas demo (${months} meses)...`);

    // Asegurar productos base
    const products = await db.getAllAsync<ProductRow>('SELECT id, name, price, stock FROM products WHERE isActive = 1');
    let productList = products;
    if (productList.length === 0) {
      console.log('🧪 Creando productos base para demo');
      const now = new Date().toISOString();
      const baseProducts = [
        ['Tortilla de Maíz', 20, 'tortilla'],
        ['Tostadas', 12, 'tostada'],
        ['Masa', 18, 'masa'],
        ['Totopos', 25, 'otros'],
      ];
      for (const [name, price, category] of baseProducts as any) {
        await db.runAsync(
          'INSERT INTO products (name, description, price, category, stock, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [name, '', price, category, 10000, 1, now, now]
        );
      }
      productList = await db.getAllAsync<ProductRow>('SELECT id, name, price, stock FROM products WHERE isActive = 1');
    } else {
      // Subir stock para evitar negativos durante el seed
      await db.runAsync('UPDATE products SET stock = stock + 10000, updatedAt = ?', [new Date().toISOString()]);
    }

    const customers = ['Juan Pérez', 'María López', 'Carlos Rojas', 'Ana Fernández', 'Luis García', 'Cliente Mostrador'];

    const today = new Date();
    const start = new Date(today);
    start.setMonth(start.getMonth() - months);
    start.setHours(0, 0, 0, 0);

    // Detectar si existe columna userId en sales
    const salesCols = await db.getAllAsync<any>('PRAGMA table_info(sales);');
    const hasUserId = salesCols.some((c: any) => c.name === 'userId');
    const hasTotalPrice = salesCols.some((c: any) => c.name === 'totalPrice');
    const hasTotal = salesCols.some((c: any) => c.name === 'total');
    const hasUpdatedAt = salesCols.some((c: any) => c.name === 'updatedAt');
    // Tomar un usuario existente como vendedor
    const userRow = await db.getFirstAsync<any>('SELECT id FROM users ORDER BY id LIMIT 1');
    const defaultUserId: number | null = userRow ? Number(userRow.id) : null;

    await db.execAsync('BEGIN TRANSACTION');
    try {
      for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
        const daySales = this.rand(10, 30); // ventas por día
        for (let i = 0; i < daySales; i++) {
          const p = this.sample(productList);
          const qty = this.rand(1, 8);
          const total = Number((p.price * qty).toFixed(2));
          const cust = Math.random() < 0.3 ? this.sample(customers) : null;
          const phone = cust && Math.random() < 0.5 ? `55${this.rand(10000000, 99999999)}` : null;
          const status = Math.random() < 0.96 ? 'completed' : (Math.random() < 0.5 ? 'failed' : 'in_progress');

          // Hora aleatoria del día
          const when = new Date(d);
          when.setHours(this.rand(8, 20), this.rand(0, 59), this.rand(0, 59), 0);
          const iso = when.toISOString();

          // Build dynamic insert to satisfy legacy NOT NULL constraints
          const columns: string[] = ['productId', 'quantity'];
          const values: any[] = [p.id, qty];
          if (hasTotalPrice) { columns.push('totalPrice'); values.push(total); }
          if (hasTotal) { columns.push('total'); values.push(total); }
          columns.push('customerName', 'customerPhone', 'status', 'saleDate', 'createdAt');
          values.push(cust, phone, status, iso, iso);
          if (hasUpdatedAt) { columns.push('updatedAt'); values.push(iso); }
          if (hasUserId) { columns.push('userId'); values.push(defaultUserId); }
          const placeholders = columns.map(() => '?').join(', ');
          const sql = `INSERT INTO sales (${columns.join(', ')}) VALUES (${placeholders})`;
          await db.runAsync(sql, values);
        }
      }
      await db.execAsync('COMMIT');
      console.log('✅ Seed de ventas demo completado');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      console.error('❌ Seed demo falló:', e);
    }
  }
}
