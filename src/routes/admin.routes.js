// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

router.get('/resumen', adminController.getResumenVentas);
router.get('/inventario', adminController.getInventario);
router.get('/usuarios', adminController.getUsuarios);
router.get('/kardex', adminController.getKardex);
router.get('/dias-con-ventas', adminController.getDiasConVentas);
router.get('/ventas-chart', adminController.getVentasChart);

router.post('/productos', adminController.crearProducto);
router.post('/usuarios', adminController.crearUsuario);
router.post('/inventario/ingreso', adminController.registrarIngresoStock);

module.exports = router;
