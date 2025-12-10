import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { EncryptionService, isBcryptHash } from '../../core/utils/encryption';
import { DemoDataService } from './DemoDataService';
import type { User } from '../../domain/entities/User';

export class DatabaseInitService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async initializeApp(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[DB] Starting bootstrap...');
      const existingUsers = await this.userRepository.getAllUsers();
      console.log(`[DB] Users found: ${existingUsers.length}`);

      if (existingUsers.length > 0) {
        const normalizedUsers = await this.ensurePasswordsAreHashed(existingUsers);
        this.logSampleUser(normalizedUsers[0]);
        await new DemoDataService().seedDemoSalesIfEmpty(3);
        return { success: true, message: 'App lista' };
      }

      console.log('[DB] Creating default users...');
      await this.createDefaultUsers();
      await new DemoDataService().seedDemoSalesIfEmpty(3);
      return { success: true, message: 'App lista con usuarios nuevos' };
    } catch (error: any) {
      console.error('[DB] Critical error:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  private async ensurePasswordsAreHashed(users: User[]): Promise<User[]> {
    if (!users.length) {
      return users;
    }

    const hasPlain = users.some(user => !isBcryptHash(user.password));
    if (!hasPlain) {
      console.log('[DB] Existing users already use bcrypt.');
      return users;
    }

    console.warn('[DB] Plain-text passwords detected. Migrating to bcrypt...');
    await this.userRepository.migrateLegacyPasswords();
    const refreshedUsers = await this.userRepository.getAllUsers();
    const stillPlain = refreshedUsers.some(user => !isBcryptHash(user.password));

    if (stillPlain) {
      console.warn('[DB] Migration failed. Triggering emergency reset.');
      await this.emergencyReset();
      return await this.userRepository.getAllUsers();
    }

    console.log('[DB] Password migration completed.');
    return refreshedUsers;
  }

  private logSampleUser(user?: User) {
    if (!user) {
      return;
    }

    console.log(`[DB] Sample user: ${user.email}`);
    console.log(`[DB] Password length: ${user.password.length}`);
    console.log(`[DB] Stored with bcrypt: ${isBcryptHash(user.password) ? 'yes' : 'no'}`);
  }

  private async createDefaultUsers(): Promise<void> {
    const users = [
      { name: 'Admin', email: 'admin@tortilleria.com', password: 'admin123', role: 'admin' as const },
      { name: 'Empleado', email: 'empleado@tortilleria.com', password: 'empleado123', role: 'empleado' as const },
      { name: 'Repartidor', email: 'repartidor@tortilleria.com', password: 'repartidor123', role: 'repartidor' as const },
    ];

    for (const user of users) {
      try {
        const hashedPassword = await EncryptionService.hashPassword(user.password);
        const userId = await this.userRepository.createUser({
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          isActive: true,
        });
        console.log(`[DB] Created ${user.email} (id ${userId})`);
      } catch (error: any) {
        console.log(`[DB] Unable to create ${user.email}: ${error.message}`);
      }
    }
  }

  private async emergencyReset(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[DB] Emergency reset in progress...');
      const db = await this.userRepository['dbService'].getDatabase();
      await db.execAsync('DELETE FROM users');
      console.log('[DB] Users deleted.');
      await this.createDefaultUsers();
      console.log('[DB] Emergency reset completed.');
      return { success: true, message: 'Reset de emergencia completado' };
    } catch (error: any) {
      console.error('[DB] Error in emergency reset:', error);
      return { success: false, message: `Reset fallo: ${error.message}` };
    }
  }
}
