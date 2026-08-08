const { getPool, sql } = require('../config/db');
const { parseToSQLDate, formatDisplayDate } = require('../utils/dateUtils');
const { localProductos, localResponsables } = require('./catalogosController');

// Local fallback memory store for Pedidos
let localPedidos = [
  { numero_pedido: 1000, fecha_pedido: '2026-07-21', codigo: '7', descripcion_producto: 'Clindamicina clorhidrato Cápsula 300 mg', renglon: '266', cantidad: 10000, justificacion: 'Segunda Programación Cuatrimestral de Compras 2026', id_responsable: 'SHN', nombre_responsable: 'Sheny Magaly' },
  { numero_pedido: 1005, fecha_pedido: '2026-07-21', codigo: '354', descripcion_producto: 'Metformina Tableta de liberación prolongada 1000 mg', renglon: '266', cantidad: 1200, justificacion: 'Segunda Programación Cuatrimestral de Compras 2026', id_responsable: 'ANA', nombre_responsable: 'Ana Luisa' },
  { numero_pedido: 1006, fecha_pedido: '2026-07-21', codigo: '7', descripcion_producto: 'Clindamicina clorhidrato Cápsula 300 mg', renglon: '266', cantidad: 200, justificacion: 'Segunda Programación Cuatrimestral de Compras 2026', id_responsable: 'DEN', nombre_responsable: 'Dennise Orozco' },
  { numero_pedido: 1007, fecha_pedido: '2026-07-21', codigo: '599', descripcion_producto: 'Hierro aminoquelado + ácido fólico Tableta 30 mg + 250-300 mcg', renglon: '266', cantidad: 11200, justificacion: 'Segunda Programación Cuatrimestral de Compras 2026', id_responsable: 'MAB', nombre_responsable: 'Maby Soc' }
];

async function getPedidos(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        p.numero_pedido,
        p.fecha_pedido,
        p.codigo,
        pr.descripcion AS descripcion_producto,
        pr.renglon,
        p.cantidad,
        p.justificacion,
        RTRIM(LTRIM(pc.id_responsable)) AS id_responsable,
        ISNULL(r.nombre_completo, 'Pendiente') AS nombre_responsable
      FROM Pedidos p
      LEFT JOIN Productos pr ON p.codigo = pr.codigo
      LEFT JOIN ProcesoCompra pc ON p.numero_pedido = pc.numero_pedido
      LEFT JOIN Responsables r ON pc.id_responsable = r.id_responsable
      ORDER BY p.numero_pedido ASC
    `);

    const formattedRows = result.recordset.map(row => ({
      ...row,
      id_responsable: row.id_responsable ? String(row.id_responsable).trim() : null,
      fecha_pedido_display: formatDisplayDate(row.fecha_pedido)
    }));

    return res.json(formattedRows);

  } catch (err) {
    const formattedLocal = localPedidos.map(p => ({
      ...p,
      fecha_pedido_display: formatDisplayDate(p.fecha_pedido)
    }));
    return res.json(formattedLocal);
  }
}

async function bulkPedidos(req, res) {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La lista de pedidos recibida es inválida.' });
  }

  let count = 0;
  try {
    const pool = await getPool();
    for (const item of items) {
      if (!item.numero_pedido || !item.codigo || !item.cantidad) continue;
      
      const sqlDate = parseToSQLDate(item.fecha_pedido);

      await pool.request()
        .input('numero_pedido', sql.Int, parseInt(item.numero_pedido, 10))
        .input('fecha_pedido', sql.VarChar(10), sqlDate)
        .input('codigo', sql.VarChar(50), String(item.codigo))
        .input('cantidad', sql.Int, parseInt(item.cantidad, 10))
        .input('justificacion', sql.VarChar(500), String(item.justificacion || 'Carga Masiva Excel'))
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Pedidos WHERE numero_pedido = @numero_pedido)
            INSERT INTO Pedidos (numero_pedido, fecha_pedido, codigo, cantidad, justificacion)
            VALUES (@numero_pedido, @fecha_pedido, @codigo, @cantidad, @justificacion);
          ELSE
            UPDATE Pedidos 
            SET fecha_pedido = @fecha_pedido, codigo = @codigo, cantidad = @cantidad, justificacion = @justificacion
            WHERE numero_pedido = @numero_pedido;
        `);
      count++;
    }
    return res.json({ message: `Carga de pedidos completada: ${count} registros cargados exitosamente.` });

  } catch (err) {
    items.forEach(item => {
      const num = parseInt(item.numero_pedido, 10);
      const prod = localProductos.find(p => p.codigo === String(item.codigo));
      const idx = localPedidos.findIndex(p => p.numero_pedido === num);
      const newObj = {
        numero_pedido: num,
        fecha_pedido: parseToSQLDate(item.fecha_pedido),
        codigo: String(item.codigo),
        descripcion_producto: prod ? prod.descripcion : 'Producto Carga',
        renglon: prod ? prod.renglon : '266',
        cantidad: parseInt(item.cantidad, 10),
        justificacion: String(item.justificacion || 'Carga Masiva Excel'),
        id_responsable: null,
        nombre_responsable: 'Pendiente'
      };
      if (idx >= 0) localPedidos[idx] = newObj;
      else localPedidos.push(newObj);
    });
    return res.json({ message: `Carga masiva completada (${items.length} pedidos procesados).` });
  }
}

