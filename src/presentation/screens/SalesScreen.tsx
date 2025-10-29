import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { logger } from "../../core/protection/Logger";
import { secureCache } from "../../core/protection/SecureCache";
import { anomalyDetector } from "../../core/protection/AnomalyDetector";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    barcode?: string;
}

interface CartItem {
    product: Product;
    quantity: number;
    subtotal: number;
}

const SalesScreen = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Cargar productos al iniciar
    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            // Simular productos de ejemplo
            const sampleProducts: Product[] = [
                { id: '1', name: 'Tortilla de Maíz', price: 15.50, stock: 100, category: 'tortilla' },
                { id: '2', name: 'Tortilla de Harina', price: 18.00, stock: 80, category: 'tortilla' },
                { id: '3', name: 'Totopos', price: 25.00, stock: 50, category: 'totopos' },
                { id: '4', name: 'Masa para Tortilla', price: 12.00, stock: 200, category: 'masa' },
            ];
            
            setProducts(sampleProducts);
            await secureCache.set('products', sampleProducts);
        } catch (error) {
            logger.error('Error cargando productos:', error);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addToCart = (product: Product) => {
        if (product.stock <= 0) {
            Alert.alert('Sin stock', 'Este producto no tiene stock disponible');
            return;
        }

        anomalyDetector.recordBehavior({
            action: 'add_to_cart',
            timestamp: Date.now(),
            success: true,
            metadata: { productId: product.id, productName: product.name }
        });

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product.id === product.id);
            
            if (existingItem) {
                // Incrementar cantidad si ya está en el carrito
                return prevCart.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.price }
                        : item
                );
            } else {
                // Agregar nuevo item al carrito
                return [...prevCart, {
                    product,
                    quantity: 1,
                    subtotal: product.price
                }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.price }
                    : item
            )
        );
    };

    const getTotal = () => {
        return cart.reduce((total, item) => total + item.subtotal, 0);
    };

    const processSale = async () => {
        if (cart.length === 0) {
            Alert.alert('Carrito vacío', 'Agrega productos para realizar una venta');
            return;
        }

        setIsProcessing(true);

        try {
            // Validar stock antes de procesar
            for (const item of cart) {
                const product = products.find(p => p.id === item.product.id);
                if (!product || product.stock < item.quantity) {
                    Alert.alert('Stock insuficiente', `No hay suficiente stock de ${item.product.name}`);
                    setIsProcessing(false);
                    return;
                }
            }

            // Registrar venta
            const sale = {
                id: `sale_${Date.now()}`,
                timestamp: new Date(),
                items: cart,
                total: getTotal(),
                status: 'completed' as const
            };

            // Guardar en cache seguro
            const existingSales = await secureCache.get<any[]>('sales') || [];
            await secureCache.set('sales', [...existingSales, sale]);

            // Actualizar stock
            const updatedProducts = products.map(product => {
                const cartItem = cart.find(item => item.product.id === product.id);
                if (cartItem) {
                    return { ...product, stock: product.stock - cartItem.quantity };
                }
                return product;
            });

            setProducts(updatedProducts);
            await secureCache.set('products', updatedProducts);

            // Registrar comportamiento
            anomalyDetector.recordBehavior({
                action: 'sale_completed',
                timestamp: Date.now(),
                success: true,
                metadata: { saleId: sale.id, total: sale.total, itemsCount: cart.length }
            });

            // Mostrar éxito
            Alert.alert(
                'Venta Exitosa',
                `Venta procesada por $${getTotal().toFixed(2)}`,
                [{ text: 'OK', onPress: () => setCart([]) }]
            );

            logger.info(`Venta procesada: $${getTotal().toFixed(2)}`);

        } catch (error) {
            logger.error('Error procesando venta:', error);
            Alert.alert('Error', 'No se pudo procesar la venta');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <TouchableOpacity 
            style={styles.productCard}
            onPress={() => addToCart(item)}
            disabled={item.stock <= 0}
        >
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                <Text style={styles.productStock}>
                    {item.stock > 0 ? `Stock: ${item.stock}` : 'SIN STOCK'}
                </Text>
            </View>
            <View style={[styles.addButton, item.stock <= 0 && styles.addButtonDisabled]}>
                <Text style={styles.addButtonText}>+</Text>
            </View>
        </TouchableOpacity>
    );

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.product.name}</Text>
                <Text style={styles.cartItemPrice}>${item.product.price.toFixed(2)} c/u</Text>
            </View>
            <View style={styles.cartItemControls}>
                <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                    <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{item.quantity}</Text>
                
                <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                >
                    <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
                
                <Text style={styles.cartItemSubtotal}>${item.subtotal.toFixed(2)}</Text>
                
                <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.product.id)}
                >
                    <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Punto de Venta</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Contenido principal */}
            <View style={styles.mainContent}>
                {/* Lista de productos */}
                <View style={styles.productsSection}>
                    <Text style={styles.sectionTitle}>Productos ({filteredProducts.length})</Text>
                    <FlatList
                        data={filteredProducts}
                        renderItem={renderProduct}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                {/* Carrito */}
                <View style={styles.cartSection}>
                    <Text style={styles.sectionTitle}>
                        Carrito ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                    </Text>
                    
                    {cart.length === 0 ? (
                        <View style={styles.emptyCart}>
                            <Text style={styles.emptyCartText}>Carrito vacío</Text>
                            <Text style={styles.emptyCartSubtext}>Agrega productos para comenzar</Text>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                data={cart}
                                renderItem={renderCartItem}
                                keyExtractor={item => item.product.id}
                                style={styles.cartList}
                            />
                            
                            <View style={styles.totalSection}>
                                <Text style={styles.totalLabel}>Total:</Text>
                                <Text style={styles.totalAmount}>${getTotal().toFixed(2)}</Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]}
                                onPress={processSale}
                                disabled={isProcessing}
                            >
                                <Text style={styles.checkoutButtonText}>
                                    {isProcessing ? 'Procesando...' : 'Finalizar Venta'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    searchInput: {
        backgroundColor: '#F1F5F9',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
    },
    productsSection: {
        flex: 2,
        padding: 16,
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
    },
    cartSection: {
        flex: 1,
        padding: 16,
        backgroundColor: 'white',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        color: '#059669',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    productStock: {
        fontSize: 12,
        color: '#6B7280',
    },
    addButton: {
        backgroundColor: '#10B981',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    addButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cartItem: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    cartItemInfo: {
        marginBottom: 8,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    cartItemPrice: {
        fontSize: 12,
        color: '#6B7280',
    },
    cartItemControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quantityButton: {
        backgroundColor: '#E5E7EB',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginHorizontal: 12,
    },
    cartItemSubtotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#059669',
    },
    removeButton: {
        backgroundColor: '#FEF2F2',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#DC2626',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyCart: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyCartText: {
        fontSize: 18,
        color: '#6B7280',
        marginBottom: 8,
    },
    emptyCartSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    cartList: {
        flex: 1,
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#059669',
    },
    checkoutButton: {
        backgroundColor: '#1E40AF',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    checkoutButtonDisabled: {
        opacity: 0.6,
    },
    checkoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SalesScreen;
