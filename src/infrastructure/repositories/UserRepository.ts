import { Platform } from 'react-native';
import { User } from '../../domain/entities/User';
import { DatabaseService } from '../database/DatabaseService';
import { EncryptionService, isBcryptHash } from '../../core/utils/encryption';
import { getNextWebUserId, readWebUsers, saveWebUsers, WebUserRecord } from '../storage/webUsersStorage';

export class UserRepository {
  private dbService: DatabaseService;
  private readonly isWeb: boolean;

  constructor() {
    this.dbService = DatabaseService.getInstance();
    this.isWeb = Platform.OS === 'web';
  }

  private mapStorageUser(record: WebUserRecord): User {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      role: record.role,
      isActive: record.isActive,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    };
  }

  async createUser(user: User): Promise<number> {
    const storedPassword = isBcryptHash(user.password)
      ? user.password
      : await EncryptionService.hashPassword(user.password);

    if (this.isWeb) {
      const users = await readWebUsers();
      const emailLower = user.email.toLowerCase();
      if (users.some(existing => existing.email.toLowerCase() === emailLower)) {
        throw new Error('Ya existe un usuario con ese correo');
      }
      const now = new Date().toISOString();
      const record: WebUserRecord = {
        id: getNextWebUserId(users),
        name: user.name,
        email: user.email,
        password: storedPassword,
        role: user.role,
        isActive: !!user.isActive,
        createdAt: now,
        updatedAt: now,
      };
      await saveWebUsers([...users, record]);
      return record.id;
    }

    try {
      const db = await this.dbService.getDatabase();
      const now = new Date().toISOString();
      const result = await db.runAsync(
        'INSERT INTO users (name, email, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.name, user.email, storedPassword, user.role, user.isActive ? 1 : 0, now, now]
      );
      return result.lastInsertRowId as number;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (this.isWeb) {
      const users = await readWebUsers();
      const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return record ? this.mapStorageUser(record) : null;
    }

    try {
      const db = await this.dbService.getDatabase();
      const result = await db.getFirstAsync('SELECT * FROM users WHERE email = ?', [email]);
      if (result) {
        return this.mapResultToUser(result);
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo usuario por email:', error);
      throw error;
    }
  }

  async getUserById(id: number): Promise<User | null> {
    if (this.isWeb) {
      const users = await readWebUsers();
      const record = users.find(u => u.id === id);
      return record ? this.mapStorageUser(record) : null;
    }

    try {
      const db = await this.dbService.getDatabase();
      const result = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [id]);
      if (result) {
        return this.mapResultToUser(result);
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo usuario por ID:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (this.isWeb) {
      const records = await readWebUsers();
      return records
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(record => this.mapStorageUser(record));
    }

    try {
      const db = await this.dbService.getDatabase();
      const result = await db.getAllAsync('SELECT * FROM users ORDER BY name ASC');
      return result.map(row => this.mapResultToUser(row));
    } catch (error) {
      console.error('Error obteniendo todos los usuarios:', error);
      return [];
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<boolean> {
    if (this.isWeb) {
      const users = await readWebUsers();
      const index = users.findIndex(u => u.id === id);
      if (index === -1) {
        return false;
      }
      if (updates.email) {
        const emailLower = updates.email.toLowerCase();
        if (users.some(u => u.id !== id && u.email.toLowerCase() === emailLower)) {
          throw new Error('Ya existe un usuario con ese correo');
        }
      }
      const record = { ...users[index] };
      if (updates.name !== undefined) {
        record.name = updates.name;
      }
      if (updates.email !== undefined) {
        record.email = updates.email;
      }
      if (updates.password !== undefined) {
        record.password = isBcryptHash(updates.password)
          ? updates.password
          : await EncryptionService.hashPassword(updates.password);
      }
      if (updates.role !== undefined) {
        record.role = updates.role;
      }
      if (updates.isActive !== undefined) {
        record.isActive = !!updates.isActive;
      }
      record.updatedAt = new Date().toISOString();
      users[index] = record;
      await saveWebUsers(users);
      return true;
    }

    try {
      const db = await this.dbService.getDatabase();
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }
      if (updates.password !== undefined) {
        const storedPassword = isBcryptHash(updates.password)
          ? updates.password
          : await EncryptionService.hashPassword(updates.password);
        fields.push('password = ?');
        values.push(storedPassword);
      }
      if (updates.role !== undefined) {
        fields.push('role = ?');
        values.push(updates.role);
      }
      if (updates.isActive !== undefined) {
        fields.push('isActive = ?');
        values.push(updates.isActive ? 1 : 0);
      }

      fields.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const query = 'UPDATE users SET ' + fields.join(', ') + ' WHERE id = ?';
      const result = await db.runAsync(query, values);
      return result.changes > 0;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  async migrateLegacyPasswords(): Promise<void> {
    if (this.isWeb) {
      const users = await readWebUsers();
      let modified = false;
      for (let i = 0; i < users.length; i += 1) {
        if (!isBcryptHash(users[i].password)) {
          users[i] = {
            ...users[i],
            password: await EncryptionService.hashPassword(String(users[i].password ?? '')),
            updatedAt: new Date().toISOString(),
          };
          modified = true;
        }
      }
      if (modified) {
        await saveWebUsers(users);
      }
      return;
    }

    const db = await this.dbService.getDatabase();
    const rows = await db.getAllAsync<any>('SELECT id, password FROM users');
    for (const row of rows) {
      if (!isBcryptHash(row.password)) {
        const hashed = await EncryptionService.hashPassword(String(row.password ?? ''));
        await db.runAsync('UPDATE users SET password = ?, updatedAt = ? WHERE id = ?', [hashed, new Date().toISOString(), row.id]);
      }
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    if (this.isWeb) {
      const users = await readWebUsers();
      const next = users.filter(u => u.id !== id);
      if (next.length === users.length) {
        return false;
      }
      await saveWebUsers(next);
      return true;
    }

    try {
      const db = await this.dbService.getDatabase();
      const result = await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  private mapResultToUser(row: any): User {
    return {
      id: row.id as number,
      name: row.name as string,
      email: row.email as string,
      password: row.password as string,
      role: row.role as 'admin' | 'empleado' | 'repartidor',
      isActive: row.isActive === 1,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }
}
