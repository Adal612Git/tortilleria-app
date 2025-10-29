import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReportsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reportes</Text>
            <Text>Reportes y estadísticas pronto...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
    },
});
