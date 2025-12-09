export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'empleado' | 'repartidor';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserValidator {
  static validate(user: Partial<User>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!user.name || user.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push('El email no es válido');
    }

    if (!user.password || user.password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }

    if (!user.role || !['admin', 'empleado', 'repartidor'].includes(user.role)) {
      errors.push('El rol no es válido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static canModifyUser(currentUserRole: string, targetUserRole: string): boolean {
    return currentUserRole === 'admin';
  }

  static canDeleteUser(currentUserId: number, targetUserId: number, currentUserRole: string): boolean {
    if (currentUserId === targetUserId) {
      return false;
    }
    return currentUserRole === 'admin';
  }
}
