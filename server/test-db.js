const { getPool } = require('./src/config/db');

async function verify() {
  try {
    const pool = await getPool();
    const res = await pool.request().query('SELECT id_usuario, nombre_completo, usuario FROM Usuarios');
    console.log('✅ CONEXIÓN EXITOSA A SQL SERVER REAL!');
    console.log('Usuarios en la base de datos real SQL Server:', res.recordset);
    process.exit(0);
  } catch (e) {
    console.error('❌ ERROR:', e);
    process.exit(1);
  }
}

verify();
