const { DoctorProfile } = require('../models');

// Modelo multi-clínica: cada doctor pertenece a un único admin (doctor_profiles.owner_admin_id).
// Se usa para acotar todo lo que un admin puede ver/gestionar/cobrar a sus propios doctores.
async function assertDoctorOwnedByAdmin(doctorId, adminId) {
  const profile = await DoctorProfile.findOne({ where: { userId: doctorId } });
  if (!profile || profile.ownerAdminId !== adminId) {
    const err = new Error('No tienes permiso sobre este doctor.');
    err.status = 403;
    throw err;
  }
  return profile;
}

module.exports = { assertDoctorOwnedByAdmin };
