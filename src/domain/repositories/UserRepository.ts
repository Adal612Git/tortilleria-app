import { User, AuthCredentials } from '../entities/User';

export interface UserRepository {
  login(credentials: AuthCredentials): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  updateUser(user: User): Promise<User>;
}