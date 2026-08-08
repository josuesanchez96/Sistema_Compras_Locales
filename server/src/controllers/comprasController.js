const { getPool, sql } = require('../config/db');
const { parseToSQLDate, formatDisplayDate, formatDisplayDateTime, getTodaySQLDate, getNowSQLDateTime } = require('../utils/dateUtils');
const { localPedidos } = require('./pedidosController');
const { localProveedores } = require('./catalogosController');

// Local fallback memory stores
let localOrdenesCompra = [
  {
    numero_orden_compra: '123123',
    numero_pedido: 1000,
    id_tipo_compra: 'BC',
    nombre_tipo: 'Baja Cuantía',
    fecha_orden: '2026-07-20',
    fecha_notificacion: '2026-07-21',
    fecha_vencimiento: '2026-07-31',
    descripcion_producto: 'Clindamicina clorhidrato Cápsula 300 mg',
    cantidad: 10000
  }
];

let localEntregaOrdenCompra = [
  {
    id_entrega: 1,
    numero_orden_compra: '123123',
    fecha_entrega: '2026-07-22',
    usuario: 'a201600577908',
    fecha_recepcion: '2026-07-23'
  }
];

let localEntregaExpediente = [
  {
    id_entrega: 1,
    numero_orden_compra: '123123',
    fecha_entrega_expediente: '2026-07-25'
  }
];

let localRecepcionCompra = [
  {
    id_recepcion_compra: 1,
    numero_orden_compra: '123123',
    fecha_ingreso: '2026-07-25',
    serie_factura: 'ABC123ABC',
    numero_factura: '22223330',
    nit: '2342855',
    nombre_proveedor: 'Instituto Guatemalteco de Seguridad Social',
    precio_unitario: 0.50
  }
];

