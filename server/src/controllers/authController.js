const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// Mock data fallback if database is not reachable
const fallbackUsers = [
  {
    id_usuario: 'JSL',
    nombre_completo: 'Josué David Sánchez López',
    usuario: 'a201600577908',
    roles: ['Jefe de bodega', 'Encargado de pedidos', 'Encargado de ingresos', 'Encargado de recepción', 'Encargado de compras']
  }
];

async function login(req, res) {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Por favor ingrese usuario y contraseña.' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('usuario', sql.VarChar(50), usuario)
      .input('password', sql.VarChar(100), password)
      .query(`
        SELECT u.id_usuario, u.nombre_completo, u.usuario
        FROM Usuarios u
        WHERE u.usuario = @usuario
          AND u.contrasena_hash = HASHBYTES('SHA2_512', @password)
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifique su usuario y contraseña.' });
    }

    const user = result.recordset[0];

    // Obtener roles del usuario
    const rolesResult = await pool.request()
      .input('id_usuario', sql.Char(3), user.id_usuario)
      .query(`
        SELECT r.nombre_rol
        FROM Usuario_Roles ur
        JOIN Roles r ON ur.id_rol = r.id_rol
        WHERE ur.id_usuario = @id_usuario
      `);

    const roles = rolesResult.recordset.map(row => row.nombre_rol);

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        nombre_completo: user.nombre_completo,
        usuario: user.usuario,
        roles
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre_completo: user.nombre_completo,
        usuario: user.usuario,
        roles
      }
    });

  } catch (err) {
    console.warn('⚠️ Error de conexión SQL Server en login, utilizando fallback local:', err.message);
    
    // Fallback mode for testing/demo when SQL Server is offline
    const fbUser = fallbackUsers.find(u => u.usuario === usuario && (password === 'a201600577908' || password === '123456' || password === usuario));
    if (fbUser) {
      const token = jwt.sign(fbUser, JWT_SECRET, { expiresIn: '12h' });
      return res.json({
        message: 'Inicio de sesión exitoso (Modo Demostración)',
        token,
        user: fbUser
      });
    }

    return res.status(401).json({ error: 'Credenciales inválidas o falla de conexión a base de datos.' });
  }
}

async function getProfile(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  login,
  getProfile
};
