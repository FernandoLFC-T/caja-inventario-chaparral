// src/controllers/admin.controller.js
const db = require('../config/database');

const getResumenVentas = async (req, res) => {
    try {
        const fechaParam = req.query.fecha;
        const filtroFecha = fechaParam ? `DATE(fecha) = ?` : `DATE(fecha) = CURDATE()`;
        const paramsTotales = fechaParam ? [fechaParam] : [];

        // Obtenemos los totales del día filtrado
        const [totales] = await db.query(`
            SELECT 
                COUNT(*) as cantidad_ventas,
                IFNULL(SUM(total), 0) as total_ventas,
                IFNULL(SUM(utilidad_total), 0) as utilidad_estimada
            FROM ventas
            WHERE ${filtroFecha}
        `, paramsTotales);

        // Obtenemos las últimas 10 ventas
        let queryVentas = `
            SELECT v.id, v.total, v.fecha, u.username as cajero
            FROM ventas v
            JOIN usuarios u ON v.usuario_id = u.id
        `;
        const paramsVentas = [];
        if (fechaParam) {
            queryVentas += ` WHERE DATE(v.fecha) = ?`;
            paramsVentas.push(fechaParam);
        }
        queryVentas += ` ORDER BY v.fecha DESC LIMIT 10`;

        const [ultimasVentas] = await db.query(queryVentas, paramsVentas);

        const data = totales[0];
        const ticketPromedio = data.cantidad_ventas > 0 ? (data.total_ventas / data.cantidad_ventas) : 0;

        res.status(200).json({
            ventas_hoy: data.total_ventas,
            utilidad_estimada: data.utilidad_estimada,
            ticket_promedio: ticketPromedio,
            ultimas_ventas: ultimasVentas
        });
    } catch (error) {
        console.error('Error en getResumenVentas:', error);
        res.status(500).json({ message: 'Error al obtener resumen de ventas' });
    }
};

const getInventario = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                pb.id as base_id,
                pb.nombre,
                pb.stock_actual,
                pb.stock_minimo,
                pp.id as presentacion_id,
                pp.nombre_presentacion,
                pp.precio_venta,
                pp.codigo_barras
            FROM productos_base pb
            LEFT JOIN productos_presentaciones pp ON pb.id = pp.producto_base_id
            ORDER BY pb.nombre ASC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error en getInventario:', error);
        res.status(500).json({ message: 'Error al obtener inventario' });
    }
};

const getUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.username, u.estado, u.creado_en, r.nombre as rol
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error en getUsuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

const getKardex = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT k.id, k.tipo_movimiento, k.cantidad, k.motivo, k.fecha, k.descripcion, pb.nombre as producto, u.username
            FROM kardex k
            JOIN productos_base pb ON k.producto_base_id = pb.id
            JOIN usuarios u ON k.usuario_id = u.id
            ORDER BY k.fecha DESC
            LIMIT 50
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error en getKardex:', error);
        res.status(500).json({ message: 'Error al obtener kardex' });
    }
};

const getDiasConVentas = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DISTINCT DATE_FORMAT(fecha, '%Y-%m-%d') as fecha
            FROM ventas
            ORDER BY fecha ASC
        `);
        const dias = rows.map(r => r.fecha);
        res.status(200).json(dias);
    } catch (error) {
        console.error('Error en getDiasConVentas:', error);
        res.status(500).json({ message: 'Error al obtener días con ventas' });
    }
};

const getVentasChart = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DATE_FORMAT(fecha, '%Y-%m-%d') as fecha, SUM(total) as total
            FROM ventas
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(fecha)
            ORDER BY fecha ASC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error en getVentasChart:', error);
        res.status(500).json({ message: 'Error al obtener datos para el gráfico' });
    }
};

const bcrypt = require('bcryptjs');

const crearUsuario = async (req, res) => {
    const { username, password, rol_id } = req.body;
    
    if (!username || !password || !rol_id) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(`
            INSERT INTO usuarios (username, password_hash, rol_id, estado)
            VALUES (?, ?, ?, 1)
        `, [username, hash, rol_id]);

        res.status(201).json({ message: 'Usuario creado con éxito', id: result.insertId });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};

const crearProducto = async (req, res) => {
    const { 
        nombre_base, descripcion, stock_inicial, stock_minimo, 
        nombre_presentacion, codigo_barras, costo, precio_venta 
    } = req.body;

    if (!nombre_base || !nombre_presentacion || !codigo_barras || !costo || !precio_venta) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insertar Producto Base
        const [baseResult] = await connection.query(`
            INSERT INTO productos_base (nombre, descripcion, stock_actual, stock_minimo)
            VALUES (?, ?, ?, ?)
        `, [nombre_base, descripcion || '', stock_inicial || 0, stock_minimo || 5]);
        
        const base_id = baseResult.insertId;

        // 2. Insertar Producto Presentación
        await connection.query(`
            INSERT INTO productos_presentaciones (producto_base_id, codigo_barras, nombre_presentacion, factor_conversion, costo, precio_venta, estado)
            VALUES (?, ?, ?, 1, ?, ?, 1)
        `, [base_id, codigo_barras, nombre_presentacion, costo, precio_venta]);

        // 3. Registrar en Kardex si hay stock inicial
        if (stock_inicial > 0) {
            await connection.query(`
                INSERT INTO kardex (producto_base_id, usuario_id, tipo_movimiento, cantidad, motivo, descripcion)
                VALUES (?, ?, 'ENTRADA', ?, 'COMPRA_NUEVA', 'Inventario inicial')
            `, [base_id, 1, stock_inicial]); // Hardcodeado usuario_id = 1 (admin)
        }

        await connection.commit();
        res.status(201).json({ message: 'Producto creado con éxito' });

    } catch (error) {
        await connection.rollback();
        console.error('Error al crear producto:', error);
        res.status(500).json({ message: 'Error interno al crear producto' });
    } finally {
        connection.release();
    }
};

const registrarIngresoStock = async (req, res) => {
    const { productos } = req.body;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ message: 'No hay productos para ingresar' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const item of productos) {
            const { base_id, cantidad } = item;
            
            if (!base_id || !cantidad || cantidad <= 0) {
                continue; // Saltar items inválidos
            }

            // 1. Actualizar stock actual
            await connection.query(`
                UPDATE productos_base 
                SET stock_actual = stock_actual + ? 
                WHERE id = ?
            `, [cantidad, base_id]);

            // 2. Registrar movimiento en Kardex
            await connection.query(`
                INSERT INTO kardex (producto_base_id, usuario_id, tipo_movimiento, cantidad, motivo, descripcion)
                VALUES (?, ?, 'ENTRADA', ?, 'REPOSICION_RAPIDA', 'Ingreso de mercadería desde el panel')
            `, [base_id, 1, cantidad]); // Hardcodeado usuario_id = 1 (admin)
        }

        await connection.commit();
        res.status(200).json({ message: 'Ingreso de stock registrado con éxito' });

    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar ingreso de stock:', error);
        res.status(500).json({ message: 'Error interno al ingresar stock' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getResumenVentas,
    getInventario,
    getUsuarios,
    getKardex,
    crearUsuario,
    crearProducto,
    registrarIngresoStock,
    getDiasConVentas,
    getVentasChart
};
