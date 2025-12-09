import { AuthService } from '../AuthService';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../../core/utils/encryption';

type MockedRepo = jest.Mocked<UserRepository>;

jest.mock('expo-sqlite');
jest.mock('expo-crypto');
jest.mock('../../../infrastructure/repositories/UserRepository');
jest.mock('../../../core/utils/encryption');

describe('AuthService', () => {
  let authService: AuthService;
  let mockRepo: MockedRepo;

  beforeEach(() => {
    authService = new AuthService();
    mockRepo = {
      getUserByEmail: jest.fn(),
    } as unknown as MockedRepo;
    (authService as any).userRepository = mockRepo;
  });

  describe('login', () => {
    const baseUser = {
      id: 1,
      name: 'Admin',
      email: 'admin@tortilleria.com',
      password: 'hashed',
      role: 'admin' as const,
      isActive: true,
    };

    it('returns success when credentials are valid', async () => {
      mockRepo.getUserByEmail.mockResolvedValue(baseUser as any);
      (EncryptionService.verifyPassword as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('admin@tortilleria.com', 'admin123');

      expect(result.success).toBe(true);
      expect(result.user).toMatchObject({ id: 1, email: baseUser.email, role: 'admin' });
      expect(result.user).not.toHaveProperty('password');
    });

    it('returns failure when user does not exist', async () => {
      mockRepo.getUserByEmail.mockResolvedValue(null);

      const result = await authService.login('missing@tortilleria.com', 'admin123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Usuario o contrasena incorrectos');
    });

    it('returns failure when password is invalid', async () => {
      mockRepo.getUserByEmail.mockResolvedValue(baseUser as any);
      (EncryptionService.verifyPassword as jest.Mock).mockResolvedValue(false);

      const result = await authService.login('admin@tortilleria.com', 'bad');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Usuario o contrasena incorrectos');
    });

    it('handles repository errors gracefully', async () => {
      mockRepo.getUserByEmail.mockRejectedValue(new Error('db down'));

      const result = await authService.login('admin@tortilleria.com', 'admin123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error del sistema');
    });
  });
});
