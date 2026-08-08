/**
 * Módulo para formateo y conversión estricta de fechas dd/mm/yyyy <-> YYYY-MM-DD
 * Previene el error Msg 241 (Conversion failed when converting date and/or time from character string) en SQL Server.
 */

// Convierte cadena dd/mm/yyyy o YYYY-MM-DD a objeto Date o ISO string 'YYYY-MM-DD'
function parseToSQLDate(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === 'object' && dateStr instanceof Date) {
    return dateStr.toISOString().split('T')[0];
  }
  
  const str = String(dateStr).trim();
  
  // Si viene en formato dd/mm/yyyy
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  
  // Si viene en formato YYYY-MM-DD
  if (str.includes('-')) {
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  
  return str;
}

// Convierte Date u objeto SQL a dd/mm/yyyy
function formatDisplayDate(dateVal) {
  if (!dateVal) return null;
  let dateObj;
  if (typeof dateVal === 'string') {
    if (dateVal.includes('/')) return dateVal; // Ya está formateada
    const cleanStr = dateVal.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    dateObj = new Date(dateVal);
  } else {
    dateObj = new Date(dateVal);
  }
  
  if (isNaN(dateObj.getTime())) return null;
  
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const year = dateObj.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
}

// Convierte Date u objeto SQL a dd/mm/yyyy hh:mm AM/PM
function formatDisplayDateTime(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') {
    let str = dateVal.trim();
    if (str.includes('/') && str.includes(':')) return str;
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const pad = num => String(num).padStart(2, '0');
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();

      if (!dateVal.includes(':') && !dateVal.includes('T')) {
        return `${day}/${month}/${year}`;
      }

      let hours = d.getHours();
      const minutes = pad(d.getMinutes());
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm}`;
    }
  } else if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return null;
    const pad = num => String(num).padStart(2, '0');
    const day = pad(dateVal.getDate());
    const month = pad(dateVal.getMonth() + 1);
    const year = dateVal.getFullYear();
    let hours = dateVal.getHours();
    const minutes = pad(dateVal.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm}`;
  }
  return null;
}

// Obtiene la fecha actual en formato ISO YYYY-MM-DD
function getTodaySQLDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Obtiene la fecha y hora actual en formato YYYY-MM-DD HH:mm:ss
function getNowSQLDateTime() {
  const now = new Date();
  const pad = num => String(num).padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
  parseToSQLDate,
  formatDisplayDate,
  formatDisplayDateTime,
  getTodaySQLDate,
  getNowSQLDateTime
};

