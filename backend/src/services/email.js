const nodemailer = require('nodemailer');

let transporter;

// Perezoso: si no hay SMTP configurado (típico en desarrollo local), no truena —
// solo deja constancia en consola para poder probar el flujo sin credenciales reales.
function getTransporter() {
  if (transporter !== undefined) return transporter;
  if (!process.env.SMTP_HOST) {
    transporter = null;
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

// Envía al paciente su contraseña temporal recién generada (y, si aplica, el resumen de su
// primera cita) para que pueda iniciar sesión y dar seguimiento a sus citas.
async function sendPatientCredentialsEmail({ to, nombre, password, fecha, horaInicio }) {
  const from = process.env.SMTP_FROM || 'NeuroClinic <no-reply@neuroclinic.test>';
  const subject = 'Tu cuenta en NeuroClinic';
  const citaTexto =
    fecha && horaInicio ? `\nTu cita quedó agendada para el ${fecha} a las ${horaInicio.slice(0, 5)}.\n` : '';
  const text =
    `Hola ${nombre},\n\n` +
    `Creamos tu cuenta en NeuroClinic para que puedas dar seguimiento a tus citas.\n\n` +
    `Correo: ${to}\n` +
    `Contraseña temporal: ${password}\n\n` +
    `Por seguridad, te recomendamos cambiarla la primera vez que inicies sesión.\n` +
    `${citaTexto}\n` +
    `Nos vemos pronto.\nNeuroClinic`;

  const client = getTransporter();
  if (!client) {
    console.warn(
      `[email] SMTP no configurado: no se envió correo real a ${to}. ` +
        `Contraseña temporal (solo visible en este log de desarrollo): ${password}`
    );
    return { sent: false };
  }

  await client.sendMail({ from, to, subject, text });
  return { sent: true };
}

module.exports = { sendPatientCredentialsEmail };
