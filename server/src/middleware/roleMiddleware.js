/**
 * Middleware para validación de Roles de usuario (RBAC)
 * @param {Array<string>} allowedRoles Listado de nombres de roles permitidos para acceder a la ruta
 */
function checkRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'Permisos insuficientes: Usuario no autenticado o sin roles asignados.' });
    }

    if (allowedRoles.length === 0 || allowedRoles.includes('*')) {
      return next();
    }

    const userRoles = req.user.roles || [];
    const hasPermission = userRoles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ 
        error: `Acceso restringido. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}.` 
      });
    }

    next();
  };
}

module.exports = {
  checkRole
};
