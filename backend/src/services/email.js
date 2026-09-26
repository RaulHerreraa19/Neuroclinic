const nodemailer = require('nodemailer');
const { User, DoctorProfile } = require('../models');

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

// URL pública del frontend para los enlaces del correo. Si no se define APP_URL, se usa el
// primer origen de CORS_ORIGIN (en local, http://localhost:5173).
function appUrl() {
  const base = process.env.APP_URL || (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];
  return base.trim().replace(/\/+$/, '');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// fecha llega como 'YYYY-MM-DD' (DATEONLY): se interpreta en UTC para que la zona horaria
// del servidor no la recorra un día.
function formatFecha(fecha) {
  const text = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${fecha}T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatHora(hora) {
  return String(hora).slice(0, 5);
}

function fullName(user) {
  return [user.nombre, user.apellidoPaterno, user.apellidoMaterno].filter(Boolean).join(' ');
}

// Datos de la cita que sí van en el correo. El motivo de consulta NO se incluye a propósito:
// es información de salud y el correo sale del perímetro cifrado/auditado del sistema.
async function loadAppointmentDetails(appointment) {
  const doctor = await User.findByPk(appointment.doctorId, {
    attributes: ['nombre', 'apellidoPaterno', 'apellidoMaterno'],
    include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: ['especialidad'] }],
  });
  return {
    fecha: formatFecha(appointment.fecha),
    hora: formatHora(appointment.horaInicio),
    horario: `${formatHora(appointment.horaInicio)} – ${formatHora(appointment.horaFin)} h`,
    doctor: doctor ? fullName(doctor) : null,
    especialidad: doctor?.doctorProfile?.especialidad || null,
    direccion: process.env.CLINIC_ADDRESS || null,
    telefono: process.env.CLINIC_PHONE || null,
  };
}

function appointmentSection(details) {
  const especialista = details.especialidad ? `${details.doctor} · ${details.especialidad}` : details.doctor;
  return {
    rows: [
      ['Fecha', details.fecha],
      ['Horario', details.horario],
      details.doctor && ['Especialista', especialista],
      details.direccion && ['Dirección', details.direccion],
    ].filter(Boolean),
  };
}

function appointmentSubject(details) {
  return `Cita confirmada: ${details.fecha}, ${details.hora} h`;
}

function cancelNote(details) {
  const contacto = details.telefono ? ` o llámanos al ${details.telefono}` : '';
  return `Si necesitas cancelar o cambiar tu cita, hazlo desde "Mis citas" en tu cuenta${contacto}, con la mayor anticipación posible para liberar el horario.`;
}

