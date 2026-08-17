const sql = require('mssql');
require('dotenv').config();

const isTrusted = process.env.DB_TRUSTED_CONNECTION === 'true';
const serverName = process.env.DB_SERVER || 'localhost';
const databaseName = process.env.DB_NAME || 'bd_compras_locales';

let config;
let sqlDriver = sql;

if (isTrusted) {
  // Conexión nativa de Windows (Windows Authentication) mediante ODBC
  try {
    sqlDriver = require('mssql/msnodesqlv8');
    config = {
      connectionString: `Driver={SQL Server};Server=${serverName};Database=${databaseName};Trusted_Connection=yes;`
    };
  } catch (e) {
    config = {
      server: serverName,
      database: databaseName,
      options: { trustServerCertificate: true }
    };
  }
} else {
  // Autenticación de SQL Server (Azure SQL / Nube / Usuario y contraseña)
  config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: serverName,
    database: databaseName,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
      encrypt: process.env.DB_ENCRYPT !== 'false', // Por defecto true para Azure SQL
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true'
    }
  };
}

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sqlDriver.connect(config)
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
  sql: sqlDriver,
  getPool
};
