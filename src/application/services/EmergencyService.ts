import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../core/utils/encryption';

export class EmergencyService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createEmergencyUser(): Promise<boolean> {
    try {
      console.log('🆘 CREANDO USUARIO DE EMERGENCIA...');
      
      const emergencyUser = {
        name: 'EMERGENCIA',
        email: 'emergencia@tortilleria.com', 
        password: await EncryptionService.hashPassword('123456'),
        role: 'admin' as const,
        isActive: true
      };

      await this.userRepository.createUser(emergencyUser);
      console.log('✅ USUARIO DE EMERGENCIA CREADO:');
      console.log('   📧 emergencia@tortilleria.com');
      console.log('   🔑 123456');
      
      return true;
    } catch (error) {
      console.error('❌ Error creando usuario emergencia:', error);
      return false;
    }
  }
}
