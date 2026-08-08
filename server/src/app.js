const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const catalogosRoutes = require('./routes/catalogosRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const comprasRoutes = require('./routes/comprasRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, '../../client')));

// Montar Rutas API REST
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no capturado:', err);
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

module.exports = app;
