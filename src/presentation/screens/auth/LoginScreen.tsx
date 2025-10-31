// DEPRECADO: Esta pantalla usaba login por PIN.
// Manteniendo el archivo solo como referencia, pero NO se usa en la navegación.
// Ahora el login es por email/contraseña (ver: src/presentation/screens/LoginScreen.tsx)
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authService } from "../../../application/services/AuthService";
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const handleLogin = async () => {
        if (pin.length < 4) {
            Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos');
            return;
        }

        setIsLoading(true);
        
        try {
            const result = await authService.login(pin);
            
            if (result.success) {
                console.log('✅ Login exitoso - React Navigation manejará la redirección automáticamente');
                // NO navegar manualmente - React Navigation maneja esto automáticamente
                // debido al conditional rendering en RoleBasedNavigator
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            console.error('Error en login:', error);
            Alert.alert('Error', 'Error del sistema al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoSection}>
                <Text style={styles.logo}>🌮</Text>
                <Text style={styles.title}>Tortillería Suprema</Text>
                <Text style={styles.subtitle}>Sistema de Gestión</Text>
            </View>

            <View style={styles.loginForm}>
                <Text style={styles.label}>Ingresa tu PIN</Text>
                <TextInput
                    style={styles.pinInput}
                    placeholder="****"
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    editable={!isLoading}
                />
                
                <TouchableOpacity 
                    style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    <Text style={styles.loginButtonText}>
                        {isLoading ? 'Verificando...' : 'Ingresar'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Sistema Offline • v1.0.0
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E40AF',
        justifyContent: 'space-between',
        padding: 20,
    },
    logoSection: {
        alignItems: 'center',
        marginTop: 80,
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#BFDBFE',
    },
    loginForm: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        textAlign: 'center',
    },
    pinInput: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 20,
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 8,
        marginBottom: 20,
        backgroundColor: '#F9FAFB',
    },
    loginButton: {
        backgroundColor: '#1E40AF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    footerText: {
        color: '#BFDBFE',
        fontSize: 14,
    },
});

export default LoginScreen;
