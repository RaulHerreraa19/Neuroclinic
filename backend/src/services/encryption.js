const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey() {
  const hex = process.env.CLINICAL_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'CLINICAL_ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes).'
    );
  }
  return Buffer.from(hex, 'hex');
}

// Encripta texto plano y devuelve "iv:authTag:cipherText" en base64, listo para guardar en un TEXT column.
function encrypt(plainText) {
  if (plainText === null || plainText === undefined) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
}

function decrypt(payload) {
  if (payload === null || payload === undefined) return null;
  const [ivB64, authTagB64, dataB64] = String(payload).split(':');
  if (!ivB64 || !authTagB64 || !dataB64) return null;
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
