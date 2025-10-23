export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'customer';
  createdAt: Date;
}

export interface AuthCredentials {
  email: string;
  password: string;
}