// --- 1. REGISTRAR ORDEN DE COMPRA ---
async function getOrdenesCompra(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        oc.numero_orden_compra,
        oc.numero_pedido,
        p.fecha_pedido,
        p.codigo,
        pr.descripcion AS descripcion_producto,
        p.cantidad,
        oc.id_tipo_compra,
        tc.nombre_tipo,
        oc.fecha_orden,
        oc.fecha_notificacion,
        oc.fecha_vencimiento
      FROM OrdenCompra oc
      LEFT JOIN Pedidos p ON oc.numero_pedido = p.numero_pedido
      LEFT JOIN Productos pr ON p.codigo = pr.codigo
      LEFT JOIN TipoCompra tc ON oc.id_tipo_compra = tc.id_tipo_compra
      ORDER BY oc.numero_orden_compra ASC
    `);

    const formatted = result.recordset.map(row => ({
      ...row,
      numero_orden_compra: String(row.numero_orden_compra).trim(),
      id_tipo_compra: row.id_tipo_compra ? String(row.id_tipo_compra).trim() : null,
      fecha_pedido_display: formatDisplayDate(row.fecha_pedido),
      fecha_orden_display: formatDisplayDate(row.fecha_orden),
      fecha_notificacion_display: formatDisplayDate(row.fecha_notificacion),
      fecha_vencimiento_display: formatDisplayDate(row.fecha_vencimiento)
    }));

    return res.json(formatted);

  } catch (err) {
    const formattedLocal = localOrdenesCompra.map(oc => {
      const ped = localPedidos.find(p => p.numero_pedido === oc.numero_pedido);
      return {
        ...oc,
        fecha_pedido: ped ? ped.fecha_pedido : null,
        codigo: ped ? ped.codigo : '',
        descripcion_producto: oc.descripcion_producto || (ped ? ped.descripcion_producto : ''),
        cantidad: oc.cantidad || (ped ? ped.cantidad : 0),
        fecha_pedido_display: formatDisplayDate(ped ? ped.fecha_pedido : null),
        fecha_orden_display: formatDisplayDate(oc.fecha_orden),
        fecha_notificacion_display: formatDisplayDate(oc.fecha_notificacion),
        fecha_vencimiento_display: formatDisplayDate(oc.fecha_vencimiento)
      };
    });
    return res.json(formattedLocal);
  }
}

async function createOrdenCompra(req, res) {
  const { numero_orden_compra, numero_pedido, id_tipo_compra, fecha_orden, fecha_notificacion, fecha_vencimiento } = req.body;

  if (!numero_orden_compra || !numero_pedido) {
    return res.status(400).json({ error: 'Número de orden de compra y número de pedido son requeridos.' });
  }

  const numOC = String(numero_orden_compra).trim();
  const numPed = parseInt(numero_pedido, 10);
  const fOrden = parseToSQLDate(fecha_orden);
  const fNotif = parseToSQLDate(fecha_notificacion);
  const fVenc = parseToSQLDate(fecha_vencimiento);
  const cleanTipo = id_tipo_compra ? String(id_tipo_compra).trim().toUpperCase() : null;

  try {
    const pool = await getPool();
    await pool.request()
      .input('numero_orden_compra', sql.Char(10), numOC)
      .input('numero_pedido', sql.Int, numPed)
      .input('id_tipo_compra', sql.Char(3), cleanTipo)
      .input('fecha_orden', sql.VarChar(10), fOrden)
      .input('fecha_notificacion', sql.VarChar(10), fNotif)
      .input('fecha_vencimiento', sql.VarChar(10), fVenc)
      .query(`
        INSERT INTO OrdenCompra (numero_orden_compra, numero_pedido, id_tipo_compra, fecha_orden, fecha_notificacion, fecha_vencimiento)
        VALUES (@numero_orden_compra, @numero_pedido, @id_tipo_compra, @fecha_orden, @fecha_notificacion, @fecha_vencimiento);
      `);
    return res.status(201).json({ message: 'Orden de compra registrada exitosamente.' });
  } catch (err) {
    if (err.message && err.message.includes('PRIMARY KEY')) {
      return res.status(400).json({ error: 'El número de orden de compra ya existe.' });
    }
    if (err.message && err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ error: 'El número de pedido o tipo de compra ingresado no existe.' });
    }
    const ped = localPedidos.find(p => p.numero_pedido === numPed);
    localOrdenesCompra.push({
      numero_orden_compra: numOC,
      numero_pedido: numPed,
      id_tipo_compra: cleanTipo,
      nombre_tipo: cleanTipo || 'Compra',
      fecha_orden: fOrden,
      fecha_notificacion: fNotif,
      fecha_vencimiento: fVenc,
      descripcion_producto: ped ? ped.descripcion_producto : 'Producto',
      cantidad: ped ? ped.cantidad : 0
    });
    return res.status(201).json({ message: 'Orden de compra registrada.' });
  }
}

async function updateOrdenCompra(req, res) {
  const { id } = req.params;
  const { numero_pedido, id_tipo_compra, fecha_orden, fecha_notificacion, fecha_vencimiento } = req.body;

  if (!id || !numero_pedido) {
    return res.status(400).json({ error: 'Número de orden de compra y número de pedido son requeridos.' });
  }

  const numOC = String(id).trim();
  const numPed = parseInt(numero_pedido, 10);
  const fOrden = parseToSQLDate(fecha_orden);
  const fNotif = parseToSQLDate(fecha_notificacion);
  const fVenc = parseToSQLDate(fecha_vencimiento);
  const cleanTipo = id_tipo_compra ? String(id_tipo_compra).trim().toUpperCase() : null;

  try {
    const pool = await getPool();
    await pool.request()
      .input('numero_orden_compra', sql.Char(10), numOC)
      .input('numero_pedido', sql.Int, numPed)
      .input('id_tipo_compra', sql.Char(3), cleanTipo)
      .input('fecha_orden', sql.VarChar(10), fOrden)
      .input('fecha_notificacion', sql.VarChar(10), fNotif)
      .input('fecha_vencimiento', sql.VarChar(10), fVenc)
      .query(`
        UPDATE OrdenCompra
        SET numero_pedido = @numero_pedido,
            id_tipo_compra = @id_tipo_compra,
            fecha_orden = @fecha_orden,
            fecha_notificacion = @fecha_notificacion,
            fecha_vencimiento = @fecha_vencimiento
        WHERE numero_orden_compra = @numero_orden_compra;
      `);
    return res.json({ message: 'Orden de compra actualizada exitosamente.' });
  } catch (err) {
    if (err.message && err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ error: 'El número de pedido o tipo de compra ingresado no existe.' });
    }
    const idx = localOrdenesCompra.findIndex(o => o.numero_orden_compra === numOC);
    const ped = localPedidos.find(p => p.numero_pedido === numPed);
    if (idx >= 0) {
      localOrdenesCompra[idx].numero_pedido = numPed;
      localOrdenesCompra[idx].id_tipo_compra = cleanTipo;
      localOrdenesCompra[idx].fecha_orden = fOrden;
      localOrdenesCompra[idx].fecha_notificacion = fNotif;
      localOrdenesCompra[idx].fecha_vencimiento = fVenc;
      if (ped) {
        localOrdenesCompra[idx].descripcion_producto = ped.descripcion_producto;
        localOrdenesCompra[idx].cantidad = ped.cantidad;
      }
    }
    return res.json({ message: 'Orden de compra actualizada.' });
  }
}

async function deleteOrdenCompra(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Número de orden de compra es requerido.' });
  }

  const numOC = String(id).trim();

  try {
    const pool = await getPool();
    await pool.request().input('numOC', sql.Char(10), numOC).query('DELETE FROM EntregaOrdenCompra WHERE numero_orden_compra = @numOC;');
    await pool.request().input('numOC', sql.Char(10), numOC).query('DELETE FROM EntregaExpediente WHERE numero_orden_compra = @numOC;');
    await pool.request().input('numOC', sql.Char(10), numOC).query('DELETE FROM RecepcionCompra WHERE numero_orden_compra = @numOC;');
    await pool.request().input('numOC', sql.Char(10), numOC).query('DELETE FROM OrdenCompra WHERE numero_orden_compra = @numOC;');

    return res.json({ message: `Orden de compra ${numOC} eliminada exitosamente.` });
  } catch (err) {
    if (err.message && (err.message.includes('REFERENCE constraint') || err.message.includes('FOREIGN KEY'))) {
      return res.status(400).json({ error: 'No se puede eliminar la orden de compra porque tiene recepciones o entregas asociadas.' });
    }
    localOrdenesCompra = localOrdenesCompra.filter(o => o.numero_orden_compra !== numOC);
    return res.json({ message: `Orden de compra ${numOC} eliminada.` });
  }
}

async function bulkOrdenesCompra(req, res) {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Lista de órdenes de compra inválida.' });
  }

  let count = 0;
  try {
    const pool = await getPool();
    for (const item of items) {
      if (!item.numero_orden_compra || !item.numero_pedido) continue;

      const fOrden = parseToSQLDate(item.fecha_orden);
      const fNotif = parseToSQLDate(item.fecha_notificacion);
      const fVenc = parseToSQLDate(item.fecha_vencimiento);

      await pool.request()
        .input('numero_orden_compra', sql.Char(10), String(item.numero_orden_compra).trim())
        .input('numero_pedido', sql.Int, parseInt(item.numero_pedido, 10))
        .input('id_tipo_compra', sql.Char(3), String(item.id_tipo_compra || 'CD').toUpperCase())
        .input('fecha_orden', sql.VarChar(10), fOrden)
        .input('fecha_notificacion', sql.VarChar(10), fNotif)
        .input('fecha_vencimiento', sql.VarChar(10), fVenc)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM OrdenCompra WHERE numero_orden_compra = @numero_orden_compra)
            INSERT INTO OrdenCompra (numero_orden_compra, numero_pedido, id_tipo_compra, fecha_orden, fecha_notificacion, fecha_vencimiento)
            VALUES (@numero_orden_compra, @numero_pedido, @id_tipo_compra, @fecha_orden, @fecha_notificacion, @fecha_vencimiento);
          ELSE
            UPDATE OrdenCompra 
            SET numero_pedido = @numero_pedido, id_tipo_compra = @id_tipo_compra, fecha_orden = @fecha_orden, fecha_notificacion = @fecha_notificacion, fecha_vencimiento = @fecha_vencimiento
            WHERE numero_orden_compra = @numero_orden_compra;
        `);
      count++;
    }
    return res.json({ message: `Carga de órdenes de compra completada: ${count} registros.` });

  } catch (err) {
    items.forEach(item => {
      const numOC = String(item.numero_orden_compra).trim();
      const numPed = parseInt(item.numero_pedido, 10);
      const ped = localPedidos.find(p => p.numero_pedido === numPed);
      const idx = localOrdenesCompra.findIndex(o => o.numero_orden_compra === numOC);
      const newObj = {
        numero_orden_compra: numOC,
        numero_pedido: numPed,
        id_tipo_compra: String(item.id_tipo_compra || 'CD').toUpperCase(),
        nombre_tipo: 'Compra',
        fecha_orden: parseToSQLDate(item.fecha_orden),
        fecha_notificacion: parseToSQLDate(item.fecha_notificacion),
        fecha_vencimiento: parseToSQLDate(item.fecha_vencimiento),
        descripcion_producto: ped ? ped.descripcion_producto : 'Producto',
        cantidad: ped ? ped.cantidad : 0
      };
      if (idx >= 0) localOrdenesCompra[idx] = newObj;
      else localOrdenesCompra.push(newObj);
    });
    return res.json({ message: `Carga masiva de órdenes completada (${items.length} procesadas).` });
  }
}

