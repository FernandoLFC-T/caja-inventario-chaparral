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

app.listen(PORT, () => {
    console.log(`✅ Servidor del sistema El Chaparral corriendo en http://localhost:${PORT}`);
});