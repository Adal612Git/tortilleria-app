import { AuthService } from '../AuthService';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../../core/utils/encryption';

// Mock de las dependencias
jest.mock('../../../infrastructure/repositories/UserRepository');
jest.mock('../../../core/utils/encryption');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    authService = new AuthService();
    mockUserRepository = {
      getUserByEmail: jest.fn(),
      getAllUsers: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;

    // Inyectar mock
    (authService as any).userRepository = mockUserRepository;
  });

  describe('login', () => {
    it('debe retornar usuario cuando las credenciales son válidas', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@tortilleria.com',
        password: 'hashed_password',
        role: 'admin' as const,
        isActive: true
      };

      mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);
      (EncryptionService.verifyPassword as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('test@tortilleria.com', 'password123');

      expect(result).toEqual({
        id: 1,
        name: 'Test User',
        email: 'test@tortilleria.com',
        role: 'admin',
        isActive: true
      });
    });

    it('debe retornar null cuando el usuario no existe', async () => {
      mockUserRepository.getUserByEmail.mockResolvedValue(null);

      const result = await authService.login('nonexistent@tortilleria.com', 'password123');

      expect(result).toBeNull();
    });

    it('debe retornar null cuando la contraseña es incorrecta', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@tortilleria.com',
        password: 'hashed_password',
        role: 'admin' as const,
        isActive: true
      };

      mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);
      (EncryptionService.verifyPassword as jest.Mock).mockResolvedValue(false);

      const result = await authService.login('test@tortilleria.com', 'wrong_password');

      expect(result).toBeNull();
    });
  });

  describe('validateSession', () => {
    it('debe retornar usuario cuando el ID es válido', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'Test User',
          email: 'test@tortilleria.com',
          password: 'hashed_password',
          role: 'admin' as const,
          isActive: true
        }
      ];

      mockUserRepository.getAllUsers.mockResolvedValue(mockUsers);

      const result = await authService.validateSession(1);

      expect(result).toEqual({
        id: 1,
        name: 'Test User',
        email: 'test@tortilleria.com',
        role: 'admin',
        isActive: true
      });
    });

    it('debe retornar null cuando el ID no existe', async () => {
      mockUserRepository.getAllUsers.mockResolvedValue([]);

      const result = await authService.validateSession(999);

      expect(result).toBeNull();
    });
  });
});
