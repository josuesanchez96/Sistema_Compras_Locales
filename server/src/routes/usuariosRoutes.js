const express = require('express');
const router = express.Router();
const {
  getUsuarios,
  createUsuario,
  updateUsuario,
  updatePassword,
  deleteUsuario,
  getRoles
} = require('../controllers/usuariosController');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

const roleJefeBodega = checkRole(['Jefe de bodega']);

router.get('/roles', verifyToken, getRoles);
router.get('/', verifyToken, roleJefeBodega, getUsuarios);
router.post('/', verifyToken, roleJefeBodega, createUsuario);
router.put('/:id', verifyToken, roleJefeBodega, updateUsuario);
router.put('/:id/password', verifyToken, roleJefeBodega, updatePassword);
router.delete('/:id', verifyToken, roleJefeBodega, deleteUsuario);

module.exports = router;
