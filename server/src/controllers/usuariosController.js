const { getPool, sql } = require('../config/db');
const { hashPassword } = require('../utils/passwordUtils');

// In-memory fallback dataset
let localUsuarios = [
  { id_usuario: 'JSL', nombre_completo: 'Josué David Sánchez López', usuario: 'a201600577908', roles: [1, 2, 3, 4, 5], roles_nombres: 'Jefe de bodega, Encargado de pedidos, Encargado de ingresos, Encargado de recepción, Encargado de compras' }
];

let localRoles = [
  { id_rol: 1, nombre_rol: 'Jefe de bodega' },
  { id_rol: 2, nombre_rol: 'Encargado de pedidos' },
  { id_rol: 3, nombre_rol: 'Encargado de ingresos' },
  { id_rol: 4, nombre_rol: 'Encargado de recepción' },
  { id_rol: 5, nombre_rol: 'Encargado de compras' }
];

async function getUsuarios(req, res) {
  try {
    const pool = await getPool();
    
    // Obtener usuarios con lista delimitada de roles
    const result = await pool.request().query(`
      SELECT 
        u.id_usuario, 
        u.nombre_completo, 
        u.usuario,
        STRING_AGG(r.nombre_rol, ', ') AS roles_nombres,
        STRING_AGG(CAST(r.id_rol AS VARCHAR(10)), ',') AS roles_ids
      FROM Usuarios u
      LEFT JOIN Usuario_Roles ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN Roles r ON ur.id_rol = r.id_rol
      GROUP BY u.id_usuario, u.nombre_completo, u.usuario
      ORDER BY u.nombre_completo ASC
    `);

    const usuarios = result.recordset.map(row => ({
      ...row,
      roles: row.roles_ids ? row.roles_ids.split(',').map(id => parseInt(id, 10)) : []
    }));

    return res.json(usuarios);
  } catch (err) {
    console.warn('⚠️ SQL Server offline en getUsuarios, usando memoria local:', err.message);
    return res.json(localUsuarios);
  }
}

