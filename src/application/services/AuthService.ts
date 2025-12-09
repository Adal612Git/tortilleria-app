import { User } from '../../domain/entities/User';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../core/utils/encryption';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: Omit<User, 'password'>; message: string }> {
    try {
      const user = await this.userRepository.getUserByEmail(email);
      if (!user || !user.isActive) {
        return { success: false, message: 'Usuario o contrasena incorrectos' };
      }

      const isValid = await EncryptionService.verifyPassword(password, user.password);
      if (!isValid) {
        return { success: false, message: 'Usuario o contrasena incorrectos' };
      }

      const { password: _ignored, ...safeUser } = user;
      return { success: true, user: safeUser, message: 'Login exitoso' };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error del sistema' };
    }
  }
}

export const authService = new AuthService();
