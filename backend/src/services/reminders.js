const { Op } = require('sequelize');
const { Appointment, User } = require('../models');

// "Mañana" se calcula en la zona horaria de la clínica (no la del servidor) para evitar
// desfaces de un día si el servidor corre en otra timezone.
function getTomorrowDateMexico() {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + 1);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(now);
}

const ACTIVE_STATES = ['pendiente', 'confirmada'];

async function getTomorrowAppointmentsForDoctor(doctorId) {
  const fecha = getTomorrowDateMexico();
  const appointments = await Appointment.findAll({
    where: { doctorId, fecha, estado: { [Op.in]: ACTIVE_STATES } },
    include: [{ model: User, as: 'patient', attributes: ['id', 'nombre', 'apellidoPaterno'] }],
    order: [['horaInicio', 'ASC']],
  });
  return { tomorrowCount: appointments.length, appointments };
}

async function getTomorrowAppointmentForPatient(patientId) {
  const fecha = getTomorrowDateMexico();
  const appointment = await Appointment.findOne({
    where: { patientId, fecha, estado: { [Op.in]: ACTIVE_STATES } },
    include: [{ model: User, as: 'doctor', attributes: ['id', 'nombre', 'apellidoPaterno'] }],
  });
  return { appointment };
}

module.exports = { getTomorrowDateMexico, getTomorrowAppointmentsForDoctor, getTomorrowAppointmentForPatient };
