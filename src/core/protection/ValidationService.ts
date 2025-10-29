export class ValidationService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: 'Debe incluir minúsculas' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: 'Debe incluir mayúsculas' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Debe incluir números' };
    }
    return { valid: true, message: 'Contraseña válida' };
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static validatePrice(price: number): boolean {
    return price >= 0 && price <= 1000000;
  }

  static validateStock(stock: number): boolean {
    return Number.isInteger(stock) && stock >= 0 && stock <= 10000;
  }
}