// --- 2. ENTREGA ORDEN DE COMPRA ---
async function getEntregaOrdenes(req, res) {
  try {
    const pool = await getPool();
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='usuario_entrego')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ADD usuario_entrego VARCHAR(50);
        END
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='usuario_entrega')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ADD usuario_entrega VARCHAR(50);
        END
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='usuario_recepcion')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ADD usuario_recepcion VARCHAR(50);
        END
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='usuario')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ADD usuario VARCHAR(50);
        END
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='fecha_entrega')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ALTER COLUMN fecha_entrega DATETIME2 NULL;
        END
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='fecha_recepcion')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ALTER COLUMN fecha_recepcion DATETIME2 NULL;
        END
      `);
    } catch (e) {}

    const result = await pool.request().query(`
      SELECT 
        oc.numero_orden_compra,
        oc.numero_pedido,
        p.fecha_pedido,
        pr.descripcion AS descripcion_producto,
        p.cantidad,
        oc.fecha_orden,
        e.id_entrega,
        e.fecha_entrega,
        COALESCE(e.usuario_entrega, e.usuario_entrego) AS usuario_entrego,
        ISNULL(u_entrego.nombre_completo, COALESCE(e.usuario_entrega, e.usuario_entrego)) AS nombre_usuario_entrego,
        COALESCE(e.usuario_recepcion, e.usuario) AS usuario,
        ISNULL(u_recibio.nombre_completo, COALESCE(e.usuario_recepcion, e.usuario)) AS nombre_usuario_recibio,
        e.fecha_recepcion
      FROM OrdenCompra oc
      LEFT JOIN Pedidos p ON oc.numero_pedido = p.numero_pedido
      LEFT JOIN Productos pr ON p.codigo = pr.codigo
      LEFT JOIN EntregaOrdenCompra e ON oc.numero_orden_compra = e.numero_orden_compra
      LEFT JOIN Usuarios u_entrego ON (RTRIM(LTRIM(COALESCE(e.usuario_entrega, e.usuario_entrego))) = RTRIM(LTRIM(u_entrego.usuario)) OR RTRIM(LTRIM(COALESCE(e.usuario_entrega, e.usuario_entrego))) = RTRIM(LTRIM(u_entrego.id_usuario)))
      LEFT JOIN Usuarios u_recibio ON (RTRIM(LTRIM(COALESCE(e.usuario_recepcion, e.usuario))) = RTRIM(LTRIM(u_recibio.usuario)) OR RTRIM(LTRIM(COALESCE(e.usuario_recepcion, e.usuario))) = RTRIM(LTRIM(u_recibio.id_usuario)))
      ORDER BY oc.numero_pedido ASC
    `);

    const formatted = result.recordset.map(row => ({
      ...row,
      numero_orden_compra: String(row.numero_orden_compra).trim(),
      usuario_entrego: row.usuario_entrego ? String(row.usuario_entrego).trim() : null,
      nombre_usuario_entrego: row.nombre_usuario_entrego ? String(row.nombre_usuario_entrego).trim() : null,
      usuario: row.usuario ? String(row.usuario).trim() : null,
      nombre_usuario_recibio: row.nombre_usuario_recibio ? String(row.nombre_usuario_recibio).trim() : null,
      fecha_pedido_display: formatDisplayDate(row.fecha_pedido),
      fecha_orden_display: formatDisplayDate(row.fecha_orden),
      fecha_entrega_display: formatDisplayDateTime(row.fecha_entrega),
      fecha_recepcion_display: formatDisplayDateTime(row.fecha_recepcion)
    }));

    return res.json(formatted);

  } catch (err) {
    const combined = localOrdenesCompra.map(oc => {
      const ped = localPedidos.find(p => p.numero_pedido === oc.numero_pedido);
      const e = localEntregaOrdenCompra.find(x => x.numero_orden_compra === oc.numero_orden_compra);
      return {
        ...oc,
        fecha_pedido: ped ? ped.fecha_pedido : null,
        fecha_pedido_display: formatDisplayDate(ped ? ped.fecha_pedido : null),
        descripcion_producto: oc.descripcion_producto || (ped ? ped.descripcion_producto : ''),
        cantidad: oc.cantidad || (ped ? ped.cantidad : 0),
        fecha_orden_display: formatDisplayDate(oc.fecha_orden),
        id_entrega: e ? e.id_entrega : null,
        fecha_entrega: e ? e.fecha_entrega : null,
        fecha_entrega_display: e ? formatDisplayDateTime(e.fecha_entrega) : null,
        usuario_entrego: e ? (e.usuario_entrega || e.usuario_entrego) : null,
        nombre_usuario_entrego: e ? ((e.usuario_entrego || e.usuario_entrego) === 'a201600577908' ? 'Josué David Sánchez López' : (e.usuario_entrego || e.usuario_entrego)) : null,
        usuario: e ? (e.usuario || e.usuario_recepcion) : null,
        nombre_usuario_recibio: e ? ((e.usuario || e.usuario_recepcion) === 'a12345678' ? 'Oscar Odilio López Cobox' : (e.usuario || e.usuario_recepcion)) : null,
        fecha_recepcion: e ? e.fecha_recepcion : null,
        fecha_recepcion_display: e ? formatDisplayDateTime(e.fecha_recepcion) : null
      };
    });
    return res.json(combined);
  }
}

async function registrarEntregaOrden(req, res) {
  const { numero_orden_compra } = req.body;
  if (!numero_orden_compra) {
    return res.status(400).json({ error: 'Número de orden de compra es obligatorio.' });
  }

  const currentUser = req.user ? req.user.usuario : 'a201600577908';
  const now = new Date();

  try {
    const pool = await getPool();
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='usuario_entrego')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ADD usuario_entrego VARCHAR(50);
        END
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='usuario_entrega')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ADD usuario_entrega VARCHAR(50);
        END
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='fecha_entrega')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ALTER COLUMN fecha_entrega DATETIME2 NULL;
        END
      `);
    } catch (e) {}

    await pool.request()
      .input('numero_orden_compra', sql.Char(10), String(numero_orden_compra).trim())
      .input('usuario_entrego', sql.VarChar(50), currentUser)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM EntregaOrdenCompra WHERE numero_orden_compra = @numero_orden_compra)
          INSERT INTO EntregaOrdenCompra (fecha_entrega, usuario_entrego, usuario_entrega, numero_orden_compra)
          VALUES (GETDATE(), @usuario_entrego, @usuario_entrego, @numero_orden_compra);
        ELSE
          UPDATE EntregaOrdenCompra 
          SET fecha_entrega = GETDATE(), usuario_entrego = @usuario_entrego, usuario_entrega = @usuario_entrego 
          WHERE numero_orden_compra = @numero_orden_compra;
      `);

    return res.json({ message: `Entrega de orden de compra registrada exitosamente por ${currentUser} el ${formatDisplayDateTime(now)}.` });

  } catch (err) {
    console.error('Error en registrarEntregaOrden:', err);
    const num = String(numero_orden_compra).trim();
    let exist = localEntregaOrdenCompra.find(e => e.numero_orden_compra === num);
    if (!exist) {
      localEntregaOrdenCompra.push({
        id_entrega: localEntregaOrdenCompra.length + 1,
        numero_orden_compra: num,
        fecha_entrega: now,
        usuario_entrego: currentUser,
        usuario_entrega: currentUser,
        usuario: null,
        usuario_recepcion: null,
        fecha_recepcion: null
      });
    } else {
      exist.fecha_entrega = now;
      exist.usuario_entrego = currentUser;
      exist.usuario_entrega = currentUser;
    }
    return res.json({ message: `Entrega registrada exitosamente el ${formatDisplayDateTime(now)}.` });
  }
}

// --- 3. RECEPCIÓN ORDEN DE COMPRA ---
async function registrarRecepcionOrden(req, res) {
  const { numero_orden_compra } = req.body;
  if (!numero_orden_compra) {
    return res.status(400).json({ error: 'Número de orden de compra es obligatorio.' });
  }

  const currentUser = req.user ? req.user.usuario : 'a201600577908';
  const now = new Date();
  const numOC = String(numero_orden_compra).trim();

  try {
    const pool = await getPool();

    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='usuario_recepcion')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ADD usuario_recepcion VARCHAR(50);
        END
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaOrdenCompra' AND COLUMN_NAME='fecha_recepcion')
        BEGIN
            ALTER TABLE EntregaOrdenCompra ALTER COLUMN fecha_recepcion DATETIME2 NULL;
        END
      `);
    } catch (e) {}

    // Validar que el usuario que entrega NO sea el mismo que recibe
    const checkQuery = await pool.request()
      .input('numero_orden_compra', sql.Char(10), numOC)
      .query(`SELECT usuario_entrego, usuario_entrega FROM EntregaOrdenCompra WHERE numero_orden_compra = @numero_orden_compra`);

    if (checkQuery.recordset.length > 0) {
      const uEntrego = (checkQuery.recordset[0].usuario_entrego || checkQuery.recordset[0].usuario_entrega) ? String(checkQuery.recordset[0].usuario_entrego || checkQuery.recordset[0].usuario_entrega).trim() : null;
      if (uEntrego && uEntrego.toLowerCase() === String(currentUser).toLowerCase()) {
        return res.status(400).json({ 
          error: `No puedes recibir esta orden porque tú mismo (${currentUser}) realizaste la entrega. Debe ser recibida por otro usuario.` 
        });
      }
    }

    await pool.request()
      .input('numero_orden_compra', sql.Char(10), numOC)
      .input('usuario', sql.VarChar(50), currentUser)
      .query(`
        UPDATE EntregaOrdenCompra
        SET usuario = @usuario, usuario_recepcion = @usuario, fecha_recepcion = GETDATE()
        WHERE numero_orden_compra = @numero_orden_compra;
      `);

    return res.json({ message: `Recepción de orden confirmada por usuario ${currentUser} el ${formatDisplayDateTime(now)}.` });

  } catch (err) {
    console.error('Error en registrarRecepcionOrden:', err);
    let exist = localEntregaOrdenCompra.find(e => e.numero_orden_compra === numOC);
    if (exist) {
      const uEntrego = exist.usuario_entrego || exist.usuario_entrega;
      if (uEntrego && String(uEntrego).toLowerCase() === String(currentUser).toLowerCase()) {
        return res.status(400).json({ 
          error: `No puedes recibir esta orden porque tú mismo (${currentUser}) realizaste la entrega. Debe ser recibida por otro usuario.` 
        });
      }
      exist.usuario = currentUser;
      exist.usuario_recepcion = currentUser;
      exist.fecha_recepcion = now;
    }
    return res.json({ message: `Recepción registrada por ${currentUser} el ${formatDisplayDateTime(now)}.` });
  }
}

