/**
 * 🎨 Sistema de Colores - Tortillería App
 * HU1.4: Paleta de colores basada en roles de usuario
 */

export const colors = {
  // Colores por rol (según especificación HU1.4)
  roles: {
    // Azul → confianza y control (Dueño/Admin)
    owner: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a',
    },
    // Verde → productividad y estabilidad (Despachador/Empleado)
    employee: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      900: '#14532d',
    },
    // Naranja → energía y acción (Motociclista/Repartidor)
    delivery: {
      50: '#fff7ed',
      100: '#ffedd5',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      900: '#7c2d12',
    },
  },
  
  // Grises neutros para equilibrio visual
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
  
  // Estados del sistema
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Fondos y superficies
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
  },
  
  // Textos
  text: {
    primary: '#18181b',
    secondary: '#52525b',
    tertiary: '#a1a1aa',
    inverse: '#ffffff',
  },
};

/**
 * Obtener colores según el rol del usuario
 */
export const getRoleColors = (role: string) => {
  switch (role) {
    case 'admin':
      return colors.roles.owner;
    case 'empleado':
      return colors.roles.employee;
    case 'repartidor':
      return colors.roles.delivery;
    default:
      return colors.roles.owner;
  }
};

/**
 * Verificar contraste para accesibilidad WCAG AA
 */
export const getAccessibleTextColor = (backgroundColor: string): string => {
  // Simulación básica de contraste (en una implementación real usaría librería de color)
  const darkColors = ['#1e3a8a', '#14532d', '#7c2d12', '#18181b', '#27272a'];
  return darkColors.includes(backgroundColor) ? colors.text.inverse : colors.text.primary;
};
