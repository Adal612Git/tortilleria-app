import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { secureCache } from "../../core/protection/SecureCache";
import { logger } from "../../core/protection/Logger";
import { useAuthStore } from "../store/authStore";
import { anomalyDetector } from "../../core/protection/AnomalyDetector";

interface DeliveryOrder {
    id: string;
    customerName: string;
    address: string;
    total: number;
    status: 'pending' | 'assigned' | 'in_progress' | 'delivered' | 'failed';
    assignedTo?: string;
    items: Array<{
        productName: string;
        quantity: number;
        price: number;
    }>;
    createdAt: Date;
    notes?: string;
}

const DeliveryDashboard = () => {
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'my_orders' | 'history'>('pending');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            // Simular órdenes de ejemplo
            const sampleOrders: DeliveryOrder[] = [
                {
                    id: 'order_001',
                    customerName: 'María González',
                    address: 'Av. Principal #123, Col. Centro',
                    total: 185.50,
                    status: 'pending',
                    items: [
                        { productName: 'Tortilla de Maíz', quantity: 10, price: 15.50 },
                        { productName: 'Totopos', quantity: 1, price: 25.00 },
                    ],
                    createdAt: new Date(),
                },
                {
                    id: 'order_002',
                    customerName: 'Juan Rodríguez',
                    address: 'Calle Secundaria #456, Col. Norte',
                    total: 240.00,
                    status: 'pending',
                    items: [
                        { productName: 'Tortilla de Harina', quantity: 10, price: 18.00 },
                        { productName: 'Masa para Tortilla', quantity: 5, price: 12.00 },
                    ],
                    createdAt: new Date(),
                },
            ];
            
            setOrders(sampleOrders);
            await secureCache.set('delivery_orders', sampleOrders);
        } catch (error) {
            logger.error('Error cargando órdenes:', error);
        }
    };

    const takeOrder = (orderId: string) => {
        Alert.alert(
            'Tomar Pedido',
            '¿Estás seguro de que quieres tomar este pedido?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Tomar Pedido', 
                    onPress: () => assignOrderToMe(orderId) 
                },
            ]
        );
    };

    const assignOrderToMe = (orderId: string) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId
                    ? { ...order, status: 'assigned', assignedTo: 'current_user' }
                    : order
            )
        );

        anomalyDetector.recordBehavior({
            action: 'order_taken',
            timestamp: Date.now(),
            success: true,
            metadata: { orderId }
        });

        logger.info(`Pedido tomado: ${orderId}`);
        Alert.alert('Éxito', 'Pedido asignado correctamente');
    };

    const updateOrderStatus = (orderId: string, newStatus: 'delivered' | 'failed', notes?: string) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId
                    ? { ...order, status: newStatus, notes }
                    : order
            )
        );

        const action = newStatus === 'delivered' ? 'order_delivered' : 'order_failed';
        anomalyDetector.recordBehavior({
            action,
            timestamp: Date.now(),
            success: true,
            metadata: { orderId, status: newStatus, notes }
        });

        logger.info(`Estado de pedido actualizado: ${orderId} -> ${newStatus}`);
    };

    const renderOrderItem = ({ item }: { item: DeliveryOrder }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Pedido #{item.id.split('_')[1]}</Text>
                <View style={[styles.statusBadge, styles[item.status]]}>
                    <Text style={styles.statusText}>
                        {item.status === 'pending' ? 'Pendiente' :
                         item.status === 'assigned' ? 'Asignado' :
                         item.status === 'in_progress' ? 'En camino' :
                         item.status === 'delivered' ? 'Entregado' : 'Fallido'}
                    </Text>
                </View>
            </View>

            <View style={styles.orderInfo}>
                <Text style={styles.customerName}>{item.customerName}</Text>
                <Text style={styles.address}>{item.address}</Text>
                <Text style={styles.total}>${item.total.toFixed(2)}</Text>
            </View>

            <View style={styles.itemsList}>
                {item.items.map((orderItem, index) => (
                    <Text key={index} style={styles.itemText}>
                        {orderItem.quantity}x {orderItem.productName}
                    </Text>
                ))}
            </View>

            <View style={styles.orderActions}>
                {item.status === 'pending' && (
                    <TouchableOpacity 
                        style={styles.takeOrderButton}
                        onPress={() => takeOrder(item.id)}
                    >
                        <Text style={styles.takeOrderButtonText}>Tomar Pedido</Text>
                    </TouchableOpacity>
                )}

                {item.status === 'assigned' && item.assignedTo === 'current_user' && (
                    <View style={styles.inProgressActions}>
                        <TouchableOpacity 
                            style={styles.deliveredButton}
                            onPress={() => updateOrderStatus(item.id, 'delivered')}
                        >
                            <Text style={styles.actionButtonText}>✅ Entregado</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.failedButton}
                            onPress={() => updateOrderStatus(item.id, 'failed', 'Cliente no encontrado')}
                        >
                            <Text style={styles.actionButtonText}>❌ No Entregado</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {item.status === 'delivered' && (
                    <Text style={styles.completedText}>✅ Entregado</Text>
                )}

                {item.status === 'failed' && (
                    <Text style={styles.failedText}>❌ No entregado</Text>
                )}
            </View>

            {item.notes && (
                <Text style={styles.notesText}>Notas: {item.notes}</Text>
            )}
        </View>
    );

    const pendingOrders = orders.filter(order => order.status === 'pending');
    const myOrders = orders.filter(order => 
        order.assignedTo === 'current_user' && 
        ['assigned', 'in_progress'].includes(order.status)
    );
    const historyOrders = orders.filter(order => 
        ['delivered', 'failed'].includes(order.status)
    );

    const getOrdersToShow = () => {
        switch (activeTab) {
            case 'pending': return pendingOrders;
            case 'my_orders': return myOrders;
            case 'history': return historyOrders;
            default: return pendingOrders;
        }
    };

    const { logout } = useAuthStore();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={styles.title}>Repartidor</Text>
                        <Text style={styles.subtitle}>Gestión de Pedidos</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={{ backgroundColor: '#F1F5F9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <Text style={{ color: '#1F2937', fontWeight: '600' }}>Salir</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                        Pendientes ({pendingOrders.length})
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'my_orders' && styles.activeTab]}
                    onPress={() => setActiveTab('my_orders')}
                >
                    <Text style={[styles.tabText, activeTab === 'my_orders' && styles.activeTabText]}>
                        Mis Pedidos ({myOrders.length})
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                        Historial ({historyOrders.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Lista de órdenes */}
            <FlatList
                data={getOrdersToShow()}
                renderItem={renderOrderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.ordersList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            {activeTab === 'pending' ? 'No hay pedidos pendientes' :
                             activeTab === 'my_orders' ? 'No tienes pedidos asignados' :
                             'No hay historial de pedidos'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#7C3AED',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#7C3AED',
    },
    ordersList: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pending: {
        backgroundColor: '#FEF3C7',
    },
    assigned: {
        backgroundColor: '#DBEAFE',
    },
    in_progress: {
        backgroundColor: '#D1FAE5',
    },
    delivered: {
        backgroundColor: '#D1FAE5',
    },
    failed: {
        backgroundColor: '#FEE2E2',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderInfo: {
        marginBottom: 12,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    address: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    total: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#059669',
    },
    itemsList: {
        marginBottom: 12,
    },
    itemText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    orderActions: {
        marginTop: 8,
    },
    takeOrderButton: {
        backgroundColor: '#7C3AED',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    takeOrderButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inProgressActions: {
        flexDirection: 'row',
        gap: 8,
    },
    deliveredButton: {
        flex: 1,
        backgroundColor: '#10B981',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    failedButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    completedText: {
        color: '#059669',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    failedText: {
        color: '#DC2626',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    notesText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default DeliveryDashboard;
