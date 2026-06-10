// src/controllers/producto.controller.js
const db = require('../config/database');

const buscarPorCodigo = async (req, res) => {
    const { codigo } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT 
                p.id AS presentacion_id, 
                p.producto_base_id AS base_id,
                b.nombre AS nombre_base,
                p.codigo_barras, 
                p.nombre_presentacion, 
                p.precio_venta, 
                b.stock_actual
            FROM productos_presentaciones p
            JOIN productos_base b ON p.producto_base_id = b.id
            WHERE p.codigo_barras = ? AND p.estado = 1
        `, [codigo]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error al buscar producto:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
const buscarPorNombre = async (req, res) => {
    const { termino } = req.params;

    try {
        // Usamos LIKE %termino% para buscar coincidencias parciales. Limitamos a 10 para no saturar.
        const [rows] = await db.query(`
            SELECT 
                p.id AS presentacion_id, 
                p.producto_base_id AS base_id,
                b.nombre AS nombre_base,
                p.codigo_barras, 
                p.nombre_presentacion, 
                p.precio_venta,
                b.stock_actual
            FROM productos_presentaciones p
            JOIN productos_base b ON p.producto_base_id = b.id
            WHERE p.nombre_presentacion LIKE ? AND p.estado = 1
            LIMIT 10
        `, [`%${termino}%`]);

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error al buscar por nombre:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const obtenerTendencias = async (req, res) => {
    try {
        // Obtenemos los 3 productos más vendidos
        const [rows] = await db.query(`
            SELECT 
                p.id AS presentacion_id, 
                p.codigo_barras, 
                p.nombre_presentacion, 
                p.precio_venta,
                IFNULL(SUM(d.cantidad), 0) as total_vendido
            FROM productos_presentaciones p
            LEFT JOIN detalle_ventas d ON p.id = d.presentacion_id
            WHERE p.estado = 1
            GROUP BY p.id
            ORDER BY total_vendido DESC, p.id ASC
            LIMIT 3
        `);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener tendencias:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Asegúrate de exportar ambas funciones ahora:
module.exports = { buscarPorCodigo, buscarPorNombre, obtenerTendencias };