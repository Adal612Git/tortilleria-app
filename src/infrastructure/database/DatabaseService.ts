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


    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cash_audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        openingFloat REAL NOT NULL,
        entries REAL NOT NULL,
        exits REAL NOT NULL,
        cashSales REAL NOT NULL,
        expectedCash REAL NOT NULL,
        countedCash REAL NOT NULL,
        difference REAL NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL
      );
    `);

    console.log('✅ Tablas inicializadas correctamente');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS route_boxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        isOpen INTEGER NOT NULL DEFAULT 0,
        openedAt TEXT,
        closedAt TEXT,
        totalSold REAL DEFAULT 0,
        totalWaste REAL DEFAULT 0,
        ridersInRoute INTEGER DEFAULT 0,
        ridersSettled INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS coolers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        riderId INTEGER NOT NULL,
        coolerNumber INTEGER NOT NULL,
        kilosOut REAL NOT NULL,
        routePrice REAL NOT NULL,
        otherProducts TEXT,
        status TEXT NOT NULL DEFAULT 'en_ruta',
        goodReturn REAL DEFAULT 0,
        coldWaste REAL DEFAULT 0,
        kilosSold REAL DEFAULT 0,
        expectedTotal REAL DEFAULT 0,
        receivedTotal REAL DEFAULT 0,
        difference REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS route_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        productId INTEGER NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'kg',
        coolerId INTEGER,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (coolerId) REFERENCES coolers (id)
      );
    `);

    // Migraciones de esquema para columnas faltantes
    await this.migrateSchema(db);
    return db;
  }

  private async migrateSchema(db: SQLite.SQLiteDatabase) {
    console.log('🔄 Verificando migraciones de esquema...');
    const columnExists = async (table: string, column: string) => {
      const info = await db.getAllAsync<any>(`PRAGMA table_info(${table});`);
      return info.some((c: any) => c.name === column);
    };

    // Productos
    if (!(await columnExists('products', 'category'))) {
      console.log('🧩 Migrando products: agregando category');
      await db.execAsync(`ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'otros';`);
    }
    if (!(await columnExists('products', 'stock'))) {
      console.log('🧩 Migrando products: agregando stock');
      await db.execAsync(`ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;`);
    }
    if (!(await columnExists('products', 'isActive'))) {
      console.log('🧩 Migrando products: agregando isActive');
      await db.execAsync(`ALTER TABLE products ADD COLUMN isActive INTEGER DEFAULT 1;`);
    }
    if (!(await columnExists('products', 'createdAt'))) {
      console.log('🧩 Migrando products: agregando createdAt');
      await db.execAsync(`ALTER TABLE products ADD COLUMN createdAt TEXT DEFAULT (CURRENT_TIMESTAMP);`);
    }
    if (!(await columnExists('products', 'updatedAt'))) {
      console.log('🧩 Migrando products: agregando updatedAt');
      await db.execAsync(`ALTER TABLE products ADD COLUMN updatedAt TEXT DEFAULT (CURRENT_TIMESTAMP);`);
    }

    // Usuarios
    if (!(await columnExists('users', 'role'))) {
      console.log('🧩 Migrando users: agregando role');
      await db.execAsync(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'empleado';`);
    }
    if (!(await columnExists('users', 'isActive'))) {
      console.log('🧩 Migrando users: agregando isActive');
      await db.execAsync(`ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1;`);
    }
    if (!(await columnExists('users', 'createdAt'))) {
      console.log('🧩 Migrando users: agregando createdAt');
      await db.execAsync(`ALTER TABLE users ADD COLUMN createdAt TEXT DEFAULT (CURRENT_TIMESTAMP);`);
    }
    if (!(await columnExists('users', 'updatedAt'))) {
      console.log('🧩 Migrando users: agregando updatedAt');
      await db.execAsync(`ALTER TABLE users ADD COLUMN updatedAt TEXT DEFAULT (CURRENT_TIMESTAMP);`);
    }

    // Ventas
    if (!(await columnExists('sales', 'productId'))) {
      console.log('🧩 Migrando sales: agregando productId');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN productId INTEGER`);
    }
    if (!(await columnExists('sales', 'quantity'))) {
      console.log('🧩 Migrando sales: agregando quantity');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN quantity INTEGER DEFAULT 1`);
    }
    if (!(await columnExists('sales', 'totalPrice'))) {
      console.log('🧩 Migrando sales: agregando totalPrice');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN totalPrice REAL DEFAULT 0`);
    }
    if (!(await columnExists('sales', 'customerName'))) {
      console.log('🧩 Migrando sales: agregando customerName');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN customerName TEXT;`);
    }
    if (!(await columnExists('sales', 'customerPhone'))) {
      console.log('🧩 Migrando sales: agregando customerPhone');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN customerPhone TEXT;`);
    }
    if (!(await columnExists('sales', 'status'))) {
      console.log('🧩 Migrando sales: agregando status');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'completed';`);
    }
    if (!(await columnExists('sales', 'saleDate'))) {
      console.log('🧩 Migrando sales: agregando saleDate');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN saleDate TEXT DEFAULT (CURRENT_TIMESTAMP);`);
    }
    if (!(await columnExists('sales', 'createdAt'))) {
      console.log('🧩 Migrando sales: agregando createdAt');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN createdAt TEXT DEFAULT (CURRENT_TIMESTAMP);`);
    }
    if (!(await columnExists('sales', 'updatedAt'))) {
      console.log('🧩 Migrando sales: agregando updatedAt');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN updatedAt TEXT DEFAULT (CURRENT_TIMESTAMP);`);
    }
    if (!(await columnExists('sales', 'paymentMethod'))) {
      console.log('🧩 Migrando sales: agregando paymentMethod');
      await db.execAsync(`ALTER TABLE sales ADD COLUMN paymentMethod TEXT DEFAULT 'cash';`);
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.database) {
      await this.database.closeAsync();
      this.database = null;
    }
  }
}
