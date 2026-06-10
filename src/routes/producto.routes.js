// src/routes/producto.routes.js
const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');

router.get('/buscar/:codigo', productoController.buscarPorCodigo);
// NUEVA RUTA:
router.get('/buscar-nombre/:termino', productoController.buscarPorNombre);
router.get('/tendencias', productoController.obtenerTendencias);

module.exports = router;