// Obtener solo pedidos SIN responsable asignado
async function getPedidosSinResponsable(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        p.numero_pedido,
        p.fecha_pedido,
        p.codigo,
        pr.descripcion AS descripcion_producto,
        p.cantidad
      FROM Pedidos p
      LEFT JOIN ProcesoCompra pc ON p.numero_pedido = pc.numero_pedido
      LEFT JOIN Productos pr ON p.codigo = pr.codigo
      WHERE pc.numero_pedido IS NULL
      ORDER BY p.numero_pedido ASC
    `);

    const formatted = result.recordset.map(row => ({
      ...row,
      fecha_pedido_display: formatDisplayDate(row.fecha_pedido)
    }));

    return res.json(formatted);

  } catch (err) {
    const unassigned = localPedidos
      .filter(p => !p.id_responsable || p.nombre_responsable === 'Pendiente')
      .map(p => ({
        ...p,
        fecha_pedido_display: formatDisplayDate(p.fecha_pedido)
      }));
    return res.json(unassigned);
  }
}

// Asignar responsables a lista de pedidos
async function saveAsignacionResponsable(req, res) {
  const { asignaciones } = req.body; // Array of { numero_pedido, id_responsable }
  if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
    return res.status(400).json({ error: 'No hay asignaciones para guardar.' });
  }

  try {
    const pool = await getPool();
    for (const item of asignaciones) {
      if (!item.numero_pedido || !item.id_responsable) continue;
      
      await pool.request()
        .input('numero_pedido', sql.Int, parseInt(item.numero_pedido, 10))
        .input('id_responsable', sql.Char(3), String(item.id_responsable).toUpperCase())
        .query(`
          IF EXISTS (SELECT 1 FROM ProcesoCompra WHERE numero_pedido = @numero_pedido)
            UPDATE ProcesoCompra SET id_responsable = @id_responsable WHERE numero_pedido = @numero_pedido;
          ELSE
            INSERT INTO ProcesoCompra (numero_pedido, id_responsable) VALUES (@numero_pedido, @id_responsable);
        `);
    }

    return res.json({ message: 'Asignación de responsables guardada exitosamente.' });

  } catch (err) {
    asignaciones.forEach(item => {
      const ped = localPedidos.find(p => p.numero_pedido === parseInt(item.numero_pedido, 10));
      const resp = localResponsables.find(r => r.id_responsable === String(item.id_responsable).toUpperCase());
      if (ped) {
        ped.id_responsable = String(item.id_responsable).toUpperCase();
        ped.nombre_responsable = resp ? resp.nombre_completo : item.id_responsable;
      }
    });
    return res.json({ message: 'Asignaciones guardadas (Modo Demostración).' });
  }
}

async function createPedido(req, res) {
  const { numero_pedido, fecha_pedido, codigo, cantidad, justificacion } = req.body;
  if (!numero_pedido || !codigo || !cantidad) {
    return res.status(400).json({ error: 'Número de pedido, código y cantidad son requeridos.' });
  }

  const sqlDate = parseToSQLDate(fecha_pedido || new Date().toISOString().split('T')[0]);

  try {
    const pool = await getPool();
    await pool.request()
      .input('numero_pedido', sql.Int, parseInt(numero_pedido, 10))
      .input('fecha_pedido', sql.VarChar(10), sqlDate)
      .input('codigo', sql.VarChar(50), String(codigo))
      .input('cantidad', sql.Int, parseInt(cantidad, 10))
      .input('justificacion', sql.VarChar(500), String(justificacion || 'Ingreso Manual'))
      .query(`
        INSERT INTO Pedidos (numero_pedido, fecha_pedido, codigo, cantidad, justificacion)
        VALUES (@numero_pedido, @fecha_pedido, @codigo, @cantidad, @justificacion);
      `);
    return res.status(201).json({ message: 'Pedido creado exitosamente.' });
  } catch (err) {
    if (err.message && err.message.includes('PRIMARY KEY')) {
      return res.status(400).json({ error: 'El número de pedido ya existe.' });
    }
    const num = parseInt(numero_pedido, 10);
    const prod = localProductos.find(p => p.codigo === String(codigo));
    localPedidos.push({
      numero_pedido: num,
      fecha_pedido: sqlDate,
      codigo: String(codigo),
      descripcion_producto: prod ? prod.descripcion : 'Producto',
      renglon: prod ? prod.renglon : '266',
      cantidad: parseInt(cantidad, 10),
      justificacion: String(justificacion || 'Ingreso Manual'),
      id_responsable: null,
      nombre_responsable: 'Pendiente'
    });
    return res.status(201).json({ message: 'Pedido creado.' });
  }
}

async function updatePedido(req, res) {
  const { id } = req.params;
  const { fecha_pedido, codigo, cantidad, justificacion, id_responsable } = req.body;

  if (!id || !codigo || !cantidad) {
    return res.status(400).json({ error: 'Número de pedido, código y cantidad son requeridos.' });
  }

  const sqlDate = parseToSQLDate(fecha_pedido || new Date().toISOString().split('T')[0]);
  const numPedido = parseInt(id, 10);
  const cleanResp = id_responsable ? String(id_responsable).trim().toUpperCase() : '';

  try {
    const pool = await getPool();

    // Auto-registrar producto si no existe en la BD para evitar violaciones de clave foránea
    await pool.request()
      .input('codigo', sql.VarChar(50), String(codigo))
      .input('descripcion', sql.VarChar(250), `Producto ${codigo}`)
      .input('renglon', sql.VarChar(20), '266')
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE codigo = @codigo)
          INSERT INTO Productos (codigo, descripcion, renglon) VALUES (@codigo, @descripcion, @renglon);
      `);

    await pool.request()
      .input('numero_pedido', sql.Int, numPedido)
      .input('fecha_pedido', sql.VarChar(10), sqlDate)
      .input('codigo', sql.VarChar(50), String(codigo))
      .input('cantidad', sql.Int, parseInt(cantidad, 10))
      .input('justificacion', sql.VarChar(500), String(justificacion || ''))
      .query(`
        UPDATE Pedidos
        SET fecha_pedido = @fecha_pedido,
            codigo = @codigo,
            cantidad = @cantidad,
            justificacion = @justificacion
        WHERE numero_pedido = @numero_pedido;
      `);

    if (cleanResp) {
      await pool.request()
        .input('numero_pedido', sql.Int, numPedido)
        .input('id_responsable', sql.Char(3), cleanResp)
        .query(`
          IF EXISTS (SELECT 1 FROM ProcesoCompra WHERE numero_pedido = @numero_pedido)
            UPDATE ProcesoCompra SET id_responsable = @id_responsable WHERE numero_pedido = @numero_pedido;
          ELSE
            INSERT INTO ProcesoCompra (numero_pedido, id_responsable) VALUES (@numero_pedido, @id_responsable);
        `);
    } else {
      await pool.request()
        .input('numero_pedido', sql.Int, numPedido)
        .query(`DELETE FROM ProcesoCompra WHERE numero_pedido = @numero_pedido;`);
    }

    return res.json({ message: 'Pedido actualizado exitosamente.' });
  } catch (err) {
    console.error('Error en updatePedido:', err);
    // Si la conexión falló completamente, usar memoria local
    const idx = localPedidos.findIndex(p => p.numero_pedido === numPedido);
    const prod = localProductos.find(p => p.codigo === String(codigo));
    const resp = localResponsables.find(r => r.id_responsable === cleanResp);
    if (idx >= 0) {
      localPedidos[idx].fecha_pedido = sqlDate;
      localPedidos[idx].codigo = String(codigo);
      if (prod) {
        localPedidos[idx].descripcion_producto = prod.descripcion;
        localPedidos[idx].renglon = prod.renglon;
      }
      localPedidos[idx].cantidad = parseInt(cantidad, 10);
      localPedidos[idx].justificacion = String(justificacion || '');
      localPedidos[idx].id_responsable = cleanResp || null;
      localPedidos[idx].nombre_responsable = resp ? resp.nombre_completo : (cleanResp || 'Pendiente');
      return res.json({ message: 'Pedido actualizado (Modo Demostración).' });
    }
    return res.status(500).json({ error: 'No se pudo actualizar el pedido: ' + err.message });
  }
}

async function deletePedido(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Número de pedido es requerido.' });
  }

  try {
    const pool = await getPool();
    const num = parseInt(id, 10);

    await pool.request().input('num', sql.Int, num).query('DELETE FROM ProcesoCompra WHERE numero_pedido = @num;');
    await pool.request().input('num', sql.Int, num).query('DELETE FROM Pedidos WHERE numero_pedido = @num;');

    return res.json({ message: `Pedido No. ${id} eliminado exitosamente.` });
  } catch (err) {
    const num = parseInt(id, 10);
    localPedidos = localPedidos.filter(p => p.numero_pedido !== num);
    return res.json({ message: `Pedido No. ${id} eliminado.` });
  }
}

module.exports = {
  getPedidos,
  createPedido,
  updatePedido,
  deletePedido,
  bulkPedidos,
  getPedidosSinResponsable,
  saveAsignacionResponsable,
  localPedidos
};
