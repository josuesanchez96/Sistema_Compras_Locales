/**
 * Utilidad Frontend para lectura y parseo inteligente de archivos Excel con SheetJS (xlsx)
 * Soporta búsqueda por sinonimia de encabezados y por posición de columna.
 */

window.readExcelFile = function(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No se seleccionó ningún archivo.'));
    }

    const reader = new FileReader();

    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir hoja a JSON por nombres de encabezados
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Convertir hoja a matriz 2D por índice de columnas (header: 1)
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        resolve({ jsonData, rawRows });
      } catch (err) {
        reject(new Error('Error al procesar el archivo Excel: ' + err.message));
      }
    };

    reader.onerror = function(err) {
      reject(new Error('Error de lectura del archivo local.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// Normalizar nombres de llaves de Excel (minúsculas, eliminar espacios y acentos)
window.normalizeExcelKeys = function(row) {
  const normalized = {};
  for (const key in row) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const cleanKey = key
        .toLowerCase()
        .trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_]/g, "_");
      normalized[cleanKey] = row[key];
    }
  }
  return normalized;
};

/**
 * Exporta una matriz de objetos JSON a un archivo de Excel (.xlsx) nativo.
 * @param {Array} dataArray - Lista de objetos a exportar.
 * @param {String} fileName - Nombre del archivo final (ej: 'reporte.xlsx').
 * @param {String} sheetName - Nombre de la pestaña en Excel (ej: 'Datos').
 * @param {Object} columnMap - Objeto de mapeo { propiedadData: 'Nombre de Columna en Excel' }.
 */
window.exportToExcel = function(dataArray, fileName = 'Reporte.xlsx', sheetName = 'Hoja 1', columnMap = null) {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
    alert('No hay datos filtrados para exportar a Excel.');
    return;
  }

  // Transformar datos usando el mapeo de columnas si existe
  let formattedData = dataArray;
  if (columnMap) {
    formattedData = dataArray.map(item => {
      const row = {};
      for (const key in columnMap) {
        if (Object.prototype.hasOwnProperty.call(columnMap, key)) {
          let val = item[key];
          if (val === null || val === undefined) {
            val = '';
          } else if (typeof val === 'boolean') {
            val = val ? 'SI' : 'NO';
          }
          row[columnMap[key]] = val;
        }
      }
      return row;
    });
  }

  // Crear la hoja de trabajo (Worksheet) de SheetJS
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Auto-ajustar ancho de las columnas (wch)
  if (formattedData.length > 0) {
    const keys = Object.keys(formattedData[0]);
    const colWidths = keys.map(key => {
      let maxLen = key ? key.toString().length : 10;
      // Evaluar longitud en una muestra o en todas las filas
      const sampleRows = formattedData.slice(0, 100);
      sampleRows.forEach(row => {
        const valStr = row[key] !== null && row[key] !== undefined ? row[key].toString() : '';
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 60) };
    });
    worksheet['!cols'] = colWidths;
  }

  // Crear el libro de trabajo (Workbook) y agregar la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Asegurar extensión .xlsx
  const validFileName = fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

  // Descargar archivo
  XLSX.writeFile(workbook, validFileName);
};

