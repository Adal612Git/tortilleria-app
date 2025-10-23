import { User, AuthCredentials } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { ApiDataSource } from '../datasources/ApiDataSource';

export class UserRepositoryImpl implements UserRepository {
  private apiDataSource = new ApiDataSource();

  async login(credentials: AuthCredentials): Promise<User> {
    const response = await this.apiDataSource.post<{ user: User; token: string }>(
      '/auth/login',
      credentials
    );
    
    // Guardar token en AsyncStorage
    // await AsyncStorage.setItem('authToken', response.token);
    
    return response.user;
  }

  async logout(): Promise<void> {
    // await AsyncStorage.removeItem('authToken');
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // const token = await AsyncStorage.getItem('authToken');
      // if (!token) return null;
      
      // Implementar lógica para obtener usuario actual
      return null;
    } catch {
      return null;
    }
  }

  async updateUser(user: User): Promise<User> {
    const response = await this.apiDataSource.post<{ user: User }>(
      '/users/update',
      user
    );
    return response.user;
  }
}