// Una sección = tabla de pares etiqueta/valor, con título opcional (p. ej. "Tus datos de acceso").
function renderSectionHtml({ title, rows, mono }) {
  const valueFont = mono ? 'font-family:Consolas,Menlo,monospace;' : '';
  const rowsHtml = rows
    .map(
      ([label, value]) => `<tr>
          <td style="padding:6px 0;color:#64748B;font-size:14px;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;color:#1B2A4A;font-size:14px;font-weight:600;${valueFont}">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');
  return `${title ? `<h2 style="margin:24px 0 8px;font-size:16px;color:#1B2A4A;">${escapeHtml(title)}</h2>` : ''}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F5FB;border-radius:14px;padding:16px 20px;">${rowsHtml}</table>`;
}

// Plantilla HTML con estilos en línea (los clientes de correo ignoran <style> y clases).
function renderHtml({ heading, intro, sections, cta, notes }) {
  const notesHtml = notes
    .map((note) => `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748B;">${escapeHtml(note)}</p>`)
    .join('');

  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#F4F5FB;font-family:'Plus Jakarta Sans',Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F5FB;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
        <tr><td style="padding:0 8px 16px;font-size:20px;font-weight:800;color:#1B2A4A;">Neuro<span style="color:#4F5FE0;">Clinic</span></td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;padding:32px;box-shadow:0 4px 18px rgba(27,42,74,0.08);">
          <h1 style="margin:0 0 12px;font-size:22px;color:#1B2A4A;">${escapeHtml(heading)}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(intro)}</p>
          ${sections.map(renderSectionHtml).join('')}
          <div style="text-align:center;margin:28px 0 8px;">
            <a href="${escapeHtml(cta.href)}" style="display:inline-block;background:#FF7A50;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:12px 28px;border-radius:999px;">${escapeHtml(cta.label)}</a>
          </div>
          ${notesHtml}
        </td></tr>
        <tr><td style="padding:16px 8px 0;font-size:12px;color:#94A3B8;text-align:center;">
          Este correo se generó automáticamente; no respondas a este mensaje.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderText({ heading, intro, sections, cta, notes }) {
  const lines = [heading, '', intro];
  for (const { title, rows } of sections) {
    lines.push('');
    if (title) lines.push(title);
    lines.push(...rows.map(([label, value]) => `${label}: ${value}`));
  }
  lines.push('', `${cta.label}: ${cta.href}`);
  for (const note of notes) lines.push('', note);
  lines.push('', 'NeuroClinic');
  return lines.join('\n');
}

// Nunca lanza: un fallo de correo no debe revertir ni romper un registro o cita ya guardados.
// Devuelve true solo si el correo salió realmente por SMTP.
async function deliver({ to, subject, content, devNote }) {
  const client = getTransporter();
  if (!client) {
    console.warn(`[email] SMTP no configurado: no se envió "${subject}" a ${to}.${devNote ? ` ${devNote}` : ''}`);
    return false;
  }
  try {
    await client.sendMail({
      from: process.env.SMTP_FROM || 'NeuroClinic <no-reply@neuroclinic.test>',
      to,
      subject,
      text: renderText(content),
      html: renderHtml(content),
    });
    return true;
  } catch (err) {
    console.error(`[email] No se pudo enviar "${subject}" a ${to}:`, err.message);
    return false;
  }
}

const CHANGE_PASSWORD_NOTE =
  'Por seguridad, cambia esta contraseña desde "Mi perfil" la primera vez que inicies sesión.';

// Paciente nuevo: sus datos de acceso (contraseña temporal) y, si aplica, su primera cita.
async function sendPatientCredentialsEmail({ user, password, appointment }) {
  try {
    const details = appointment ? await loadAppointmentDetails(appointment) : null;
    const credentials = {
      title: details ? 'Tus datos de acceso' : null,
      rows: [
        ['Correo', user.email],
        ['Contraseña temporal', password],
      ],
      mono: true,
    };
    const cta = { label: 'Iniciar sesión', href: `${appUrl()}/login` };

    const content = details
      ? {
          heading: '¡Tu cita quedó agendada!',
          intro: `Hola ${user.nombre}, creamos tu cuenta en NeuroClinic y registramos tu primera cita. Estos son los detalles:`,
          sections: [appointmentSection(details), credentials],
          cta,
          notes: [CHANGE_PASSWORD_NOTE, cancelNote(details)],
        }
      : {
          heading: 'Tu cuenta en NeuroClinic',
          intro: `Hola ${user.nombre}, creamos tu cuenta en NeuroClinic para que puedas agendar y dar seguimiento a tus citas.`,
          sections: [credentials],
          cta,
          notes: [CHANGE_PASSWORD_NOTE],
        };

    return await deliver({
      to: user.email,
      subject: details ? appointmentSubject(details) : 'Tu cuenta en NeuroClinic',
      content,
      devNote: `Contraseña temporal (solo visible en este log de desarrollo): ${password}`,
    });
  } catch (err) {
    console.error('[email] No se pudo preparar el correo de credenciales:', err.message);
    return false;
  }
}

// Paciente ya registrado: confirmación de una cita nueva (agendada por él o por su médico).
async function sendAppointmentConfirmationEmail({ appointment }) {
  try {
    const patient = await User.findByPk(appointment.patientId, { attributes: ['email', 'nombre'] });
    if (!patient) return false;
    const details = await loadAppointmentDetails(appointment);

    return await deliver({
      to: patient.email,
      subject: appointmentSubject(details),
      content: {
        heading: '¡Tu cita quedó agendada!',
        intro: `Hola ${patient.nombre}, registramos tu cita en NeuroClinic. Estos son los detalles:`,
        sections: [appointmentSection(details)],
        cta: { label: 'Ver mis citas', href: `${appUrl()}/mis-citas` },
        notes: [cancelNote(details)],
      },
    });
  } catch (err) {
    console.error('[email] No se pudo preparar el correo de confirmación de cita:', err.message);
    return false;
  }
}

module.exports = { sendPatientCredentialsEmail, sendAppointmentConfirmationEmail };
