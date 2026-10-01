const { maskPhone } = require('../utils/phone');

const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';

// Envía un SMS transaccional por Brevo a un celular mexicano (10 dígitos ya normalizados).
// Mismo contrato que services/email.js: nunca lanza y devuelve true solo si Brevo lo aceptó.
// Sin BREVO_API_KEY (desarrollo local) no envía nada: solo lo deja en consola.
async function sendSms({ to, content, devNote }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn(`[sms] BREVO_API_KEY no configurada: no se envió SMS a ${maskPhone(to)}.${devNote ? ` ${devNote}` : ''}`);
    return false;
  }
  try {
    const res = await fetch(BREVO_SMS_URL, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        // Máx. 11 caracteres alfanuméricos; en México el operador puede mostrar un número en su lugar.
        sender: (process.env.SMS_SENDER || 'NeuroClinic').slice(0, 11),
        recipient: `52${to}`,
        content,
        type: 'transactional',
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[sms] Brevo rechazó el SMS a ${maskPhone(to)} (${res.status}): ${body.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[sms] No se pudo enviar SMS a ${maskPhone(to)}:`, err.message);
    return false;
  }
}

module.exports = { sendSms };