async function eliminarEntregaOrden(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Número de orden de compra es requerido.' });
  const numOC = String(id).trim();

  try {
    const pool = await getPool();
    await pool.request()
      .input('numero_orden_compra', sql.VarChar(10), numOC)
      .query(`
        UPDATE EntregaOrdenCompra
        SET fecha_entrega = NULL, usuario_entrego = NULL, usuario_entrega = NULL
        WHERE RTRIM(LTRIM(numero_orden_compra)) = @numero_orden_compra;
      `);
    return res.json({ message: `La Entrega de la orden ${numOC} ha sido eliminada exitosamente.` });
  } catch (err) {
    console.error('Error en eliminarEntregaOrden:', err);
    let exist = localEntregaOrdenCompra.find(e => e.numero_orden_compra === numOC);
    if (exist) {
      exist.fecha_entrega = null;
      exist.usuario_entrego = null;
      exist.usuario_entrega = null;
    }
    return res.json({ message: `Entrega de la orden ${numOC} eliminada.` });
  }
}

async function eliminarRecepcionOrden(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Número de orden de compra es requerido.' });
  const numOC = String(id).trim();

  try {
    const pool = await getPool();
    await pool.request()
      .input('numero_orden_compra', sql.VarChar(10), numOC)
      .query(`
        UPDATE EntregaOrdenCompra
        SET fecha_recepcion = NULL, usuario = NULL, usuario_recepcion = NULL
        WHERE RTRIM(LTRIM(numero_orden_compra)) = @numero_orden_compra;
      `);
    return res.json({ message: `La Recepción de la orden ${numOC} ha sido eliminada exitosamente.` });
  } catch (err) {
    console.error('Error en eliminarRecepcionOrden:', err);
    let exist = localEntregaOrdenCompra.find(e => e.numero_orden_compra === numOC);
    if (exist) {
      exist.fecha_recepcion = null;
      exist.usuario = null;
      exist.usuario_recepcion = null;
    }
    return res.json({ message: `Recepción de la orden ${numOC} eliminada.` });
  }
}

