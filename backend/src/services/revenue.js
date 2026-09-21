const { Op } = require('sequelize');
const { Payment, Appointment, User, DoctorProfile } = require('../models');

// Suma de cobros de los doctores propios del admin (nunca de otras clínicas/admins),
// opcionalmente acotada a un rango de fechas.
async function getRevenueSummary({ ownerAdminId, from, to }) {
  const where = {};
  if (from && to) where.fechaCobro = { [Op.between]: [from, to] };

  const payments = await Payment.findAll({
    where,
    include: [
      {
        model: Appointment,
        as: 'appointment',
        attributes: ['id', 'doctorId'],
        required: true,
        include: [
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'nombre', 'apellidoPaterno'],
            required: true,
            include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: [], where: { ownerAdminId }, required: true }],
          },
        ],
      },
    ],
  });

  const totalIngresos = payments.reduce((sum, p) => sum + Number(p.monto), 0);
  const porDoctor = {};
  for (const p of payments) {
    const doctor = p.appointment.doctor;
    if (!porDoctor[doctor.id]) {
      porDoctor[doctor.id] = { doctorId: doctor.id, nombre: `${doctor.nombre} ${doctor.apellidoPaterno}`, total: 0, citas: 0 };
    }
    porDoctor[doctor.id].total += Number(p.monto);
    porDoctor[doctor.id].citas += 1;
  }

  return {
    totalIngresos,
    totalCitasCobradas: payments.length,
    porDoctor: Object.values(porDoctor),
  };
}

module.exports = { getRevenueSummary };
