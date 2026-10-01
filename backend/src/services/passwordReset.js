const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op, fn, col, where } = require('sequelize');
const { User, PasswordResetCode } = require('../models');
const { normalizeMxPhone } = require('../utils/phone');
const { sendSms } = require('./sms');
const { sendPasswordResetCodeEmail } = require('./email');

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_HOUR = 3;

function generateTemporaryPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

// El código nunca se guarda en claro: HMAC con JWT_SECRET, así un volcado de la tabla no sirve
// para restablecer contraseñas.
function hashCode(code) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(code).digest('hex');
}

function codesMatch(code, codeHash) {
  const a = Buffer.from(hashCode(code), 'hex');
  const b = Buffer.from(codeHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function invalidInput(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// El paciente escribe su correo o su celular; eso decide también por dónde recibe el código.
function parseIdentifier(identifier) {
  const value = String(identifier || '').trim();
  if (value.includes('@')) return { channel: 'email', email: value.toLowerCase() };
  const phone = normalizeMxPhone(value);
  if (!phone) throw invalidInput('Escribe tu correo o tu celular de 10 dígitos.');
  return { channel: 'sms', phone };
}

// Cuentas activas que corresponden al dato. Por celular puede haber más de una (familiares que
// comparten número): en ese caso no se puede saber de quién es y se deriva a la clínica.
async function findUsers({ channel, email, phone }) {
  if (channel === 'email') {
    return User.findAll({ where: { [Op.and]: [where(fn('lower', col('email')), email), { isActive: true }] } });
  }
  return User.findAll({ where: { telefono: phone, isActive: true } });
}

// Devuelve siempre sin error para cuentas inexistentes (no revelar quién es paciente); el
// controlador responde lo mismo en todos los casos. Regresa lo necesario para auditar.
async function requestPasswordReset(identifier) {
  const parsed = parseIdentifier(identifier);
  const users = await findUsers(parsed);

  if (users.length === 0) return { channel: parsed.channel, user: null, sent: false };

  if (users.length > 1) {
    await sendSms({
      to: parsed.phone,
      content:
        'NeuroClinic: este celular esta registrado en mas de una cuenta. Para recuperar tu contrasena, comunicate con la clinica o usa tu correo.',
    });
    return { channel: parsed.channel, user: null, sent: false, ambiguous: true };
  }

  const user = users[0];
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await PasswordResetCode.count({ where: { userId: user.id, createdAt: { [Op.gte]: since } } });
  if (recent >= MAX_CODES_PER_HOUR) return { channel: parsed.channel, user, sent: false, limited: true };

  // Un código nuevo anula los anteriores que sigan vigentes.
  await PasswordResetCode.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null } });

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await PasswordResetCode.create({
    userId: user.id,
    channel: parsed.channel,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
  });

  const sent =
    parsed.channel === 'email'
      ? await sendPasswordResetCodeEmail({ user, code, minutes: CODE_TTL_MINUTES })
      : await sendSms({
          to: parsed.phone,
          content: `NeuroClinic: tu codigo para restablecer tu contrasena es ${code}. Vence en ${CODE_TTL_MINUTES} min. No lo compartas con nadie.`,
          devNote: `Código (solo visible en este log de desarrollo): ${code}`,
        });

  return { channel: parsed.channel, user, sent };
}

// Verifica el código y cambia la contraseña. Mismo mensaje para todo fallo (código incorrecto,
// vencido, agotado o cuenta inexistente).
async function confirmPasswordReset({ identifier, code, newPassword }) {
  const parsed = parseIdentifier(identifier);
  const rejected = invalidInput('El código es incorrecto o ya venció. Pide uno nuevo.');

  const users = await findUsers(parsed);
  if (users.length !== 1) throw rejected;
  const user = users[0];

  const record = await PasswordResetCode.findOne({
    where: { userId: user.id, channel: parsed.channel, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
    order: [['createdAt', 'DESC']],
  });
  if (!record || record.attempts >= MAX_ATTEMPTS) throw rejected;

  if (!codesMatch(String(code), record.codeHash)) {
    await record.increment('attempts');
    throw rejected;
  }

  await record.update({ usedAt: new Date() });
  await user.update({ passwordHash: await bcrypt.hash(newPassword, 10), passwordChangedAt: new Date() });
  return { user, channel: parsed.channel };
}

module.exports = { generateTemporaryPassword, requestPasswordReset, confirmPasswordReset };
