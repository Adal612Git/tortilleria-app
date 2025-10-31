// AuthService unificado: email/contraseña con SQLite
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../core/utils/encryption';

export class AuthService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    // Login estándar con email y contraseña
    async login(email: string, password: string): Promise<{ success: boolean; user?: Omit<User, 'password'>; message: string }> {
        try {
            const user = await this.userRepository.getUserByEmail(email);
            if (!user || !user.isActive) {
                return { success: false, message: 'Usuario o contraseña incorrectos' };
            }

            const isValid = await EncryptionService.verifyPassword(password, user.password);
            if (!isValid) {
                return { success: false, message: 'Usuario o contraseña incorrectos' };
            }

            const { password: _pw, ...safeUser } = user;
            return { success: true, user: safeUser, message: 'Login exitoso' };
        } catch (error) {
            console.error('💥 Error en login:', error);
            return { success: false, message: 'Error del sistema' };
        }
    }
}

// Instancia exportada por compatibilidad si se requiere inyección simple
export const authService = new AuthService();
