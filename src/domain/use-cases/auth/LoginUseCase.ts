import { User, AuthCredentials } from '../../entities/User';
import { UserRepository } from '../../repositories/UserRepository';

export class LoginUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(credentials: AuthCredentials): Promise<User> {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    return await this.userRepository.login(credentials);
  }
}