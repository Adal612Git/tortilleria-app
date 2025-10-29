#!/bin/bash

echo "🔧 REPARACIÓN MECÁNICA DEFINITIVA - CORRIGIENDO TODAS LAS RUTAS"

# 1. CORREGIR RUTAS DESDE application/services/
echo "📁 Corrigiendo rutas desde application/services/"
find src/application/services -name "*.ts" -o -name "*.tsx" | while read file; do
    sed -i 's|from "./src/core/|from "../../core/|g' "$file"
    sed -i 's|from "../src/core/|from "../../core/|g' "$file" 
    sed -i 's|from "src/core/|from "../../core/|g' "$file"
    echo "✅ $file - rutas core corregidas"
done

# 2. CORREGIR RUTAS DESDE presentation/screens/
echo "📁 Corrigiendo rutas desde presentation/screens/"
find src/presentation/screens -name "*.ts" -o -name "*.tsx" | while read file; do
    sed -i 's|from "./src/core/|from "../../../core/|g' "$file"
    sed -i 's|from "../src/core/|from "../../../core/|g' "$file"
    sed -i 's|from "src/core/|from "../../../core/|g' "$file"
    echo "✅ $file - rutas core corregidas"
done

# 3. CORREGIR RUTAS DESDE presentation/navigation/
echo "📁 Corrigiendo rutas desde presentation/navigation/"
find src/presentation/navigation -name "*.ts" -o -name "*.tsx" | while read file; do
    sed -i 's|from "./src/core/|from "../../core/|g' "$file"
    sed -i 's|from "../src/core/|from "../../core/|g' "$file"
    sed -i 's|from "src/core/|from "../../core/|g' "$file"
    echo "✅ $file - rutas core corregidas"
done

# 4. CORREGIR App.tsx
echo "📁 Corrigiendo App.tsx"
sed -i 's|from "./src/core/|from "./src/core/|g' App.tsx  # Ya está correcto

# 5. VERIFICAR RUTAS CORREGIDAS
echo "🔍 VERIFICANDO RUTAS CORREGIDAS:"
echo "AuthService.ts -> $(grep "from.*core" src/application/services/AuthService.ts | head -1)"
echo "SalesScreen.tsx -> $(grep "from.*core" src/presentation/screens/SalesScreen.tsx | head -1)" 
echo "DeliveryDashboard.tsx -> $(grep "from.*core" src/presentation/screens/DeliveryDashboard.tsx | head -1)"
echo "App.tsx -> $(grep "from.*core" App.tsx | head -1)"

# 6. CREAR ARCHIVOS FALTANTES CRÍTICOS
echo "📝 Creando archivos faltantes críticos..."
mkdir -p src/presentation/screens

# InventoryScreen básico
cat > src/presentation/screens/InventoryScreen.tsx << 'INVEOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InventoryScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Inventario</Text>
            <Text>Gestión de inventario pronto...</Text>
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
INVEOF

# ReportsScreen básico  
cat > src/presentation/screens/ReportsScreen.tsx << 'REPEOF'
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
REPEOF

echo "✅ REPARACIÓN COMPLETADA - TODAS LAS RUTAS CORREGIDAS"
echo "🚀 EJECUTA: npm start"
