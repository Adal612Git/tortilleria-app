import { User } from '../../domain/entities/User';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../core/utils/encryption';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private readonly fallbackCredentials: Record<string, { password: string; role: User['role']; name: string }> = {
    'admin@tortilleria.com': { password: 'admin123', role: 'admin', name: 'Admin' },
    'empleado@tortilleria.com': { password: 'empleado123', role: 'empleado', name: 'Empleado' },
    'repartidor@tortilleria.com': { password: 'repartidor123', role: 'repartidor', name: 'Repartidor' },
  };

  private async beforeLogin(email: string): Promise<void> {
    await this.userRepository.migrateLegacyPasswords();
  }

  private afterLogin(user: User): Omit<User, 'password'> {
    const { password: _ignored, ...safeUser } = user;
    return safeUser;
  }

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: Omit<User, 'password'>; message: string }> {
    try {
      await this.beforeLogin(email);
      let user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        const fallback = this.fallbackCredentials[email.toLowerCase()];
        if (fallback) {
          const hashed = await EncryptionService.hashPassword(fallback.password);
          await this.userRepository.createUser({
            name: fallback.name,
            email,
            password: hashed,
            role: fallback.role,
            isActive: true,
          });
          user = await this.userRepository.getUserByEmail(email);
        }
      }
      if (!user || !user.isActive) {
        return { success: false, message: 'Usuario o contrasena incorrectos' };
      }

      const isValid = await EncryptionService.verifyPassword(password, user.password);
      if (!isValid) {
        return { success: false, message: 'Usuario o contrasena incorrectos' };
      }

      return { success: true, user: this.afterLogin(user), message: 'Login exitoso' };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error del sistema' };
    }
  }
}

export const authService = new AuthService();
