import * as SQLite from 'expo-sqlite';

export class DatabaseService {
  private static instance: DatabaseService;
  private database: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.database) {
      console.log('🆕 CREANDO NUEVA BASE DE DATOS...');
      this.database = await this.initializeDatabase();
    }
    return this.database;
  }

  private async initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
    const db = await SQLite.openDatabaseAsync('tortilleria.db');
    
    console.log('🗃️ Inicializando tablas...');
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER,
        quantity INTEGER NOT NULL,
        totalPrice REAL NOT NULL,
        customerName TEXT,
        customerPhone TEXT,
        status TEXT DEFAULT 'completed',
        saleDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id)
      );
    `);

    console.log('✅ Tablas inicializadas correctamente');
    return db;
  }

  async closeDatabase(): Promise<void> {
    if (this.database) {
      await this.database.closeAsync();
      this.database = null;
    }
  }
}
