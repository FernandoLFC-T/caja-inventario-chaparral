// src/controllers/venta.controller.js
const db = require('../config/database');

const registrarVenta = async (req, res) => {
    const { ticket, total, metodo, pago_efectivo, pago_yape, usuario_id } = req.body;

    if (!ticket || ticket.length === 0) {
        return res.status(400).json({ message: 'El ticket está vacío' });
    }

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Calcular utilidad total y preparar datos
        let utilidad_total = 0;
        const detalles = [];

        for (const item of ticket) {
            // Obtener datos del producto para la venta
            const [rows] = await connection.query(`
                SELECT producto_base_id, costo, factor_conversion 
                FROM productos_presentaciones 
                WHERE id = ? FOR UPDATE
            `, [item.presentacion_id]);

            if (rows.length === 0) {
                throw new Error(`Producto presentación no encontrado: ${item.presentacion_id}`);
            }

            const producto = rows[0];
            const costo_unitario = parseFloat(producto.costo);
            const utilidad_item = (parseFloat(item.precio) - costo_unitario) * item.cantidad;
            utilidad_total += utilidad_item;

            detalles.push({
                ...item,
                producto_base_id: producto.producto_base_id,
                costo_unitario,
                factor_conversion: producto.factor_conversion
            });
        }

        // 2. Insertar en ventas
        const [ventaResult] = await connection.query(`
            INSERT INTO ventas (usuario_id, total, utilidad_total, metodo_pago, pago_efectivo, pago_yape)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [usuario_id || 2, total, utilidad_total, metodo, pago_efectivo || 0, pago_yape || 0]);

        const venta_id = ventaResult.insertId;

        // 3. Procesar detalles, kardex y stock
        for (const detalle of detalles) {
            const subtotal = detalle.cantidad * detalle.precio;

            // Insertar detalle_ventas
            await connection.query(`
                INSERT INTO detalle_ventas (venta_id, presentacion_id, cantidad, precio_unitario, costo_unitario, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [venta_id, detalle.presentacion_id, detalle.cantidad, detalle.precio, detalle.costo_unitario, subtotal]);

            // Actualizar stock
            const cantidadEnBase = detalle.cantidad * detalle.factor_conversion;
            await connection.query(`
                UPDATE productos_base 
                SET stock_actual = stock_actual - ? 
                WHERE id = ?
            `, [cantidadEnBase, detalle.producto_base_id]);

            // Insertar kardex
            await connection.query(`
                INSERT INTO kardex (producto_base_id, usuario_id, tipo_movimiento, cantidad, motivo, descripcion)
                VALUES (?, ?, 'SALIDA', ?, 'VENTA', ?)
            `, [
                detalle.producto_base_id, 
                usuario_id || 2, 
                cantidadEnBase, 
                `Venta ID: ${venta_id}`
            ]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Venta registrada con éxito', venta_id });

    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar la venta:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar la venta', error: error.message });
    } finally {
        connection.release();
    }
};

module.exports = {
    registrarVenta
};