// --- 4. ENTREGA EXPEDIENTE ---
async function getEntregaExpedientes(req, res) {
  try {
    const pool = await getPool();
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaExpediente' AND COLUMN_NAME='usuario')
        BEGIN
            ALTER TABLE EntregaExpediente ADD usuario VARCHAR(50);
        END
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaExpediente' AND COLUMN_NAME='fecha_entrega_expediente' AND IS_NULLABLE='NO')
        BEGIN
            ALTER TABLE EntregaExpediente ALTER COLUMN fecha_entrega_expediente DATE NULL;
        END
      `);
    } catch (e) {}

    const result = await pool.request().query(`
      SELECT 
        oc.numero_orden_compra,
        oc.numero_pedido,
        p.fecha_pedido,
        p.codigo,
        pr.descripcion AS descripcion_producto,
        p.cantidad,
        oc.fecha_orden,
        ee.id_entrega,
        ee.fecha_entrega_expediente,
        ee.usuario,
        ISNULL(u.nombre_completo, ee.usuario) AS nombre_usuario_expediente
      FROM OrdenCompra oc
      LEFT JOIN Pedidos p ON oc.numero_pedido = p.numero_pedido
      LEFT JOIN Productos pr ON p.codigo = pr.codigo
      LEFT JOIN EntregaExpediente ee ON oc.numero_orden_compra = ee.numero_orden_compra
      LEFT JOIN Usuarios u ON (RTRIM(LTRIM(ee.usuario)) = RTRIM(LTRIM(u.usuario)) OR RTRIM(LTRIM(ee.usuario)) = RTRIM(LTRIM(u.id_usuario)))
      ORDER BY oc.numero_pedido ASC
    `);

    const formatted = result.recordset.map(row => ({
      ...row,
      numero_orden_compra: String(row.numero_orden_compra).trim(),
      usuario: row.usuario ? String(row.usuario).trim() : null,
      nombre_usuario_expediente: row.nombre_usuario_expediente ? String(row.nombre_usuario_expediente).trim() : null,
      fecha_pedido_display: formatDisplayDate(row.fecha_pedido),
      fecha_orden_display: formatDisplayDate(row.fecha_orden),
      fecha_entrega_expediente_display: formatDisplayDate(row.fecha_entrega_expediente)
    }));

    return res.json(formatted);

  } catch (err) {
    const formattedLocal = localOrdenesCompra.map(oc => {
      const ped = localPedidos.find(p => p.numero_pedido === oc.numero_pedido);
      const exp = localEntregaExpediente.find(e => e.numero_orden_compra === oc.numero_orden_compra);
      return {
        ...oc,
        fecha_pedido: ped ? ped.fecha_pedido : null,
        fecha_pedido_display: formatDisplayDate(ped ? ped.fecha_pedido : null),
        codigo: ped ? ped.codigo : '',
        descripcion_producto: oc.descripcion_producto || (ped ? ped.descripcion_producto : ''),
        cantidad: oc.cantidad || (ped ? ped.cantidad : 0),
        fecha_orden_display: formatDisplayDate(oc.fecha_orden),
        id_entrega: exp ? exp.id_entrega : null,
        fecha_entrega_expediente: exp ? exp.fecha_entrega_expediente : null,
        fecha_entrega_expediente_display: exp ? formatDisplayDate(exp.fecha_entrega_expediente) : null,
        usuario: exp ? exp.usuario : null,
        nombre_usuario_expediente: exp ? (exp.usuario === 'a201600577908' ? 'Josué David Sánchez López' : exp.usuario) : null
      };
    });
    return res.json(formattedLocal);
  }
}

async function registrarEntregaExpediente(req, res) {
  const { numero_orden_compra } = req.body;
  if (!numero_orden_compra) {
    return res.status(400).json({ error: 'Número de orden de compra es obligatorio.' });
  }

  const currentUser = req.user ? req.user.usuario : 'a201600577908';
  const todayStr = getTodaySQLDate();
  const numOC = String(numero_orden_compra).trim();

  try {
    const pool = await getPool();
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='EntregaExpediente' AND COLUMN_NAME='usuario')
        BEGIN
            ALTER TABLE EntregaExpediente ADD usuario VARCHAR(50);
        END
      `);
    } catch (e) {}

    await pool.request()
      .input('numero_orden_compra', sql.VarChar(10), numOC)
      .input('fecha_entrega_expediente', sql.VarChar(10), todayStr)
      .input('usuario', sql.VarChar(50), currentUser)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM EntregaExpediente WHERE RTRIM(LTRIM(numero_orden_compra)) = @numero_orden_compra)
          INSERT INTO EntregaExpediente (fecha_entrega_expediente, usuario, numero_orden_compra)
          VALUES (@fecha_entrega_expediente, @usuario, @numero_orden_compra);
        ELSE
          UPDATE EntregaExpediente 
          SET fecha_entrega_expediente = @fecha_entrega_expediente, usuario = @usuario
          WHERE RTRIM(LTRIM(numero_orden_compra)) = @numero_orden_compra;
      `);

    return res.json({ message: `Expediente entregado exitosamente por ${currentUser} el ${formatDisplayDate(todayStr)}.` });

  } catch (err) {
    console.error('Error en registrarEntregaExpediente:', err);
    let exist = localEntregaExpediente.find(e => e.numero_orden_compra === numOC);
    if (!exist) {
      localEntregaExpediente.push({
        id_entrega: localEntregaExpediente.length + 1,
        numero_orden_compra: numOC,
        fecha_entrega_expediente: todayStr,
        usuario: currentUser
      });
    } else {
      exist.fecha_entrega_expediente = todayStr;
      exist.usuario = currentUser;
    }
    return res.json({ message: `Expediente entregado el ${formatDisplayDate(todayStr)}.` });
  }
}

async function eliminarEntregaExpediente(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Número de orden de compra es requerido.' });
  const numOC = String(id).trim();

  try {
    const pool = await getPool();
    await pool.request()
      .input('numero_orden_compra', sql.VarChar(10), numOC)
      .query(`
        UPDATE EntregaExpediente
        SET fecha_entrega_expediente = NULL, usuario = NULL
        WHERE RTRIM(LTRIM(numero_orden_compra)) = @numero_orden_compra;
      `);
    return res.json({ message: `La Entrega de Expediente de la orden ${numOC} ha sido eliminada.` });
  } catch (err) {
    let exist = localEntregaExpediente.find(e => e.numero_orden_compra === numOC);
    if (exist) {
      exist.fecha_entrega_expediente = null;
      exist.usuario = null;
    }
    return res.json({ message: `Entrega de Expediente de la orden ${numOC} eliminada.` });
  }
}

// --- 5. RECEPCIÓN DE COMPRA ---
async function getRecepcionesCompra(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        rc.id_recepcion_compra,
        rc.numero_orden_compra,
        rc.fecha_ingreso,
        rc.serie_factura,
        rc.numero_factura,
        rc.nit,
        prov.nombre_proveedor,
        rc.precio_unitario,
        oc.numero_pedido,
        p.fecha_pedido,
        p.codigo,
        p.cantidad,
        pr.descripcion AS descripcion_producto
      FROM RecepcionCompra rc
      LEFT JOIN OrdenCompra oc ON rc.numero_orden_compra = oc.numero_orden_compra
      LEFT JOIN Pedidos p ON oc.numero_pedido = p.numero_pedido
      LEFT JOIN Productos pr ON p.codigo = pr.codigo
      LEFT JOIN Proveedores prov ON rc.nit = prov.nit
      ORDER BY p.numero_pedido ASC, rc.fecha_ingreso DESC
    `);

    const formatted = result.recordset.map(row => ({
      ...row,
      numero_orden_compra: String(row.numero_orden_compra).trim(),
      fecha_ingreso_display: formatDisplayDate(row.fecha_ingreso),
      fecha_pedido_display: formatDisplayDate(row.fecha_pedido),
      precio_total: row.precio_unitario && row.cantidad ? (row.precio_unitario * row.cantidad) : 0
    }));

    return res.json(formatted);

  } catch (err) {
    const formattedLocal = localRecepcionCompra.map(rc => {
      const oc = localOrdenesCompra.find(o => o.numero_orden_compra === rc.numero_orden_compra);
      const ped = oc ? localPedidos.find(p => p.numero_pedido === oc.numero_pedido) : null;
      const cant = ped ? ped.cantidad : 10000;
      return {
        ...rc,
        fecha_ingreso_display: formatDisplayDate(rc.fecha_ingreso),
        numero_pedido: oc ? oc.numero_pedido : 1000,
        cantidad: cant,
        descripcion_producto: ped ? ped.descripcion_producto : 'Producto',
        precio_total: rc.precio_unitario * cant
      };
    });
    return res.json(formattedLocal);
  }
}

