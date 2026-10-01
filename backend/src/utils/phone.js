// Normaliza un celular mexicano a 10 dígitos. Acepta espacios, guiones, paréntesis y el
// prefijo de país (+52, 52 o el antiguo 521). Devuelve null si no es un número válido.
function normalizeMxPhone(value) {
  if (value === undefined || value === null) return null;
  let digits = String(value).replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('521')) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith('52')) digits = digits.slice(2);
  return /^\d{10}$/.test(digits) ? digits : null;
}

// Para logs y auditoría: nunca el número completo.
function maskPhone(phone) {
  return phone ? `******${String(phone).slice(-4)}` : null;
}

module.exports = { normalizeMxPhone, maskPhone };
