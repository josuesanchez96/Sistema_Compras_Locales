const { getPool, sql } = require('../config/db');
const { formatDisplayDate } = require('../utils/dateUtils');
const { localPedidos } = require('./pedidosController');
const { localOrdenesCompra, localRecepcionCompra } = require('./comprasController');
const { localProductos } = require('./catalogosController');

async function getDashboardData(req, res) {
  try {
    const pool = await getPool();
    
    // Consulta SQL consolidada para Sub-Ventana 1 y KPIs
    const result = await pool.request().query(`
      SELECT 
        p.numero_pedido,
        p.fecha_pedido,
        oc.numero_orden_compra,
        p.codigo,
        pr.descripcion AS descripcion_producto,
        pr.renglon,
        p.cantidad,
        rc.fecha_ingreso,
        rc.precio_unitario,
        (p.cantidad * rc.precio_unitario) AS precio_total,
        CASE WHEN rc.id_recepcion_compra IS NOT NULL THEN 'Ingresado' ELSE 'Pendiente' END AS estado
      FROM Pedidos p
      LEFT JOIN Productos pr ON p.codigo = pr.codigo
      LEFT JOIN OrdenCompra oc ON p.numero_pedido = oc.numero_pedido
      LEFT JOIN RecepcionCompra rc ON oc.numero_orden_compra = rc.numero_orden_compra
      ORDER BY p.numero_pedido DESC
    `);

    const rawRows = result.recordset;
    return processDashboardRows(rawRows, res);

  } catch (err) {
    console.warn('⚠️ SQL Server offline en Dashboard, construyendo desde datos en memoria:', err.message);

    const rawRows = localPedidos.map(p => {
      const prod = localProductos.find(x => x.codigo === p.codigo);
      const oc = localOrdenesCompra.find(x => x.numero_pedido === p.numero_pedido);
      const rc = oc ? localRecepcionCompra.find(x => x.numero_orden_compra === oc.numero_orden_compra) : null;
      
      const cantidad = p.cantidad || 0;
      const precio_unitario = rc ? rc.precio_unitario : 0;
      const precio_total = cantidad * precio_unitario;
      const estado = rc ? 'Ingresado' : 'Pendiente';

      return {
        numero_pedido: p.numero_pedido,
        fecha_pedido: p.fecha_pedido,
        numero_orden_compra: oc ? oc.numero_orden_compra : null,
        codigo: p.codigo,
        descripcion_producto: prod ? prod.descripcion : (p.descripcion_producto || 'Producto'),
        renglon: prod ? (prod.renglon || '266') : (p.renglon || '266'),
        cantidad: cantidad,
        fecha_ingreso: rc ? rc.fecha_ingreso : null,
        precio_unitario: precio_unitario,
        precio_total: precio_total,
        estado: estado
      };
    });

    return processDashboardRows(rawRows, res);
  }
}

function processDashboardRows(rawRows, res) {
  // 1. Formateo de filas
  const rows = rawRows.map(r => {
    let cuatrimestre = 1;
    if (r.fecha_pedido) {
      const month = new Date(r.fecha_pedido).getUTCMonth() + 1;
      if (month >= 1 && month <= 4) cuatrimestre = 1;
      else if (month >= 5 && month <= 8) cuatrimestre = 2;
      else cuatrimestre = 3;
    }

    return {
      ...r,
      fecha_pedido_display: formatDisplayDate(r.fecha_pedido),
      fecha_ingreso_display: r.fecha_ingreso ? formatDisplayDate(r.fecha_ingreso) : null,
      cuatrimestre,
      precio_unitario: r.precio_unitario ? parseFloat(r.precio_unitario) : 0,
      precio_total: r.precio_total ? parseFloat(r.precio_total) : 0
    };
  });

  // 2. Cálculo de KPIs
  const totalPedidos = rows.length;
  const ingresadosCount = rows.filter(r => r.estado === 'Ingresado').length;
  const pendientesCount = totalPedidos - ingresadosCount;
  const montoInvertido = rows
    .filter(r => r.estado === 'Ingresado')
    .reduce((sum, r) => sum + r.precio_total, 0);

  const kpis = {
    total_pedidos: totalPedidos,
    ingresados: ingresadosCount,
    pendientes: pendientesCount,
    monto_invertido: montoInvertido
  };

  // 3. Resumen por Renglón (Sub-Ventana 2)
  const renglonesMap = {};
  rows.forEach(r => {
    const reng = r.renglon || 'Sin Renglón';
    if (!renglonesMap[reng]) {
      renglonesMap[reng] = { renglon: reng, total: 0, ingresados: 0, pendientes: 0, porcentaje: 0 };
    }
    renglonesMap[reng].total += 1;
    if (r.estado === 'Ingresado') {
      renglonesMap[reng].ingresados += 1;
    } else {
      renglonesMap[reng].pendientes += 1;
    }
  });

  const resumenRenglones = Object.values(renglonesMap).map(item => ({
    ...item,
    porcentaje: item.total > 0 ? Math.round((item.ingresados / item.total) * 100) : 0
  }));

  return res.json({
    kpis,
    consolidado: rows,
    resumen_renglones: resumenRenglones
  });
}

module.exports = {
  getDashboardData
};
