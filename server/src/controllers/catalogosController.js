const { getPool, sql } = require('../config/db');

// Local fallback memory stores
let localProductos = [
  { codigo: '7', descripcion: 'Clindamicina clorhidrato Cápsula 300 mg', renglon: '266' },
  { codigo: '10534', descripcion: 'Sitagliptina Fosfato Comprimido recubierto 100 mg', renglon: '266' },
  { codigo: '354', descripcion: 'Metformina Tableta de liberación prolongada 1000 mg', renglon: '266' },
  { codigo: '599', descripcion: 'Hierro aminoquelado + ácido fólico Tableta 30 mg + 250-300 mcg', renglon: '266' }
];

let localResponsables = [
  { id_responsable: 'SHN', nombre_completo: 'Sheny Magaly' },
  { id_responsable: 'ANA', nombre_completo: 'Ana Luisa' },
  { id_responsable: 'DEN', nombre_completo: 'Dennise Orozco' },
  { id_responsable: 'MAB', nombre_completo: 'Maby Soc' }
];

let localTipoCompra = [
  { id_tipo_compra: 'CD', nombre_tipo: 'Compra Directa' },
  { id_tipo_compra: 'CA', nombre_tipo: 'Contrato Abierto' },
  { id_tipo_compra: 'BC', nombre_tipo: 'Baja Cuantía' },
  { id_tipo_compra: 'CT', nombre_tipo: 'Cotización' },
  { id_tipo_compra: 'LP', nombre_tipo: 'Licitación Pública' }
];

let localProveedores = [
  { nit: '2342855', nombre_proveedor: 'Instituto Guatemalteco de Seguridad Social' },
  { nit: '1234567', nombre_proveedor: 'Droguería Guatemala, S. A.' }
];

