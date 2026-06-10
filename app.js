const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src/public')));

const db = require('./src/config/database');

db.getConnection()
    .then(connection => {
        console.log('✅ Base de datos MySQL conectada exitosamente.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error de conexión a la base de datos:', err);
    });
// ---> ESTAS DOS LÍNEAS SON LAS QUE FALTAN <---
const authRoutes = require('./src/routes/auth.routes');
app.use('/api/auth', authRoutes);
// ---------------------------------------------

app.listen(PORT, () => {
    console.log(`✅ Servidor del sistema El Chaparral corriendo en http://localhost:${PORT}`);
});
// En tu app.js, debajo de las rutas de auth:
const productoRoutes = require('./src/routes/producto.routes');
app.use('/api/productos', productoRoutes);
const ventaRoutes = require('./src/routes/venta.routes');
app.use('/api/ventas', ventaRoutes);
const adminRoutes = require('./src/routes/admin.routes');
app.use('/api/admin', adminRoutes);