async function registrarRecepcionCompra(req, res) {
  const { numero_orden_compra, fecha_ingreso, serie_factura, numero_factura, nit, precio_unitario } = req.body;

  if (!numero_orden_compra || !fecha_ingreso || !nit || precio_unitario === undefined) {
    return res.status(400).json({ error: 'Número de orden, fecha de ingreso, NIT y precio unitario son requeridos.' });
  }

  const sqlFechaIngreso = parseToSQLDate(fecha_ingreso);

  try {
    const pool = await getPool();
    await pool.request()
      .input('numero_orden_compra', sql.Char(10), String(numero_orden_compra).trim())
      .input('fecha_ingreso', sql.VarChar(10), sqlFechaIngreso)
      .input('serie_factura', sql.VarChar(30), String(serie_factura || ''))
      .input('numero_factura', sql.VarChar(30), String(numero_factura || ''))
      .input('nit', sql.VarChar(25), String(nit))
      .input('precio_unitario', sql.Decimal(18, 2), parseFloat(precio_unitario))
      .query(`
        INSERT INTO RecepcionCompra (numero_orden_compra, fecha_ingreso, serie_factura, numero_factura, nit, precio_unitario)
        VALUES (@numero_orden_compra, @fecha_ingreso, @serie_factura, @numero_factura, @nit, @precio_unitario);
      `);

    return res.status(201).json({ message: 'Recepción de compra registrada exitosamente.' });

  } catch (err) {
    const prov = localProveedores.find(p => p.nit === String(nit));
    localRecepcionCompra.push({
      id_recepcion_compra: localRecepcionCompra.length + 1,
      numero_orden_compra: String(numero_orden_compra).trim(),
      fecha_ingreso: sqlFechaIngreso,
      serie_factura: String(serie_factura || ''),
      numero_factura: String(numero_factura || ''),
      nit: String(nit),
      nombre_proveedor: prov ? prov.nombre_proveedor : nit,
      precio_unitario: parseFloat(precio_unitario)
    });
    return res.status(201).json({ message: 'Recepción de compra registrada (Modo Demostración).' });
  }
}