// --- PRODUCTOS ---
async function getProductos(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT codigo, descripcion, renglon 
      FROM Productos 
      ORDER BY TRY_CAST(codigo AS INT) ASC, codigo ASC
    `);
    return res.json(result.recordset);
  } catch (err) {
    return res.json(localProductos);
  }
}

async function createProducto(req, res) {
  const { codigo, descripcion, renglon } = req.body;
  if (!codigo || !descripcion) {
    return res.status(400).json({ error: 'El código y la descripción son obligatorios.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('codigo', sql.VarChar(50), String(codigo))
      .input('descripcion', sql.VarChar(250), descripcion)
      .input('renglon', sql.VarChar(20), String(renglon || ''))
      .query(`
        INSERT INTO Productos (codigo, descripcion, renglon)
        VALUES (@codigo, @descripcion, @renglon);
      `);
    return res.status(201).json({ message: 'Producto registrado exitosamente.' });
  } catch (err) {
    if (err.message.includes('PRIMARY KEY')) {
      return res.status(400).json({ error: 'El código de producto ya existe.' });
    }
    localProductos.push({ codigo: String(codigo), descripcion, renglon: String(renglon || '') });
    return res.status(201).json({ message: 'Producto registrado (Modo Demostración).' });
  }
}

async function bulkProductos(req, res) {
  const { items } = req.body; // Expects Array of { codigo, descripcion, renglon }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere una lista válida de productos.' });
  }

  let count = 0;
  try {
    const pool = await getPool();
    const chunkSize = 500;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const request = pool.request();
      const valueStrings = [];

      chunk.forEach((item, index) => {
        if (!item.codigo || !item.descripcion) return;
        const paramCod = `cod_${index}`;
        const paramDesc = `desc_${index}`;
        const paramReng = `reng_${index}`;

        request.input(paramCod, sql.VarChar(50), String(item.codigo).trim());
        request.input(paramDesc, sql.VarChar(250), String(item.descripcion).trim().substring(0, 250));
        request.input(paramReng, sql.VarChar(20), String(item.renglon || '').trim());

        valueStrings.push(`(@${paramCod}, @${paramDesc}, @${paramReng})`);
      });

      if (valueStrings.length > 0) {
        const query = `
          MERGE INTO Productos AS Target
          USING (VALUES ${valueStrings.join(',')}) AS Source (codigo, descripcion, renglon)
          ON (Target.codigo = Source.codigo)
          WHEN MATCHED THEN
            UPDATE SET Target.descripcion = Source.descripcion, Target.renglon = Source.renglon
          WHEN NOT MATCHED THEN
            INSERT (codigo, descripcion, renglon) VALUES (Source.codigo, Source.descripcion, Source.renglon);
        `;
        await request.query(query);
        count += valueStrings.length;
      }
    }

    return res.json({ message: `Carga masiva completada: ${count} productos procesados exitosamente en SQL Server.` });

  } catch (err) {
    console.error('Error en bulkProductos SQL:', err);
    items.forEach(item => {
      const idx = localProductos.findIndex(p => p.codigo === String(item.codigo));
      if (idx >= 0) {
        localProductos[idx] = { codigo: String(item.codigo), descripcion: item.descripcion, renglon: String(item.renglon || '') };
      } else {
        localProductos.push({ codigo: String(item.codigo), descripcion: item.descripcion, renglon: String(item.renglon || '') });
      }
    });
    return res.json({ message: `Carga masiva completada (${items.length} productos procesados en modo demostración).` });
  }
}

async function updateProducto(req, res) {
  const { codigo } = req.params;
  const { descripcion, renglon } = req.body;

  if (!codigo || !descripcion) {
    return res.status(400).json({ error: 'El código y la descripción son requeridos.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('codigo', sql.VarChar(50), String(codigo))
      .input('descripcion', sql.VarChar(250), descripcion)
      .input('renglon', sql.VarChar(20), String(renglon || ''))
      .query(`
        UPDATE Productos
        SET descripcion = @descripcion, renglon = @renglon
        WHERE codigo = @codigo;
      `);
    return res.json({ message: 'Producto actualizado exitosamente.' });
  } catch (err) {
    const idx = localProductos.findIndex(p => p.codigo === String(codigo));
    if (idx >= 0) {
      localProductos[idx] = { codigo: String(codigo), descripcion, renglon: String(renglon || '') };
    }
    return res.json({ message: 'Producto actualizado.' });
  }
}

async function deleteProducto(req, res) {
  const { codigo } = req.params;

  if (!codigo) {
    return res.status(400).json({ error: 'Código de producto es requerido.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('codigo', sql.VarChar(50), String(codigo))
      .query('DELETE FROM Productos WHERE codigo = @codigo;');
    return res.json({ message: `Producto ${codigo} eliminado exitosamente.` });
  } catch (err) {
    if (err.message && err.message.includes('REFERENCE constraint')) {
      return res.status(400).json({ error: 'No se puede eliminar el producto porque está asociado a pedidos existentes.' });
    }
    localProductos = localProductos.filter(p => p.codigo !== String(codigo));
    return res.json({ message: `Producto ${codigo} eliminado.` });
  }
}

// --- RESPONSABLES ---
async function getResponsables(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT id_responsable, nombre_completo FROM Responsables ORDER BY nombre_completo ASC');
    return res.json(result.recordset);
  } catch (err) {
    return res.json(localResponsables);
  }
}

async function createResponsable(req, res) {
  const { id_responsable, nombre_completo } = req.body;
  if (!id_responsable || id_responsable.length !== 3 || !nombre_completo) {
    return res.status(400).json({ error: 'ID de responsable debe tener 3 caracteres y el nombre es requerido.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('id_responsable', sql.Char(3), id_responsable.toUpperCase())
      .input('nombre_completo', sql.VarChar(150), nombre_completo)
      .query(`
        INSERT INTO Responsables (id_responsable, nombre_completo)
        VALUES (@id_responsable, @nombre_completo);
      `);
    return res.status(201).json({ message: 'Responsable creado exitosamente.' });
  } catch (err) {
    localResponsables.push({ id_responsable: id_responsable.toUpperCase(), nombre_completo });
    return res.status(201).json({ message: 'Responsable creado (Modo Demostración).' });
  }
}

async function updateResponsable(req, res) {
  const { id } = req.params;
  const { nombre_completo } = req.body;

  if (!id || !nombre_completo) {
    return res.status(400).json({ error: 'El ID y el nombre completo son requeridos.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('id_responsable', sql.Char(3), id.toUpperCase())
      .input('nombre_completo', sql.VarChar(150), nombre_completo)
      .query(`
        UPDATE Responsables
        SET nombre_completo = @nombre_completo
        WHERE id_responsable = @id_responsable;
      `);
    return res.json({ message: 'Responsable actualizado exitosamente.' });
  } catch (err) {
    const idx = localResponsables.findIndex(r => r.id_responsable === id.toUpperCase());
    if (idx >= 0) {
      localResponsables[idx].nombre_completo = nombre_completo;
    }
    return res.json({ message: 'Responsable actualizado.' });
  }
}

async function deleteResponsable(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID de responsable es requerido.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('id_responsable', sql.Char(3), id.toUpperCase())
      .query('DELETE FROM Responsables WHERE id_responsable = @id_responsable;');
    return res.json({ message: `Responsable ${id} eliminado exitosamente.` });
  } catch (err) {
    if (err.message && (err.message.includes('REFERENCE constraint') || err.message.includes('FOREIGN KEY'))) {
      return res.status(400).json({ error: 'No se puede eliminar el responsable porque está asignado a procesos de compra existentes.' });
    }
    localResponsables = localResponsables.filter(r => r.id_responsable !== id.toUpperCase());
    return res.json({ message: `Responsable ${id} eliminado.` });
  }
}

// --- TIPO COMPRA ---
async function getTipoCompra(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT id_tipo_compra, nombre_tipo FROM TipoCompra ORDER BY nombre_tipo ASC');
    return res.json(result.recordset);
  } catch (err) {
    return res.json(localTipoCompra);
  }
}

async function createTipoCompra(req, res) {
  const { id_tipo_compra, nombre_tipo } = req.body;
  if (!id_tipo_compra || !nombre_tipo) {
    return res.status(400).json({ error: 'El ID de tipo de compra (max 3 letras) y el nombre son obligatorios.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('id_tipo_compra', sql.Char(3), id_tipo_compra.toUpperCase())
      .input('nombre_tipo', sql.VarChar(50), nombre_tipo)
      .query(`
        INSERT INTO TipoCompra (id_tipo_compra, nombre_tipo)
        VALUES (@id_tipo_compra, @nombre_tipo);
      `);
    return res.status(201).json({ message: 'Tipo de compra creado exitosamente.' });
  } catch (err) {
    localTipoCompra.push({ id_tipo_compra: id_tipo_compra.toUpperCase(), nombre_tipo });
    return res.status(201).json({ message: 'Tipo de compra registrado (Modo Demostración).' });
  }
}

async function updateTipoCompra(req, res) {
  const { id } = req.params;
  const { nombre_tipo } = req.body;

  if (!id || !nombre_tipo) {
    return res.status(400).json({ error: 'El ID y el nombre del tipo de compra son requeridos.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('id_tipo_compra', sql.Char(3), id.toUpperCase())
      .input('nombre_tipo', sql.VarChar(50), nombre_tipo)
      .query(`
        UPDATE TipoCompra
        SET nombre_tipo = @nombre_tipo
        WHERE id_tipo_compra = @id_tipo_compra;
      `);
    return res.json({ message: 'Tipo de compra actualizado exitosamente.' });
  } catch (err) {
    const idx = localTipoCompra.findIndex(t => t.id_tipo_compra === id.toUpperCase());
    if (idx >= 0) {
      localTipoCompra[idx].nombre_tipo = nombre_tipo;
    }
    return res.json({ message: 'Tipo de compra actualizado.' });
  }
}

async function deleteTipoCompra(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID de tipo de compra es requerido.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('id_tipo_compra', sql.Char(3), id.toUpperCase())
      .query('DELETE FROM TipoCompra WHERE id_tipo_compra = @id_tipo_compra;');
    return res.json({ message: `Tipo de compra ${id} eliminado exitosamente.` });
  } catch (err) {
    if (err.message && (err.message.includes('REFERENCE constraint') || err.message.includes('FOREIGN KEY'))) {
      return res.status(400).json({ error: 'No se puede eliminar el tipo de compra porque está asociado a órdenes de compra existentes.' });
    }
    localTipoCompra = localTipoCompra.filter(t => t.id_tipo_compra !== id.toUpperCase());
    return res.json({ message: `Tipo de compra ${id} eliminado.` });
  }
}

// --- PROVEEDORES ---
async function getProveedores(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT nit, nombre_proveedor FROM Proveedores ORDER BY nombre_proveedor ASC');
    return res.json(result.recordset);
  } catch (err) {
    return res.json(localProveedores);
  }
}

async function createProveedor(req, res) {
  const { nit, nombre_proveedor } = req.body;
  if (!nit || !nombre_proveedor) {
    return res.status(400).json({ error: 'El NIT y nombre de proveedor son requeridos.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('nit', sql.VarChar(25), String(nit))
      .input('nombre_proveedor', sql.VarChar(200), nombre_proveedor)
      .query(`
        INSERT INTO Proveedores (nit, nombre_proveedor)
        VALUES (@nit, @nombre_proveedor);
      `);
    return res.status(201).json({ message: 'Proveedor registrado exitosamente.' });
  } catch (err) {
    localProveedores.push({ nit: String(nit), nombre_proveedor });
    return res.status(201).json({ message: 'Proveedor registrado (Modo Demostración).' });
  }
}

async function bulkProveedores(req, res) {
  const { items } = req.body; // Array of { nit, nombre_proveedor }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Lista de proveedores inválida.' });
  }

  let count = 0;
  try {
    const pool = await getPool();
    const chunkSize = 500;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const request = pool.request();
      const valueStrings = [];

      chunk.forEach((item, index) => {
        if (!item.nit || !item.nombre_proveedor) return;
        const paramNit = `nit_${index}`;
        const paramNombre = `nom_${index}`;

        request.input(paramNit, sql.VarChar(25), String(item.nit).trim());
        request.input(paramNombre, sql.VarChar(200), String(item.nombre_proveedor).trim());

        valueStrings.push(`(@${paramNit}, @${paramNombre})`);
      });

      if (valueStrings.length > 0) {
        const query = `
          MERGE INTO Proveedores AS Target
          USING (VALUES ${valueStrings.join(',')}) AS Source (nit, nombre_proveedor)
          ON (Target.nit = Source.nit)
          WHEN MATCHED THEN
            UPDATE SET Target.nombre_proveedor = Source.nombre_proveedor
          WHEN NOT MATCHED THEN
            INSERT (nit, nombre_proveedor) VALUES (Source.nit, Source.nombre_proveedor);
        `;
        await request.query(query);
        count += valueStrings.length;
      }
    }

    return res.json({ message: `Carga masiva de proveedores: ${count} registros procesados exitosamente en SQL Server.` });

  } catch (err) {
    console.error('Error en bulkProveedores SQL:', err);
    items.forEach(item => {
      const idx = localProveedores.findIndex(p => p.nit === String(item.nit));
      if (idx >= 0) localProveedores[idx] = { nit: String(item.nit), nombre_proveedor: item.nombre_proveedor };
      else localProveedores.push({ nit: String(item.nit), nombre_proveedor: item.nombre_proveedor });
    });
    return res.json({ message: `Carga masiva completada (${items.length} proveedores procesados en modo demostración).` });
  }
}
async function updateProveedor(req, res) {
  const { nit } = req.params;
  const { nombre_proveedor } = req.body;

  if (!nit || !nombre_proveedor) {
    return res.status(400).json({ error: 'El NIT y el nombre de proveedor son requeridos.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('nit', sql.VarChar(25), String(nit))
      .input('nombre_proveedor', sql.VarChar(200), nombre_proveedor)
      .query(`
        UPDATE Proveedores
        SET nombre_proveedor = @nombre_proveedor
        WHERE nit = @nit;
      `);
    return res.json({ message: 'Proveedor actualizado exitosamente.' });
  } catch (err) {
    const idx = localProveedores.findIndex(p => p.nit === String(nit));
    if (idx >= 0) {
      localProveedores[idx].nombre_proveedor = nombre_proveedor;
    }
    return res.json({ message: 'Proveedor actualizado.' });
  }
}

async function deleteProveedor(req, res) {
  const { nit } = req.params;

  if (!nit) {
    return res.status(400).json({ error: 'NIT de proveedor es requerido.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('nit', sql.VarChar(25), String(nit))
      .query('DELETE FROM Proveedores WHERE nit = @nit;');
    return res.json({ message: `Proveedor NIT ${nit} eliminado exitosamente.` });
  } catch (err) {
    if (err.message && (err.message.includes('REFERENCE constraint') || err.message.includes('FOREIGN KEY'))) {
      return res.status(400).json({ error: 'No se puede eliminar el proveedor porque está asociado a recepciones de compra existentes.' });
    }
    localProveedores = localProveedores.filter(p => p.nit !== String(nit));
    return res.json({ message: `Proveedor ${nit} eliminado.` });
  }
}

module.exports = {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  bulkProductos,
  getResponsables,
  createResponsable,
  updateResponsable,
  deleteResponsable,
  getTipoCompra,
  createTipoCompra,
  updateTipoCompra,
  deleteTipoCompra,
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  bulkProveedores,
  localProductos,
  localResponsables,
  localTipoCompra,
  localProveedores
};
