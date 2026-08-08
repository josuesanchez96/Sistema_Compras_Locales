const { getPool } = require('./src/config/db');

async function testUsuarios() {
  try {
    const pool = await getPool();
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

    console.log('--- USUARIOS Y SUS ROLES RECUPERADOS ---');
    console.dir(usuarios, { depth: null });
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

testUsuarios();
