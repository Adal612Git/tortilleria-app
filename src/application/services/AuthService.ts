import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../core/utils/encryption';
import { Logger } from '../../core/utils/logger';

// Sistema de bloqueo mejorado
class LockoutManager {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_TIME = 10 * 60 * 1000; // 10 minutos

  isLocked(email: string): boolean {
    const data = this.attempts.get(email);
    if (!data) return false;

    // Si pasó el tiempo de bloqueo, resetear
    if (Date.now() - data.lastAttempt > this.LOCKOUT_TIME) {
      this.attempts.delete(email);
      return false;
    }

    return data.count >= this.MAX_ATTEMPTS;
  }

  recordAttempt(email: string): void {
    const current = this.attempts.get(email) || { count: 0, lastAttempt: 0 };
    this.attempts.set(email, {
      count: current.count + 1,
      lastAttempt: Date.now()
    });
  }

  resetAttempts(email: string): void {
    this.attempts.delete(email);
  }

  getRemainingTime(email: string): number {
    const data = this.attempts.get(email);
    if (!data) return 0;
    
    const elapsed = Date.now() - data.lastAttempt;
    return Math.max(0, this.LOCKOUT_TIME - elapsed);
  }
}

export class AuthService {
  private userRepository: UserRepository;
  private lockoutManager: LockoutManager;

  constructor() {
    this.userRepository = new UserRepository();
    this.lockoutManager = new LockoutManager();
  }

  async login(email: string, password: string): Promise<{ 
    success: boolean; 
    user?: any; 
    message: string;
    remainingTime?: number;
  }> {
    try {
      console.log(`🔐 [AUTH] Login attempt for: ${email}`);
      
      // 1. Verificar bloqueo
      if (this.lockoutManager.isLocked(email)) {
        const remainingTime = this.lockoutManager.getRemainingTime(email);
        const minutes = Math.ceil(remainingTime / 60000);
        
        await Logger.logAuthEvent('LOGIN_BLOCKED', email, false);
        return { 
          success: false, 
          message: `Cuenta bloqueada. Espera ${minutes} minutos.`,
          remainingTime
        };
      }

      // 2. Buscar usuario
      const user = await this.userRepository.getUserByEmail(email);
      console.log(`👤 [AUTH] User found:`, user ? 'YES' : 'NO');
      
      if (!user) {
        this.lockoutManager.recordAttempt(email);
        await Logger.logAuthEvent('LOGIN_FAILED', email, false);
        return { 
          success: false, 
          message: 'Usuario no encontrado' 
        };
      }

      // 3. Verificar contraseña con DEBUG
      console.log(`🔑 [AUTH] Verifying password...`);
      console.log(`   Input: "${password}"`);
      console.log(`   Stored: "${user.password}" (${user.password.length} chars)`);
      
      const isPasswordValid = await EncryptionService.verifyPassword(password, user.password);
      console.log(`   ✅ Password valid:`, isPasswordValid);

      if (!isPasswordValid) {
        this.lockoutManager.recordAttempt(email);
        await Logger.logAuthEvent('LOGIN_FAILED', email, false);
        return { 
          success: false, 
          message: 'Contraseña incorrecta' 
        };
      }

      // 4. ÉXITO - Resetear bloqueo
      this.lockoutManager.resetAttempts(email);
      await Logger.logAuthEvent('LOGIN_SUCCESS', email, true);
      
      console.log(`🎉 [AUTH] LOGIN SUCCESS for: ${email}`);
      return { 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        message: 'Login exitoso'
      };

    } catch (error: any) {
      console.error('💥 [AUTH] Error:', error);
      await Logger.logAuthEvent('LOGIN_ERROR', email, false);
      return { 
        success: false, 
        message: 'Error del sistema: ' + error.message 
      };
    }
  }

  // Método para debug
  async debugUser(email: string) {
    const user = await this.userRepository.getUserByEmail(email);
    if (user) {
      console.log('🔍 [DEBUG] User data:', {
        email: user.email,
        password: user.password,
        passwordLength: user.password.length,
        role: user.role,
        isActive: user.isActive
      });
    } else {
      console.log('🔍 [DEBUG] User not found:', email);
    }
  }
}