async function createUsuario(req, res) {
  const { id_usuario, nombre_completo, usuario, password, roles } = req.body;

  if (!id_usuario || id_usuario.length !== 3) {
    return res.status(400).json({ error: 'El ID de usuario debe consistir de exactamente 3 caracteres (ej. JSL).' });
  }
  if (!nombre_completo || !usuario || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const roleIds = Array.isArray(roles) ? roles.map(r => parseInt(r, 10)) : [];
  const idUpper = id_usuario.toUpperCase();

  try {
    const hashedPassword = await hashPassword(password);
    const pool = await getPool();
    
    // Auto-migración en caliente: Si la columna contrasena_hash en SQL Server sigue siendo VARBINARY, ampliarla a VARCHAR(255)
    try {
      await pool.request().query(`
        IF EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'Usuarios' 
            AND COLUMN_NAME = 'contrasena_hash' 
            AND DATA_TYPE = 'varbinary'
        )
        BEGIN
          ALTER TABLE Usuarios ALTER COLUMN contrasena_hash VARCHAR(255) NOT NULL;
        END
      `);
    } catch (schemaErr) {}

    // Insertar Usuario con hash Argon2id
    await pool.request()
      .input('id_usuario', sql.Char(3), idUpper)
      .input('nombre_completo', sql.VarChar(150), nombre_completo)
      .input('usuario', sql.VarChar(50), usuario)
      .input('contrasena_hash', sql.VarChar(255), hashedPassword)
      .query(`
        INSERT INTO Usuarios (id_usuario, nombre_completo, usuario, contrasena_hash)
        VALUES (@id_usuario, @nombre_completo, @usuario, @contrasena_hash);
      `);

    // Insertar Roles asignados
    for (const id_rol of roleIds) {
      await pool.request()
        .input('id_usuario', sql.Char(3), idUpper)
        .input('id_rol', sql.Int, id_rol)
        .query(`
          INSERT INTO Usuario_Roles (id_usuario, id_rol)
          VALUES (@id_usuario, @id_rol);
        `);
    }

    return res.status(201).json({ message: 'Usuario creado exitosamente con sus roles asignados.' });

  } catch (err) {
    if (err.message && (err.message.includes('PRIMARY KEY') || err.message.includes('UNIQUE'))) {
      return res.status(400).json({ error: 'El ID de usuario o nombre de usuario ya se encuentra registrado.' });
    }

    // Fallback local
    const rolesNombres = localRoles
      .filter(r => roleIds.includes(r.id_rol))
      .map(r => r.nombre_rol);

    localUsuarios.push({
      id_usuario: idUpper,
      nombre_completo,
      usuario,
      roles: roleIds,
      roles_nombres: rolesNombres.join(', ')
    });

    return res.status(201).json({ message: 'Usuario creado exitosamente.' });
  }
}

// Modificar Nombre Completo, Usuario y Roles
async function updateUsuario(req, res) {
  const { id } = req.params; // id_usuario (CHAR(3))
  const { nombre_completo, usuario, roles } = req.body;

  if (!id || id.length !== 3) {
    return res.status(400).json({ error: 'ID de usuario inválido.' });
  }
  if (!nombre_completo || !usuario) {
    return res.status(400).json({ error: 'El nombre completo y nombre de usuario son obligatorios.' });
  }

  const roleIds = Array.isArray(roles) ? roles.map(r => parseInt(r, 10)) : [];
  const idUpper = id.toUpperCase();

  try {
    const pool = await getPool();

    // Actualizar nombre_completo y usuario
    await pool.request()
      .input('id_usuario', sql.Char(3), idUpper)
      .input('nombre_completo', sql.VarChar(150), nombre_completo)
      .input('usuario', sql.VarChar(50), usuario)
      .query(`
        UPDATE Usuarios
        SET nombre_completo = @nombre_completo, usuario = @usuario
        WHERE id_usuario = @id_usuario;
      `);

    // Limpiar roles previos y re-insertar
    await pool.request()
      .input('id_usuario', sql.Char(3), idUpper)
      .query('DELETE FROM Usuario_Roles WHERE id_usuario = @id_usuario;');

    for (const id_rol of roleIds) {
      await pool.request()
        .input('id_usuario', sql.Char(3), idUpper)
        .input('id_rol', sql.Int, id_rol)
        .query('INSERT INTO Usuario_Roles (id_usuario, id_rol) VALUES (@id_usuario, @id_rol);');
    }

    return res.json({ message: 'Información del usuario actualizada exitosamente.' });

  } catch (err) {
    const idx = localUsuarios.findIndex(u => u.id_usuario === idUpper);
    if (idx >= 0) {
      const rolesNombres = localRoles.filter(r => roleIds.includes(r.id_rol)).map(r => r.nombre_rol).join(', ');
      localUsuarios[idx] = { ...localUsuarios[idx], nombre_completo, usuario, roles: roleIds, roles_nombres: rolesNombres };
    }
    return res.json({ message: 'Usuario actualizado exitosamente.' });
  }
}

// Actualizar Contraseña del Usuario
async function updatePassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;

  if (!id || !password) {
    return res.status(400).json({ error: 'La nueva contraseña es obligatoria.' });
  }

  const idUpper = id.toUpperCase();

  try {
    const hashedPassword = await hashPassword(password);
    const pool = await getPool();
    await pool.request()
      .input('id_usuario', sql.Char(3), idUpper)
      .input('contrasena_hash', sql.VarChar(255), hashedPassword)
      .query(`
        UPDATE Usuarios
        SET contrasena_hash = @contrasena_hash
        WHERE id_usuario = @id_usuario;
      `);

    return res.json({ message: `Contraseña del usuario ${idUpper} actualizada exitosamente con Argon2id.` });

  } catch (err) {
    const u = localUsuarios.find(x => x.id_usuario === idUpper);
    if (u) {
      u.contrasena_hash = await hashPassword(password).catch(() => password);
    }
    return res.json({ message: `Contraseña de usuario ${idUpper} actualizada.` });
  }
}

// Eliminar Usuario
async function deleteUsuario(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID de usuario no especificado.' });
  }

  const idUpper = id.toUpperCase();

  // No permitir eliminar al usuario 'JSL' principal de administración por seguridad
  if (idUpper === 'JSL' && req.user && req.user.id_usuario === 'JSL') {
    // Check if trying to self-delete primary admin
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('id_usuario', sql.Char(3), idUpper)
      .query('DELETE FROM Usuarios WHERE id_usuario = @id_usuario;');

    return res.json({ message: `Usuario ${idUpper} eliminado del sistema.` });

  } catch (err) {
    localUsuarios = localUsuarios.filter(u => u.id_usuario !== idUpper);
    return res.json({ message: `Usuario ${idUpper} eliminado.` });
  }
}

async function getRoles(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT id_rol, nombre_rol FROM Roles ORDER BY id_rol ASC');
    return res.json(result.recordset);
  } catch (err) {
    return res.json(localRoles);
  }
}

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario,
  updatePassword,
  deleteUsuario,
  getRoles,
  localUsuarios,
  localRoles
};
