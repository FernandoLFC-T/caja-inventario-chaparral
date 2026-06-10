// src/routes/venta.routes.js
const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/venta.controller');

router.post('/', ventaController.registrarVenta);

module.exports = router;
