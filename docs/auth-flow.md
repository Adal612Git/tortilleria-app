# Flujo de Autenticación - HU2.1

## Arquitectura


## Componentes Principales

### 1. AuthStore (Zustand)
- Maneja estado global de autenticación
- Persistencia con AsyncStorage
- Control de intentos fallidos
- Bloqueo temporal por seguridad

### 2. AuthService
- Lógica de negocio de autenticación
- Validación de credenciales
- Comunicación con UserRepository

### 3. UserRepository
- Operaciones CRUD con SQLite
- Consultas por email y rol
- Bootstrap de usuario inicial

### 4. StorageService
- Persistencia segura de sesión
- Manejo de AsyncStorage
- Cifrado futuro con expo-secure-store

## Flujo de Login

1. **Validación Frontend**: Email y contraseña requeridos
2. **Control de Intentos**: Máximo 5 intentos, bloqueo 15min
3. **Consulta SQLite**: Buscar usuario por email
4. **Validación Credenciales**: Comparación de contraseña
5. **Persistencia**: Guardar sesión en AsyncStorage
6. **Navegación**: Redirigir a Home según rol

## Seguridad

- Validación de formato email
- Mínimo 6 caracteres en contraseña
- Bloqueo progresivo por intentos
- No almacenamiento de passwords en texto plano
- Limpieza automática de sesión en logout

## Roles y Permisos

- **Dueño (Admin)**: Acceso completo
- **Despachador (Empleado)**: Ventas e inventario
- **Motociclista (Repartidor)**: Entregas y pedidos
