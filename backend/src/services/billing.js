const { assertDoctorOwnedByAdmin } = require('./ownership');

const PRECIO_SUGERIDO_DEFAULT = 500;

// El médico dueño de la cita, o el admin dueño de ese médico, pueden cobrarla.
async function assertCanCharge(appointment, actingUser) {
  if (actingUser.hasRole('medico') && appointment.doctorId === actingUser.id) return;
  if (actingUser.hasRole('admin')) {
    await assertDoctorOwnedByAdmin(appointment.doctorId, actingUser.id);
    return;
  }
  const err = new Error('No tienes permiso para cobrar esta cita.');
  err.status = 403;
  throw err;
}

module.exports = { assertCanCharge, PRECIO_SUGERIDO_DEFAULT };
