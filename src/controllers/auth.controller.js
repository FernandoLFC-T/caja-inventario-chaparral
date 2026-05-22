const db = require('../config/database');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const usuario = rows[0];
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        res.status(200).json({
            message: 'Login exitoso',
            user: {
                id: usuario.id,
                username: usuario.username,
                rol_id: usuario.rol_id
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { login };