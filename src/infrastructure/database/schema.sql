PRAGMA foreign_keys = ON;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS Usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'empleado', 'repartidor', 'cliente')),
    correo TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    activo BOOLEAN DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario con password en texto plano para testing
INSERT OR IGNORE INTO Usuario (nombre, rol, correo, password, activo) VALUES 
('Administrador', 'admin', 'admin@tortilleria.com', 'admin123', 1),
('Empleado Test', 'empleado', 'test@tortilleria.com', 'test123', 1);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS Producto (
    id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unidad TEXT NOT NULL CHECK (unidad IN ('kg', 'pieza', 'docena')),
    categoria TEXT NOT NULL CHECK (categoria IN ('tortilla', 'tostada', 'masa', 'otros')),
    activo BOOLEAN DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO Producto (nombre, descripcion, precio, stock, unidad, categoria) VALUES 
('Tortilla de Maíz', 'Tortilla fresca de maíz', 15.50, 100, 'kg', 'tortilla'),
('Tostadas', 'Tostadas crujientes', 12.00, 50, 'pieza', 'tostada');

-- Tabla de Inventario
CREATE TABLE IF NOT EXISTS Inventario (
    id_inventario INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    cantidad REAL NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    motivo TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto) ON DELETE CASCADE
);

-- Tabla de Ventas
CREATE TABLE IF NOT EXISTS Venta (
    id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL NOT NULL CHECK (total >= 0),
    estado TEXT DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE RESTRICT
);

-- Tabla de Detalles de Venta
CREATE TABLE IF NOT EXISTS DetalleVenta (
    id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad REAL NOT NULL CHECK (cantidad > 0),
    precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0),
    subtotal REAL NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (id_venta) REFERENCES Venta(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto) ON DELETE RESTRICT
);

-- Tabla de Pedidos
CREATE TABLE IF NOT EXISTS Pedido (
    id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    direccion TEXT NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado')),
    total REAL NOT NULL CHECK (total >= 0),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE RESTRICT
);

-- Tabla de Entregas
CREATE TABLE IF NOT EXISTS Entrega (
    id_entrega INTEGER PRIMARY KEY AUTOINCREMENT,
    id_pedido INTEGER NOT NULL,
    id_repartidor INTEGER NOT NULL,
    fecha_entrega DATETIME,
    confirmado BOOLEAN DEFAULT 0,
    notas TEXT,
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_repartidor) REFERENCES Usuario(id_usuario) ON DELETE RESTRICT
);

-- Tabla de Historial de Entregas
CREATE TABLE IF NOT EXISTS HistorialEntrega (
    id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
    id_repartidor INTEGER NOT NULL,
    id_pedido INTEGER NOT NULL,
    accion TEXT NOT NULL CHECK (accion IN ('asignado', 'en_camino', 'entregado', 'fallido', 'reprogramado')),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    comentarios TEXT,
    FOREIGN KEY (id_repartidor) REFERENCES Usuario(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido) ON DELETE CASCADE
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_venta_fecha ON Venta(fecha);
CREATE INDEX IF NOT EXISTS idx_pedido_estado ON Pedido(estado);
CREATE INDEX IF NOT EXISTS idx_producto_activo ON Producto(activo);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON Inventario(id_producto);
