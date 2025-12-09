import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Formato de email inválido')
    .required('Email es requerido'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('Contraseña es requerida')
});

export const registerSchema = yup.object({
  name: yup
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .required('Nombre es requerido'),
  email: yup
    .string()
    .email('Formato de email inválido')
    .required('Email es requerido'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('Contraseña es requerida'),
  role: yup
    .string()
    .oneOf(['admin', 'empleado', 'repartidor'], 'Rol inválido')
    .required('Rol es requerido')
});
