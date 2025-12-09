import { Product } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { DatabaseService } from '../database/DatabaseService';

type DBRow = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  stock: number;
  isActive: number; // 1/0
  createdAt: string;
  updatedAt: string;
};

export class ProductRepositoryImpl implements ProductRepository {
  private dbService = DatabaseService.getInstance();

  private mapRow(row: DBRow): Product {
    return {
      id: String(row.id),
      name: row.name,
      description: row.description ?? '',
      price: row.price,
      stock: row.stock,
      unit: 'kg',
      category: (row.category as Product['category']) ?? 'otros',
      isActive: row.isActive === 1,
      createdAt: new Date(row.createdAt),
    };
  }

  async getAll(): Promise<Product[]> {
    const db = await this.dbService.getDatabase();
    const rows = await db.getAllAsync<DBRow>('SELECT * FROM products WHERE isActive = 1 ORDER BY name ASC');
    return rows.map(r => this.mapRow(r));
  }

  async getById(id: string): Promise<Product> {
    const db = await this.dbService.getDatabase();
    const row = await db.getFirstAsync<DBRow>('SELECT * FROM products WHERE id = ?', [Number(id)]);
    if (!row) throw new Error('Producto no encontrado');
    return this.mapRow(row);
  }

  async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const db = await this.dbService.getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      'INSERT INTO products (name, description, price, category, stock, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        product.name,
        product.description ?? '',
        product.price,
        product.category,
        product.stock ?? 0,
        product.isActive ? 1 : 0,
        now,
        now,
      ]
    );
    const id = String(result.lastInsertRowId);
    return { ...product, id, createdAt: new Date(now) };
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const db = await this.dbService.getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }
    if (data.isActive !== undefined) { fields.push('isActive = ?'); values.push(data.isActive ? 1 : 0); }
    fields.push('updatedAt = ?'); values.push(new Date().toISOString());
    values.push(Number(id));

    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
    return await this.getById(id);
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbService.getDatabase();
    await db.runAsync('UPDATE products SET isActive = 0, updatedAt = ? WHERE id = ?', [new Date().toISOString(), Number(id)]);
  }
}

