const express = require('express');
const router = express.Router();
const {
  getProductos, createProducto, updateProducto, deleteProducto, bulkProductos,
  getResponsables, createResponsable, updateResponsable, deleteResponsable,
  getTipoCompra, createTipoCompra, updateTipoCompra, deleteTipoCompra,
  getProveedores, createProveedor, updateProveedor, deleteProveedor, bulkProveedores
} = require('../controllers/catalogosController');

const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

const roleEncargadoPedidos = checkRole(['Encargado de pedidos']);

// Productos
router.get('/productos', verifyToken, getProductos);
router.post('/productos', verifyToken, roleEncargadoPedidos, createProducto);
router.put('/productos/:codigo', verifyToken, roleEncargadoPedidos, updateProducto);
router.delete('/productos/:codigo', verifyToken, roleEncargadoPedidos, deleteProducto);
router.post('/productos/bulk', verifyToken, roleEncargadoPedidos, bulkProductos);

// Responsables
router.get('/responsables', verifyToken, getResponsables);
router.post('/responsables', verifyToken, roleEncargadoPedidos, createResponsable);
router.put('/responsables/:id', verifyToken, roleEncargadoPedidos, updateResponsable);
router.delete('/responsables/:id', verifyToken, roleEncargadoPedidos, deleteResponsable);

// Tipo Compra
router.get('/tipocompra', verifyToken, getTipoCompra);
router.post('/tipocompra', verifyToken, roleEncargadoPedidos, createTipoCompra);
router.put('/tipocompra/:id', verifyToken, roleEncargadoPedidos, updateTipoCompra);
router.delete('/tipocompra/:id', verifyToken, roleEncargadoPedidos, deleteTipoCompra);

// Proveedores
router.get('/proveedores', verifyToken, getProveedores);
router.post('/proveedores', verifyToken, roleEncargadoPedidos, createProveedor);
router.put('/proveedores/:nit', verifyToken, roleEncargadoPedidos, updateProveedor);
router.delete('/proveedores/:nit', verifyToken, roleEncargadoPedidos, deleteProveedor);
router.post('/proveedores/bulk', verifyToken, roleEncargadoPedidos, bulkProveedores);

module.exports = router;