async function updateRecepcionCompra(req, res) {
  const { id } = req.params;
  const { fecha_ingreso, serie_factura, numero_factura, nit, precio_unitario } = req.body;

  if (!id || !fecha_ingreso || !nit || precio_unitario === undefined) {
    return res.status(400).json({ error: 'ID, fecha de ingreso, NIT y precio unitario son requeridos.' });
  }

  const sqlFechaIngreso = parseToSQLDate(fecha_ingreso);

  try {
    const pool = await getPool();
    await pool.request()
      .input('id_recepcion_compra', sql.Int, parseInt(id))
      .input('fecha_ingreso', sql.VarChar(10), sqlFechaIngreso)
      .input('serie_factura', sql.VarChar(30), String(serie_factura || ''))
      .input('numero_factura', sql.VarChar(30), String(numero_factura || ''))
      .input('nit', sql.VarChar(25), String(nit))
      .input('precio_unitario', sql.Decimal(18, 2), parseFloat(precio_unitario))
      .query(`
        UPDATE RecepcionCompra
        SET fecha_ingreso = @fecha_ingreso,
            serie_factura = @serie_factura,
            numero_factura = @numero_factura,
            nit = @nit,
            precio_unitario = @precio_unitario
        WHERE id_recepcion_compra = @id_recepcion_compra;
      `);
    return res.json({ message: 'Recepción de compra actualizada exitosamente.' });
  } catch (err) {
    console.error('Error en updateRecepcionCompra:', err);
    const idx = localRecepcionCompra.findIndex(r => r.id_recepcion_compra === parseInt(id));
    if (idx !== -1) {
      localRecepcionCompra[idx] = {
        ...localRecepcionCompra[idx],
        fecha_ingreso: sqlFechaIngreso,
        serie_factura: String(serie_factura || ''),
        numero_factura: String(numero_factura || ''),
        nit: String(nit),
        precio_unitario: parseFloat(precio_unitario)
      };
    }
    return res.json({ message: 'Recepción actualizada (Modo Demostración).' });
  }
}

