-- =========================================================================
-- ESTRUCTURA DE LA BASE DE DATOS: EL CHAPARRAL POS
-- COOPERACIÓN: ARQUITECTURA MODULAR, CONTROL DE ROLES Y GESTIÓN DE STOCK MULTI-PRESENTACIÓN
-- =========================================================================

CREATE DATABASE IF NOT EXISTS el_chaparral_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE el_chaparral_db;

-- Desactivar restricciones de claves foráneas para realizar un truncado limpio de datos antiguos
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS kardex;
DROP TABLE IF EXISTS detalle_ventas;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS sesiones_caja;
DROP TABLE IF EXISTS productos_presentaciones;
DROP TABLE IF EXISTS productos_base;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- TABLA 1: ROLES (Control de Acceso Basado en Roles - RBAC)
-- =========================================================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO roles (id, nombre) VALUES 
(1, 'Administrador'),
(2, 'Supervisor'),
(3, 'Cajero');

-- =========================================================================
-- TABLA 2: USUARIOS (Esquema de autenticación criptográfica)
-- el campo 'estado' maneja el ciclo de vida de la cuenta (1: Activo, 0: Inactivo)
-- =========================================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    estado TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Datos de inicialización (Claves por defecto en texto plano: '123456')
-- NOTA: Se inserta un hash bcrypt provisional. Recuerda ejecutar el script de actualización en tu entorno local.
INSERT INTO usuarios (username, password_hash, rol_id, estado) VALUES 
('admin', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 1, 1),
('luis', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 3, 1);

-- =========================================================================
-- TABLA 3: PRODUCTOS BASE (Control estricto de inventario en almacén)
-- stock_actual almacena las existencias consolidadas en la unidad física mínima.
-- =========================================================================
CREATE TABLE productos_base (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    stock_actual INT DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================================
-- TABLA 4: PRODUCTOS PRESENTACIONES (Unidades de venta, Códigos de barra y Precios)
-- factor_conversion determina la equivalencia exacta con la unidad mínima de productos_base
-- =========================================================================
CREATE TABLE productos_presentaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_base_id INT NOT NULL,
    codigo_barras VARCHAR(50) NOT NULL UNIQUE,
    nombre_presentacion VARCHAR(150) NOT NULL,
    factor_conversion INT NOT NULL DEFAULT 1,
    costo DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    estado TINYINT(1) DEFAULT 1,
    FOREIGN KEY (producto_base_id) REFERENCES productos_base(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================================
-- TABLA 5: VENTAS (Cabecera transaccional y auditoría financiera)
-- Almacena montos globales, utilidades netas e integraciones para flujos combinados
-- =========================================================================
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    utilidad_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(20) NOT NULL, -- 'Efectivo', 'Yape', 'Combinado'
    pago_efectivo DECIMAL(10,2) DEFAULT 0.00,
    pago_yape DECIMAL(10,2) DEFAULT 0.00,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================================
-- TABLA 6: DETALLE DE VENTAS (Ruptura de la relación de muchos a muchos)
-- Captura el estado del costo e importe unitario al momento exacto del cobro
-- =========================================================================
CREATE TABLE detalle_ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    presentacion_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (presentacion_id) REFERENCES productos_presentaciones(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================================
-- TABLA 7: KARDEX (Historial inmutable de movimientos de stock)
-- Auditoría total para trazabilidad de inventarios. Cantidades mapeadas en unidad base.
-- =========================================================================
CREATE TABLE kardex (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_base_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_movimiento ENUM('ENTRADA', 'SALIDA') NOT NULL,
    cantidad INT NOT NULL,
    motivo ENUM('VENTA', 'REPOSICION_RAPIDA', 'COMPRA_NUEVA', 'AJUSTE', 'MERMA') NOT NULL,
    descripcion TEXT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_base_id) REFERENCES productos_base(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================================
-- INSERCIÓN DE DATOS DE PRUEBA CONTROLADOS
-- =========================================================================
INSERT INTO productos_base (id, nombre, descripcion, stock_actual, stock_minimo) 
VALUES (1, 'Cerveza Pilsen Trujillo 620ml', 'Cerveza para el inventario de la cancha', 48, 12);

INSERT INTO productos_presentaciones (producto_base_id, codigo_barras, nombre_presentacion, factor_conversion, costo, precio_venta)
VALUES 
(1, '775000111111', 'Cerveza Pilsen - Botella Individual', 1, 5.00, 8.00),
(1, '775000222222', 'Cerveza Pilsen - Caja x24', 24, 110.00, 160.00);