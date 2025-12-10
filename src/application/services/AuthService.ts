import { User } from '../../domain/entities/User';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../core/utils/encryption';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

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
      const user = await this.userRepository.getUserByEmail(email);
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
