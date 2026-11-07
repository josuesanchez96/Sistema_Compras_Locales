const crypto = require('crypto');
const { hash, verify, Algorithm } = require('@node-rs/argon2');

// Parámetros recomendados por OWASP para Argon2id
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,       // 2 iteraciones
  parallelism: 1
};

/**
 * Genera un hash seguro utilizando Argon2id.
 * @param {string} plainPassword 
 * @returns {Promise<string>}
 */
async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('La contraseña debe ser una cadena de texto válida.');
  }
  return await hash(plainPassword, ARGON2_OPTIONS);
}

/**
 * Verifica una contraseña contra un hash Argon2id o hash legado SHA2-512.
 * @param {string|Buffer} storedHash 
 * @param {string} plainPassword 
 * @returns {Promise<{ valid: boolean, needsRehash: boolean }>}
 */
async function verifyPassword(storedHash, plainPassword) {
  if (!storedHash || !plainPassword) {
    return { valid: false, needsRehash: false };
  }

  // 1. Si es formato Argon2 ($argon2id$, $argon2i$, $argon2d$)
  if (typeof storedHash === 'string' && storedHash.startsWith('$argon2')) {
    try {
      const isValid = await verify(storedHash, plainPassword);
      return { valid: isValid, needsRehash: false };
    } catch (err) {
      console.warn('⚠️ Error al verificar hash Argon2id:', err.message);
      return { valid: false, needsRehash: false };
    }
  }

  // 2. Soporte de transición: Hash legado SHA2-512 (Buffer o Hexadecimal)
  try {
    const expectedBuf = crypto.createHash('sha512').update(String(plainPassword), 'utf8').digest();

    if (Buffer.isBuffer(storedHash)) {
      const isValid = storedHash.length === expectedBuf.length && crypto.timingSafeEqual(storedHash, expectedBuf);
      return { valid: isValid, needsRehash: isValid };
    }

    if (typeof storedHash === 'string') {
      let cleanHex = storedHash.trim().toLowerCase();
      if (cleanHex.startsWith('0x')) cleanHex = cleanHex.slice(2);
      const expectedHex = expectedBuf.toString('hex').toLowerCase();
      const isValid = cleanHex.length === expectedHex.length && cleanHex === expectedHex;
      return { valid: isValid, needsRehash: isValid };
    }
  } catch (err) {
    console.warn('⚠️ Error al verificar hash legado SHA-512:', err.message);
  }

  return { valid: false, needsRehash: false };
}

module.exports = {
  hashPassword,
  verifyPassword
};