async function deleteRecepcionCompra(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID de recepción es requerido.' });

  try {
    const pool = await getPool();
    await pool.request()
      .input('id_recepcion_compra', sql.Int, parseInt(id))
      .query(`DELETE FROM RecepcionCompra WHERE id_recepcion_compra = @id_recepcion_compra;`);
    return res.json({ message: 'Recepción de compra eliminada exitosamente.' });
  } catch (err) {
    console.error('Error en deleteRecepcionCompra:', err);
    const idx = localRecepcionCompra.findIndex(r => r.id_recepcion_compra === parseInt(id));
    if (idx !== -1) localRecepcionCompra.splice(idx, 1);
    return res.json({ message: 'Recepción eliminada (Modo Demostración).' });
  }
}

module.exports = {
  getOrdenesCompra,
  createOrdenCompra,
  updateOrdenCompra,
  deleteOrdenCompra,
  bulkOrdenesCompra,
  getEntregaOrdenes,
  registrarEntregaOrden,
  registrarRecepcionOrden,
  eliminarEntregaOrden,
  eliminarRecepcionOrden,
  getEntregaExpedientes,
  registrarEntregaExpediente,
  eliminarEntregaExpediente,
  getRecepcionesCompra,
  registrarRecepcionCompra,
  updateRecepcionCompra,
  deleteRecepcionCompra,
  localOrdenesCompra,
  localRecepcionCompra
};
