import { User } from '../../domain/entities/User';
import { DatabaseService } from '../database/DatabaseService';

export class UserRepository {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  async createUser(user: User): Promise<number> {
    try {
      const db = await this.dbService.getDatabase();
      
      const result = await db.runAsync(
        'INSERT INTO users (name, email, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          user.name,
          user.email,
          user.password,
          user.role,
          user.isActive ? 1 : 0,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
      return result.lastInsertRowId as number;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const db = await this.dbService.getDatabase();
      const result = await db.getFirstAsync(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

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
    try {
      const db = await this.dbService.getDatabase();
      const result = await db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

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
    try {
      const db = await this.dbService.getDatabase();
      const result = await db.getAllAsync(
        'SELECT * FROM users ORDER BY name ASC'
      );

      return result.map(row => this.mapResultToUser(row));
    } catch (error) {
      console.error('Error obteniendo todos los usuarios:', error);
      return [];
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<boolean> {
    try {
      const db = await this.dbService.getDatabase();
      
      const fields = [];
      const values = [];
      
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }
      
      if (updates.password !== undefined) {
        fields.push('password = ?');
        values.push(updates.password);
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

  async deleteUser(id: number): Promise<boolean> {
    try {
      const db = await this.dbService.getDatabase();
      const result = await db.runAsync(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
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
      updatedAt: new Date(row.updatedAt as string)
    };
  }
}
