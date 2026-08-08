const express = require('express');
const router = express.Router();
const {
  getPedidos, createPedido, updatePedido, deletePedido, bulkPedidos, getPedidosSinResponsable, saveAsignacionResponsable
} = require('../controllers/pedidosController');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Roles autorizados a consultar pedidos
const rolesConsultaPedidos = checkRole([
  'Encargado de pedidos',
  'Jefe de bodega',
  'Encargado de ingresos',
  'Encargado de recepción',
  'Encargado de compras'
]);

// Solo Encargado de pedidos para modificaciones
const roleEncargadoPedidos = checkRole(['Encargado de pedidos']);

// Asignación de responsable (Rutas específicas antes de parámetros :id)
router.get('/sin-responsable', verifyToken, roleEncargadoPedidos, getPedidosSinResponsable);
router.post('/asignar', verifyToken, roleEncargadoPedidos, saveAsignacionResponsable);
router.post('/asignar-responsable', verifyToken, roleEncargadoPedidos, saveAsignacionResponsable);

router.get('/', verifyToken, rolesConsultaPedidos, getPedidos);
router.post('/', verifyToken, roleEncargadoPedidos, createPedido);
router.post('/bulk', verifyToken, roleEncargadoPedidos, bulkPedidos);
router.put('/:id', verifyToken, roleEncargadoPedidos, updatePedido);
router.delete('/:id', verifyToken, roleEncargadoPedidos, deletePedido);

module.exports = router;
