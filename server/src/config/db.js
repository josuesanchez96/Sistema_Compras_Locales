const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const isTrusted = process.env.DB_TRUSTED_CONNECTION === 'true';
const serverName = process.env.DB_SERVER || 'localhost';
const databaseName = process.env.DB_NAME || 'SistemaComprasLocales';

let config;

if (isTrusted) {
  // Conexión nativa de Windows (Windows Authentication) mediante ODBC
  config = {
    connectionString: `Driver={SQL Server};Server=${serverName};Database=${databaseName};Trusted_Connection=yes;`
  };
} else {
  // Autenticación de SQL Server con usuario y contraseña
  config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'TuPasswordSeguro123!',
    server: serverName,
    database: databaseName,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: true
    }
  };
}

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config)
      .then(pool => {
        console.log(`✅ Conexión establecida exitosamente con SQL Server (${databaseName})`);
        return pool;
      })
      .catch(err => {
        console.warn('⚠️ Error al conectar con SQL Server:', err.message || err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

module.exports = {
  sql,
  getPool
};
