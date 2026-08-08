const express = require('express');
const router = express.Router();
const {
  getOrdenesCompra, createOrdenCompra, updateOrdenCompra, deleteOrdenCompra, bulkOrdenesCompra,
  getEntregaOrdenes, registrarEntregaOrden, registrarRecepcionOrden, eliminarEntregaOrden, eliminarRecepcionOrden,
  getEntregaExpedientes, registrarEntregaExpediente, eliminarEntregaExpediente,
  getRecepcionesCompra, registrarRecepcionCompra, updateRecepcionCompra, deleteRecepcionCompra
} = require('../controllers/comprasController');

const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// 1. Ordenes de Compra
router.get('/ordenes', verifyToken, checkRole([
  'Encargado de pedidos', 'Encargado de compras', 'Jefe de bodega', 'Encargado de ingresos', 'Encargado de recepción'
]), getOrdenesCompra);

router.post('/ordenes', verifyToken, checkRole([
  'Encargado de pedidos', 'Encargado de compras'
]), createOrdenCompra);

router.put('/ordenes/:id', verifyToken, checkRole([
  'Encargado de pedidos', 'Encargado de compras'
]), updateOrdenCompra);

router.delete('/ordenes/:id', verifyToken, checkRole([
  'Encargado de pedidos', 'Encargado de compras'
]), deleteOrdenCompra);

router.post('/ordenes/bulk', verifyToken, checkRole([
  'Encargado de pedidos', 'Encargado de compras'
]), bulkOrdenesCompra);

// 2. Entrega y Recepción de Orden de Compra
router.get('/entrega-orden', verifyToken, checkRole([
  'Encargado de pedidos', 'Jefe de bodega', 'Encargado de ingresos', 'Encargado de recepción'
]), getEntregaOrdenes);

router.post('/entrega-orden', verifyToken, checkRole([
  'Encargado de pedidos'
]), registrarEntregaOrden);

router.post('/recepcion-orden', verifyToken, checkRole([
  'Encargado de ingresos'
]), registrarRecepcionOrden);

router.delete('/entrega-orden/:id/entrega', verifyToken, checkRole([
  'Jefe de bodega'
]), eliminarEntregaOrden);

router.delete('/entrega-orden/:id/recepcion', verifyToken, checkRole([
  'Jefe de bodega'
]), eliminarRecepcionOrden);

// 3. Entrega Expediente
router.get('/entrega-expediente', verifyToken, checkRole([
  'Encargado de pedidos', 'Jefe de bodega', 'Encargado de ingresos', 'Encargado de recepción'
]), getEntregaExpedientes);

router.post('/entrega-expediente', verifyToken, checkRole([
  'Encargado de pedidos'
]), registrarEntregaExpediente);

router.delete('/entrega-expediente/:id', verifyToken, checkRole([
  'Jefe de bodega'
]), eliminarEntregaExpediente);

// 4. Recepción de Compra
router.get('/recepcion-compra', verifyToken, checkRole([
  'Encargado de pedidos', 'Encargado de ingresos', 'Encargado de recepción', 'Jefe de bodega', 'Encargado de compras'
]), getRecepcionesCompra);

router.post('/recepcion-compra', verifyToken, checkRole([
  'Encargado de pedidos', 'Encargado de ingresos', 'Encargado de recepción'
]), registrarRecepcionCompra);

router.put('/recepcion-compra/:id', verifyToken, checkRole([
  'Encargado de pedidos', 'Encargado de ingresos', 'Encargado de recepción', 'Jefe de bodega'
]), updateRecepcionCompra);

router.delete('/recepcion-compra/:id', verifyToken, checkRole([
  'Encargado de pedidos', 'Encargado de ingresos', 'Jefe de bodega'
]), deleteRecepcionCompra);

module.exports = router;
