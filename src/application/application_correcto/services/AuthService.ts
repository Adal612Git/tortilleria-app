import { LoginUseCase } from '../../domain/use-cases/auth/LoginUseCase';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl';

export class AuthService {
  private loginUseCase: LoginUseCase;

  constructor() {
    const userRepository = new UserRepositoryImpl();
    this.loginUseCase = new LoginUseCase(userRepository);
  }

  async login(email: string, password: string) {
    return await this.loginUseCase.execute({ email, password });
  }

  async logout() {
    const userRepository = new UserRepositoryImpl();
    await userRepository.logout();
  }
}